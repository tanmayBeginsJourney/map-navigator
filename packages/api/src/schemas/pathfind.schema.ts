import { z } from 'zod';

export const pathfindSchema = z.object({
  body: z.object({
    start_node_id: z.number().int({ message: "start_node_id must be an integer." }),
    end_node_id: z.number().int({ message: "end_node_id must be an integer." }),
    accessibility_required: z.boolean().optional(),
  }).refine(data => data.start_node_id !== data.end_node_id, {
    message: 'Start and end nodes cannot be the same.',
    path: ['start_node_id', 'end_node_id'], // Field where the error is reported
  }),
}); 