import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import { CreateServiceInput, UpdateServiceInput } from './service.schema';

export async function listServices(isAdmin = false) {
  return prisma.service.findMany({
    where: isAdmin ? {} : { active: true },
    orderBy: { name: 'asc' },
  });
}

export async function getService(id: string) {
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  return service;
}

export async function createService(data: CreateServiceInput) {
  return prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      duration: data.duration,
    },
  });
}

export async function updateService(id: string, data: UpdateServiceInput) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  return prisma.service.update({
    where: { id },
    data: { active: false },
  });
}
