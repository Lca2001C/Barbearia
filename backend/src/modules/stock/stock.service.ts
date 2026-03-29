import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import { CreateStockItemInput, UpdateStockItemInput } from './stock.schema';

export type StockViewer = {
  role: Role;
  managedBarberId?: string | null;
};

function assertBarberScope(viewer: StockViewer, barberId: string) {
  if (viewer.role === 'ADMIN') {
    return;
  }
  if (viewer.role === 'SUB_ADMIN') {
    if (viewer.managedBarberId && viewer.managedBarberId === barberId) {
      return;
    }
  }
  throw new AppError('Acesso não autorizado', 403);
}

async function assertBarber(barberId: string) {
  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }
  return barber;
}

export async function listByBarber(barberId: string, viewer: StockViewer) {
  assertBarberScope(viewer, barberId);
  await assertBarber(barberId);
  return prisma.stockItem.findMany({
    where: { barberId },
    orderBy: { name: 'asc' },
  });
}

export async function createItem(barberId: string, data: CreateStockItemInput, viewer: StockViewer) {
  assertBarberScope(viewer, barberId);
  await assertBarber(barberId);
  return prisma.stockItem.create({
    data: {
      barberId,
      name: data.name,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit ?? 'un',
    },
  });
}

export async function updateItem(id: string, data: UpdateStockItemInput, viewer: StockViewer) {
  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) {
    throw new AppError('Item de estoque não encontrado', 404);
  }
  assertBarberScope(viewer, item.barberId);
  return prisma.stockItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.unit !== undefined && { unit: data.unit }),
    },
  });
}

export async function deleteItem(id: string, viewer: StockViewer) {
  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) {
    throw new AppError('Item de estoque não encontrado', 404);
  }
  assertBarberScope(viewer, item.barberId);
  await prisma.stockItem.delete({ where: { id } });
}
