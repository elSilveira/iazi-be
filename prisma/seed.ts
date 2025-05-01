// prisma/seed.ts - Recreated based on schema and confirmed DB structure
import { PrismaClient, Prisma, UserRole, AppointmentStatus } from '@prisma/client';

// Hash password function (replace with your actual hashing implementation)
// NOTE: Storing plain text passwords is a security risk!
async function hashPassword(password: string): Promise<string> {
  // In a real app, use bcrypt or argon2
  // Example: import bcrypt from 'bcrypt'; const saltRounds = 10; return bcrypt.hash(password, saltRounds);
  return password + '-hashed'; // Placeholder
}

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Create Categories ---
  const category1 = await prisma.category.upsert({
    where: { name: 'Barbearia' },
    update: {},
    create: {
      name: 'Barbearia',
      icon: 'barber-icon.png',
    },
  });
  console.log(`Created category: ${category1.name} (ID: ${category1.id})`);

  const category2 = await prisma.category.upsert({
    where: { name: 'Estética Masculina' },
    update: {},
    create: {
      name: 'Estética Masculina',
      icon: 'esthetics-icon.png',
    },
  });
  console.log(`Created category: ${category2.name} (ID: ${category2.id})`);

  // --- Create Users ---
  const hashedPasswordAlice = await hashPassword('password123');
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Wonderland',
      password: hashedPasswordAlice,
      avatar: 'alice-avatar.jpg',
      bio: 'Curiouser and curiouser!',
      phone: '123-456-7890',
      address: '123 Rabbit Hole Lane', // This field exists in the DB schema provided
      role: UserRole.USER, // Use the imported enum
    },
  });
  console.log(`Created user: ${user1.name} (ID: ${user1.id})`);

  const hashedPasswordBob = await hashPassword('password456');
  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob The Builder',
      password: hashedPasswordBob,
      role: UserRole.ADMIN, // Use the imported enum
      phone: '987-654-3210',
      // bio and address are optional
    },
  });
  console.log(`Created user: ${user2.name} (ID: ${user2.id})`);

  // --- Create Company with Address ---
  // NOTE: The 'categories' field in the Company model is String[] according to the schema,
  // but the DB structure shows it as ARRAY. This might be a source of issues if not handled correctly.
  // The schema should ideally define a proper relation if 'categories' refers to the Category model.
  // For now, seeding as String[] as per the schema.
  const company1 = await prisma.company.upsert({
    // Need a unique field for the where clause. Using email assuming it's intended to be unique.
    // If not, remove the where clause and use create directly (might create duplicates on re-seed).
    where: { email: 'contact@sharpcuts.com' },
    update: {},
    create: {
      name: 'Sharp Cuts Barbearia',
      description: 'Cortes modernos e clássicos para homens.',
      logo: 'sharpcuts-logo.png',
      coverImage: 'sharpcuts-cover.jpg',
      yearEstablished: '2020',
      phone: '555-0101',
      email: 'contact@sharpcuts.com',
      address: {
        create: {
          street: 'Rua Principal',
          number: '456',
          complement: 'Loja B',
          neighborhood: 'Centro',
          city: 'Metropolis',
          state: 'MP',
          zipCode: '12345-678',
        },
      },
      workingHours: {
        monday: '9:00-18:00',
        tuesday: '9:00-18:00',
        wednesday: '9:00-18:00',
        thursday: '9:00-20:00',
        friday: '9:00-20:00',
        saturday: '10:00-16:00',
        sunday: 'closed',
      } as Prisma.JsonObject,
      categories: ['Barbearia', 'Cortes Masculinos'], // As per schema String[]
    },
    include: { address: true },
  });
  console.log(`Created company: ${company1.name} (ID: ${company1.id}) with address ID: ${company1.address?.id}`);

  // --- Create Services for Company 1 ---
  // Ensure unique constraint exists in schema (e.g., @@unique([name, companyId])) for upsert to work reliably
  const service1 = await prisma.service.upsert({
    where: { name_companyId: { name: 'Corte Masculino', companyId: company1.id } },
    update: {},
    create: {
      name: 'Corte Masculino',
      description: 'Corte de cabelo clássico ou moderno.',
      price: '50.00',
      duration: '45 min',
      image: 'corte-masculino.jpg',
      companyId: company1.id,
      categoryId: category1.id, // Link to Barbearia category
    },
  });
  console.log(`Created service: ${service1.name} (ID: ${service1.id}) for company ${company1.name}`);

  const service2 = await prisma.service.upsert({
    where: { name_companyId: { name: 'Barba Terapia', companyId: company1.id } },
    update: {},
    create: {
      name: 'Barba Terapia',
      description: 'Modelagem de barba com toalha quente e massagem.',
      price: '40.00',
      duration: '30 min',
      image: 'barba-terapia.jpg',
      companyId: company1.id,
      categoryId: category1.id, // Link to Barbearia category
    },
  });
  console.log(`Created service: ${service2.name} (ID: ${service2.id}) for company ${company1.name}`);

  // --- Create Professionals for Company 1 ---
  // Add a unique constraint (e.g., @@unique([email, companyId])) in schema for reliable upsert
  // Adding a placeholder email field here assuming it might be used for uniqueness
  const prof1 = await prisma.professional.upsert({
    where: { email_companyId: { email: 'john.doe@sharpcuts.com', companyId: company1.id } },
    update: {},
    create: {
      name: 'John Doe',
      role: 'Barbeiro Senior',
      image: 'john-doe.jpg',
      companyId: company1.id,
      email: 'john.doe@sharpcuts.com', // Added placeholder email
    },
  });
  console.log(`Created professional: ${prof1.name} (ID: ${prof1.id}) for company ${company1.name}`);

  const prof2 = await prisma.professional.upsert({
    where: { email_companyId: { email: 'jane.smith@sharpcuts.com', companyId: company1.id } },
    update: {},
    create: {
      name: 'Jane Smith',
      role: 'Barbeira Junior',
      image: 'jane-smith.jpg',
      companyId: company1.id,
      email: 'jane.smith@sharpcuts.com', // Added placeholder email
    },
  });
  console.log(`Created professional: ${prof2.name} (ID: ${prof2.id}) for company ${company1.name}`);

  // --- Link Professionals to Services (ProfessionalService) ---
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof1.id, serviceId: service1.id } },
    update: {},
    create: {
      professionalId: prof1.id,
      serviceId: service1.id,
      price: '50.00',
    },
  });
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof1.id, serviceId: service2.id } },
    update: {},
    create: {
      professionalId: prof1.id,
      serviceId: service2.id,
    },
  });
  console.log(`Linked ${prof1.name} to services.`);

  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof2.id, serviceId: service1.id } },
    update: {},
    create: {
      professionalId: prof2.id,
      serviceId: service1.id,
      price: '45.00',
    },
  });
  console.log(`Linked ${prof2.name} to services.`);

  // --- Create Appointments ---
  const appointment1 = await prisma.appointment.create({
    data: {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: AppointmentStatus.CONFIRMED, // Use imported enum
      userId: user1.id,
      serviceId: service1.id,
      professionalId: prof1.id,
      notes: 'Prefiro máquina 2 dos lados.',
    },
  });
  console.log(`Created appointment ${appointment1.id} for ${user1.name}`);

  // --- Create Reviews ---
  const review1 = await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Ótimo corte, como sempre!',
      userId: user1.id,
      serviceId: service1.id,
      companyId: company1.id,
      professionalId: prof1.id,
    },
  });
  console.log(`Created review ${review1.id} from ${user1.name}`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    // Log the detailed error structure if available
    if (e.code) {
      console.error(`Prisma Error Code: ${e.code}`);
    }
    if (e.meta) {
      console.error(`Prisma Error Meta: ${JSON.stringify(e.meta)}`);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

