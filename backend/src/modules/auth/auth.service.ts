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
      phone: data.phone,
      password: hashedPassword,
    },
  });

  const tokens = generateTokens(user);

  return { user: excludePassword(user), ...tokens };
}

export async function login(data: LoginInput) {
  let user = await prisma.user.findUnique({ where: { email: data.email } });
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
