import { z } from 'zod';

export const generatePixSchema = z.object({
  appointmentId: z.string().uuid('appointmentId deve ser um UUID válido'),
});

export type GeneratePixInput = z.infer<typeof generatePixSchema>;
