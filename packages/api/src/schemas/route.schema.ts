import { z } from 'zod';

export const routeSchema = z.object({
  startNodeId: z.preprocess(
    val => (typeof val === 'number' ? String(val) : val),
    z.string().regex(/^\d+$/, 'startNodeId must be a string of digits').transform(Number)
  ),
  endNodeId: z.preprocess(
    val => (typeof val === 'number' ? String(val) : val),
    z.string().regex(/^\d+$/, 'endNodeId must be a string of digits').transform(Number)
  ),
  accessibilityRequired: z.boolean().optional(),
}).refine(data => data.startNodeId !== data.endNodeId, {
  message: 'Start and end nodes cannot be the same.',
  path: ['startNodeId', 'endNodeId'],
}); 