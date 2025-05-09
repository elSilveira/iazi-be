import request from "supertest";
import { app } from "../index"; // Corrected path
import { prisma } from "../utils/prismaClient"; // Corrected path
import { Decimal } from "@prisma/client/runtime/library";
import { UserRole, Category, Company } from "@prisma/client"; // Import necessary types
import jwt from "jsonwebtoken";

// --- Test Setup ---
let adminToken: string;
let userToken: string;
let testCompanyId1: string;
let testCompanyId2: string;
let testCategoryId1: number; // Changed to number
let testCategoryId2: number; // Changed to number
let testServiceId1: string;
let testServiceId2: string;
let testUserId: string;
let testAdminId: string;

// Helper to generate JWT token
const generateToken = (userId: string, role: UserRole): string => {
    const secret = process.env.JWT_SECRET || "test-secret"; // Use env var or a default for testing
    return jwt.sign({ userId, role }, secret, { expiresIn: "1h" });
};

// Helper to create test data
const createTestData = async () => {
  // Create users (Admin and Regular)
  const adminUser = await prisma.user.upsert({
      where: { email: "admin.svc@test.com" },
      update: { role: UserRole.ADMIN },
      create: {
          name: "Test Admin Svc",
          email: "admin.svc@test.com",
          password: "hashedpassword", // Use a dummy hash for tests
          role: UserRole.ADMIN,
          points: 0, // Add points
          slug: "test-admin-svc"
      }
  });
  const regularUser = await prisma.user.upsert({
      where: { email: "user.svc@test.com" },
      update: { role: UserRole.USER },
      create: {
          name: "Test User Svc",
          email: "user.svc@test.com",
          password: "hashedpassword",
          role: UserRole.USER,
          points: 0, // Add points
          slug: "test-user-svc"
      }
  });
  testAdminId = adminUser.id;
  testUserId = regularUser.id;

  // Generate tokens
  adminToken = generateToken(adminUser.id, adminUser.role);
  userToken = generateToken(regularUser.id, regularUser.role);

  // Create Categories
  const category1: Category = await prisma.category.upsert({ 
      where: { name: "Test Category Svc 1" },
      update: {},
      create: { name: "Test Category Svc 1" } 
  });
  const category2: Category = await prisma.category.upsert({ 
      where: { name: "Test Category Svc 2" },
      update: {},
      create: { name: "Test Category Svc 2" } 
  });
  testCategoryId1 = category1.id; // Assign number ID
  testCategoryId2 = category2.id; // Assign number ID

  // Create Companies - Changed from upsert to create as name is not unique
  const company1: Company = await prisma.company.create({
    data: {
      name: "Test Company Alpha Svc",
      description: "Description Alpha Svc",
      address: {
        create: {
          street: "123 Main St Svc", city: "Testville Svc", state: "TS", zipCode: "12345", number: "1", neighborhood: "Downtown" // Added missing fields
        },
      },
    },
  });
  const company2: Company = await prisma.company.create({
    data: {
      name: "Test Company Beta Svc",
      description: "Description Beta Svc",
      address: {
        create: {
          street: "456 Side St Svc", city: "AnotherCity Svc", state: "AC", zipCode: "67890", number: "456", neighborhood: "Uptown" // Added missing fields
        },
      },
    },
  });
  testCompanyId1 = company1.id;
  testCompanyId2 = company2.id;

  // Create Services
  const service1 = await prisma.service.create({
    data: {
        name: "Service A - Basic Svc",
        description: "Basic service description Svc",
        price: new Decimal("50.00"),
        duration: "30min",
        categoryId: category1.id, // Use number ID
        companyId: company1.id,
      }
  });
  const service2 = await prisma.service.create({
    data: {
        name: "Service B - Premium Svc",
        description: "Premium offering Svc",
        price: new Decimal("150.50"),
        duration: "1h",
        categoryId: category1.id, // Use number ID
        companyId: company1.id,
      }
  });
  testServiceId1 = service1.id;
  testServiceId2 = service2.id;

  await prisma.service.createMany({
    data: [
      {
        name: "Service C - Standard Svc",
        description: "Standard package Svc",
        price: new Decimal("99.99"),
        duration: "45min",
        categoryId: category2.id, // Use number ID
        companyId: company2.id,
      },
       {
        name: "Service D - Alpha Special Svc",
        description: "Only at Alpha Svc",
        price: new Decimal("75.00"),
        duration: "1h",
        categoryId: category2.id, // Use number ID
        companyId: company1.id,
      },
    ],
    skipDuplicates: true, // Add skipDuplicates
  });
};

