import { apiClient } from './client';

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  followersCount: number;
  followingCount: number;
  eloProfiles: Record<string, number>;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserPublic;
}

export async function registerApi(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/register', data);
  return response.data.data;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', data);
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}
