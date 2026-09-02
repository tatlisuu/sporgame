import { Types } from 'mongoose';
import { User } from './user.model';
import { Follow } from './follow.model';
import { Activity } from '../activities/activity.model';
import { AppError } from '../../shared/errors/AppError';
import { HTTP_STATUS } from '@sporgame/shared';

export async function getUserProfile(targetUserId: string, currentUserId?: string) {
  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid user ID', 'INVALID_ID');
  }

  const user = await User.findById(targetUserId).lean();
  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found', 'USER_NOT_FOUND');
  }

  let isFollowing = false;
  if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
    const followDoc = await Follow.exists({
      followerId:  new Types.ObjectId(currentUserId),
      followingId: new Types.ObjectId(targetUserId),
    });
    isFollowing = Boolean(followDoc);
  }

  // Fetch target user's recent activities
  const recentActivitiesRaw = await Activity.find({ userId: new Types.ObjectId(targetUserId) })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', '_id username avatarUrl eloProfiles')
    .lean();

  const recentActivities = recentActivitiesRaw.map((doc: any) => ({
    _id:            doc._id.toString(),
    id:             doc._id.toString(),
    user: {
      _id:          doc.userId?._id?.toString() ?? targetUserId,
      username:     doc.userId?.username ?? user.username,
      avatarUrl:    doc.userId?.avatarUrl,
      eloProfiles:  doc.userId?.eloProfiles,
    },
    title:          doc.title,
    sportType:      doc.sportType,
    stats:          doc.stats,
    locationString: doc.locationString,
    likes:          (doc.likes || []).map((id: any) => id.toString()),
    likesCount:     doc.likesCount ?? 0,
    commentsCount:  doc.commentsCount ?? 0,
    isLiked:        currentUserId
      ? (doc.likes || []).some((id: any) => id.toString() === currentUserId)
      : false,
    createdAt:      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  }));

  return {
    _id:              user._id.toString(),
    id:               user._id.toString(),
    username:         user.username,
    followersCount:   user.followersCount ?? 0,
    followingCount:   user.followingCount ?? 0,
    isFollowing,
    eloProfiles:      user.eloProfiles,
    recentActivities,
    createdAt:        user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

export async function toggleFollow(targetUserId: string, currentUserId: string) {
  if (!Types.ObjectId.isValid(targetUserId) || !Types.ObjectId.isValid(currentUserId)) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid user ID', 'INVALID_ID');
  }

  if (targetUserId === currentUserId) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Cannot follow yourself', 'SELF_FOLLOW_NOT_ALLOWED');
  }

  const targetObjectId  = new Types.ObjectId(targetUserId);
  const currentObjectId = new Types.ObjectId(currentUserId);

  const existingFollow = await Follow.findOneAndDelete({
    followerId:  currentObjectId,
    followingId: targetObjectId,
  });

  if (existingFollow) {
    // Unfollowed
    await User.findByIdAndUpdate(targetObjectId, { $inc: { followersCount: -1 } });
    await User.findByIdAndUpdate(currentObjectId, { $inc: { followingCount: -1 } });

    const targetUser = await User.findById(targetObjectId).lean();
    return {
      isFollowing:    false,
      followersCount: Math.max(0, targetUser?.followersCount ?? 0),
    };
  }

  // Follow
  await Follow.create({
    followerId:  currentObjectId,
    followingId: targetObjectId,
  });

  await User.findByIdAndUpdate(targetObjectId, { $inc: { followersCount: 1 } });
  await User.findByIdAndUpdate(currentObjectId, { $inc: { followingCount: 1 } });

  const targetUser = await User.findById(targetObjectId).lean();
  return {
    isFollowing:    true,
    followersCount: targetUser?.followersCount ?? 1,
  };
}
