import mongoose, { Types } from 'mongoose';
import { Match } from './match.model';
import { User } from '../users/user.model';
import { AppError } from '../../shared/errors/AppError';
import { calculateElo } from './elo.service';
import { HTTP_STATUS } from '@sporgame/shared';
import type {
  CreateChallengeDto,
  RespondChallengeDto,
  ReportResultDto,
  MatchResponseDto,
  LeaderboardEntryDto,
} from './matchmaking.dto';

function toMatchDto(doc: any): MatchResponseDto {
  const challengerId = doc.challengerId?._id ? doc.challengerId._id.toString() : doc.challengerId?.toString();
  const challengerUsername = doc.challengerId?.username;
  const challengedId = doc.challengedId?._id ? doc.challengedId._id.toString() : doc.challengedId?.toString();
  const challengedUsername = doc.challengedId?.username;

  return {
    id:                 doc._id.toString(),
    challengerId,
    challengerUsername,
    challengedId,
    challengedUsername,
    sportType:          doc.sportType,
    status:             doc.status,
    winnerId:           doc.winnerId ? doc.winnerId.toString() : null,
    eloChange:          doc.eloChange,
    createdAt:          doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

// ── Create Challenge ──────────────────────────────────────────────────────────

export async function createChallenge(
  challengerId: string,
  dto: CreateChallengeDto,
): Promise<MatchResponseDto> {
  let targetUserId = dto.challengedId;

  if (!targetUserId && dto.username) {
    const cleanUsername = dto.username.trim().replace(/^@/, '');
    const userDoc = await User.findOne({
      username: new RegExp(`^${cleanUsername}$`, 'i'),
    });
    if (!userDoc) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, `@${cleanUsername} kullanıcı adlı sporcu bulunamadı`, 'USER_NOT_FOUND');
    }
    targetUserId = userDoc._id.toString();
  }

  if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Geçerli bir kullanıcı veya sporcu ID gereklidir', 'INVALID_ID');
  }

  if (challengerId === targetUserId) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Kendinize meydan okuyamazsınız', 'SELF_CHALLENGE');
  }

  const challenged = await User.exists({ _id: targetUserId });
  if (!challenged) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Meydan okunan sporcu bulunamadı', 'USER_NOT_FOUND');
  }

  const existing = await Match.findOne({
    $or: [
      { challengerId, challengedId: targetUserId },
      { challengerId: targetUserId, challengedId: challengerId },
    ],
    sportType: dto.sportType,
    status:    'PENDING',
  });
  if (existing) {
    throw new AppError(HTTP_STATUS.CONFLICT, 'Bu sporcuyla zaten bekleyen bir meydan okumanız var', 'CHALLENGE_EXISTS');
  }

  const match = await Match.create({
    challengerId: new Types.ObjectId(challengerId),
    challengedId: new Types.ObjectId(targetUserId),
    sportType:    dto.sportType,
    status:       'PENDING',
  });

  const populated = await match.populate([
    { path: 'challengerId', select: 'username' },
    { path: 'challengedId', select: 'username' },
  ]);

  return toMatchDto(populated);
}

// ── Respond to Challenge ──────────────────────────────────────────────────────

export async function respondToChallenge(
  matchId: string,
  userId: string,
  dto: RespondChallengeDto,
): Promise<MatchResponseDto> {
  if (!Types.ObjectId.isValid(matchId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Geçersiz maç ID', 'INVALID_ID');
  }

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Maç bulunamadı', 'MATCH_NOT_FOUND');
  }
  if (match.challengedId.toString() !== userId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'Yalnızca meydan okunan sporcu yanıtlayabilir', 'FORBIDDEN');
  }
  if (String(match.status) !== 'PENDING') {
    throw new AppError(HTTP_STATUS.CONFLICT, 'Meydan okuma artık beklemede değil', 'INVALID_STATUS');
  }

  match.status = (dto.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED') as any;
  await match.save();

  const populated = await match.populate([
    { path: 'challengerId', select: 'username' },
    { path: 'challengedId', select: 'username' },
  ]);

  return toMatchDto(populated);
}

