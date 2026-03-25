import { prisma } from '../../config/prisma';

export async function getStats() {
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalRevenue,
    appointmentsToday,
    totalClients,
    totalActiveBarbers,
    revenueThisMonth,
    appointmentsThisWeek,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
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
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: {
        dateTime: { gte: weekStart, lt: todayEnd },
      },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.amount ?? 0,
    appointmentsToday,
    totalClients,
    totalBarbers: totalActiveBarbers,
    monthlyRevenue: revenueThisMonth._sum.amount ?? 0,
    weeklyAppointments: appointmentsThisWeek,
  };
}
