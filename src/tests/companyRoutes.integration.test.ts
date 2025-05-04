import request from "supertest";
import { app } from "../index"; // Assuming your Express app is exported from index.ts
import { prisma } from "../lib/prisma";

// Helper to create test data (can be shared or adapted)
const createTestData = async () => {
  // Ensure categories exist (use different names to avoid conflicts if tests run concurrently)
  await prisma.category.upsert({ where: { name: "Tech Company" }, update: {}, create: { name: "Tech Company" } });
  await prisma.category.upsert({ where: { name: "Consulting" }, update: {}, create: { name: "Consulting" } });

  // Create companies
  await prisma.company.createMany({
    data: [
      {
        name: "Innovate Solutions",
        description: "Leading tech solutions provider",
        rating: 4.7,
        categories: ["Tech Company"],
      },
      {
        name: "Global Consulting Group",
        description: "Expert business consulting",
        rating: 4.2,
        categories: ["Consulting"],
      },
      {
        name: "Alpha Tech",
        description: "Software development specialists",
        rating: 4.9,
        categories: ["Tech Company", "Software"], // Add another category for testing
      },
      {
        name: "Beta Services",
        description: "General business services",
        rating: 3.9,
        categories: ["Services"],
      },
    ],
    skipDuplicates: true, // Skip if names conflict (adjust if needed)
  });

  // Add addresses to companies
  const innovate = await prisma.company.findUnique({ where: { name: "Innovate Solutions" } });
  const globalConsulting = await prisma.company.findUnique({ where: { name: "Global Consulting Group" } });
  const alphaTech = await prisma.company.findUnique({ where: { name: "Alpha Tech" } });
  const betaServices = await prisma.company.findUnique({ where: { name: "Beta Services" } });

  if (innovate) {
    await prisma.companyAddress.create({
      data: {
        street: "1 Innovation Dr", number: "100", neighborhood: "Tech Park", city: "Silicon Valley", state: "CA", zipCode: "94000", companyId: innovate.id,
      },
    });
  }
  if (globalConsulting) {
    await prisma.companyAddress.create({
      data: {
        street: "200 Business Ave", number: "50", neighborhood: "Financial District", city: "New York", state: "NY", zipCode: "10001", companyId: globalConsulting.id,
      },
    });
  }
   if (alphaTech) {
    await prisma.companyAddress.create({
      data: {
        street: "3 Code Ln", number: "Suite A", neighborhood: "Dev Corner", city: "Silicon Valley", state: "CA", zipCode: "94001", companyId: alphaTech.id,
      },
    });
  }
   if (betaServices) {
     await prisma.companyAddress.create({
      data: {
        street: "4 Service Rd", number: "Bldg 1", neighborhood: "Industrial Area", city: "Metropolis", state: "IL", zipCode: "60606", companyId: betaServices.id,
      },
    });
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

describe("GET /api/companies", () => {
  it("should return a list of companies with default pagination", async () => {
    const res = await request(app).get("/api/companies");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.length).toBeLessThanOrEqual(10); // Default limit
    expect(res.body.pagination.currentPage).toEqual(1);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
  });

  it("should handle pagination parameters (page, limit)", async () => {
    const res = await request(app).get("/api/companies?page=2&limit=2");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.currentPage).toEqual(2);
    expect(res.body.pagination.itemsPerPage).toEqual(2);
  });

  it("should filter companies by category", async () => {
    const category = "Tech Company";
    const res = await request(app).get(`/api/companies?category=${encodeURIComponent(category)}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((company: any) => {
      expect(company.categories).toContain(category);
    });
  });

  it("should filter companies by city", async () => {
    const city = "Silicon Valley";
    const res = await request(app).get(`/api/companies?city=${encodeURIComponent(city)}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((company: any) => {
      expect(company.address.city).toEqual(city);
    });
  });

  it("should filter companies by state", async () => {
    const state = "NY";
    const res = await request(app).get(`/api/companies?state=${state}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((company: any) => {
      expect(company.address.state).toEqual(state);
    });
  });

  it("should filter companies by minRating", async () => {
    const minRating = "4.5";
    const res = await request(app).get(`/api/companies?minRating=${minRating}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((company: any) => {
      expect(company.rating).toBeGreaterThanOrEqual(parseFloat(minRating));
    });
  });

  it("should filter companies by search query (q)", async () => {
    const searchTerm = "Consulting";
    const res = await request(app).get(`/api/companies?q=${searchTerm}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const found = res.body.data.some((company: any) => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.categories.some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    expect(found).toBe(true);
  });

  it("should sort companies by name ascending (default)", async () => {
    const res = await request(app).get("/api/companies");
    expect(res.statusCode).toEqual(200);
    const names = res.body.data.map((c: any) => c.name);
    expect(names).toEqual([...names].sort());
  });

  it("should sort companies by rating descending", async () => {
    const res = await request(app).get("/api/companies?sort=rating_desc");
    expect(res.statusCode).toEqual(200);
    const ratings = res.body.data.map((c: any) => c.rating);
    for (let i = 0; i < ratings.length - 1; i++) {
      expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i+1]);
    }
  });

  it("should return empty data array when no companies match filters", async () => {
    const res = await request(app).get("/api/companies?q=NonExistentCompanyXYZ&minRating=5.1&city=Atlantis");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toEqual(0);
    expect(res.body.pagination.totalItems).toEqual(0);
  });
});

// TODO: Add tests for POST, GET by ID, PUT, DELETE /api/companies

