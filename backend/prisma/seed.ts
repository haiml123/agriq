import { PrismaClient, role_type } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('1234', 10);

  // Create user with SUPER_ADMIN role
  const superAdmin = await prisma.user.upsert({
    where: { email: 'levihai49@gmail.com' },
    update: {},
    create: {
      email: 'levihai49@gmail.com',
      password: hashedPassword,
      name: 'Hai',
      roles: {
        create: {
          role: role_type.SUPER_ADMIN,
        },
      },
    },
    include: {
      roles: true,
    },
  });

  console.log('Super admin created:', superAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
