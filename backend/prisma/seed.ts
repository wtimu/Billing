import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    {
      name: '1 Hour Access',
      priceUgx: 2000,
      durationMinutes: 60
    },
    {
      name: '3 Hour Access',
      priceUgx: 5000,
      durationMinutes: 180
    },
    {
      name: 'Daily Unlimited',
      priceUgx: 10000,
      durationMinutes: 24 * 60
    }
  ];

  // Clear existing packages
  await prisma.package.deleteMany({});
  
  // Create packages
  await prisma.package.createMany({
    data: packages
  });

  const adminPassword = await bcrypt.hash('ChangeMe123!', 10);
  await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin'
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
