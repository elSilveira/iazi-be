// prisma/seed.ts
import { PrismaClient, Prisma, UserRole, AppointmentStatus } from '@prisma/client';

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
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Wonderland',
      password: 'password123', // Remember to hash passwords in a real app
      avatar: 'alice-avatar.jpg',
      bio: 'Curiouser and curiouser!',
      phone: '123-456-7890',
      address: '123 Rabbit Hole Lane',
      role: UserRole.USER,
    },
  });
  console.log(`Created user: ${user1.name} (ID: ${user1.id})`);

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob The Builder',
      password: 'password456',
      role: UserRole.ADMIN, // Example of different role
      phone: '987-654-3210',
    },
  });
  console.log(`Created user: ${user2.name} (ID: ${user2.id})`);

  // --- Create Company with Address ---
  const company1 = await prisma.company.upsert({
    where: { email: 'contact@sharpcuts.com' }, // Assuming email is unique for upsert
    update: {},
    create: {
      name: 'Sharp Cuts Barbearia',
      description: 'Cortes modernos e clássicos para homens.',
      logo: 'sharpcuts-logo.png',
      coverImage: 'sharpcuts-cover.jpg',
      yearEstablished: '2020',
      phone: '555-0101',
      email: 'contact@sharpcuts.com',
      // Nested create for Address
      address: {
        create: {
          street: 'Rua Principal',
          number: '456',
          neighborhood: 'Centro',
          city: 'Metropolis',
          state: 'MP',
          zipCode: '12345-678',
        },
      },
      // Example for workingHours (Json field)
      workingHours: {
        monday: '9:00-18:00',
        tuesday: '9:00-18:00',
        wednesday: '9:00-18:00',
        thursday: '9:00-20:00',
        friday: '9:00-20:00',
        saturday: '10:00-16:00',
        sunday: 'closed',
      } as Prisma.JsonObject, // Cast to Prisma.JsonObject
      // categories field is String[], not a relation in the current schema
      categories: ['Barbearia', 'Cortes Masculinos'],
    },
    include: { address: true }, // Include address to log its ID
  });
  console.log(`Created company: ${company1.name} (ID: ${company1.id}) with address ID: ${company1.address?.id}`);

  // --- Create Services for Company 1 ---
  const service1 = await prisma.service.upsert({
    where: { name_companyId: { name: 'Corte Masculino', companyId: company1.id } }, // Need a unique constraint or use create directly
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
    where: { name_companyId: { name: 'Barba Terapia', companyId: company1.id } }, // Need a unique constraint or use create directly
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
  const prof1 = await prisma.professional.upsert({
    where: { email_companyId: { email: 'john.doe@sharpcuts.com', companyId: company1.id } }, // Assuming email+companyId is unique
    update: {},
    create: {
      name: 'John Doe',
      role: 'Barbeiro Senior',
      image: 'john-doe.jpg',
      companyId: company1.id,
      email: 'john.doe@sharpcuts.com', // Added email for potential unique constraint
    },
  });
  console.log(`Created professional: ${prof1.name} (ID: ${prof1.id}) for company ${company1.name}`);

  const prof2 = await prisma.professional.upsert({
    where: { email_companyId: { email: 'jane.smith@sharpcuts.com', companyId: company1.id } }, // Assuming email+companyId is unique
    update: {},
    create: {
      name: 'Jane Smith',
      role: 'Barbeira Junior',
      image: 'jane-smith.jpg',
      companyId: company1.id,
      email: 'jane.smith@sharpcuts.com', // Added email for potential unique constraint
    },
  });
  console.log(`Created professional: ${prof2.name} (ID: ${prof2.id}) for company ${company1.name}`);

  // --- Link Professionals to Services (ProfessionalService) ---
  // John Doe offers Corte Masculino and Barba Terapia
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof1.id, serviceId: service1.id } },
    update: {},
    create: {
      professionalId: prof1.id,
      serviceId: service1.id,
      price: '50.00', // Can override service price if needed
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

  // Jane Smith offers only Corte Masculino
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof2.id, serviceId: service1.id } },
    update: {},
    create: {
      professionalId: prof2.id,
      serviceId: service1.id,
      price: '45.00', // Junior price example
    },
  });
  console.log(`Linked ${prof2.name} to services.`);

  // --- Create Appointments ---
  const appointment1 = await prisma.appointment.create({
    data: {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: AppointmentStatus.CONFIRMED,
      userId: user1.id,
      serviceId: service1.id,
      professionalId: prof1.id, // Alice booked with John Doe
      notes: 'Prefiro máquina 2 dos lados.',
    },
  });
  console.log(`Created appointment ${appointment1.id} for ${user1.name}`);

  // --- Create Reviews ---
  // Review for a service
  const review1 = await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Ótimo corte, como sempre!',
      userId: user1.id,
      serviceId: service1.id,
      companyId: company1.id,
      professionalId: prof1.id, // Optional: review can be linked to professional too
    },
  });
  console.log(`Created review ${review1.id} from ${user1.name}`);

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

