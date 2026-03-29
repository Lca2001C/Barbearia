import { AppointmentStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import {
  CreateAppointmentByAdminInput,
  CreateAppointmentInput,
  UpdateAppointmentByAdminInput,
} from './appointment.schema';

const appointmentIncludes = {
  barber: true,
  service: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
  payment: true,
};

interface DateRangeInput {
  startDate?: string;
  endDate?: string;
}

function buildRangeWithFallback(input: DateRangeInput, fallback: 'today' | 'week') {
  const now = new Date();

  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start < end) {
      return { start, end };
    }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);

  if (fallback === 'today') {
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  start.setDate(start.getDate() - start.getDay());
  end.setTime(start.getTime());
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export async function createAppointment(userId: string, data: CreateAppointmentInput) {
  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, active: true },
  });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  const dateTime = new Date(data.dateTime);
  const endTime = new Date(dateTime.getTime() + service.duration * 60 * 1000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId: data.barberId,
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
      dateTime: { lt: endTime },
      endTime: { gt: dateTime },
    },
  });

  if (conflict) {
    throw new AppError('Horário indisponível', 409);
  }

  return prisma.appointment.create({
    data: {
      userId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      dateTime,
      endTime,
      notes: data.notes,
      status: 'CONFIRMED',
    },
    include: appointmentIncludes,
  });
}

function listWhereForRole(
  userId: string,
  role: Role,
  managedBarberId?: string | null,
): Prisma.AppointmentWhereInput {
  if (role === 'CLIENT') {
    return { userId };
  }
  if (role === 'SUB_ADMIN' && managedBarberId) {
    return { barberId: managedBarberId };
  }
  return {};
}

export async function listAppointments(
  userId: string,
  role: Role,
  managedBarberId?: string | null,
) {
  const where = listWhereForRole(userId, role, managedBarberId);
  if (role === 'SUB_ADMIN' && !managedBarberId) {
    return [];
  }

  return prisma.appointment.findMany({
    where,
    include: appointmentIncludes,
    orderBy: { dateTime: 'desc' },
  });
}

export async function getAppointment(
  id: string,
  userId: string,
  role: Role,
  managedBarberId?: string | null,
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: appointmentIncludes,
  });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  if (role === 'CLIENT' && appointment.userId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  if (role === 'SUB_ADMIN') {
    if (!managedBarberId || appointment.barberId !== managedBarberId) {
      throw new AppError('Acesso não autorizado', 403);
    }
  }

  return appointment;
}

export async function cancelAppointment(
  id: string,
  userId: string,
  role: Role,
  managedBarberId?: string | null,
) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  if (role === 'CLIENT' && appointment.userId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  if (role === 'SUB_ADMIN') {
    if (!managedBarberId || appointment.barberId !== managedBarberId) {
      throw new AppError('Acesso não autorizado', 403);
    }
  }

  if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
    throw new AppError('Agendamento não pode ser cancelado neste status', 400);
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: appointmentIncludes,
  });
}

export async function completeAppointment(id: string, scopeBarberId?: string | null) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  if (scopeBarberId && appointment.barberId !== scopeBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: appointmentIncludes,
  });
}

function scopeBarberWhere(scopeBarberId?: string | null): Prisma.AppointmentWhereInput {
  return scopeBarberId ? { barberId: scopeBarberId } : {};
}

export async function getUpcoming(scopeBarberId?: string | null) {
  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: new Date() },
      ...scopeBarberWhere(scopeBarberId),
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
    take: 10,
  });
}

export async function getTodayAppointments(
  input: DateRangeInput = {},
  scopeBarberId?: string | null,
) {
  const { start, end } = buildRangeWithFallback(input, 'today');

  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: start, lt: end },
      ...scopeBarberWhere(scopeBarberId),
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
  });
}

export async function getWeekAppointments(
  input: DateRangeInput = {},
  scopeBarberId?: string | null,
) {
  const { start, end } = buildRangeWithFallback(input, 'week');

  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: start, lt: end },
      ...scopeBarberWhere(scopeBarberId),
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
  });
}

export async function createAppointmentByAdmin(
  data: CreateAppointmentByAdminInput,
  scopeBarberId?: string | null,
) {
  if (scopeBarberId && data.barberId !== scopeBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, active: true },
  });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  const dateTime = new Date(data.dateTime);
  const endTime = new Date(dateTime.getTime() + service.duration * 60 * 1000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId: data.barberId,
      status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
      dateTime: { lt: endTime },
      endTime: { gt: dateTime },
    },
  });

  if (conflict) {
    throw new AppError('Horário indisponível', 409);
  }

  const status: AppointmentStatus = data.status ?? 'CONFIRMED';

  return prisma.appointment.create({
    data: {
      userId: data.userId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      dateTime,
      endTime,
      notes: data.notes,
      status,
    },
    include: appointmentIncludes,
  });
}

export async function updateAppointmentByAdmin(
  id: string,
  data: UpdateAppointmentByAdminInput,
  scopeBarberId?: string | null,
) {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  if (scopeBarberId && existing.barberId !== scopeBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }
  if (scopeBarberId && data.barberId !== undefined && data.barberId !== scopeBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  const nextServiceId = data.serviceId ?? existing.serviceId;
  const service = await prisma.service.findFirst({
    where: { id: nextServiceId, active: true },
  });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  const nextBarberId = data.barberId ?? existing.barberId;
  const nextUserId = data.userId ?? existing.userId;
  const nextDateTime = data.dateTime ? new Date(data.dateTime) : existing.dateTime;
  const nextEndTime = new Date(nextDateTime.getTime() + service.duration * 60 * 1000);

  if (data.dateTime || data.barberId || data.serviceId) {
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        barberId: nextBarberId,
        status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
        dateTime: { lt: nextEndTime },
        endTime: { gt: nextDateTime },
      },
    });
    if (conflict) {
      throw new AppError('Horário indisponível', 409);
    }
  }

  const shouldRefreshTimes = Boolean(data.dateTime || data.serviceId);

  return prisma.appointment.update({
    where: { id },
    data: {
      userId: data.userId !== undefined ? nextUserId : undefined,
      barberId: data.barberId !== undefined ? nextBarberId : undefined,
      serviceId: data.serviceId !== undefined ? nextServiceId : undefined,
      dateTime: data.dateTime !== undefined ? nextDateTime : undefined,
      endTime: shouldRefreshTimes ? nextEndTime : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
      status: data.status !== undefined ? data.status : undefined,
    },
    include: appointmentIncludes,
  });
}

export async function deleteAppointmentByAdmin(id: string, scopeBarberId?: string | null) {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  if (scopeBarberId && existing.barberId !== scopeBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  await prisma.appointment.delete({ where: { id } });
}
