import { apiClient } from './client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  elo: number;
}

export interface MatchItem {
  id: string;
  challengerId: string;
  challengedId: string;
  sportType: 'RUNNING' | 'CYCLING' | 'SWIMMING';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  winnerId: string | null;
  eloChange: number | null;
  createdAt: string;
}

export async function getLeaderboardApi(
  sport: 'RUNNING' | 'CYCLING' | 'SWIMMING'
): Promise<LeaderboardEntry[]> {
  const response = await apiClient.get(`/matchmaking/leaderboard/${sport}`);
  return response.data.data;
}

export async function getChallengesApi(): Promise<MatchItem[]> {
  const response = await apiClient.get('/matchmaking/challenges');
  return response.data.data;
}

export async function respondChallengeApi(
  matchId: string,
  action: 'ACCEPT' | 'REJECT'
): Promise<MatchItem> {
  const response = await apiClient.patch(`/matchmaking/${matchId}/respond`, { action });
  return response.data.data;
}

export async function reportResultApi(
  matchId: string,
  winnerId: string
): Promise<MatchItem> {
  const response = await apiClient.patch(`/matchmaking/${matchId}/result`, { winnerId });
  return response.data.data;
}
