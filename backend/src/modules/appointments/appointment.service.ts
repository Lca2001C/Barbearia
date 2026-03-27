import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import { CreateAppointmentInput } from './appointment.schema';

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
  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }

  const dateTime = new Date(data.dateTime);
  const endTime = new Date(dateTime.getTime() + service.duration * 60 * 1000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId: data.barberId,
      status: { not: 'CANCELLED' },
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

export async function listAppointments(userId: string, role: Role) {
  const where = role === 'CLIENT' ? { userId } : {};

  return prisma.appointment.findMany({
    where,
    include: appointmentIncludes,
    orderBy: { dateTime: 'desc' },
  });
}

export async function getAppointment(id: string, userId: string, role: Role) {
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

  return appointment;
}

export async function cancelAppointment(id: string, userId: string, role: Role) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  if (role === 'CLIENT' && appointment.userId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
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

export async function completeAppointment(id: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  return prisma.appointment.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: appointmentIncludes,
  });
}

export async function getUpcoming() {
  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: new Date() },
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
    take: 10,
  });
}

export async function getTodayAppointments(input: DateRangeInput = {}) {
  const { start, end } = buildRangeWithFallback(input, 'today');

  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: start, lt: end },
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
  });
}

export async function getWeekAppointments(input: DateRangeInput = {}) {
  const { start, end } = buildRangeWithFallback(input, 'week');

  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: start, lt: end },
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
  });
}
