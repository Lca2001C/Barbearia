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

export async function getStats() {
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    totalRevenue,
    appointmentsToday,
    totalClients,
    totalActiveBarbers,
    monthlyRevenue,
    appointmentsThisWeek,
  ] = await Promise.all([
    sumCompletedServiceRevenue({}),
    prisma.appointment.count({
      where: {
        dateTime: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.user.count({
      where: { role: 'CLIENT' },
    }),
    prisma.barber.count({
      where: { active: true },
    }),
    sumCompletedServiceRevenue({
      dateTime: { gte: monthStart, lt: monthEnd },
    }),
    prisma.appointment.count({
      where: {
        dateTime: { gte: weekStart, lt: weekEnd },
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
