import { z } from 'zod';

const phoneRegex = /^\+?[0-9()\-\s]{10,20}$/;

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(phoneRegex, 'Telefone inválido').optional(),
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e _')
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateUserRoleAdminSchema = z
  .object({
    // Contrato externo do painel: ADMIN ou USER.
    // Compatibilidade: ainda aceita CLIENT/SUB_ADMIN para chamadas legadas.
    role: z.enum(['ADMIN', 'USER', 'CLIENT', 'SUB_ADMIN']),
    managedBarberId: z.string().uuid().optional().nullable(),
  });

export type UpdateUserRoleAdminInput = z.infer<typeof updateUserRoleAdminSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Senha atual obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
    confirmNewPassword: z.string().min(6, 'Confirmação obrigatória'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
