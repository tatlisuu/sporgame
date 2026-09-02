import { apiClient } from './client';
import { IUserProfile } from '@sporgame/shared';

export async function getUserProfileApi(userId: string): Promise<IUserProfile> {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data.data;
}

export async function toggleFollowApi(
  userId: string
): Promise<{ isFollowing: boolean; followersCount: number }> {
  const response = await apiClient.post(`/users/${userId}/follow`);
  return response.data.data;
}
