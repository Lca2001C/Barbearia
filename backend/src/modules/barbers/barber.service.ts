import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import { CreateBarberInput, UpdateBarberInput, WorkingHourInput } from './barber.schema';

export async function listBarbers(viewer?: { role: Role; managedBarberId?: string | null }) {
  if (viewer?.role === 'SUB_ADMIN') {
    if (!viewer.managedBarberId) {
      return [];
    }
    return prisma.barber.findMany({
      where: { id: viewer.managedBarberId, active: true },
      include: {
        barberServices: { include: { service: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  return prisma.barber.findMany({
    where: { active: true },
    include: {
      barberServices: { include: { service: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getBarber(id: string) {
  const barber = await prisma.barber.findUnique({
    where: { id },
    include: {
      barberServices: { include: { service: true } },
      workingHours: { orderBy: { dayOfWeek: 'asc' } },
    },
  });

  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }

  return barber;
}

export async function createBarber(data: CreateBarberInput) {
  const existing = await prisma.barber.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email já cadastrado para outro barbeiro', 409);
  }

  return prisma.barber.create({ data });
}

export async function updateBarber(id: string, data: UpdateBarberInput) {
  const barber = await prisma.barber.findUnique({ where: { id } });
  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }

  if (data.email && data.email !== barber.email) {
    const existing = await prisma.barber.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email já cadastrado para outro barbeiro', 409);
    }
  }

  return prisma.barber.update({ where: { id }, data });
}

export async function deleteBarber(id: string) {
  const barber = await prisma.barber.findUnique({ where: { id } });
  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }

  return prisma.barber.update({
    where: { id },
    data: { active: false },
  });
}

export async function setWorkingHours(barberId: string, hours: WorkingHourInput[]) {
  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.workingHour.deleteMany({ where: { barberId } });

    await tx.workingHour.createMany({
      data: hours.map((h) => ({
        barberId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
      })),
    });
  });

  return prisma.workingHour.findMany({
    where: { barberId },
    orderBy: { dayOfWeek: 'asc' },
  });
}

export async function getAvailability(barberId: string, date: string, serviceId: string) {
  const targetDate = new Date(date + 'T00:00:00');
  const dayOfWeek = targetDate.getDay();

  const workingHour = await prisma.workingHour.findUnique({
    where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
  });

  if (!workingHour) {
    return [];
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  const dayStart = new Date(date + 'T00:00:00');
  const dayEnd = new Date(date + 'T23:59:59');

  const appointments = await prisma.appointment.findMany({
    where: {
      barberId,
      dateTime: { gte: dayStart, lte: dayEnd },
      status: { not: 'CANCELLED' },
    },
    orderBy: { dateTime: 'asc' },
  });
  type ApptRow = (typeof appointments)[number];

  const [startHour, startMin] = workingHour.startTime.split(':').map(Number);
  const [endHour, endMin] = workingHour.endTime.split(':').map(Number);
  const durationMinutes = service.duration;

  const slots: { time: string; available: boolean }[] = [];
  let currentMinutes = startHour * 60 + startMin;
  const closingMinutes = endHour * 60 + endMin;

  while (currentMinutes + durationMinutes <= closingMinutes) {
    const slotStart = new Date(targetDate);
    slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

    const hasConflict = appointments.some((appt: ApptRow) => {
      return slotStart < appt.endTime && slotEnd > appt.dateTime;
    });

    const hh = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
    const mm = String(currentMinutes % 60).padStart(2, '0');
    slots.push({
      time: `${hh}:${mm}`,
      available: !hasConflict,
    });

    currentMinutes += 30;
  }

  return slots;
}

export async function getBarbersMetricsOverview(scopeBarberId?: string) {
  const barbers = await prisma.barber.findMany({
    where: scopeBarberId ? { id: scopeBarberId } : undefined,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, active: true, email: true },
  });
  type BarberRow = (typeof barbers)[number];

  const completed = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    select: { barberId: true, service: { select: { price: true } } },
  });

  const acc = new Map<string, { completedCuts: number; totalRevenue: number }>();
  for (const row of completed) {
    const prev = acc.get(row.barberId) ?? { completedCuts: 0, totalRevenue: 0 };
    prev.completedCuts += 1;
    prev.totalRevenue += Number(row.service.price);
    acc.set(row.barberId, prev);
  }

  return barbers.map((b: BarberRow) => {
    const m = acc.get(b.id) ?? { completedCuts: 0, totalRevenue: 0 };
    return {
      id: b.id,
      name: b.name,
      email: b.email,
      active: b.active,
      completedCuts: m.completedCuts,
      totalRevenue: m.totalRevenue,
    };
  });
}

export async function getBarberHistory(
  barberId: string,
  order: 'asc' | 'desc' = 'desc',
  viewer?: { role: Role; managedBarberId?: string | null },
) {
  if (viewer?.role === 'SUB_ADMIN' && viewer.managedBarberId !== barberId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }

  return prisma.appointment.findMany({
    where: {
      barberId,
      status: 'COMPLETED',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      barber: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { dateTime: order },
  });
}
