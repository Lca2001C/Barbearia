import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { hashPassword, comparePassword } from '../../shared/utils/password';
import { AppError } from '../../shared/errors/AppError';
import { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from './auth.schema';
import { sendPasswordResetTokenEmail } from './mail.service';

type AuthTokenUser = { id: string; role: string; managedBarberId?: string | null };

function buildJwtPayload(user: AuthTokenUser) {
  const payload: { id: string; role: string; managedBarberId?: string } = {
    id: user.id,
    role: user.role,
  };
  if (user.managedBarberId) {
    payload.managedBarberId = user.managedBarberId;
  }
  return payload;
}

function generateTokens(user: AuthTokenUser) {
  const accessExpiresIn = env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'];
  const refreshExpiresIn = env.REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'];
  const payload = buildJwtPayload(user);

  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: accessExpiresIn });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn,
  });

  return { accessToken, refreshToken };
}

function excludePassword(user: { password: string } & Record<string, unknown>) {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

function normalizeUsername(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

async function getAvailableUsername(preferred: string) {
  let base = normalizeUsername(preferred);
  if (base.length < 3) base = `user_${Date.now().toString().slice(-6)}`;
  let candidate = base;
  let idx = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    idx += 1;
    candidate = `${base}_${idx}`.slice(0, 30);
  }

  return candidate;
}

export async function register(data: RegisterInput) {
  const normalizedRequestedUsername = data.username
    ? normalizeUsername(data.username)
    : undefined;
  if (normalizedRequestedUsername && normalizedRequestedUsername.length < 3) {
    throw new AppError('Username inválido', 400);
  }

  if (normalizedRequestedUsername) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedRequestedUsername },
    });
    if (existingUsername) {
      throw new AppError('Username já cadastrado', 409);
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email já cadastrado', 409);
  }

  if (data.phone) {
    const existingPhone = await prisma.user.findFirst({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new AppError('Telefone já cadastrado', 409);
    }
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      username:
        normalizedRequestedUsername ??
        (await getAvailableUsername(data.email.split('@')[0] ?? data.name)),
      phone: data.phone,
      password: hashedPassword,
    },
  });

  const tokens = generateTokens(user);

  return { user: excludePassword(user), ...tokens };
}

export async function login(data: LoginInput) {
  const identifier = (data.identifier ?? data.email ?? '').toLowerCase().trim();
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });
  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
  }

  // Garante que o usuário de admin padrão exista como ADMIN (caso o banco tenha sido seedado antes).
  if (user.email === 'admin@barbearia.com' && user.role !== 'ADMIN') {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
  }

  const passwordValid = await comparePassword(data.password, user.password);
  if (!passwordValid) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const tokens = generateTokens(user);

  return { user: excludePassword(user), ...tokens };
}

export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; role: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      throw new AppError('Usuário não encontrado', 401);
    }

    const ensuredUser =
      user.email === 'admin@barbearia.com' && user.role !== 'ADMIN'
        ? await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
        : user;

    const tokens = generateTokens(ensuredUser);

    return { user: excludePassword(ensuredUser), ...tokens };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Refresh token inválido', 401);
  }
}

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function forgotPassword(data: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    return { success: true };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(resetToken);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  await sendPasswordResetTokenEmail({
    to: user.email,
    name: user.name,
    token: resetToken,
  });

  return { success: true };
}

export async function resetPassword(data: ResetPasswordInput) {
  const tokenHash = hashResetToken(data.token);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Token de recuperação inválido ou expirado', 400);
  }

  const hashedPassword = await hashPassword(data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  return { success: true };
}
