import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barbearia.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@barbearia.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  const barber1 = await prisma.barber.upsert({
    where: { email: 'carlos@barbearia.com' },
    update: {},
    create: {
      name: 'Carlos Silva',
      email: 'carlos@barbearia.com',
      phone: '(11) 99999-0001',
      bio: 'Especialista em cortes modernos e degradê.',
      active: true,
    },
  });

  const barber2 = await prisma.barber.upsert({
    where: { email: 'rafael@barbearia.com' },
    update: {},
    create: {
      name: 'Rafael Santos',
      email: 'rafael@barbearia.com',
      phone: '(11) 99999-0002',
      bio: 'Expert em barba e tratamentos capilares.',
      active: true,
    },
  });
  console.log(`Barbers created: ${barber1.name}, ${barber2.name}`);

  const workingHoursData = [1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) =>
    [barber1.id, barber2.id].map((barberId) => ({
      barberId,
      dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
    })),
  );

  for (const wh of workingHoursData) {
    await prisma.workingHour.upsert({
      where: { barberId_dayOfWeek: { barberId: wh.barberId, dayOfWeek: wh.dayOfWeek } },
      update: { startTime: wh.startTime, endTime: wh.endTime },
      create: wh,
    });
  }
  console.log('Working hours set for Mon-Sat 09:00-18:00');

  const servicesData = [
    { name: 'Corte Masculino', description: 'Corte masculino moderno com acabamento.', price: 45, duration: 30 },
    { name: 'Barba', description: 'Barba feita com navalha e toalha quente.', price: 30, duration: 20 },
    { name: 'Corte + Barba', description: 'Combo corte masculino e barba completa.', price: 65, duration: 50 },
    { name: 'Pigmentação', description: 'Pigmentação capilar para cobertura de fios brancos.', price: 80, duration: 40 },
  ];

  const services = [];
  for (const s of servicesData) {
    let service = await prisma.service.findFirst({ where: { name: s.name } });
    if (!service) {
      service = await prisma.service.create({ data: s });
    }
    services.push(service);
  }
  console.log(`Services created: ${services.map((s) => s.name).join(', ')}`);

  for (const barber of [barber1, barber2]) {
    for (const service of services) {
      await prisma.barberService.upsert({
        where: { barberId_serviceId: { barberId: barber.id, serviceId: service.id } },
        update: {},
        create: { barberId: barber.id, serviceId: service.id },
      });
    }
  }
  console.log('Barbers linked to all services');

  const stockSamples = [
    { name: 'Pomada modeladora', description: 'Fixação média', quantity: 12, unit: 'un' },
    { name: 'Óleo para barba', description: 'Frasco 30ml', quantity: 8, unit: 'un' },
    { name: 'Toalhas descartáveis', description: 'Pacote', quantity: 200, unit: 'un' },
    { name: 'Navalha descartável', description: 'Caixa', quantity: 50, unit: 'un' },
  ];

  for (const barber of [barber1, barber2]) {
    const count = await prisma.stockItem.count({ where: { barberId: barber.id } });
    if (count === 0) {
      for (const item of stockSamples) {
        await prisma.stockItem.create({
          data: { barberId: barber.id, ...item },
        });
      }
      console.log(`Stock sample items for ${barber.name}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
