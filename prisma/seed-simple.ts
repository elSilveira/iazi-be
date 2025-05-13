// prisma/seed.ts - Simplified seed with only categories and services

import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Helper function to generate a date in the past
function pastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clean only categories and services ---
  console.log("Deleting existing categories and services...");
  await prisma.professionalService.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.category.deleteMany({});
  console.log("Existing categories and services deleted.");

  // --- Create Categories ---
  const categoriesData = [
    { name: "Barbearia", icon: "barber.png", createdAt: pastDate(30), updatedAt: pastDate(5) },
    { name: "Salão de Beleza", icon: "salon.png", createdAt: pastDate(60), updatedAt: pastDate(10) },
    { name: "Manicure e Pedicure", icon: "nails.png", createdAt: pastDate(45), updatedAt: pastDate(15) },
    { name: "Massagem", icon: "massage.png", createdAt: pastDate(90), updatedAt: pastDate(20) },
    { name: "Cabelo", icon: "hair.png", createdAt: pastDate(35), updatedAt: pastDate(3) },
    { name: "Barba", icon: "beard.png", createdAt: pastDate(40), updatedAt: pastDate(8) },
    { name: "Combo", icon: "combo.png", createdAt: pastDate(50), updatedAt: pastDate(12) },
    { name: "Estética", icon: "aesthetics.png", createdAt: pastDate(55), updatedAt: pastDate(7) },
    { name: "Depilação", icon: "waxing.png", createdAt: pastDate(42), updatedAt: pastDate(6) },
    { name: "Maquiagem", icon: "makeup.png", createdAt: pastDate(38), updatedAt: pastDate(4) }
  ];

  console.log(`Creating/Updating ${categoriesData.length} categories...`);
  const createdCategories: { [name: string]: { id: number, createdAt: Date, updatedAt: Date } } = {};
  
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: { icon: catData.icon, updatedAt: new Date() },
      create: catData,
    });
    createdCategories[category.name] = { 
      id: category.id, 
      createdAt: category.createdAt, 
      updatedAt: category.updatedAt 
    };
    console.log(`   - ${category.name} (ID: ${category.id}) created at ${category.createdAt}`);
  }
  console.log("Categories created/updated.");

  // --- Create Services (without company association) ---
  function parsePrice(priceStr: string): Decimal {
    const numStr = priceStr.replace(/[^0-9,]/g, "").replace(",", ".");
    return new Decimal(numStr);
  }

  const servicesData = [
    {
      name: "Corte de Cabelo Masculino",
      description: "Corte moderno ou tradicional com acabamento perfeito",
      price: parsePrice("R$ 60,00"),
      duration: "45min",
      categoryId: createdCategories["Cabelo"].id,
      image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=300",
      createdAt: pastDate(55),
      updatedAt: pastDate(7),
    },
    {
      name: "Barba",
      description: "Alinhamento e acabamento de barba com toalha quente",
      price: parsePrice("R$ 45,00"),
      duration: "30min",
      categoryId: createdCategories["Barba"].id,
      image: "https://images.unsplash.com/photo-1617906117901-380b13d3c1b8?w=300",
      createdAt: pastDate(50),
      updatedAt: pastDate(6),
    },
    {
      name: "Combo Cabelo e Barba",
      description: "Corte de cabelo e barba com atendimento completo",
      price: parsePrice("R$ 95,00"),
      duration: "1h15min",
      categoryId: createdCategories["Combo"].id,
      image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300",
      createdAt: pastDate(48),
      updatedAt: pastDate(5),
    },
    {
      name: "Manicure",
      description: "Tratamento completo para unhas das mãos",
      price: parsePrice("R$ 40,00"),
      duration: "45min",
      categoryId: createdCategories["Manicure e Pedicure"].id,
      image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=300",
      createdAt: pastDate(45),
      updatedAt: pastDate(4),
    },
    {
      name: "Pedicure",
      description: "Tratamento completo para unhas dos pés",
      price: parsePrice("R$ 50,00"),
      duration: "50min",
      categoryId: createdCategories["Manicure e Pedicure"].id,
      image: "https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=300",
      createdAt: pastDate(45),
      updatedAt: pastDate(4),
    },
    {
      name: "Massagem Relaxante",
      description: "Massagem corporal para relaxamento muscular",
      price: parsePrice("R$ 120,00"),
      duration: "1h",
      categoryId: createdCategories["Massagem"].id,
      image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300",
      createdAt: pastDate(40),
      updatedAt: pastDate(3),
    },
    {
      name: "Corte Feminino",
      description: "Corte, lavagem e finalização para cabelos femininos",
      price: parsePrice("R$ 80,00"),
      duration: "1h",
      categoryId: createdCategories["Cabelo"].id,
      image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300",
      createdAt: pastDate(38),
      updatedAt: pastDate(2),
    },
    {
      name: "Coloração",
      description: "Aplicação de tinta com produtos de qualidade",
      price: parsePrice("R$ 140,00"),
      duration: "2h",
      categoryId: createdCategories["Cabelo"].id,
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300",
      createdAt: pastDate(35),
      updatedAt: pastDate(2),
    },
    {
      name: "Depilação com Cera",
      description: "Depilação com cera quente ou fria",
      price: parsePrice("R$ 70,00"),
      duration: "45min",
      categoryId: createdCategories["Depilação"].id,
      image: "https://images.unsplash.com/photo-1608548533535-8e1e2d81fce4?w=300",
      createdAt: pastDate(30),
      updatedAt: pastDate(1),
    },
    {
      name: "Maquiagem Social",
      description: "Maquiagem completa para eventos sociais",
      price: parsePrice("R$ 120,00"),
      duration: "1h15min",
      categoryId: createdCategories["Maquiagem"].id,
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300",
      createdAt: pastDate(28),
      updatedAt: pastDate(1),
    }
  ];

  console.log(`Creating ${servicesData.length} generic services...`);
  const createdServices: { [name: string]: { id: string, createdAt: Date, updatedAt: Date } } = {};
  
  for (const serviceData of servicesData) {
    const service = await prisma.service.create({ 
      data: serviceData
    });
    
    createdServices[service.name] = { 
      id: service.id, 
      createdAt: service.createdAt, 
      updatedAt: service.updatedAt 
    };
    
    console.log(`   - ${service.name} (ID: ${service.id}) created at ${service.createdAt}`);
  }
  
  console.log("Services created successfully.");
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
