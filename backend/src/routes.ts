import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { barberRoutes } from './modules/barbers/barber.routes';
import { serviceRoutes } from './modules/services/service.routes';
import { appointmentRoutes } from './modules/appointments/appointment.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { stockRoutes } from './modules/stock/stock.routes';

const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ data: { ok: true, service: 'cia-do-disfarce-api' } });
});

routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/barbers', barberRoutes);
routes.use('/services', serviceRoutes);
routes.use('/appointments', appointmentRoutes);
routes.use('/payments', paymentRoutes);
routes.use('/notifications', notificationRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/stock', stockRoutes);

export { routes };
