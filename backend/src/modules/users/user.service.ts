import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import { comparePassword, hashPassword } from '../../shared/utils/password';
import {
  ChangePasswordInput,
  UpdateProfileInput,
  UpdateUserRoleAdminInput,
} from './user.schema';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      managedBarberId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  if (data.username) {
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: data.username.toLowerCase(),
        NOT: { id: userId },
      },
    });

    if (existingUsername) {
      throw new AppError('Username já cadastrado', 409);
    }
  }

  if (data.phone) {
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone: data.phone,
        NOT: { id: userId },
      },
    });

    if (existingPhone) {
      throw new AppError('Telefone já cadastrado', 409);
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      ...(data.username !== undefined && { username: data.username.toLowerCase() }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      managedBarberId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function listClientsForStaff() {
  return prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      managedBarberId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
}

export async function updateUserRoleByAdmin(userId: string, data: UpdateUserRoleAdminInput) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (target.role === 'ADMIN' && data.role !== 'ADMIN') {
    throw new AppError('O administrador não pode ser rebaixado ou alterado', 400);
  }

  const normalizedRole = data.role === 'USER' ? 'CLIENT' : data.role;
  let managedBarberId: string | null = null;

  if (normalizedRole === 'ADMIN') {
    if (target.role !== 'SUB_ADMIN' && target.role !== 'ADMIN') {
      throw new AppError('Apenas SUB_ADMIN pode ser promovido para ADMIN', 400);
    }

    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        NOT: { id: target.id },
      },
      select: { id: true },
    });

    if (existingAdmin) {
      throw new AppError('Já existe um administrador no sistema', 400);
    }
  }

  if (normalizedRole === 'SUB_ADMIN') {
    if (!data.managedBarberId) {
      throw new AppError('Selecione o barbeiro vinculado para SUB_ADMIN', 400);
    }
    const barber = await prisma.barber.findUnique({ where: { id: data.managedBarberId! } });
    if (!barber) {
      throw new AppError('Barbeiro não encontrado', 404);
    }
    managedBarberId = data.managedBarberId!;
  }

  const role = normalizedRole as Role;

  return prisma.user.update({
    where: { id: userId },
    data: {
      role,
      managedBarberId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      managedBarberId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteUserByAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  if (user.role === 'ADMIN') {
    throw new AppError('O administrador não pode ser removido', 400);
  }

  await prisma.user.delete({ where: { id: userId } });
}

export async function getUserDetailsByAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      managedBarberId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return user;
}

export async function changePassword(userId: string, data: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const validCurrentPassword = await comparePassword(data.currentPassword, user.password);
  if (!validCurrentPassword) {
    throw new AppError('Senha atual inválida', 400);
  }

  const newPassword = await hashPassword(data.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: newPassword },
  });
}
