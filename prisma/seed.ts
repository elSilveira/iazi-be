// prisma/seed.ts - Expanded seed with company, services, staff, and activity log

import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client'; // Assuming UserRole and AppointmentStatus enums are correctly generated
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal

// Placeholder hash function (replace with actual implementation)
async function hashPassword(password: string): Promise<string> {
  // In a real app, use bcrypt or argon2
  console.warn("Using placeholder password hashing. Replace with bcrypt/argon2 in production.");
  return password + '-hashed';
}

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clean existing data (optional, use with caution) ---
  // console.log('Deleting existing data...');
  // await prisma.professionalService.deleteMany({});
  // await prisma.appointment.deleteMany({});
  // await prisma.review.deleteMany({});
  // await prisma.service.deleteMany({});
  // await prisma.professionalExperience.deleteMany({});
  // await prisma.professionalEducation.deleteMany({});
  // await prisma.professional.deleteMany({});
  // await prisma.companyAddress.deleteMany({});
  // await prisma.company.deleteMany({});
  // await prisma.userAddress.deleteMany({});
  // await prisma.activityLog.deleteMany({});
  // await prisma.userBadge.deleteMany({});
  // await prisma.gamificationEvent.deleteMany({});
  // await prisma.user.deleteMany({});
  // await prisma.category.deleteMany({});
  // console.log('Existing data deleted.');

  // --- Create Categories ---
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
    { name: 'Cabelo', icon: 'hair.png' }, // Added from mock-company
    { name: 'Barba', icon: 'beard.png' }, // Added from mock-company
    { name: 'Combo', icon: 'combo.png' }, // Added from mock-company
    { name: 'Tratamento Facial', icon: 'facial_treatment.png' }, // Added from mock-services
    { name: 'Fisioterapia', icon: 'physiotherapy.png' }, // Added from mock-services
    { name: 'Fitness', icon: 'fitness.png' }, // Added from mock-services
    { name: 'Nutrição', icon: 'nutrition.png' }, // Added from mock-services
    { name: 'Odontologia', icon: 'dentistry.png' }, // Added from mock-services
  ];

  console.log(`Creating/Updating ${categoriesData.length} categories...`);
  const createdCategories: { [name: string]: number } = {};
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: { icon: catData.icon },
      create: catData,
    });
    createdCategories[category.name] = category.id; // Store created category IDs
    console.log(`   - ${category.name} (ID: ${category.id})`);
  }
  console.log('Categories created/updated.');

  // --- Create Users ---
  const hashedPasswordAlice = await hashPassword('password123');
  const userAlice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Demo',
      password: hashedPasswordAlice,
      role: UserRole.USER,
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      bio: 'Usuária de demonstração para testes.',
      phone: '11911111111',
      points: 50, // Add some points for gamification demo
    },
  });
  console.log(`Created/Updated user: ${userAlice.name} (ID: ${userAlice.id})`);

  const hashedPasswordBob = await hashPassword('password456');
  const userBob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Testador',
      password: hashedPasswordBob,
      role: UserRole.USER,
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      bio: 'Outro usuário para testes.',
      phone: '11922222222',
    },
  });
  console.log(`Created/Updated user: ${userBob.name} (ID: ${userBob.id})`);

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
    }
  });
  console.log(`Created address for Alice (ID: ${aliceAddress.id})`);

  // --- Create Company (Barbearia Vintage from mock-company.ts) ---
  const companyVintage = await prisma.company.create({
    data: {
      name: "Barbearia Vintage",
      description: "Barbearia especializada em cortes modernos e tradicionais",
      logo: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=300",
      coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200",
      rating: 4.8,
      totalReviews: 156,
      categories: ["Barbearia", "Estética Masculina"], // Assuming these exist in categoriesData
      yearEstablished: "2020",
      phone: "(11) 98765-4321",
      email: "contato@barbeariavintage.com.br",
      workingHours: { // Storing as JSON
        monday: { open: "09:00", close: "20:00", isOpen: true },
        tuesday: { open: "09:00", close: "20:00", isOpen: true },
        wednesday: { open: "09:00", close: "20:00", isOpen: true },
        thursday: { open: "09:00", close: "20:00", isOpen: true },
        friday: { open: "09:00", close: "22:00", isOpen: true },
        saturday: { open: "09:00", close: "18:00", isOpen: true },
        sunday: { open: "10:00", close: "16:00", isOpen: false }
      },
      address: {
        create: {
          street: "Rua Augusta",
          number: "1000",
          complement: "Loja 2",
          neighborhood: "Consolação",
          city: "São Paulo",
          state: "SP",
          zipCode: "01304-001"
        }
      }
    }
  });
  console.log(`Created company: ${companyVintage.name} (ID: ${companyVintage.id})`);

  // --- Create Professionals for Company Vintage (from mock-company.ts) ---
  const professionalsData = [
    {
      name: "João Silva",
      role: "Barbeiro Senior",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
      rating: 4.9,
      totalReviews: 50, // Adjusted from mock 'appointments'
      companyId: companyVintage.id,
      workingHours: undefined // Inherits from company or can be specific
    },
    {
      name: "Pedro Santos",
      role: "Barbeiro",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
      rating: 4.7,
      totalReviews: 30, // Adjusted from mock 'appointments'
      companyId: companyVintage.id,
      workingHours: undefined
    },
    {
      name: "Carlos Oliveira",
      role: "Barbeiro",
      image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
      rating: 4.8,
      totalReviews: 40, // Adjusted from mock 'appointments'
      companyId: companyVintage.id,
      workingHours: undefined
    }
  ];

  const createdProfessionals: { [name: string]: string } = {};
  console.log(`Creating ${professionalsData.length} professionals for ${companyVintage.name}...`);
  for (const profData of professionalsData) {
    const professional = await prisma.professional.create({ data: profData });
    createdProfessionals[professional.name] = professional.id;
    console.log(`   - ${professional.name} (ID: ${professional.id})`);
  }
  console.log('Professionals created.');

  // --- Create Services for Company Vintage (from mock-company.ts) ---
  // Helper function to parse price string like "R$ 60,00" to Decimal
  function parsePrice(priceStr: string): Decimal {
      const numStr = priceStr.replace(/[^0-9,]/g, '').replace(',', '.');
      return new Decimal(numStr);
  }

  const servicesData = [
    {
      name: "Corte de Cabelo",
      description: "Corte moderno ou tradicional com acabamento perfeito",
      price: parsePrice("R$ 60,00"),
      duration: "45min", // Adjusted format
      categoryId: createdCategories['Cabelo'], // Use ID from createdCategories
      companyId: companyVintage.id,
      image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300", // Added image example
      professionals: ["João Silva", "Pedro Santos", "Carlos Oliveira"] // Names to link via ProfessionalService
    },
    {
      name: "Barba",
      description: "Alinhamento e acabamento de barba com toalha quente",
      price: parsePrice("R$ 45,00"),
      duration: "30min", // Adjusted format
      categoryId: createdCategories['Barba'], // Use ID from createdCategories
      companyId: companyVintage.id,
      image: "https://images.unsplash.com/photo-1617906117901-380b13d3c1b8?w=300", // Added image example
      professionals: ["João Silva", "Carlos Oliveira"]
    },
    {
      name: "Combo Cabelo + Barba",
      description: "Corte de cabelo e barba com produtos premium",
      price: parsePrice("R$ 95,00"),
      duration: "1h15min", // Adjusted format "75" -> "1h15min"
      categoryId: createdCategories['Combo'], // Use ID from createdCategories
      companyId: companyVintage.id,
      image: "https://images.unsplash.com/photo-1517832606299-7ae96e19a179?w=300", // Added image example
      professionals: ["João Silva", "Pedro Santos", "Carlos Oliveira"]
    }
  ];

  console.log(`Creating ${servicesData.length} services for ${companyVintage.name}...`);
  for (const servData of servicesData) {
    const { professionals, ...serviceCreateData } = servData; // Separate professionals list
    const service = await prisma.service.create({ data: serviceCreateData });
    console.log(`   - ${service.name} (ID: ${service.id})`);

    // Link professionals to this service
    if (professionals && professionals.length > 0) {
      console.log(`     Linking ${professionals.length} professionals...`);
      for (const profName of professionals) {
        const profId = createdProfessionals[profName];
        if (profId) {
          await prisma.professionalService.create({
            data: {
              professionalId: profId,
              serviceId: service.id,
              // price: null // Optional: specific price per professional
            }
          });
          console.log(`       - Linked ${profName}`);
        } else {
          console.warn(`       - Professional ${profName} not found for linking.`);
        }
      }
    }
  }
  console.log('Services created and linked.');

  // --- Create Sample Appointment (based on mock-data.ts notification) ---
  // Find the "Corte de Cabelo" service created above
  const corteService = await prisma.service.findFirst({ where: { name: "Corte de Cabelo", companyId: companyVintage.id } });
  const joaoSilva = await prisma.professional.findFirst({ where: { name: "João Silva", companyId: companyVintage.id } });

  if (corteService && userAlice && joaoSilva) {
    const appointmentDate = new Date(); // Example: Today at 14:00
    appointmentDate.setHours(14, 0, 0, 0);

    const appointment1 = await prisma.appointment.create({
      data: {
        date: appointmentDate,
        status: AppointmentStatus.CONFIRMED, // Use enum
        userId: userAlice.id,
        serviceId: corteService.id,
        professionalId: joaoSilva.id, // Link to specific professional
        notes: "Confirmado via seed."
      }
    });
    console.log(`Created appointment for ${userAlice.name} (ID: ${appointment1.id})`);

    // --- Create Activity Log / Notification (based on mock-data.ts) ---
    const activityLog1 = await prisma.activityLog.create({
      data: {
        userId: userAlice.id,
        type: "APPOINTMENT_CONFIRMED", // Example type
        message: `Seu agendamento para ${corteService.name} foi confirmado para ${appointmentDate.toLocaleString('pt-BR')}`,
        relatedEntityId: appointment1.id,
        relatedEntityType: "Appointment"
      }
    });
    console.log(`Created activity log for appointment confirmation (ID: ${activityLog1.id})`);

  } else {
     console.warn("Could not create sample appointment/activity log due to missing user, service or professional.");
  }

  // --- Create another Activity Log (System Update) ---
   const activityLog2 = await prisma.activityLog.create({
      data: {
        userId: userAlice.id,
        type: "PROFILE_UPDATED", // Example type
        message: "Suas informações de perfil foram atualizadas com sucesso (via seed)",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Simulate yesterday
      }
    });
    console.log(`Created activity log for profile update (ID: ${activityLog2.id})`);

  // --- Create another Activity Log (Promotion - No direct model, using generic log) ---
   const activityLog3 = await prisma.activityLog.create({
      data: {
        userId: userAlice.id, // Or maybe null if it's a general promo? Schema requires userId.
        type: "PROMOTION", // Example type
        message: "Aproveite 20% de desconto em serviços de jardinagem esta semana (via seed)",
        // relatedEntityId: some_promo_id, // If promotions had their own table
        // relatedEntityType: "Promotion"
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Simulate 2 days ago
      }
    });
    console.log(`Created activity log for promotion (ID: ${activityLog3.id})`);


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

