import { z } from 'zod';

export const createChallengeSchema = z
  .object({
    challengedId: z.string().optional(),
    username:     z.string().optional(),
    sportType:    z.enum(['RUNNING', 'CYCLING', 'SWIMMING']),
  })
  .strict();

export const respondChallengeSchema = z
  .object({
    action: z.enum(['ACCEPT', 'REJECT']),
  })
  .strict();

export const reportResultSchema = z
  .object({
    winnerId: z.string().min(1),
  })
  .strict();

export type CreateChallengeDto  = z.infer<typeof createChallengeSchema>;
export type RespondChallengeDto = z.infer<typeof respondChallengeSchema>;
export type ReportResultDto     = z.infer<typeof reportResultSchema>;

export interface MatchResponseDto {
  id:                  string;
  challengerId:        string;
  challengerUsername?: string;
  challengedId:        string;
  challengedUsername?: string;
  sportType:           string;
  status:              string;
  winnerId:            string | null;
  eloChange:           number | null;
  createdAt:           string;
}

export interface LeaderboardEntryDto {
  rank:        number;
  userId:      string;
  username:    string;
  elo:         number;
}
