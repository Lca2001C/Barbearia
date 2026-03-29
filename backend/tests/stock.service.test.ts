import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/config/prisma', () => ({
  prisma: {
    barber: { findUnique: vi.fn() },
    stockItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../src/config/prisma';
import {
  listByBarber,
  createItem,
  updateItem,
  deleteItem,
} from '../src/modules/stock/stock.service';

describe('stock.service — escopo SUB_ADMIN', () => {
  const adminViewer = { role: 'ADMIN' as const, managedBarberId: null as string | null };
  const subViewer = {
    role: 'SUB_ADMIN' as const,
    managedBarberId: 'barber-mine',
  };

  beforeEach(() => {
    vi.mocked(prisma.barber.findUnique).mockResolvedValue({
      id: 'barber-mine',
      name: 'João',
      email: 'j@x.com',
      phone: null,
      avatarUrl: null,
      bio: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.stockItem.findMany).mockResolvedValue([]);
  });

  it('SUB_ADMIN recebe 403 ao listar estoque de outro barbeiro', async () => {
    await expect(
      listByBarber('outro-barbeiro', subViewer),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('SUB_ADMIN lista estoque do próprio barbeiro', async () => {
    const rows = await listByBarber('barber-mine', subViewer);
    expect(rows).toEqual([]);
    expect(prisma.stockItem.findMany).toHaveBeenCalled();
  });

  it('ADMIN lista qualquer barbeiro', async () => {
    await listByBarber('barber-mine', adminViewer);
    expect(prisma.stockItem.findMany).toHaveBeenCalled();
  });

  it('createItem: SUB_ADMIN só no próprio barbeiro', async () => {
    vi.mocked(prisma.stockItem.create).mockResolvedValue({
      id: '1',
      barberId: 'barber-mine',
      name: 'Pomada',
      description: null,
      quantity: 1,
      unit: 'un',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      createItem(
        'outro',
        { name: 'X', quantity: 1, unit: 'un' },
        subViewer,
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('updateItem: SUB_ADMIN só itens do próprio barbeiro', async () => {
    vi.mocked(prisma.stockItem.findUnique).mockResolvedValue({
      id: 'item-1',
      barberId: 'outro',
      name: 'X',
      description: null,
      quantity: 1,
      unit: 'un',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(
      updateItem('item-1', { name: 'Y' }, subViewer),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('deleteItem: SUB_ADMIN só itens do próprio barbeiro', async () => {
    vi.mocked(prisma.stockItem.findUnique).mockResolvedValue({
      id: 'item-1',
      barberId: 'outro',
      name: 'X',
      description: null,
      quantity: 1,
      unit: 'un',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await expect(deleteItem('item-1', subViewer)).rejects.toMatchObject({ statusCode: 403 });
  });
});
