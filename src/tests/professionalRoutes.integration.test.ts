import request from "supertest";
import { app } from "../index"; // Assuming your Express app is exported from index.ts
import { prisma } from "../utils/prismaClient"; // Corrected path
import { Company, Category, Service, Professional, ProfessionalService, UserRole } from "@prisma/client"; // Import types
import { Decimal } from "@prisma/client/runtime/library";
import jwt from "jsonwebtoken";

// --- Test Setup ---
let adminToken: string;
let userToken: string;
let testCompanyId1: string;
let testCompanyId2: string;
let testServiceId1: string;
let testServiceId2: string;
let testProfessionalId1: string;
let testProfessionalId2: string;
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
  const adminUser = await prisma.user.create({
      data: {
          name: "Test Admin Prof",
          email: "admin.prof@test.com",
          password: "hashedpassword", // Use a dummy hash for tests
          role: UserRole.ADMIN,
          points: 0 // Added points
      }
  });
  const regularUser = await prisma.user.create({
      data: {
          name: "Test User Prof",
          email: "user.prof@test.com",
          password: "hashedpassword",
          role: UserRole.USER,
          points: 0 // Added points
      }
  });
  testAdminId = adminUser.id;
  testUserId = regularUser.id;

  // Generate tokens
  adminToken = generateToken(adminUser.id, adminUser.role);
  userToken = generateToken(regularUser.id, regularUser.role);

  // Ensure categories exist
  const category1 = await prisma.category.upsert({ where: { name: "Test Category Prof 1" }, update: {}, create: { name: "Test Category Prof 1" } });
  const category2 = await prisma.category.upsert({ where: { name: "Test Category Prof 2" }, update: {}, create: { name: "Test Category Prof 2" } });

  // Ensure companies exist
  const company1 = await prisma.company.create({
      data: {
          name: "Test Company Prof Alpha",
          description: "Description Alpha Prof",
          address: { create: { street: "123 Prof St", number: "100", neighborhood: "Downtown Prof", city: "TestvilleProf", state: "TP", zipCode: "12345" } }, // Added number and neighborhood
      },
      include: { address: true },
  });
  const company2 = await prisma.company.create({
      data: {
          name: "Test Company Prof Beta",
          description: "Description Beta Prof",
          address: { create: { street: "456 Prof St", number: "200", neighborhood: "Uptown Prof", city: "AnotherCityProf", state: "AP", zipCode: "67890" } }, // Added number and neighborhood
      },
      include: { address: true },
  });
  testCompanyId1 = company1.id;
  testCompanyId2 = company2.id;

  // Ensure services exist
  const service1 = await prisma.service.create({
      data: { name: "Prof Service A", description: "Service A desc", price: new Decimal("50.00"), duration: "30min", categoryId: category1.id, companyId: company1.id }
  });
  const service2 = await prisma.service.create({
      data: { name: "Prof Service B", description: "Service B desc", price: new Decimal("100.00"), duration: "1h", categoryId: category2.id, companyId: company2.id }
  });
  testServiceId1 = service1.id;
  testServiceId2 = service2.id;

  // Create professionals
  const prof1 = await prisma.professional.create({
    data: {
        name: "Professional Alice",
        role: "Senior Developer",
        rating: 4.5,
        companyId: company1.id,
        userId: testUserId, // Added userId
      }
  });
  const prof2 = await prisma.professional.create({
    data: {
        name: "Professional Bob",
        role: "Junior Developer",
        rating: 3.8,
        companyId: company1.id,
        userId: testAdminId, // Added userId (can be different or same as prof1 for test purposes)
      }
  });
  testProfessionalId1 = prof1.id;
  testProfessionalId2 = prof2.id;

  await prisma.professional.createMany({
    data: [
      {
        name: "Professional Charlie",
        role: "Designer",
        rating: 4.8,
        companyId: company2.id,
        userId: testUserId, // Added userId
      },
      {
        name: "Professional Diana",
        role: "Senior Designer",
        rating: 4.2,
        companyId: company2.id,
        userId: testAdminId, // Added userId
      },
    ],
    skipDuplicates: true,
  });
  
  // Associate services
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
  await prisma.activityLog.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.gamificationEvent.deleteMany({}); // Added GamificationEvent
  // await prisma.gamificationProgress.deleteMany({}); // Removed reference
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professionalExperience.deleteMany({});
  await prisma.professionalEducation.deleteMany({});
  await prisma.scheduleBlock.deleteMany({}); // Added ScheduleBlock
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
  await prisma.activityLog.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.badge.deleteMany({});
  await prisma.gamificationEvent.deleteMany({}); // Added GamificationEvent
  // await prisma.gamificationProgress.deleteMany({}); // Removed reference
  await prisma.professionalService.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.professionalExperience.deleteMany({});
  await prisma.professionalEducation.deleteMany({});
  await prisma.scheduleBlock.deleteMany({}); // Added ScheduleBlock
  await prisma.professional.deleteMany({});
  await prisma.companyAddress.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.userAddress.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

