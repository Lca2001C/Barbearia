import nodemailer from 'nodemailer';
import { env } from '../../config/env';

interface SendPasswordResetTokenEmailInput {
  to: string;
  name: string;
  token: string;
}

function buildTransport() {
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetTokenEmail({
  to,
  name,
  token,
}: SendPasswordResetTokenEmailInput) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const from = env.SMTP_FROM ?? env.SMTP_USER ?? 'no-reply@barbearia.local';
  const transporter = buildTransport();

  if (!transporter) {
    console.warn('[auth] SMTP não configurado. E-mail de reset não foi enviado.');
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject: 'Recuperação de senha - Barbearia',
    text: `Olá ${name},\n\nUse o link abaixo para redefinir sua senha (expira em ${env.PASSWORD_RESET_TOKEN_TTL_MINUTES} minutos):\n${resetUrl}\n\nSe você não solicitou, ignore este e-mail.`,
    html: `
      <p>Olá ${name},</p>
      <p>Use o link abaixo para redefinir sua senha (expira em ${env.PASSWORD_RESET_TOKEN_TTL_MINUTES} minutos):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Se você não solicitou, ignore este e-mail.</p>
    `,
  });
}
