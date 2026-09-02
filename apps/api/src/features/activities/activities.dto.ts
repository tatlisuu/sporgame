import { z } from 'zod';

export const createActivitySchema = z
  .object({
    sportType: z.enum(['RUNNING', 'CYCLING', 'SWIMMING']),
    distance:  z.number().positive('Distance must be greater than 0'),
    duration:  z.number().positive('Duration must be greater than 0'),
  })
  .strict();

export type CreateActivityDto = z.infer<typeof createActivitySchema>;

export const paginationQuerySchema = z
  .object({
    page:  z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;

export interface AuthorPublicDto {
  _id:         string;
  username:    string;
  eloProfiles: Record<string, number>;
}

export interface ActivityResponseDto {
  id:            string;
  user:          AuthorPublicDto;
  sportType:     string;
  distance:      number;
  duration:      number;
  likesCount:    number;
  commentsCount: number;
  isLiked?:      boolean;
  createdAt:     string;
}
