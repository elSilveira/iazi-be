import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

// Criar uma nova instância do PrismaClient
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Criar Usuários
  const saltRounds = 10;
  const hashedPasswordUser1 = await bcrypt.hash("senha123", saltRounds);
  const user1 = await prisma.user.upsert({
    where: { email: "usuario1@exemplo.com" },
    update: {},
    create: {
      email: "usuario1@exemplo.com",
      name: "Usuário Um",
      password: hashedPasswordUser1,
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
  });
  console.log(`Created user: ${user1.name} (ID: ${user1.id})`);

  const hashedPasswordUser2 = await bcrypt.hash("senha456", saltRounds);
  const user2 = await prisma.user.upsert({
    where: { email: "usuario2@exemplo.com" },
    update: {},
    create: {
      email: "usuario2@exemplo.com",
      name: "Usuário Dois",
      password: hashedPasswordUser2,
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    },
  });
  console.log(`Created user: ${user2.name} (ID: ${user2.id})`);

  // Criar Empresa 1: Barbearia
  const company1 = await prisma.company.upsert({
    where: { id: "barbearia-vintage-seed" }, // Usar um ID fixo para upsert
    update: {},
    create: {
      id: "barbearia-vintage-seed",
      name: "Barbearia Vintage Seed",
      description: "Barbearia especializada em cortes modernos e tradicionais (Seed)",
      logo: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=300",
      coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200",
      categories: ["Barbearia", "Estética Masculina"],
      yearEstablished: "2021",
      phone: "(11) 11111-1111",
      email: "contato@vintage-seed.com",
      workingHours: {
        monday: { open: "09:00", close: "20:00", isOpen: true },
        sunday: { open: "10:00", close: "16:00", isOpen: false }
      },
      // Criar endereço junto com a empresa
      address: {
        create: {
          street: "Rua Fictícia",
          number: "123",
          neighborhood: "Centro Seed",
          city: "Seed City",
          state: "SS",
          zipCode: "12345-678",
        },
      },
    },
    include: { address: true }, // Incluir endereço no retorno
  });
  console.log(`Created company: ${company1.name} (ID: ${company1.id}) with address ID: ${company1.address?.id}`);

  // Criar Profissionais para Empresa 1
  const prof1 = await prisma.professional.upsert({
    where: { id: "prof1-seed" },
    update: {},
    create: {
      id: "prof1-seed",
      name: "João Barbeiro Seed",
      role: "Barbeiro Senior",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
      companyId: company1.id,
    },
  });
  console.log(`Created professional: ${prof1.name} (ID: ${prof1.id}) for company ${company1.name}`);

  const prof2 = await prisma.professional.upsert({
    where: { id: "prof2-seed" },
    update: {},
    create: {
      id: "prof2-seed",
      name: "Pedro Barbeiro Seed",
      role: "Barbeiro",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
      companyId: company1.id,
    },
  });
  console.log(`Created professional: ${prof2.name} (ID: ${prof2.id}) for company ${company1.name}`);

  // Criar Serviços para Empresa 1
  const service1 = await prisma.service.upsert({
    where: { id: "serv1-seed" },
    update: {},
    create: {
      id: "serv1-seed",
      name: "Corte de Cabelo Seed",
      description: "Corte moderno ou tradicional (Seed)",
      price: "R$ 65,00",
      duration: "45 min",
      category: "Cabelo",
      companyId: company1.id,
    },
  });
  console.log(`Created service: ${service1.name} (ID: ${service1.id}) for company ${company1.name}`);

  const service2 = await prisma.service.upsert({
    where: { id: "serv2-seed" },
    update: {},
    create: {
      id: "serv2-seed",
      name: "Barba Seed",
      description: "Alinhamento e acabamento de barba (Seed)",
      price: "R$ 50,00",
      duration: "30 min",
      category: "Barba",
      companyId: company1.id,
    },
  });
  console.log(`Created service: ${service2.name} (ID: ${service2.id}) for company ${company1.name}`);

  // Conectar Profissionais aos Serviços (ProfessionalService)
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof1.id, serviceId: service1.id } },
    update: {},
    create: { professionalId: prof1.id, serviceId: service1.id, price: "R$ 70,00" }, // Preço especial
  });
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof1.id, serviceId: service2.id } },
    update: {},
    create: { professionalId: prof1.id, serviceId: service2.id },
  });
  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: prof2.id, serviceId: service1.id } },
    update: {},
    create: { professionalId: prof2.id, serviceId: service1.id },
  });
  console.log(`Connected professionals to services for company ${company1.name}`);

  // Criar Agendamento
  const appointment1 = await prisma.appointment.create({
    data: {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      userId: user1.id,
      serviceId: service1.id,
      professionalId: prof1.id,
      status: "PENDING",
      notes: "Primeiro agendamento via seed.",
    },
  });
  console.log(`Created appointment (ID: ${appointment1.id}) for user ${user1.name}`);

  // Criar Avaliação
  const review1 = await prisma.review.create({
    data: {
      rating: 5,
      comment: "Excelente corte! Profissional muito atencioso.",
      userId: user1.id,
      serviceId: service1.id,
      professionalId: prof1.id,
      companyId: company1.id,
    },
  });
  console.log(`Created review (ID: ${review1.id}) for service ${service1.name}`);

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
