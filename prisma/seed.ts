// prisma/seed.ts - Based on simple seed, adding multiple categories
import { PrismaClient, UserRole } from '@prisma/client'; // Assuming UserRole enum is correctly generated

// Placeholder hash function (replace with actual implementation)
async function hashPassword(password: string): Promise<string> {
  // In a real app, use bcrypt or argon2
  return password + '-hashed';
}

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Create Categories for Demo ---
  const categoriesData = [
    { name: 'Barbearia', icon: 'barber.png' },
    { name: 'Salão de Beleza', icon: 'salon.png' },
    { name: 'Manicure e Pedicure', icon: 'nails.png' },
    { name: 'Massagem', icon: 'massage.png' },
    { name: 'Depilação', icon: 'waxing.png' },
    { name: 'Estética Facial', icon: 'facial.png' },
    { name: 'Estética Corporal', icon: 'body.png' },
    { name: 'Maquiagem', icon: 'makeup.png' },
    { name: 'Sobrancelhas', icon: 'eyebrows.png' },
    { name: 'Cílios', icon: 'eyelashes.png' },
    { name: 'Podologia', icon: 'podology.png' },
    { name: 'Terapia Capilar', icon: 'hair_therapy.png' },
  ];

  console.log(`Creating/Updating ${categoriesData.length} categories...`);
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: { icon: catData.icon }, // Update icon if category already exists
      create: catData,
    });
    console.log(`   - ${category.name} (ID: ${category.id})`);
  }
  console.log('Categories created/updated.');

  // --- Create a Basic User --- (Kept from the simple seed that worked)
  const hashedPasswordAlice = await hashPassword('password123');
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Demo',
      password: hashedPasswordAlice,
      role: UserRole.USER, // Use the imported enum
      // Optional fields can be added if needed for demo
      // bio: 'Demo user bio.',
      // phone: '111-222-3333',
    },
  });
  console.log(`Created/Updated user: ${user1.name} (ID: ${user1.id})`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });