import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().positive('Preço deve ser positivo'),
  duration: z.number().int().positive('Duração deve ser um inteiro positivo'),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
