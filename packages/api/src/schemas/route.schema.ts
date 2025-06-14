import { z } from 'zod';

export const routeSchema = z.object({
  body: z.object({
    startNodeId: z.string()
      .regex(/^\d+$/, "startNodeId must be a string containing only digits.")
      .transform(Number),
    endNodeId: z.string()
      .regex(/^\d+$/, "endNodeId must be a string containing only digits.")
      .transform(Number),
  }).refine(data => data.startNodeId !== data.endNodeId, {
    message: 'Start and end nodes cannot be the same.',
    path: ['startNodeId', 'endNodeId'],
  }),
}); 