// Clean up database before and after tests
beforeAll(async () => {
  // Clean related tables first (children before parents)
  await prisma.activityLog.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.gamificationEvent.deleteMany({});
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professionalExperience.deleteMany({});
  await prisma.professionalEducation.deleteMany({});
  await prisma.scheduleBlock.deleteMany({});
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
  // Clean up again (children before parents)
  await prisma.activityLog.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.gamificationEvent.deleteMany({});
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professionalExperience.deleteMany({});
  await prisma.professionalEducation.deleteMany({});
  await prisma.scheduleBlock.deleteMany({});
  await prisma.professional.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

// --- GET Tests (Public Access) ---
describe("GET /api/services", () => {
  it("should return a list of services with default pagination", async () => {
    const res = await request(app).get("/api/services");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
  });

  it("should filter services by companyId", async () => {
    const res = await request(app).get(`/api/services?companyId=${testCompanyId1}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((service: any) => {
      expect(service.companyId).toEqual(testCompanyId1);
    });
  });

  it("should filter services by category ID", async () => {
    // Use the numeric category ID for filtering
    const res = await request(app).get(`/api/services?category=${testCategoryId1}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((service: any) => {
      expect(service.categoryId).toEqual(testCategoryId1);
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
    expect(names).toEqual([...names].sort());
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

describe("GET /api/services/:id", () => {
  it("should return a specific service by ID", async () => {
    const res = await request(app).get(`/api/services/${testServiceId1}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(testServiceId1);
    expect(res.body.name).toEqual("Service A - Basic Svc");
  });

  it("should return 404 for a non-existent service ID", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // Use a valid format but non-existent ID
    const res = await request(app).get(`/api/services/${nonExistentId}`);
    expect(res.statusCode).toEqual(404);
  });

  it("should return 400 for an invalid service ID format", async () => {
    const invalidId = "invalid-id-format";
    const res = await request(app).get(`/api/services/${invalidId}`);
    expect(res.statusCode).toEqual(400);
  });
});

// --- POST Tests (Admin Only) ---
describe("POST /api/services", () => {
  const newServiceData = {
    name: "New Test Service",
    description: "A brand new service for testing",
    price: "199.99",
    duration: "2h",
    categoryId: testCategoryId1, // Use number ID
    companyId: testCompanyId1,
  };

  it("should allow an ADMIN to create a service", async () => {
    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newServiceData);
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual(newServiceData.name);
    expect(res.body.companyId).toEqual(testCompanyId1);
    expect(res.body.categoryId).toEqual(testCategoryId1);
    expect(res.body.price).toEqual(newServiceData.price); // Prisma returns Decimal as string
  });

  it("should FORBID a regular USER from creating a service", async () => {
    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${userToken}`)
      .send(newServiceData);
    expect(res.statusCode).toEqual(403); // Forbidden
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .post("/api/services")
      .send(newServiceData);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 400 Bad Request for missing required fields", async () => {
    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Incomplete data" }); // Missing name, price, duration, categoryId, companyId
    expect(res.statusCode).toEqual(400);
  });

  it("should return 400 Bad Request for invalid price format", async () => {
    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...newServiceData, price: "invalid-price" });
    expect(res.statusCode).toEqual(400);
  });

  it("should return 400 Bad Request for non-existent categoryId", async () => {
    const nonExistentId = 999999; // Use a non-existent number ID
    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...newServiceData, categoryId: nonExistentId });
    expect(res.statusCode).toEqual(400); // P2025 handled as 400
  });
});

// --- PUT Tests (Admin Only) ---
describe("PUT /api/services/:id", () => {
  const updateData = { description: "Updated description for Service A", price: "55.00" };

  it("should allow an ADMIN to update a service", async () => {
    const res = await request(app)
      .put(`/api/services/${testServiceId1}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(testServiceId1);
    expect(res.body.description).toEqual(updateData.description);
    expect(res.body.price).toEqual(updateData.price);
  });

  it("should FORBID a regular USER from updating a service", async () => {
    const res = await request(app)
      .put(`/api/services/${testServiceId1}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(403); // Forbidden
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .put(`/api/services/${testServiceId1}`)
      .send(updateData);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 404 Not Found for updating a non-existent service", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // Use a valid format but non-existent ID
    const res = await request(app)
      .put(`/api/services/${nonExistentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(404);
  });

  it("should return 400 Bad Request for invalid price format on update", async () => {
    const res = await request(app)
      .put(`/api/services/${testServiceId1}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: "invalid-price" });
    expect(res.statusCode).toEqual(400);
  });
});

// --- DELETE Tests (Admin Only) ---
describe("DELETE /api/services/:id", () => {
  let serviceToDeleteId: string;

  beforeAll(async () => {
    // Create a service specifically for delete tests
    const service = await prisma.service.create({
      data: {
        name: "Service To Delete",
        description: "Delete me Svc",
        price: new Decimal("10.00"),
        duration: "10min",
        categoryId: testCategoryId1, // Use number ID
        companyId: testCompanyId1,
      }
    });
    serviceToDeleteId = service.id;
  });

  it("should allow an ADMIN to delete a service", async () => {
    const res = await request(app)
      .delete(`/api/services/${serviceToDeleteId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain("Serviço excluído com sucesso");

    // Verify it's actually deleted
    const findRes = await request(app).get(`/api/services/${serviceToDeleteId}`);
    expect(findRes.statusCode).toEqual(404);
  });

  it("should FORBID a regular USER from deleting a service", async () => {
    const res = await request(app)
      .delete(`/api/services/${testServiceId2}`) // Use another existing service
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(403); // Forbidden
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .delete(`/api/services/${testServiceId2}`);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 404 Not Found for deleting a non-existent service", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // Use a valid format but non-existent ID
    const res = await request(app)
      .delete(`/api/services/${nonExistentId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(404);
  });
});

