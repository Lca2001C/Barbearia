import { z } from 'zod';

export const createStockItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(0, 'Quantidade não pode ser negativa'),
  unit: z.string().min(1).default('un'),
});

export const updateStockItemSchema = createStockItemSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
export type UpdateStockItemInput = Partial<CreateStockItemInput>;
