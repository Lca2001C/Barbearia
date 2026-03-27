import { AppointmentStatus, Role } from '@prisma/client';
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
  barberId?: string;
}

export interface StaffContext {
  role: Role;
  managedBarberId?: string | null;
}

function assertStaffOwnsAppointment(
  appointment: { barberId: string },
  staff: StaffContext,
) {
  if (staff.role === 'SUB_ADMIN') {
    if (!staff.managedBarberId || appointment.barberId !== staff.managedBarberId) {
      throw new AppError('Acesso não autorizado', 403);
    }
  }
}

async function assertUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Cliente não encontrado', 404);
  }
}

async function assertBarberExists(barberId: string) {
  const barber = await prisma.barber.findUnique({ where: { id: barberId } });
  if (!barber) {
    throw new AppError('Barbeiro não encontrado', 404);
  }
}

async function getServiceOrThrow(serviceId: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new AppError('Serviço não encontrado', 404);
  }
  return service;
}

async function assertNoTimeConflict(params: {
  barberId: string;
  dateTime: Date;
  endTime: Date;
  ignoreAppointmentId?: string;
}) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId: params.barberId,
      id: params.ignoreAppointmentId
        ? { not: params.ignoreAppointmentId }
        : undefined,
      status: { not: 'CANCELLED' },
      dateTime: { lt: params.endTime },
      endTime: { gt: params.dateTime },
    },
  });

  if (conflict) {
    throw new AppError('Horário indisponível', 409);
  }
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
  await assertUserExists(userId);
  await assertBarberExists(data.barberId);
  const service = await getServiceOrThrow(data.serviceId);

  const dateTime = new Date(data.dateTime);
  const endTime = new Date(dateTime.getTime() + service.duration * 60 * 1000);

  await assertNoTimeConflict({ barberId: data.barberId, dateTime, endTime });

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

export async function createAppointmentByAdmin(data: CreateAppointmentByAdminInput) {
  await assertUserExists(data.userId);
  await assertBarberExists(data.barberId);
  const service = await getServiceOrThrow(data.serviceId);

  const dateTime = new Date(data.dateTime);
  const endTime = new Date(dateTime.getTime() + service.duration * 60 * 1000);
  await assertNoTimeConflict({ barberId: data.barberId, dateTime, endTime });

  return prisma.appointment.create({
    data: {
      userId: data.userId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      dateTime,
      endTime,
      notes: data.notes,
      status: data.status ?? 'CONFIRMED',
    },
    include: appointmentIncludes,
  });
}

export async function listAppointments(
  userId: string,
  role: Role,
  managedBarberId?: string | null,
) {
  let where: { userId?: string; barberId?: string } = {};
  if (role === 'CLIENT') {
    where = { userId };
  } else if (role === 'SUB_ADMIN') {
    if (!managedBarberId) {
      throw new AppError('Sub-admin sem barbeiro vinculado', 403);
    }
    where = { barberId: managedBarberId };
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
    assertStaffOwnsAppointment(appointment, { role, managedBarberId });
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
    assertStaffOwnsAppointment(appointment, { role, managedBarberId });
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

export async function completeAppointment(id: string, staff: StaffContext) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  assertStaffOwnsAppointment(appointment, staff);

  return prisma.appointment.update({
    where: { id },
    data: { status: 'COMPLETED' },
    include: appointmentIncludes,
  });
}

export async function updateAppointmentByAdmin(
  id: string,
  data: UpdateAppointmentByAdminInput,
  staff: StaffContext,
) {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true },
  });
  if (!existing) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  assertStaffOwnsAppointment(existing, staff);
  if (staff.role === 'SUB_ADMIN' && data.barberId && data.barberId !== staff.managedBarberId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  const userId = data.userId ?? existing.userId;
  const barberId = data.barberId ?? existing.barberId;
  const serviceId = data.serviceId ?? existing.serviceId;
  const dateTime = data.dateTime ? new Date(data.dateTime) : existing.dateTime;

  if (data.userId) await assertUserExists(data.userId);
  if (data.barberId) await assertBarberExists(data.barberId);

  const service = data.serviceId
    ? await getServiceOrThrow(data.serviceId)
    : existing.service;
  const endTime = new Date(dateTime.getTime() + service.duration * 60 * 1000);

  if (barberId !== existing.barberId || dateTime.getTime() !== existing.dateTime.getTime() || serviceId !== existing.serviceId) {
    await assertNoTimeConflict({
      barberId,
      dateTime,
      endTime,
      ignoreAppointmentId: id,
    });
  }

  const payload: {
    userId: string;
    barberId: string;
    serviceId: string;
    dateTime: Date;
    endTime: Date;
    notes?: string;
    status?: AppointmentStatus;
  } = {
    userId,
    barberId,
    serviceId,
    dateTime,
    endTime,
  };

  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.status !== undefined) payload.status = data.status;

  return prisma.appointment.update({
    where: { id },
    data: payload,
    include: appointmentIncludes,
  });
}

export async function deleteAppointmentByAdmin(id: string, staff: StaffContext) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  assertStaffOwnsAppointment(appointment, staff);

  await prisma.appointment.delete({ where: { id } });
}

export async function getUpcoming(barberId?: string) {
  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: new Date() },
      ...(barberId ? { barberId } : {}),
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
    take: 10,
  });
}

export async function getTodayAppointments(input: DateRangeInput = {}) {
  const { start, end } = buildRangeWithFallback(input, 'today');
  const barberScope = input.barberId ? { barberId: input.barberId } : {};

  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: start, lt: end },
      ...barberScope,
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
  });
}

export async function getWeekAppointments(input: DateRangeInput = {}) {
  const { start, end } = buildRangeWithFallback(input, 'week');
  const barberScope = input.barberId ? { barberId: input.barberId } : {};

  return prisma.appointment.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      dateTime: { gte: start, lt: end },
      ...barberScope,
    },
    include: appointmentIncludes,
    orderBy: { dateTime: 'asc' },
  });
}
