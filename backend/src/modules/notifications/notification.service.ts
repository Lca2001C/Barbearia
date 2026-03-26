import webPush from 'web-push';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
  try {
    webPush.setVapidDetails(
      `mailto:${env.VAPID_EMAIL}`,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
  } catch (error) {
    console.warn(
      '[notifications] Chaves VAPID inválidas. Push notifications foram desativadas.',
      error,
    );
  }
}

interface SubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export async function subscribe(userId: string, subscription: SubscriptionInput) {
  const existing = await prisma.pushSubscription.findFirst({
    where: { userId, endpoint: subscription.endpoint },
  });

  if (existing) return existing;

  return prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribe(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });
}

export async function sendNotification(userId: string, payload: NotificationPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw err;
      }
    }),
  );

  return results;
}

export async function sendAppointmentReminder(appointment: {
  userId: string;
  barber: { name: string };
  service: { name: string };
  dateTime: Date;
}) {
  const time = appointment.dateTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  await sendNotification(appointment.userId, {
    title: 'Lembrete de Agendamento',
    body: `Você tem um agendamento de ${appointment.service.name} com ${appointment.barber.name} às ${time}.`,
    url: '/appointments',
  });
}
