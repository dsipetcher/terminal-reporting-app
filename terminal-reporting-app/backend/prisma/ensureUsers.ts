import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    username: 'admin',
    password: 'admin',
    role: 'ADMIN',
    fullName: 'Администратор ИЛС',
    department: 'ИТ',
  },
  {
    username: 'planner',
    password: 'planner',
    role: 'PLANNER',
    fullName: 'Плановик (демо)',
    department: 'Планирование',
  },
  {
    username: 'dispatcher',
    password: 'dispatcher',
    role: 'DISPATCHER',
    fullName: 'Диспетчер угольно-нефтяного терминала',
    department: 'Диспетчерская',
  },
  {
    username: 'warehouse',
    password: 'warehouse',
    role: 'WAREHOUSE',
    fullName: 'Кладовщик (демо)',
    department: 'Склад',
  },
] as const;

export async function ensureDemoUsers(client: PrismaClient = prisma) {
  for (const user of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await client.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
      },
      create: {
        username: user.username,
        passwordHash,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
      },
    });
  }
}

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/ensureUsers.ts');

if (isDirectRun) {
  ensureDemoUsers()
    .then(() => {
      console.log('Demo users ready: admin, planner, dispatcher, warehouse');
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
