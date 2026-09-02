import { Types } from 'mongoose';
import { Activity } from './activity.model';
import { Comment } from './comment.model';
import { AppError } from '../../shared/errors/AppError';
import { HTTP_STATUS } from '@sporgame/shared';
import { broadcastFeedUpdate, broadcastNewActivity } from '../matchmaking/matchmaking.gateway';
import type { CreateActivityDto, PaginationQueryDto, ActivityResponseDto, AuthorPublicDto } from './activities.dto';

function mapToResponseDto(doc: any, currentUserId?: string): ActivityResponseDto {
  const author: AuthorPublicDto = doc.userId && typeof doc.userId === 'object'
    ? {
        _id:         doc.userId._id.toString(),
        username:    doc.userId.username,
        avatarUrl:   doc.userId.avatarUrl,
        eloProfiles: doc.userId.eloProfiles,
      }
    : {
        _id:         doc.userId?.toString() ?? '',
        username:    'Sporcu',
        eloProfiles: {},
      };

  const likesArray = Array.isArray(doc.likes) ? doc.likes : [];
  const likesStr = likesArray.map((id: any) => id.toString());
  const isLiked = currentUserId ? likesStr.includes(currentUserId) : false;

  const stats = doc.stats || {
    distance:      doc.distance || 0,
    duration:      doc.duration || 0,
    secondaryStat: '',
  };

  return {
    _id:            doc._id.toString(),
    id:             doc._id.toString(),
    user:           author,
    title:          doc.title || (doc.sportType === 'RUNNING' ? 'Sabah Koşusu' : doc.sportType === 'CYCLING' ? 'Şehir Sürüşü' : 'Yüzme Seansı'),
    sportType:      doc.sportType,
    stats:          {
      distance:      stats.distance ?? doc.distance ?? 0,
      duration:      stats.duration ?? doc.duration ?? 0,
      secondaryStat: stats.secondaryStat ?? (doc.sportType === 'RUNNING' ? '5:12 /km' : '25 km/s'),
    },
    distance:       doc.distance ?? stats.distance ?? 0,
    duration:       doc.duration ?? stats.duration ?? 0,
    locationString: doc.locationString || 'Kadıköy, İstanbul',
    likes:          likesStr,
    likesCount:     doc.likesCount ?? likesStr.length,
    commentsCount:  doc.commentsCount || 0,
    isLiked,
    createdAt:      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

export async function createActivity(
  userId: string,
  dto: CreateActivityDto,
): Promise<ActivityResponseDto> {
  const defaultTitle = dto.sportType === 'RUNNING' ? 'Sabah Koşusu' : dto.sportType === 'CYCLING' ? 'Şehir Sürüşü' : 'Kondisyon Yüzüşü';
  const defaultPace = dto.sportType === 'RUNNING' ? '5:12 /km' : dto.sportType === 'CYCLING' ? '26.4 km/s' : '1:45 /100m';

  const stats = {
    distance:      dto.distance,
    duration:      dto.duration,
    secondaryStat: dto.secondaryStat || defaultPace,
  };

  const created = await Activity.create({
    userId:         new Types.ObjectId(userId),
    title:          dto.title || defaultTitle,
    sportType:      dto.sportType,
    stats,
    distance:       dto.distance,
    duration:       dto.duration,
    locationString: dto.locationString || 'Kadıköy, İstanbul',
  });

  const populated = await created.populate<{ userId: { _id: Types.ObjectId; username: string; avatarUrl?: string; eloProfiles: Record<string, number> } }>(
    'userId',
    '_id username avatarUrl eloProfiles',
  );

  const dtoResult = mapToResponseDto(populated, userId);
  broadcastFeedUpdate({ type: 'CREATED', activity: dtoResult });
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
      .populate('userId', '_id username avatarUrl eloProfiles')
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
    const likesCount = Math.max(0, unliked.likesCount);
    broadcastFeedUpdate({
      type: 'LIKED',
      activity: { activityId, isLiked: false, likesCount, userId },
    });
    return { isLiked: false, likesCount };
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

  const likesCount = liked ? liked.likesCount : 0;
  broadcastFeedUpdate({
    type: 'LIKED',
    activity: { activityId, isLiked: true, likesCount, userId },
  });
  return { isLiked: true, likesCount };
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

export async function getComments(activityId: string): Promise<any[]> {
  if (!Types.ObjectId.isValid(activityId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid activity ID', 'INVALID_ID');
  }

  const comments = await Comment.find({ activityId: new Types.ObjectId(activityId) })
    .sort({ createdAt: 1 })
    .populate('userId', '_id username avatarUrl')
    .lean();

  return comments.map((c: any) => ({
    _id:        c._id.toString(),
    id:         c._id.toString(),
    activityId: c.activityId.toString(),
    user: {
      _id:       c.userId?._id?.toString() ?? '',
      username:  c.userId?.username ?? 'sporcu',
      avatarUrl: c.userId?.avatarUrl,
    },
    content:   c.content,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  }));
}

export async function addComment(
  activityId: string,
  userId: string,
  content: string,
): Promise<any> {
  if (!Types.ObjectId.isValid(activityId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid activity ID', 'INVALID_ID');
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Comment content cannot be empty', 'EMPTY_COMMENT');
  }

  const activity = await Activity.findByIdAndUpdate(
    activityId,
    { $inc: { commentsCount: 1 } },
    { new: true },
  );

  if (!activity) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Activity not found', 'ACTIVITY_NOT_FOUND');
  }

  const commentDoc = await Comment.create({
    activityId: new Types.ObjectId(activityId),
    userId:     new Types.ObjectId(userId),
    content:    trimmed,
  });

  const populated = await commentDoc.populate<{ userId: { _id: Types.ObjectId; username: string; avatarUrl?: string } }>(
    'userId',
    '_id username avatarUrl',
  );

  const formattedComment = {
    _id:        populated._id.toString(),
    id:         populated._id.toString(),
    activityId: populated.activityId.toString(),
    user: {
      _id:       populated.userId?._id?.toString() ?? '',
      username:  populated.userId?.username ?? 'sporcu',
      avatarUrl: populated.userId?.avatarUrl,
    },
    content:   populated.content,
    createdAt: populated.createdAt.toISOString(),
  };

  broadcastFeedUpdate({
    type: 'COMMENT_ADDED',
    activity: {
      activityId,
      comment: formattedComment,
      commentsCount: activity.commentsCount,
    },
  });

  return formattedComment;
}
