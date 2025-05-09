// prisma/seed.ts - Expanded seed with company, services, staff, and activity log

import { PrismaClient, UserRole, AppointmentStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Helper function to generate a date in the past
function pastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Helper function to generate a date in the future
function futureDate(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

// Placeholder hash function (replace with actual implementation)
async function hashPassword(password: string): Promise<string> {
  console.warn("Using placeholder password hashing. Replace with bcrypt/argon2 in production.");
  return password + "-hashed";
}

// Helper to generate a URL-friendly slug from a name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Helper to ensure slug uniqueness
async function generateUniqueSlug(base: string, attempt = 0): Promise<string> {
  let slug = slugify(base);
  if (attempt > 0) slug += `-${attempt}`;
  const existing = await prisma.user.findUnique({ where: { slug } });
  if (!existing) return slug;
  return generateUniqueSlug(base, attempt + 1);
}

// Helper to generate a unique slug for a user
async function generateUniqueUserSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 1;
  let unique = false;
  while (!unique) {
    const existing = await prisma.user.findUnique({ where: { slug } });
    if (!existing) {
      unique = true;
    } else {
      slug = `${slugify(base)}-${suffix++}`;
    }
  }
  return slug;
}

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clean existing data (optional, use with caution) ---
  console.log("Deleting existing data...");
  await prisma.like.deleteMany({}); 
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professionalExperience.deleteMany({});
  await prisma.professionalEducation.deleteMany({});
  await prisma.professionalPortfolioItem.deleteMany({});
  await prisma.professionalAvailabilitySlot.deleteMany({});
  await prisma.scheduleBlock.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.gamificationEvent.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});
  console.log("Existing data deleted.");

  // --- Create Categories ---
  const categoriesData = [
    { name: "Barbearia", icon: "barber.png", createdAt: pastDate(30), updatedAt: pastDate(5) },
    { name: "Salão de Beleza", icon: "salon.png", createdAt: pastDate(60), updatedAt: pastDate(10) },
    { name: "Manicure e Pedicure", icon: "nails.png", createdAt: pastDate(45), updatedAt: pastDate(15) },
    { name: "Massagem", icon: "massage.png", createdAt: pastDate(90), updatedAt: pastDate(20) },
    { name: "Cabelo", icon: "hair.png", createdAt: pastDate(35), updatedAt: pastDate(3) },
    { name: "Barba", icon: "beard.png", createdAt: pastDate(40), updatedAt: pastDate(8) },
    { name: "Combo", icon: "combo.png", createdAt: pastDate(50), updatedAt: pastDate(12) },
  ];

  console.log(`Creating/Updating ${categoriesData.length} categories...`);
  const createdCategories: { [name: string]: { id: number, createdAt: Date, updatedAt: Date } } = {};
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: { icon: catData.icon, updatedAt: new Date() },
      create: catData,
    });
    createdCategories[category.name] = { id: category.id, createdAt: category.createdAt, updatedAt: category.updatedAt };
    console.log(`   - ${category.name} (ID: ${category.id}) created at ${category.createdAt}`);
  }
  console.log("Categories created/updated.");

  // --- Create Users ---
  const hashedPasswordAlice = await hashPassword("password123");
  const aliceSlug = await generateUniqueUserSlug("Alice Demo");
  const userAlice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { updatedAt: new Date(), slug: aliceSlug },
    create: {
      email: "alice@example.com",
      name: "Alice Demo",
      password: hashedPasswordAlice,
      role: UserRole.USER,
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
      bio: "Usuária de demonstração para testes.",
      phone: "11911111111",
      points: 50,
      slug: aliceSlug,
      createdAt: pastDate(100),
      updatedAt: pastDate(10),
    },
  });
  console.log(`Created/Updated user: ${userAlice.name} (ID: ${userAlice.id}) created at ${userAlice.createdAt}`);

  const hashedPasswordBob = await hashPassword("password456");
  const bobSlug = await generateUniqueUserSlug("Bob Testador");
  const userBob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { updatedAt: new Date(), slug: bobSlug },
    create: {
      email: "bob@example.com",
      name: "Bob Testador",
      password: hashedPasswordBob,
      role: UserRole.USER,
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      bio: "Outro usuário para testes.",
      phone: "11922222222",
      points: 25,
      slug: bobSlug,
      createdAt: pastDate(80),
      updatedAt: pastDate(5),
    },
  });
  console.log(`Created/Updated user: ${userBob.name} (ID: ${userBob.id}) created at ${userBob.createdAt}`);

  // --- Create User Address for Alice ---
  const aliceAddress = await prisma.userAddress.create({
    data: {
      street: "Rua Fictícia",
      number: "123",
      complement: "Apto 4B",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01001-000",
      isPrimary: true,
      userId: userAlice.id,
      createdAt: pastDate(90),
      updatedAt: pastDate(8),
    }
  });
  console.log(`Created address for Alice (ID: ${aliceAddress.id}) created at ${aliceAddress.createdAt}`);

  // --- Create Company (Barbearia Vintage) ---
  const companyVintage = await prisma.company.create({
    data: {
      name: "Barbearia Vintage",
      description: "Barbearia especializada em cortes modernos e tradicionais",
      logo: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=300",
      coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200",
      rating: 4.8,
      totalReviews: 156,
      categories: ["Barbearia"],
      yearEstablished: "2020",
      phone: "(11) 98765-4321",
      email: "contato@barbeariavintage.com.br",
      workingHours: { monday: { open: "09:00", close: "20:00", isOpen: true } },
      createdAt: pastDate(70),
      updatedAt: pastDate(15),
      address: {
        create: {
          street: "Rua Augusta",
          number: "1000",
          complement: "Loja 2",
          neighborhood: "Consolação",
          city: "São Paulo",
          state: "SP",
          zipCode: "01304-001",
          createdAt: pastDate(70),
          updatedAt: pastDate(15),
        }
      }
    }
  });
  console.log(`Created company: ${companyVintage.name} (ID: ${companyVintage.id}) created at ${companyVintage.createdAt}`);

  // --- Create Professionals for Company Vintage ---
  const professionalsData = [
    {
      name: "João Silva",
      role: "Barbeiro Senior",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
      bio: "Barbeiro experiente com mais de 10 anos de mercado.",
      phone: "11999998888",
      rating: 4.9,
      totalReviews: 50,
      companyId: companyVintage.id,
      userId: userAlice.id, 
      createdAt: pastDate(65),
      updatedAt: pastDate(12),
    },
    {
      name: "Pedro Santos",
      role: "Barbeiro",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
      bio: "Especialista em cortes clássicos e modernos.",
      phone: "11977776666",
      rating: 4.7,
      totalReviews: 30,
      companyId: companyVintage.id,
      userId: userBob.id, 
      createdAt: pastDate(60),
      updatedAt: pastDate(10),
    }
  ];

  const createdProfessionals: { [name: string]: { id: string, createdAt: Date, updatedAt: Date } } = {};
  console.log(`Creating ${professionalsData.length} professionals for ${companyVintage.name}...`);
  for (const profData of professionalsData) {
    const professional = await prisma.professional.create({ data: profData });
    createdProfessionals[professional.name] = { id: professional.id, createdAt: professional.createdAt, updatedAt: professional.updatedAt };
    console.log(`   - ${professional.name} (ID: ${professional.id}) created at ${professional.createdAt}`);
  }
  console.log("Professionals created.");

  // --- Create Services for Company Vintage ---
  function parsePrice(priceStr: string): Decimal {
      const numStr = priceStr.replace(/[^0-9,]/g, "").replace(",", ".");
      return new Decimal(numStr);
  }

  const servicesData = [
    {
      name: "Corte de Cabelo",
      description: "Corte moderno ou tradicional com acabamento perfeito",
      price: parsePrice("R$ 60,00"),
      duration: "45min",
      categoryId: createdCategories["Cabelo"].id,
      companyId: companyVintage.id,
      image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300",
      professionals: ["João Silva", "Pedro Santos"],
      createdAt: pastDate(55),
      updatedAt: pastDate(7),
    },
    {
      name: "Barba",
      description: "Alinhamento e acabamento de barba com toalha quente",
      price: parsePrice("R$ 45,00"),
      duration: "30min",
      categoryId: createdCategories["Barba"].id,
      companyId: companyVintage.id,
      image: "https://images.unsplash.com/photo-1617906117901-380b13d3c1b8?w=300",
      professionals: ["João Silva"],
      createdAt: pastDate(50),
      updatedAt: pastDate(6),
    }
  ];

  const createdServices: { [name: string]: { id: string, createdAt: Date, updatedAt: Date } } = {};
  console.log(`Creating ${servicesData.length} services for ${companyVintage.name}...`);
  for (const servData of servicesData) {
    const { professionals, ...serviceCreateData } = servData;
    const service = await prisma.service.create({ data: serviceCreateData });
    createdServices[service.name] = { id: service.id, createdAt: service.createdAt, updatedAt: service.updatedAt };
    console.log(`   - ${service.name} (ID: ${service.id}) created at ${service.createdAt}`);

    if (professionals && professionals.length > 0) {
      for (const profName of professionals) {
        const profId = createdProfessionals[profName]?.id;
        if (profId) {
          await prisma.professionalService.create({
            data: {
              professionalId: profId,
              serviceId: service.id,
            }
          });
          console.log(`       - Linked ${profName} to ${service.name}`);
        }
      }
    }
  }
  console.log("Services created and linked.");

  // --- Create Sample Appointments ---
  const corteServiceId = createdServices["Corte de Cabelo"].id;
  const joaoSilvaId = createdProfessionals["João Silva"].id;

  if (corteServiceId && userAlice.id && joaoSilvaId) {
    const appointment1 = await prisma.appointment.create({
      data: {
        date: futureDate(2),
        status: AppointmentStatus.CONFIRMED,
        userId: userAlice.id,
        serviceId: corteServiceId,
        professionalId: joaoSilvaId,
        notes: "Confirmado via seed.",
        createdAt: pastDate(1),
        updatedAt: new Date(),
      }
    });
    console.log(`Created appointment for ${userAlice.name} (ID: ${appointment1.id}) at ${appointment1.date}`);

    // --- Create Activity Log for Appointment ---
    await prisma.activityLog.create({
      data: {
        userId: userAlice.id,
        activityType: "APPOINTMENT_CONFIRMED", // updated field name
        details: {
          message: `Seu agendamento para Corte de Cabelo foi confirmado para ${appointment1.date.toLocaleString("pt-BR")}`
        },
        referenceId: appointment1.id,
        createdAt: new Date(),
      }
    });
  }

  // --- Create Reviews ---
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Excelente corte, João é um ótimo profissional!",
      userId: userAlice.id,
      serviceId: corteServiceId,
      professionalId: joaoSilvaId,
      companyId: companyVintage.id,
      updatedAt: pastDate(3), // removed createdAt
    }
  });
  console.log("Created a review.");

  // --- Create Professional Experience for João Silva ---
  await prisma.professionalExperience.create({
    data: {
      title: "Barbeiro Pleno",
      companyName: "Barbearia TopCorte",
      description: "Responsável por cortes masculinos e barba.",
      startDate: pastDate(3 * 365), 
      endDate: pastDate(1 * 365),   
      isCurrent: false,
      professionalId: joaoSilvaId,
      createdAt: pastDate(3 * 365),
      updatedAt: pastDate(1 * 365),
    }
  });
  console.log("Created professional experience for João Silva.");

  // --- Create Professional Education for João Silva ---
  await prisma.professionalEducation.create({
    data: {
      institution: "Escola de Barbeiros Profissionais",
      degree: "Certificado Avançado em Barbearia",
      fieldOfStudy: "Barbearia e Estética Masculina",
      startDate: pastDate(5 * 365), 
      endDate: pastDate(4 * 365),   
      professionalId: joaoSilvaId,
      createdAt: pastDate(5 * 365),
      updatedAt: pastDate(4 * 365),
    }
  });
  console.log("Created professional education for João Silva.");
  
  // --- Create Badges ---
  const badge1 = await prisma.badge.create({
    data: {
      name: "Primeiro Agendamento",
      description: "Concedido após o primeiro agendamento concluído.",
      iconUrl: "/icons/badge_first_appointment.png",
      eventTrigger: "FIRST_APPOINTMENT_COMPLETED",
      createdAt: pastDate(200),
      updatedAt: pastDate(200),
    }
  });
  const badge2 = await prisma.badge.create({
    data: {
      name: "Cliente Fiel",
      description: "Concedido após 5 agendamentos concluídos.",
      iconUrl: "/icons/badge_loyal_customer.png",
      pointsThreshold: 100,
      createdAt: pastDate(190),
      updatedAt: pastDate(190),
    }
  });
  console.log("Created badges.");

  // --- Award Badge to User Alice ---
  await prisma.userBadge.create({
    data: {
      userId: userAlice.id,
      badgeId: badge1.id,
      awardedAt: pastDate(1), 
    }
  });
  console.log(`Awarded '${badge1.name}' to ${userAlice.name}`);

  // --- Create Gamification Event ---
  await prisma.gamificationEvent.create({
    data: {
      userId: userAlice.id,
      eventType: "APPOINTMENT_COMPLETED",
      pointsAwarded: 10,
      details: { relatedEntityId: corteServiceId, relatedEntityType: "Service" }, // use details JSON
    }
  });
  console.log("Created gamification event for Alice.");

  // --- Create Posts ---
  const post1 = await prisma.post.create({
    data: {
      content: "Novo Visual para o Verão! Confira as novas tendências de cortes para o verão na Barbearia Vintage! Agende seu horário.",
      userId: userAlice.id, // changed from authorId
      imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600",
      createdAt: pastDate(8),
      updatedAt: pastDate(7),
    }
  });
  console.log("Created a post.");

  // --- Create Comments ---
  await prisma.comment.create({
    data: {
      content: "Adorei as dicas! Vou agendar!",
      userId: userBob.id, // changed from authorId
      postId: post1.id,
      createdAt: pastDate(6),
      updatedAt: pastDate(6),
    }
  });
  console.log("Created a comment.");

  // --- Create Likes ---
  // Like in schema does NOT have updatedAt
  await prisma.like.create({ 
    data: {
      userId: userBob.id,
      postId: post1.id,
      createdAt: pastDate(5),
    }
  });
  console.log("Created a like.");

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

