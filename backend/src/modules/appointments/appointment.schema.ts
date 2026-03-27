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

const appointmentStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
]);

export const createAppointmentByAdminSchema = z.object({
  userId: z.string().uuid('userId deve ser um UUID válido'),
  barberId: z.string().uuid('barberId deve ser um UUID válido'),
  serviceId: z.string().uuid('serviceId deve ser um UUID válido'),
  dateTime: dateTimeFlexible,
  notes: z.string().optional(),
  status: appointmentStatusSchema.optional(),
});

export const updateAppointmentByAdminSchema = z
  .object({
    userId: z.string().uuid('userId deve ser um UUID válido').optional(),
    barberId: z.string().uuid('barberId deve ser um UUID válido').optional(),
    serviceId: z.string().uuid('serviceId deve ser um UUID válido').optional(),
    dateTime: dateTimeFlexible.optional(),
    notes: z.string().optional(),
    status: appointmentStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

export type CreateAppointmentByAdminInput = z.infer<
  typeof createAppointmentByAdminSchema
>;
export type UpdateAppointmentByAdminInput = z.infer<
  typeof updateAppointmentByAdminSchema
>;
