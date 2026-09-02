import { Types } from 'mongoose';
import { Activity } from './activity.model';
import { AppError } from '../../shared/errors/AppError';
import { HTTP_STATUS } from '@sporgame/shared';
import { broadcastNewActivity } from '../matchmaking/matchmaking.gateway';
import type { CreateActivityDto, PaginationQueryDto, ActivityResponseDto, AuthorPublicDto } from './activities.dto';

function mapToResponseDto(doc: any, currentUserId?: string): ActivityResponseDto {
  const author: AuthorPublicDto = doc.userId && typeof doc.userId === 'object'
    ? {
        _id:         doc.userId._id.toString(),
        username:    doc.userId.username,
        eloProfiles: doc.userId.eloProfiles,
      }
    : {
        _id:         doc.userId?.toString() ?? '',
        username:    '',
        eloProfiles: {},
      };

  const likesArray = Array.isArray(doc.likes) ? doc.likes : [];
  const isLiked = currentUserId
    ? likesArray.some((id: Types.ObjectId | string) => id.toString() === currentUserId)
    : false;

  return {
    id:            doc._id.toString(),
    user:          author,
    sportType:     doc.sportType,
    distance:      doc.distance,
    duration:      doc.duration,
    likesCount:    doc.likesCount,
    commentsCount: doc.commentsCount,
    isLiked,
    createdAt:     doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

export async function createActivity(
  userId: string,
  dto: CreateActivityDto,
): Promise<ActivityResponseDto> {
  const created = await Activity.create({
    userId:    new Types.ObjectId(userId),
    sportType: dto.sportType,
    distance:  dto.distance,
    duration:  dto.duration,
  });

  const populated = await created.populate<{ userId: { _id: Types.ObjectId; username: string; eloProfiles: Record<string, number> } }>(
    'userId',
    '_id username eloProfiles',
  );

  const dtoResult = mapToResponseDto(populated, userId);
  broadcastNewActivity(dtoResult);
  return dtoResult;
}

export async function getFeed(
  query: PaginationQueryDto,
  currentUserId: string,
): Promise<{
  data:       ActivityResponseDto[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}> {
  const skip = (query.page - 1) * query.limit;

  const [activities, total] = await Promise.all([
    Activity.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('userId', '_id username eloProfiles')
      .lean(),
    Activity.countDocuments(),
  ]);

  return {
    data:       activities.map((act) => mapToResponseDto(act, currentUserId)),
    total,
    page:       query.page,
    limit:      query.limit,
    totalPages: Math.ceil(total / query.limit) || 1,
  };
}

export async function toggleLike(
  activityId: string,
  userId: string,
): Promise<{ isLiked: boolean; likesCount: number }> {
  if (!Types.ObjectId.isValid(activityId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid activity ID', 'INVALID_ID');
  }

  const userObjectId = new Types.ObjectId(userId);

  // Atomically attempt unlike if user ID exists in likes
  const unliked = await Activity.findOneAndUpdate(
    { _id: activityId, likes: userObjectId },
    {
      $pull: { likes: userObjectId },
      $inc:  { likesCount: -1 },
    },
    { new: true },
  );

  if (unliked) {
    return { isLiked: false, likesCount: Math.max(0, unliked.likesCount) };
  }

  // Atomically add like if user ID does not exist in likes
  const liked = await Activity.findOneAndUpdate(
    { _id: activityId, likes: { $ne: userObjectId } },
    {
      $addToSet: { likes: userObjectId },
      $inc:      { likesCount: 1 },
    },
    { new: true },
  );

  if (!liked) {
    const exists = await Activity.exists({ _id: activityId });
    if (!exists) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Activity not found', 'ACTIVITY_NOT_FOUND');
    }
  }

  return { isLiked: true, likesCount: liked ? liked.likesCount : 0 };
}

export async function deleteActivity(
  activityId: string,
  userId: string,
): Promise<void> {
  if (!Types.ObjectId.isValid(activityId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid activity ID', 'INVALID_ID');
  }

  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Activity not found', 'ACTIVITY_NOT_FOUND');
  }

  if (activity.userId.toString() !== userId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'Forbidden: IDOR protection', 'UNAUTHORIZED_ACCESS');
  }

  await Activity.findByIdAndDelete(activityId);
}
