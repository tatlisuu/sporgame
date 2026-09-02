import { apiClient } from './client';
import { IActivity, IActivityStats, IActivityUser, IComment, SportType } from '@sporgame/shared';

export type ActivityItem = IActivity;

export interface FeedResponse {
  data: ActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getFeedApi(page = 1, limit = 20): Promise<FeedResponse> {
  const response = await apiClient.get('/activities', {
    params: { page, limit },
  });
  return response.data.data;
}

export async function toggleLikeApi(
  activityId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  const response = await apiClient.post(`/activities/${activityId}/like`);
  return response.data.data;
}

export async function createActivityApi(data: {
  title?: string;
  sportType: SportType | 'RUNNING' | 'CYCLING' | 'SWIMMING';
  distance: number;
  duration: number;
  secondaryStat?: string | number;
  locationString?: string;
}): Promise<ActivityItem> {
  const response = await apiClient.post('/activities', data);
  return response.data.data;
}

export async function getCommentsApi(activityId: string): Promise<IComment[]> {
  const response = await apiClient.get(`/activities/${activityId}/comments`);
  return response.data.data;
}

export async function addCommentApi(activityId: string, content: string): Promise<IComment> {
  const response = await apiClient.post(`/activities/${activityId}/comments`, { content });
  return response.data.data;
}
