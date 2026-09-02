import { apiClient } from './client';

export interface ActivityItem {
  id: string;
  user: {
    _id: string;
    username: string;
    eloProfiles?: Record<string, number>;
  };
  sportType: 'RUNNING' | 'CYCLING' | 'SWIMMING';
  distance: number;
  duration: number;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface FeedResponse {
  data: ActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getFeedApi(page = 1, limit = 20): Promise<FeedResponse> {
  const response = await apiClient.get('/activities/feed', {
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
  sportType: 'RUNNING' | 'CYCLING' | 'SWIMMING';
  distance: number;
  duration: number;
}): Promise<ActivityItem> {
  const response = await apiClient.post('/activities', data);
  return response.data.data;
}
