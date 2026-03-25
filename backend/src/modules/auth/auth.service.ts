import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { hashPassword, comparePassword } from '../../shared/utils/password';
import { AppError } from '../../shared/errors/AppError';
import { RegisterInput, LoginInput } from './auth.schema';

function generateTokens(user: Pick<User, 'id' | 'role'>) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
}

function excludePassword(user: User) {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email já cadastrado', 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
    },
  });

  const tokens = generateTokens(user);

  return { user: excludePassword(user), ...tokens };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
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

    const tokens = generateTokens(user);

    return { user: excludePassword(user), ...tokens };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Refresh token inválido', 401);
  }
}
