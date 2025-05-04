import request from "supertest";
import { app } from "../index"; // Assuming your Express app is exported from index.ts
import { prisma } from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Helper to create test data
const createTestData = async () => {
  const category1 = await prisma.category.create({ data: { name: "Test Category 1" } });
  const category2 = await prisma.category.create({ data: { name: "Test Category 2" } });

  const company1 = await prisma.company.create({
    data: {
      name: "Test Company Alpha",
      description: "Description Alpha",
      address: {
        create: {
          street: "123 Main St",
          number: "100",
          neighborhood: "Downtown",
          city: "Testville",
          state: "TS",
          zipCode: "12345",
        },
      },
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "Test Company Beta",
      description: "Description Beta",
      address: {
        create: {
          street: "456 Side St",
          number: "200",
          neighborhood: "Uptown",
          city: "AnotherCity",
          state: "AC",
          zipCode: "67890",
        },
      },
    },
  });

  await prisma.service.createMany({
    data: [
      {
        name: "Service A - Basic",
        description: "Basic service description",
        price: new Decimal("50.00"),
        duration: "30min",
        categoryId: category1.id,
        companyId: company1.id,
      },
      {
        name: "Service B - Premium",
        description: "Premium offering",
        price: new Decimal("150.50"),
        duration: "1h",
        categoryId: category1.id,
        companyId: company1.id,
      },
      {
        name: "Service C - Standard",
        description: "Standard package",
        price: new Decimal("99.99"),
        duration: "45min",
        categoryId: category2.id,
        companyId: company2.id,
      },
       {
        name: "Service D - Alpha Special",
        description: "Only at Alpha",
        price: new Decimal("75.00"),
        duration: "1h",
        categoryId: category2.id,
        companyId: company1.id,
      },
    ],
  });
};

// Clean up database before and after tests
beforeAll(async () => {
  // Clean related tables first due to foreign key constraints
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.user.deleteMany({});
  // Create fresh test data
  await createTestData();
});

afterAll(async () => {
  // Clean up again after all tests
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("GET /api/services", () => {
  it("should return a list of services with default pagination", async () => {
    const res = await request(app).get("/api/services");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.length).toBeLessThanOrEqual(10); // Default limit
    expect(res.body.pagination.currentPage).toEqual(1);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
  });

  it("should handle pagination parameters (page, limit)", async () => {
    const res = await request(app).get("/api/services?page=2&limit=2");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.currentPage).toEqual(2);
    expect(res.body.pagination.itemsPerPage).toEqual(2);
  });

  it("should filter services by companyId", async () => {
    // Find a company ID from the test data
    const company = await prisma.company.findFirst({ where: { name: "Test Company Alpha" } });
    const res = await request(app).get(`/api/services?companyId=${company?.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((service: any) => {
      expect(service.companyId).toEqual(company?.id);
    });
  });

  it("should filter services by category name", async () => {
    const categoryName = "Test Category 1";
    const res = await request(app).get(`/api/services?category=${encodeURIComponent(categoryName)}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((service: any) => {
      expect(service.category.name).toContain(categoryName);
    });
  });

  it("should filter services by minPrice", async () => {
    const minPrice = "100.00";
    const res = await request(app).get(`/api/services?minPrice=${minPrice}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((service: any) => {
      expect(new Decimal(service.price).greaterThanOrEqualTo(minPrice)).toBe(true);
    });
  });

  it("should filter services by maxPrice", async () => {
    const maxPrice = "100.00";
    const res = await request(app).get(`/api/services?maxPrice=${maxPrice}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((service: any) => {
      expect(new Decimal(service.price).lessThanOrEqualTo(maxPrice)).toBe(true);
    });
  });

  it("should filter services by price range (minPrice and maxPrice)", async () => {
    const minPrice = "70.00";
    const maxPrice = "100.00";
    const res = await request(app).get(`/api/services?minPrice=${minPrice}&maxPrice=${maxPrice}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((service: any) => {
      expect(new Decimal(service.price).greaterThanOrEqualTo(minPrice)).toBe(true);
      expect(new Decimal(service.price).lessThanOrEqualTo(maxPrice)).toBe(true);
    });
  });

   it("should return 400 if minPrice > maxPrice", async () => {
    const minPrice = "100.00";
    const maxPrice = "50.00";
    const res = await request(app).get(`/api/services?minPrice=${minPrice}&maxPrice=${maxPrice}`);
    expect(res.statusCode).toEqual(400);
  });

  it("should filter services by search query (q)", async () => {
    const searchTerm = "Premium";
    const res = await request(app).get(`/api/services?q=${searchTerm}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Check if at least one result contains the search term in relevant fields
    const found = res.body.data.some((service: any) => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(found).toBe(true);
  });

  it("should sort services by name ascending (default)", async () => {
    const res = await request(app).get("/api/services");
    expect(res.statusCode).toEqual(200);
    const names = res.body.data.map((s: any) => s.name);
    expect(names).toEqual([...names].sort()); // Check if sorted alphabetically
  });

  it("should sort services by price ascending", async () => {
    const res = await request(app).get("/api/services?sort=price_asc");
    expect(res.statusCode).toEqual(200);
    const prices = res.body.data.map((s: any) => new Decimal(s.price));
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i].lessThanOrEqualTo(prices[i+1])).toBe(true);
    }
  });

  it("should sort services by price descending", async () => {
    const res = await request(app).get("/api/services?sort=price_desc");
    expect(res.statusCode).toEqual(200);
    const prices = res.body.data.map((s: any) => new Decimal(s.price));
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i].greaterThanOrEqualTo(prices[i+1])).toBe(true);
    }
  });

  it("should return empty data array when no services match filters", async () => {
    const res = await request(app).get("/api/services?q=NonExistentServiceXYZ");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toEqual(0);
    expect(res.body.pagination.totalItems).toEqual(0);
  });
});

// TODO: Add tests for POST, GET by ID, PUT, DELETE /api/services

