import request from "supertest";
import { app } from "../index"; // Assuming your Express app is exported from index.ts
import { prisma } from "../utils/prismaClient"; // Corrected path
import { UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";

// --- Test Setup ---
let adminToken: string;
let userToken: string;
let testCompanyId: string;
let testUserId: string;
let testAdminId: string;

// Helper to generate JWT token
const generateToken = (userId: string, role: UserRole): string => {
    const secret = process.env.JWT_SECRET || "test-secret"; // Use env var or a default for testing
    return jwt.sign({ userId, role }, secret, { expiresIn: "1h" });
};

// Helper to create test data
const createTestData = async () => {
  // Ensure categories exist
  await prisma.category.upsert({ where: { name: "Tech Company" }, update: {}, create: { name: "Tech Company" } });
  await prisma.category.upsert({ where: { name: "Consulting" }, update: {}, create: { name: "Consulting" } });

  // Create users (Admin and Regular)
  const adminUser = await prisma.user.create({
      data: {
          name: "Test Admin",
          email: "admin@test.com",
          password: "hashedpassword", // Use a dummy hash for tests
          role: UserRole.ADMIN,
      }
  });
  const regularUser = await prisma.user.create({
      data: {
          name: "Test User",
          email: "user@test.com",
          password: "hashedpassword",
          role: UserRole.USER,
      }
  });
  testAdminId = adminUser.id;
  testUserId = regularUser.id;

  // Generate tokens
  adminToken = generateToken(adminUser.id, adminUser.role);
  userToken = generateToken(regularUser.id, regularUser.role);

  // Create companies
  const company1 = await prisma.company.create({
    data: {
        name: "Innovate Solutions Test",
        description: "Leading tech solutions provider",
        rating: 4.7,
        categories: ["Tech Company"],
        // ownerId: adminUser.id // Add ownerId if schema supports it
      },
  });
  testCompanyId = company1.id;

  await prisma.company.createMany({
    data: [
      {
        name: "Global Consulting Test",
        description: "Expert business consulting",
        rating: 4.2,
        categories: ["Consulting"],
      },
      {
        name: "Alpha Tech Test",
        description: "Software development specialists",
        rating: 4.9,
        categories: ["Tech Company", "Software"],
      },
      {
        name: "Beta Services Test",
        description: "General business services",
        rating: 3.9,
        categories: ["Services"],
      },
    ],
    skipDuplicates: true,
  });

  // Add addresses
  const innovate = await prisma.company.findUnique({ where: { name: "Innovate Solutions Test" } });
  const globalConsulting = await prisma.company.findUnique({ where: { name: "Global Consulting Test" } });

  if (innovate) {
    await prisma.companyAddress.create({
      data: {
        street: "1 Test Dr", number: "100", neighborhood: "Test Park", city: "Silicon Valley", state: "CA", zipCode: "94000", companyId: innovate.id,
      },
    });
  }
  if (globalConsulting) {
    await prisma.companyAddress.create({
      data: {
        street: "200 Test Ave", number: "50", neighborhood: "Test District", city: "New York", state: "NY", zipCode: "10001", companyId: globalConsulting.id,
      },
    });
  }
};

// Clean up database before and after tests
beforeAll(async () => {
  // Clean related tables first
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.gamificationProgress.deleteMany({});
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
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.gamificationProgress.deleteMany({});
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

// --- GET Tests (Public Access) ---
describe("GET /api/companies", () => {
  it("should return a list of companies with default pagination", async () => {
    const res = await request(app).get("/api/companies");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
  });

  // ... other GET tests remain the same ...
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

describe("GET /api/companies/:id", () => {
  it("should return a specific company by ID", async () => {
    const res = await request(app).get(`/api/companies/${testCompanyId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(testCompanyId);
    expect(res.body.name).toEqual("Innovate Solutions Test");
  });

  it("should return 404 for a non-existent company ID", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // Replace with a valid format but non-existent ID
    const res = await request(app).get(`/api/companies/${nonExistentId}`);
    expect(res.statusCode).toEqual(404);
  });

  it("should return 400 for an invalid company ID format", async () => {
    const invalidId = "invalid-id-format";
    const res = await request(app).get(`/api/companies/${invalidId}`);
    expect(res.statusCode).toEqual(400);
  });
});

// --- POST Tests (Admin Only) ---
describe("POST /api/companies", () => {
  const newCompanyData = {
    name: "New Test Company",
    description: "A brand new company for testing",
    categories: ["Test Category"],
    // Add address data if required by your controller/validation
    address: {
        street: "123 Test St",
        city: "Testville",
        state: "TS",
        zipCode: "12345"
    }
  };

  it("should allow an ADMIN to create a company", async () => {
    // Ensure category exists
    await prisma.category.upsert({ where: { name: "Test Category" }, update: {}, create: { name: "Test Category" } });

    const res = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newCompanyData);
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual(newCompanyData.name);
    expect(res.body.address.street).toEqual(newCompanyData.address.street);
  });

  it("should FORBID a regular USER from creating a company", async () => {
    const res = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${userToken}`)
      .send(newCompanyData);
    expect(res.statusCode).toEqual(403); // Forbidden
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .post("/api/companies")
      .send(newCompanyData);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 400 Bad Request for missing required fields", async () => {
    const res = await request(app)
      .post("/api/companies")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Incomplete data" }); // Missing name, categories, address
    expect(res.statusCode).toEqual(400);
  });
});

// --- PUT Tests (Admin Only) ---
describe("PUT /api/companies/:id", () => {
  const updateData = { description: "Updated description for Innovate" };

  it("should allow an ADMIN to update a company", async () => {
    const res = await request(app)
      .put(`/api/companies/${testCompanyId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(testCompanyId);
    expect(res.body.description).toEqual(updateData.description);
  });

  it("should FORBID a regular USER from updating a company", async () => {
    const res = await request(app)
      .put(`/api/companies/${testCompanyId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(403); // Forbidden
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .put(`/api/companies/${testCompanyId}`)
      .send(updateData);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 404 Not Found for updating a non-existent company", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const res = await request(app)
      .put(`/api/companies/${nonExistentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(404);
  });
});

// --- DELETE Tests (Admin Only) ---
describe("DELETE /api/companies/:id", () => {
  let companyToDeleteId: string;

  beforeAll(async () => {
    // Create a company specifically for delete tests
    const company = await prisma.company.create({
      data: { name: "Company To Delete", description: "Delete me" }
    });
    companyToDeleteId = company.id;
  });

  it("should allow an ADMIN to delete a company", async () => {
    const res = await request(app)
      .delete(`/api/companies/${companyToDeleteId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200); // Or 204 No Content depending on controller implementation
    expect(res.body.message).toContain("Empresa excluída com sucesso");

    // Verify it's actually deleted
    const findRes = await request(app).get(`/api/companies/${companyToDeleteId}`);
    expect(findRes.statusCode).toEqual(404);
  });

  it("should FORBID a regular USER from deleting a company", async () => {
     // Recreate the company for this test case
     const company = await prisma.company.create({
       data: { name: "Company To Delete Again", description: "Delete me again" }
     });
     const tempId = company.id;

    const res = await request(app)
      .delete(`/api/companies/${tempId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(403); // Forbidden

    // Clean up the temp company
    await prisma.company.delete({ where: { id: tempId } });
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .delete(`/api/companies/${testCompanyId}`); // Use any existing ID
    expect(res.statusCode).toEqual(401);
  });

  it("should return 404 Not Found for deleting a non-existent company", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const res = await request(app)
      .delete(`/api/companies/${nonExistentId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(404);
  });
});

