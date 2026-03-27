import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';

/** Faturamento = soma do preço do serviço em agendamentos concluídos. */
async function sumCompletedServiceRevenue(where: Prisma.AppointmentWhereInput) {
  const rows = await prisma.appointment.findMany({
    where: { status: 'COMPLETED', ...where },
    select: { service: { select: { price: true } } },
  });
  return rows.reduce((sum, a) => sum + Number(a.service.price), 0);
}

interface StatsRangeInput {
  startDate?: string;
  endDate?: string;
  /** Quando definido, estatísticas ficam restritas a este barbeiro (sub-admin). */
  barberId?: string;
}

function parseCustomRange(input: StatsRangeInput): { start: Date; end: Date } | null {
  if (!input.startDate || !input.endDate) return null;
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return null;
  }
  return { start, end };
}

export async function getStats(input: StatsRangeInput = {}) {
  const now = new Date();
  const barberScope = input.barberId ? { barberId: input.barberId } : {};

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const customRange = parseCustomRange(input);

  const [
    totalRevenue,
    appointmentsToday,
    totalClients,
    totalActiveBarbers,
    monthlyRevenue,
    appointmentsThisWeek,
  ] = await Promise.all([
    sumCompletedServiceRevenue(
      customRange
        ? { dateTime: { gte: customRange.start, lt: customRange.end }, ...barberScope }
        : { ...barberScope },
    ),
    prisma.appointment.count({
      where: {
        status: { not: 'CANCELLED' },
        dateTime: { gte: todayStart, lt: todayEnd },
        ...barberScope,
      },
    }),
    input.barberId
      ? prisma.user.count({
          where: {
            appointments: { some: { barberId: input.barberId } },
          },
        })
      : prisma.user.count({
          where: { role: 'CLIENT' },
        }),
    input.barberId
      ? prisma.barber.count({
          where: { id: input.barberId, active: true },
        })
      : prisma.barber.count({
          where: { active: true },
        }),
    sumCompletedServiceRevenue({
      dateTime: { gte: monthStart, lt: monthEnd },
      ...barberScope,
    }),
    prisma.appointment.count({
      where: {
        status: { not: 'CANCELLED' },
        dateTime: { gte: weekStart, lt: weekEnd },
        ...barberScope,
      },
    }),
  ]);

  return {
    totalRevenue,
    appointmentsToday,
    totalClients,
    totalBarbers: totalActiveBarbers,
    monthlyRevenue,
    weeklyAppointments: appointmentsThisWeek,
  };
}
