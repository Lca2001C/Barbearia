import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import { CreateStockItemInput, UpdateStockItemInput } from './stock.schema';

type Staff = { role: Role; managedBarberId?: string | null };

function assertStaffBarberItem(itemBarberId: string, staff?: Staff) {
  if (staff?.role === 'SUB_ADMIN') {
    if (!staff.managedBarberId || itemBarberId !== staff.managedBarberId) {
      throw new AppError('Acesso não autorizado', 403);
    }
  }
}

async function assertBarber(barberId: string) {
  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }
  return barber;
}

export async function listByBarber(barberId: string) {
  await assertBarber(barberId);
  return prisma.stockItem.findMany({
    where: { barberId },
    orderBy: { name: 'asc' },
  });
}

export async function createItem(barberId: string, data: CreateStockItemInput) {
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

export async function updateItem(id: string, data: UpdateStockItemInput, staff?: Staff) {
  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) {
    throw new AppError('Item de estoque não encontrado', 404);
  }
  assertStaffBarberItem(item.barberId, staff);
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

export async function deleteItem(id: string, staff?: Staff) {
  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) {
    throw new AppError('Item de estoque não encontrado', 404);
  }
  assertStaffBarberItem(item.barberId, staff);
  await prisma.stockItem.delete({ where: { id } });
}
