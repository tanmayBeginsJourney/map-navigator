import { z } from 'zod';

export const pathfindSchema = z.object({
  startNodeId: z.number().int('startNodeId must be an integer.'),
  endNodeId: z.number().int('endNodeId must be an integer.'),
  accessibilityRequired: z.boolean().optional(),
}).refine(data => data.startNodeId !== data.endNodeId, {
  message: 'Start and end nodes cannot be the same.',
});