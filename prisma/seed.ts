// Simplified seed.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create a basic user
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      password: 'password123', // Remember to hash passwords in a real app
      role: UserRole.USER, // Use the enum
      // Other fields like bio, phone, address are optional
    },
  });
  console.log(`Created user: ${user1.name} (ID: ${user1.id})`);

  // Create a basic category
  const category1 = await prisma.category.upsert({
    where: { name: 'Default Category' },
    update: {},
    create: {
      name: 'Default Category',
      icon: 'default-icon.png',
    },
  });
  console.log(`Created category: ${category1.name} (ID: ${category1.id})`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