// ── Report Result — MongoDB Transaction ──────────────────────────────────────

export async function reportResult(
  matchId: string,
  reporterId: string,
  dto: ReportResultDto,
): Promise<MatchResponseDto> {
  if (!Types.ObjectId.isValid(matchId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Geçersiz maç ID', 'INVALID_ID');
  }
  if (!Types.ObjectId.isValid(dto.winnerId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Geçersiz kazanan ID', 'INVALID_ID');
  }

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Maç bulunamadı', 'MATCH_NOT_FOUND');
  }

  const participants = [match.challengerId.toString(), match.challengedId.toString()];
  if (!participants.includes(reporterId)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'Maçın katılımcısı değilsiniz', 'FORBIDDEN');
  }
  if (!participants.includes(dto.winnerId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Kazanan bir katılımcı olmalıdır', 'INVALID_WINNER');
  }
  if (String(match.status) !== 'ACCEPTED') {
    throw new AppError(HTTP_STATUS.CONFLICT, 'Maç kabul edilmeden sonuç bildirilemez', 'INVALID_STATUS');
  }

  const loserId = participants.find((id) => id !== dto.winnerId)!;

  const session = await mongoose.startSession();
  let updatedMatch: any;

  try {
    await session.withTransaction(async () => {
      const [winner, loser] = await Promise.all([
        User.findById(dto.winnerId).session(session),
        User.findById(loserId).session(session),
      ]);

      if (!winner || !loser) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Katılımcı kullanıcı bulunamadı', 'USER_NOT_FOUND');
      }

      const sport = match.sportType as keyof typeof winner.eloProfiles;
      const eloCalc = calculateElo(
        winner.eloProfiles[sport] ?? 1200,
        loser.eloProfiles[sport] ?? 1200,
      );

      await User.findByIdAndUpdate(
        dto.winnerId,
        { $set: { [`eloProfiles.${sport}`]: eloCalc.winnerNewElo } },
        { session },
      );

      await User.findByIdAndUpdate(
        loserId,
        { $set: { [`eloProfiles.${sport}`]: eloCalc.loserNewElo } },
        { session },
      );

      updatedMatch = await Match.findByIdAndUpdate(
        matchId,
        {
          $set: {
            status:    'COMPLETED',
            winnerId:  new Types.ObjectId(dto.winnerId),
            eloChange: eloCalc.winnerDelta,
          },
        },
        { new: true, session },
      ).populate([
        { path: 'challengerId', select: 'username' },
        { path: 'challengedId', select: 'username' },
      ]);
    });
  } finally {
    await session.endSession();
  }

  return toMatchDto(updatedMatch);
}

// ── List Challenges ───────────────────────────────────────────────────────────

export async function listChallenges(userId: string): Promise<MatchResponseDto[]> {
  const matches = await Match.find({
    $or: [{ challengerId: userId }, { challengedId: userId }],
  })
    .sort({ createdAt: -1 })
    .populate('challengerId', 'username')
    .populate('challengedId', 'username')
    .lean();

  return matches.map(toMatchDto);
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function getLeaderboard(
  sport: string,
  limit = 50,
): Promise<LeaderboardEntryDto[]> {
  const validSports = ['RUNNING', 'CYCLING', 'SWIMMING'];
  if (!validSports.includes(sport.toUpperCase())) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Geçersiz spor türü', 'INVALID_SPORT');
  }

  const sportKey = sport.toUpperCase();
  const users = await User.find()
    .select(`username eloProfiles.${sportKey}`)
    .sort({ [`eloProfiles.${sportKey}`]: -1 })
    .limit(limit)
    .lean();

  return users.map((u, idx) => ({
    rank:     idx + 1,
    userId:   (u._id as Types.ObjectId).toString(),
    username: u.username,
    elo:      (u.eloProfiles as any)?.[sportKey] ?? 1200,
  }));
}
