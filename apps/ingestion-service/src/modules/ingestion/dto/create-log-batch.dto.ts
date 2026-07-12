import { z } from 'zod';
import { createLogSchema } from './create-log.dto';

export const createLogBatchSchema = z.object({
  logs: z.array(createLogSchema).min(1).max(500),
});

export type CreateLogBatchDto = z.infer<typeof createLogBatchSchema>;
