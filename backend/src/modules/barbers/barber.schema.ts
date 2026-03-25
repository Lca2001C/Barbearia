import { z } from 'zod';

export const createBarberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
});

export const updateBarberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const workingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, 'Formato deve ser HH:mm'),
  endTime: z.string().regex(timeRegex, 'Formato deve ser HH:mm'),
});

export const setWorkingHoursSchema = z.object({
  hours: z.array(workingHourSchema),
});

export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
export type WorkingHourInput = z.infer<typeof workingHourSchema>;
