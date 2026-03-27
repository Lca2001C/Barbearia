import { z } from 'zod';

/** Aceita ISO 8601 com ou sem offset (ex.: 2026-03-25T14:00:00 ou ...Z). */
const dateTimeFlexible = z
  .string()
  .min(1, 'dateTime é obrigatório')
  .refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'dateTime deve ser uma data/hora válida',
  });

export const createAppointmentSchema = z.object({
  barberId: z.string().uuid('barberId deve ser um UUID válido'),
  serviceId: z.string().uuid('serviceId deve ser um UUID válido'),
  dateTime: dateTimeFlexible,
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
