import { z } from 'zod';
import { IActivityStats, IActivityUser } from '@sporgame/shared';

export const createActivitySchema = z
  .object({
    title:          z.string().min(1).max(100).optional(),
    sportType:      z.enum(['RUNNING', 'CYCLING', 'SWIMMING']),
    distance:       z.number().min(0, 'Distance must be positive'),
    duration:       z.number().min(0, 'Duration must be positive'),
    secondaryStat:  z.union([z.string(), z.number()]).optional(),
    locationString: z.string().max(100).optional(),
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

export interface AuthorPublicDto extends IActivityUser {}

export interface ActivityResponseDto {
  _id:            string;
  id:             string;
  user:           AuthorPublicDto;
  title:          string;
  sportType:      string;
  stats:          IActivityStats;
  distance:       number;
  duration:       number;
  locationString: string;
  likes:          string[];
  likesCount:     number;
  commentsCount:  number;
  isLiked?:       boolean;
  createdAt:      string;
}
