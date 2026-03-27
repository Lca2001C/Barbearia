import { z } from 'zod';

const phoneRegex = /^\+?[0-9()\-\s]{10,20}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e _')
    .optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua senha'),
  phone: z.string().regex(phoneRegex, 'Telefone inválido').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const loginSchema = z
  .object({
    // Compatibilidade: aceita payload antigo com `email`.
    identifier: z.string().min(3, 'Informe e-mail ou username').optional(),
    email: z.string().email('Email inválido').optional(),
    password: z.string(),
  })
  .refine((data) => !!(data.identifier || data.email), {
    message: 'Informe e-mail ou username',
    path: ['identifier'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
