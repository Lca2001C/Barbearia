import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';

function generateMockPixCode(): string {
  const chars = '0123456789';
  let code = '00020126580014br.gov.bcb.pix0136';
  for (let i = 0; i < 36; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '5204000053039865802BR';
  return code;
}

export async function generatePix(appointmentId: string, userId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true, payment: true },
  });

  if (!appointment) {
    throw new AppError('Agendamento não encontrado', 404);
  }

  if (appointment.userId !== userId) {
    throw new AppError('Acesso não autorizado', 403);
  }

  if (appointment.payment?.status === 'PAID') {
    throw new AppError('Este agendamento já foi pago', 400);
  }

  if (appointment.payment) {
    return appointment.payment;
  }

  let pixCode: string;
  let pixQrCode: string;
  let externalId: string | null = null;

  if (env.MERCADOPAGO_ACCESS_TOKEN) {
    try {
      const { MercadoPagoConfig, Payment } = await import('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN });
      const paymentApi = new Payment(client);

      const mpPayment = await paymentApi.create({
        body: {
          transaction_amount: Number(appointment.service.price),
          description: `Agendamento - ${appointment.service.name}`,
          payment_method_id: 'pix',
          payer: { email: 'cliente@barbearia.com' },
        },
      });

      pixCode = (mpPayment as any).point_of_interaction?.transaction_data?.qr_code ?? generateMockPixCode();
      pixQrCode = (mpPayment as any).point_of_interaction?.transaction_data?.qr_code_base64 ?? 'MOCK_QR_CODE_BASE64';
      externalId = String(mpPayment.id);
    } catch {
      pixCode = generateMockPixCode();
      pixQrCode = 'MOCK_QR_CODE_BASE64';
    }
  } else {
    pixCode = generateMockPixCode();
    pixQrCode = 'MOCK_QR_CODE_BASE64';
  }

  const payment = await prisma.payment.create({
    data: {
      appointmentId,
      amount: appointment.service.price,
      method: 'PIX',
      status: 'PENDING',
      pixCode,
      pixQrCode,
      externalId,
    },
  });

  return payment;
}

export async function handleWebhook(data: any) {
  if (data.type !== 'payment' || !data.data?.id) {
    return;
  }

  const externalId = String(data.data.id);

  const payment = await prisma.payment.findFirst({
    where: { externalId },
  });

  if (!payment) return;

  if (env.MERCADOPAGO_ACCESS_TOKEN) {
    try {
      const { MercadoPagoConfig, Payment } = await import('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN });
      const paymentApi = new Payment(client);
      const mpPayment = await paymentApi.get({ id: externalId });

      if (mpPayment.status === 'approved') {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID', paidAt: new Date() },
          }),
          prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: { status: 'CONFIRMED' },
          }),
        ]);
      } else if (mpPayment.status === 'rejected') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
    } catch {
      console.error('Error processing webhook for payment:', externalId);
    }
  }
}

export async function getPaymentStatus(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { appointment: true },
  });

  if (!payment) {
    throw new AppError('Pagamento não encontrado', 404);
  }

  return payment;
}
