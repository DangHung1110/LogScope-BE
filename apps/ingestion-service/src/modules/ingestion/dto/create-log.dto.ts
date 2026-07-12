import { rawLogEventSchema } from '@logscope/contracts';
import { z } from 'zod';

export const createLogSchema = rawLogEventSchema
  .omit({
    eventId: true,
    projectId: true,
  })
  .extend({
    timestamp: z.string().datetime().optional(),
  });

export type CreateLogDto = z.infer<typeof createLogSchema>;
