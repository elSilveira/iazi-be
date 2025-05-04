import request from "supertest";
import { app } from "../index"; // Assuming your Express app is exported from index.ts
import { prisma } from "../lib/prisma";

// Helper to create test data (can be shared or adapted)
const createTestData = async () => {
  // Ensure categories exist
  const category1 = await prisma.category.upsert({ where: { name: "Test Category Prof 1" }, update: {}, create: { name: "Test Category Prof 1" } });
  const category2 = await prisma.category.upsert({ where: { name: "Test Category Prof 2" }, update: {}, create: { name: "Test Category Prof 2" } });

  // Ensure companies exist
  const company1 = await prisma.company.upsert({
    where: { name: "Test Company Prof Alpha" }, // Use a unique name or other identifier
    update: {},
    create: {
      name: "Test Company Prof Alpha",
      description: "Description Alpha Prof",
      address: {
        create: {
          street: "123 Prof St", number: "100", neighborhood: "Downtown Prof", city: "TestvilleProf", state: "TP", zipCode: "12345",
        },
      },
    },
    include: { address: true },
  });

  const company2 = await prisma.company.upsert({
    where: { name: "Test Company Prof Beta" },
    update: {},
    create: {
      name: "Test Company Prof Beta",
      description: "Description Beta Prof",
      address: {
        create: {
          street: "456 Prof St", number: "200", neighborhood: "Uptown Prof", city: "AnotherCityProf", state: "AP", zipCode: "67890",
        },
      },
    },
    include: { address: true },
  });

  // Ensure services exist
  const service1 = await prisma.service.upsert({
      where: { name_companyId: { name: "Prof Service A", companyId: company1.id } }, // Need a unique constraint or find first
      update: {},
      create: {
          name: "Prof Service A", description: "Service A desc", price: 50.0, duration: "30min", categoryId: category1.id, companyId: company1.id
      }
  });
   const service2 = await prisma.service.upsert({
      where: { name_companyId: { name: "Prof Service B", companyId: company2.id } },
      update: {},
      create: {
          name: "Prof Service B", description: "Service B desc", price: 100.0, duration: "1h", categoryId: category2.id, companyId: company2.id
      }
  });

  // Create professionals
  await prisma.professional.createMany({
    data: [
      {
        name: "Professional Alice",
        role: "Senior Developer",
        rating: 4.5,
        companyId: company1.id,
      },
      {
        name: "Professional Bob",
        role: "Junior Developer",
        rating: 3.8,
        companyId: company1.id,
      },
      {
        name: "Professional Charlie",
        role: "Designer",
        rating: 4.8,
        companyId: company2.id,
      },
      {
        name: "Professional Diana",
        role: "Senior Designer",
        rating: 4.2,
        companyId: company2.id,
      },
    ],
  });
  
  // Associate services (assuming professionals were created)
  const alice = await prisma.professional.findFirst({where: {name: "Professional Alice"}});
  const charlie = await prisma.professional.findFirst({where: {name: "Professional Charlie"}});
  if(alice && service1) {
      await prisma.professionalService.create({ data: { professionalId: alice.id, serviceId: service1.id } });
  }
  if(charlie && service2) {
       await prisma.professionalService.create({ data: { professionalId: charlie.id, serviceId: service2.id } });
  }
};

// Clean up database before and after tests
beforeAll(async () => {
  // Clean related tables first
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professionalExperience.deleteMany({});
  await prisma.professionalEducation.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.user.deleteMany({});
  await createTestData();
});

afterAll(async () => {
  // Clean up again
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professionalExperience.deleteMany({});
  await prisma.professionalEducation.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("GET /api/professionals", () => {
  it("should return a list of professionals with default pagination", async () => {
    const res = await request(app).get("/api/professionals");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.length).toBeLessThanOrEqual(10); // Default limit
    expect(res.body.pagination.currentPage).toEqual(1);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
  });

  it("should handle pagination parameters (page, limit)", async () => {
    const res = await request(app).get("/api/professionals?page=2&limit=2");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.currentPage).toEqual(2);
    expect(res.body.pagination.itemsPerPage).toEqual(2);
  });

  it("should filter professionals by companyId", async () => {
    const company = await prisma.company.findFirst({ where: { name: "Test Company Prof Alpha" } });
    const res = await request(app).get(`/api/professionals?companyId=${company?.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.companyId).toEqual(company?.id);
    });
  });

  it("should filter professionals by role", async () => {
    const role = "Designer";
    const res = await request(app).get(`/api/professionals?role=${role}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.role).toContain(role);
    });
  });

  it("should filter professionals by city", async () => {
    const city = "TestvilleProf";
    const res = await request(app).get(`/api/professionals?city=${city}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.company.address.city).toEqual(city);
    });
  });

  it("should filter professionals by state", async () => {
    const state = "AP";
    const res = await request(app).get(`/api/professionals?state=${state}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.company.address.state).toEqual(state);
    });
  });

  it("should filter professionals by minRating", async () => {
    const minRating = "4.0";
    const res = await request(app).get(`/api/professionals?minRating=${minRating}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.rating).toBeGreaterThanOrEqual(parseFloat(minRating));
    });
  });

  it("should filter professionals by search query (q)", async () => {
    const searchTerm = "Alice";
    const res = await request(app).get(`/api/professionals?q=${searchTerm}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const found = res.body.data.some((prof: any) => 
        prof.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        prof.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(found).toBe(true);
  });

  it("should sort professionals by name ascending (default)", async () => {
    const res = await request(app).get("/api/professionals");
    expect(res.statusCode).toEqual(200);
    const names = res.body.data.map((p: any) => p.name);
    expect(names).toEqual([...names].sort());
  });

  it("should sort professionals by rating descending", async () => {
    const res = await request(app).get("/api/professionals?sort=rating_desc");
    expect(res.statusCode).toEqual(200);
    const ratings = res.body.data.map((p: any) => p.rating);
    for (let i = 0; i < ratings.length - 1; i++) {
      expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i+1]);
    }
  });

  it("should return empty data array when no professionals match filters", async () => {
    const res = await request(app).get("/api/professionals?q=NonExistentProfXYZ&minRating=5.1");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toEqual(0);
    expect(res.body.pagination.totalItems).toEqual(0);
  });
  
  // Add test for serviceId filter if implemented and test data allows
  // it("should filter professionals by serviceId", async () => { ... });
});

// TODO: Add tests for POST, GET by ID, PUT, DELETE /api/professionals