// --- GET Tests (Public Access) ---
describe("GET /api/professionals", () => {
  it("should return a list of professionals with default pagination", async () => {
    const res = await request(app).get("/api/professionals");
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
  });

  // ... other GET filter/sort tests remain the same ...
  it("should filter professionals by companyId", async () => {
    const res = await request(app).get(`/api/professionals?companyId=${testCompanyId1}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.companyId).toEqual(testCompanyId1);
    });
  });

  it("should filter professionals by role", async () => {
    const role = "Designer";
    const res = await request(app).get(`/api/professionals?role=${role}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.role).toEqual(role);
    });
  });

  it("should filter professionals by city", async () => {
    const city = "TestvilleProf";
    const res = await request(app).get(`/api/professionals?city=${city}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.company?.address?.city).toEqual(city);
    });
  });

  it("should filter professionals by state", async () => {
    const state = "AP";
    const res = await request(app).get(`/api/professionals?state=${state}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((prof: any) => {
      expect(prof.company?.address?.state).toEqual(state);
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
    expect(names).toEqual([...names].sort((a: string, b: string) => a.localeCompare(b)));
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
});

describe("GET /api/professionals/:id", () => {
  it("should return a specific professional by ID", async () => {
    const res = await request(app).get(`/api/professionals/${testProfessionalId1}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(testProfessionalId1);
    expect(res.body.name).toEqual("Professional Alice");
  });

  it("should return 404 for a non-existent professional ID", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const res = await request(app).get(`/api/professionals/${nonExistentId}`);
    expect(res.statusCode).toEqual(404);
  });

  it("should return 400 for an invalid professional ID format", async () => {
    const invalidId = "invalid-id-format";
    const res = await request(app).get(`/api/professionals/${invalidId}`);
    expect(res.statusCode).toEqual(400);
  });
});

// --- POST Tests (Admin Only) ---
describe("POST /api/professionals", () => {
  const newProfessionalData = {
    name: "New Test Professional",
    role: "Tester",
    companyId: testCompanyId1,
    serviceIds: [testServiceId1]
  };

  it("should allow an ADMIN to create a professional", async () => {
    const res = await request(app)
      .post("/api/professionals")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newProfessionalData);
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual(newProfessionalData.name);
    expect(res.body.companyId).toEqual(testCompanyId1);
    // Check if service was associated (assuming response includes services)
    // expect(res.body.services.some((ps: any) => ps.serviceId === testServiceId1)).toBe(true);
  });

  it("should FORBID a regular USER from creating a professional", async () => {
    const res = await request(app)
      .post("/api/professionals")
      .set("Authorization", `Bearer ${userToken}`)
      .send(newProfessionalData);
    expect(res.statusCode).toEqual(403); // Forbidden
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .post("/api/professionals")
      .send(newProfessionalData);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 400 Bad Request for missing required fields (name)", async () => {
    const res = await request(app)
      .post("/api/professionals")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "Incomplete", companyId: testCompanyId1 }); // Missing name
    expect(res.statusCode).toEqual(400);
  });

  it("should return 400 Bad Request for non-existent companyId", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const res = await request(app)
      .post("/api/professionals")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...newProfessionalData, companyId: nonExistentId });
    expect(res.statusCode).toEqual(400); // P2025 handled as 400
  });
});

// --- PUT Tests (Admin Only) ---
describe("PUT /api/professionals/:id", () => {
  const updateData = { role: "Lead Developer" };

  it("should allow an ADMIN to update a professional", async () => {
    const res = await request(app)
      .put(`/api/professionals/${testProfessionalId1}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(testProfessionalId1);
    expect(res.body.role).toEqual(updateData.role);
  });

  it("should FORBID a regular USER from updating a professional", async () => {
    const res = await request(app)
      .put(`/api/professionals/${testProfessionalId1}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(403); // Forbidden
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .put(`/api/professionals/${testProfessionalId1}`)
      .send(updateData);
    expect(res.statusCode).toEqual(401);
  });

  it("should return 404 Not Found for updating a non-existent professional", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const res = await request(app)
      .put(`/api/professionals/${nonExistentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);
    expect(res.statusCode).toEqual(404);
  });
});

// --- DELETE Tests (Admin Only) ---
describe("DELETE /api/professionals/:id", () => {
  let professionalToDeleteId: string;

  beforeAll(async () => {
    // Create a professional specifically for delete tests
    const prof = await prisma.professional.create({
      data: { name: "Professional To Delete", role: "Temp", companyId: testCompanyId1, userId: testUserId } // Added userId
    });
    professionalToDeleteId = prof.id;
  });

  it("should allow an ADMIN to delete a professional", async () => {
    const res = await request(app)
      .delete(`/api/professionals/${professionalToDeleteId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(204); // No Content

    // Verify it's actually deleted
    const findRes = await request(app).get(`/api/professionals/${professionalToDeleteId}`);
    expect(findRes.statusCode).toEqual(404);
  });

  it("should FORBID a regular USER from deleting a professional", async () => {
     // Recreate the professional for this test case
      const prof = await prisma.professional.create({
      data: { name: "Professional To Delete Again", role: "Temp Again", companyId: testCompanyId1, userId: testUserId } // Added userId
    });;
     const tempId = prof.id;

    const res = await request(app)
      .delete(`/api/professionals/${tempId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(403); // Forbidden

    // Clean up the recreated professional
    await prisma.professional.delete({ where: { id: tempId } });
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const res = await request(app)
      .delete(`/api/professionals/${testProfessionalId2}`); // Use another existing one
    expect(res.statusCode).toEqual(401);
  });

  it("should return 404 Not Found for deleting a non-existent professional", async () => {
    const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
    const res = await request(app)
      .delete(`/api/professionals/${nonExistentId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(404);
  });
});

