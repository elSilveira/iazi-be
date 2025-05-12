"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index"); // Assuming your Express app is exported from index.ts
const prismaClient_1 = require("../utils/prismaClient"); // Corrected path
const client_1 = require("@prisma/client"); // Import types
const library_1 = require("@prisma/client/runtime/library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// --- Test Setup ---
let adminToken;
let userToken;
let testCompanyId1;
let testCompanyId2;
let testServiceId1;
let testServiceId2;
let testProfessionalId1;
let testProfessionalId2;
let testUserId;
let testAdminId;
// Helper to generate JWT token
const generateToken = (userId, role) => {
    const secret = process.env.JWT_SECRET || "test-secret"; // Use env var or a default for testing
    return jsonwebtoken_1.default.sign({ userId, role }, secret, { expiresIn: "1h" });
};
// Helper to create test data
const createTestData = () => __awaiter(void 0, void 0, void 0, function* () {
    // Create users (Admin and Regular)
    const adminUser = yield prismaClient_1.prisma.user.create({
        data: {
            name: "Test Admin Prof",
            email: "admin.prof@test.com",
            password: "hashedpassword", // Use a dummy hash for tests
            role: client_1.UserRole.ADMIN,
            points: 0, // Added points
            slug: "test-admin-prof" // Novo campo obrigatório
        }
    });
    const regularUser = yield prismaClient_1.prisma.user.create({
        data: {
            name: "Test User Prof",
            email: "user.prof@test.com",
            password: "hashedpassword",
            role: client_1.UserRole.USER,
            points: 0, // Added points
            slug: "test-user-prof" // Novo campo obrigatório
        }
    });
    testAdminId = adminUser.id;
    testUserId = regularUser.id;
    // Generate tokens
    adminToken = generateToken(adminUser.id, adminUser.role);
    userToken = generateToken(regularUser.id, regularUser.role);
    // Ensure categories exist
    const category1 = yield prismaClient_1.prisma.category.upsert({ where: { name: "Test Category Prof 1" }, update: {}, create: { name: "Test Category Prof 1" } });
    const category2 = yield prismaClient_1.prisma.category.upsert({ where: { name: "Test Category Prof 2" }, update: {}, create: { name: "Test Category Prof 2" } });
    // Ensure companies exist
    const company1 = yield prismaClient_1.prisma.company.create({
        data: {
            name: "Test Company Prof Alpha",
            description: "Description Alpha Prof",
            address: { create: { street: "123 Prof St", number: "100", neighborhood: "Downtown Prof", city: "TestvilleProf", state: "TP", zipCode: "12345" } }, // Added number and neighborhood
        },
        include: { address: true },
    });
    const company2 = yield prismaClient_1.prisma.company.create({
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
    const service1 = yield prismaClient_1.prisma.service.create({
        data: { name: "Prof Service A", description: "Service A desc", price: new library_1.Decimal("50.00"), duration: "30min", categoryId: category1.id, companyId: company1.id }
    });
    const service2 = yield prismaClient_1.prisma.service.create({
        data: { name: "Prof Service B", description: "Service B desc", price: new library_1.Decimal("100.00"), duration: "1h", categoryId: category2.id, companyId: company2.id }
    });
    testServiceId1 = service1.id;
    testServiceId2 = service2.id;
    // Create professionals
    const prof1 = yield prismaClient_1.prisma.professional.create({
        data: {
            name: "Professional Alice",
            role: "Senior Developer",
            rating: 4.5,
            companyId: company1.id,
            userId: testUserId, // Added userId
        }
    });
    const prof2 = yield prismaClient_1.prisma.professional.create({
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
    yield prismaClient_1.prisma.professional.createMany({
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
    const alice = yield prismaClient_1.prisma.professional.findFirst({ where: { name: "Professional Alice" } });
    const charlie = yield prismaClient_1.prisma.professional.findFirst({ where: { name: "Professional Charlie" } });
    if (alice && service1) {
        yield prismaClient_1.prisma.professionalService.create({ data: { professionalId: alice.id, serviceId: service1.id } });
    }
    if (charlie && service2) {
        yield prismaClient_1.prisma.professionalService.create({ data: { professionalId: charlie.id, serviceId: service2.id } });
    }
});
// Clean up database before and after tests
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean related tables first (children before parents)
    yield prismaClient_1.prisma.activityLog.deleteMany({});
    yield prismaClient_1.prisma.userBadge.deleteMany({});
    yield prismaClient_1.prisma.badge.deleteMany({});
    yield prismaClient_1.prisma.gamificationEvent.deleteMany({});
    yield prismaClient_1.prisma.professionalService.deleteMany({});
    yield prismaClient_1.prisma.appointment.deleteMany({});
    yield prismaClient_1.prisma.review.deleteMany({});
    yield prismaClient_1.prisma.service.deleteMany({});
    yield prismaClient_1.prisma.professionalExperience.deleteMany({});
    yield prismaClient_1.prisma.professionalEducation.deleteMany({});
    yield prismaClient_1.prisma.scheduleBlock.deleteMany({});
    yield prismaClient_1.prisma.professional.deleteMany({});
    yield prismaClient_1.prisma.companyAddress.deleteMany({});
    yield prismaClient_1.prisma.company.deleteMany({});
    yield prismaClient_1.prisma.category.deleteMany({});
    yield prismaClient_1.prisma.userAddress.deleteMany({});
    yield prismaClient_1.prisma.user.deleteMany({});
    yield createTestData();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up again (children before parents)
    yield prismaClient_1.prisma.activityLog.deleteMany({});
    yield prismaClient_1.prisma.userBadge.deleteMany({});
    yield prismaClient_1.prisma.badge.deleteMany({});
    yield prismaClient_1.prisma.gamificationEvent.deleteMany({});
    yield prismaClient_1.prisma.professionalService.deleteMany({});
    yield prismaClient_1.prisma.appointment.deleteMany({});
    yield prismaClient_1.prisma.review.deleteMany({});
    yield prismaClient_1.prisma.service.deleteMany({});
    yield prismaClient_1.prisma.professionalExperience.deleteMany({});
    yield prismaClient_1.prisma.professionalEducation.deleteMany({});
    yield prismaClient_1.prisma.scheduleBlock.deleteMany({});
    yield prismaClient_1.prisma.professional.deleteMany({});
    yield prismaClient_1.prisma.companyAddress.deleteMany({});
    yield prismaClient_1.prisma.company.deleteMany({});
    yield prismaClient_1.prisma.category.deleteMany({});
    yield prismaClient_1.prisma.userAddress.deleteMany({});
    yield prismaClient_1.prisma.user.deleteMany({});
    yield prismaClient_1.prisma.$disconnect();
}));
// --- GET Tests (Public Access) ---
describe("GET /api/professionals", () => {
    it("should return a list of professionals with default pagination", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/professionals");
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
    }));
    // ... other GET filter/sort tests remain the same ...
    it("should filter professionals by companyId", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals?companyId=${testCompanyId1}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        res.body.data.forEach((prof) => {
            expect(prof.companyId).toEqual(testCompanyId1);
        });
    }));
    it("should filter professionals by role", () => __awaiter(void 0, void 0, void 0, function* () {
        const role = "Designer";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals?role=${role}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        res.body.data.forEach((prof) => {
            expect(prof.role).toEqual(role);
        });
    }));
    it("should filter professionals by city", () => __awaiter(void 0, void 0, void 0, function* () {
        const city = "TestvilleProf";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals?city=${city}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        res.body.data.forEach((prof) => {
            var _a, _b;
            expect((_b = (_a = prof.company) === null || _a === void 0 ? void 0 : _a.address) === null || _b === void 0 ? void 0 : _b.city).toEqual(city);
        });
    }));
    it("should filter professionals by state", () => __awaiter(void 0, void 0, void 0, function* () {
        const state = "AP";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals?state=${state}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        res.body.data.forEach((prof) => {
            var _a, _b;
            expect((_b = (_a = prof.company) === null || _a === void 0 ? void 0 : _a.address) === null || _b === void 0 ? void 0 : _b.state).toEqual(state);
        });
    }));
    it("should filter professionals by minRating", () => __awaiter(void 0, void 0, void 0, function* () {
        const minRating = "4.0";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals?minRating=${minRating}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        res.body.data.forEach((prof) => {
            expect(prof.rating).toBeGreaterThanOrEqual(parseFloat(minRating));
        });
    }));
    it("should filter professionals by search query (q)", () => __awaiter(void 0, void 0, void 0, function* () {
        const searchTerm = "Alice";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals?q=${searchTerm}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        const found = res.body.data.some((prof) => prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prof.role.toLowerCase().includes(searchTerm.toLowerCase()));
        expect(found).toBe(true);
    }));
    it("should sort professionals by name ascending (default)", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/professionals");
        expect(res.statusCode).toEqual(200);
        const names = res.body.data.map((p) => p.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    }));
    it("should sort professionals by rating descending", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/professionals?sort=rating_desc");
        expect(res.statusCode).toEqual(200);
        const ratings = res.body.data.map((p) => p.rating);
        for (let i = 0; i < ratings.length - 1; i++) {
            expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
        }
    }));
    it("should return empty data array when no professionals match filters", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/professionals?q=NonExistentProfXYZ&minRating=5.1");
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toEqual(0);
        expect(res.body.pagination.totalItems).toEqual(0);
    }));
});
describe("GET /api/professionals/:id", () => {
    it("should return a specific professional by ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals/${testProfessionalId1}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toEqual(testProfessionalId1);
        expect(res.body.name).toEqual("Professional Alice");
    }));
    it("should return 404 for a non-existent professional ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals/${nonExistentId}`);
        expect(res.statusCode).toEqual(404);
    }));
    it("should return 400 for an invalid professional ID format", () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidId = "invalid-id-format";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals/${invalidId}`);
        expect(res.statusCode).toEqual(400);
    }));
});
// --- POST Tests (Admin Only) ---
describe("POST /api/professionals", () => {
    const newProfessionalData = {
        name: "New Test Professional",
        role: "Tester",
        companyId: testCompanyId1,
        serviceIds: [testServiceId1]
    };
    it("should allow an ADMIN to create a professional", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/professionals")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newProfessionalData);
        expect(res.statusCode).toEqual(201);
        expect(res.body.name).toEqual(newProfessionalData.name);
        expect(res.body.companyId).toEqual(testCompanyId1);
        // Check if service was associated (assuming response includes services)
        // expect(res.body.services.some((ps: any) => ps.serviceId === testServiceId1)).toBe(true);
    }));
    it("should FORBID a regular USER from creating a professional", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/professionals")
            .set("Authorization", `Bearer ${userToken}`)
            .send(newProfessionalData);
        expect(res.statusCode).toEqual(403); // Forbidden
    }));
    it("should return 401 Unauthorized if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/professionals")
            .send(newProfessionalData);
        expect(res.statusCode).toEqual(401);
    }));
    it("should return 400 Bad Request for missing required fields (name)", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/professionals")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "Incomplete", companyId: testCompanyId1 }); // Missing name
        expect(res.statusCode).toEqual(400);
    }));
    it("should return 400 Bad Request for non-existent companyId", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/professionals")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(Object.assign(Object.assign({}, newProfessionalData), { companyId: nonExistentId }));
        expect(res.statusCode).toEqual(400); // P2025 handled as 400
    }));
    it("should update user role to PROFESSIONAL after creating a professional profile", () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a new user with USER role
        const tempUser = yield prismaClient_1.prisma.user.create({
            data: {
                name: "Temp User For Prof Role Test",
                email: `tempuser-profrole-${Date.now()}@test.com`,
                password: "hashedpassword",
                role: client_1.UserRole.USER,
                points: 0,
                slug: `tempuser-profrole-${Date.now()}`
            }
        });
        const tempToken = generateToken(tempUser.id, tempUser.role);
        // Create a professional profile for this user
        const profRes = yield (0, supertest_1.default)(index_1.app)
            .post("/api/professionals")
            .set("Authorization", `Bearer ${tempToken}`)
            .send({
            name: "Temp Professional",
            role: "Test Role",
            companyId: testCompanyId1
        });
        expect(profRes.statusCode).toEqual(201);
        // Fetch the user from DB and check role
        const updatedUser = yield prismaClient_1.prisma.user.findUnique({ where: { id: tempUser.id } });
        expect(updatedUser).toBeDefined();
        expect(updatedUser.role).toBe("PROFESSIONAL");
        // Cleanup
        yield prismaClient_1.prisma.professional.deleteMany({ where: { userId: tempUser.id } });
        yield prismaClient_1.prisma.user.delete({ where: { id: tempUser.id } });
    }));
});
// --- PUT Tests (Admin Only) ---
describe("PUT /api/professionals/:id", () => {
    const updateData = { role: "Lead Developer" };
    it("should allow an ADMIN to update a professional", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/professionals/${testProfessionalId1}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData);
        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toEqual(testProfessionalId1);
        expect(res.body.role).toEqual(updateData.role);
    }));
    it("should FORBID a regular USER from updating a professional", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/professionals/${testProfessionalId1}`)
            .set("Authorization", `Bearer ${userToken}`)
            .send(updateData);
        expect(res.statusCode).toEqual(403); // Forbidden
    }));
    it("should return 401 Unauthorized if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/professionals/${testProfessionalId1}`)
            .send(updateData);
        expect(res.statusCode).toEqual(401);
    }));
    it("should return 404 Not Found for updating a non-existent professional", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/professionals/${nonExistentId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData);
        expect(res.statusCode).toEqual(404);
    }));
});
// --- DELETE Tests (Admin Only) ---
describe("DELETE /api/professionals/:id", () => {
    let professionalToDeleteId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create a professional specifically for delete tests
        const prof = yield prismaClient_1.prisma.professional.create({
            data: { name: "Professional To Delete", role: "Temp", companyId: testCompanyId1, userId: testUserId } // Added userId
        });
        professionalToDeleteId = prof.id;
    }));
    it("should allow an ADMIN to delete a professional", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/${professionalToDeleteId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(204); // No Content
        // Verify it's actually deleted
        const findRes = yield (0, supertest_1.default)(index_1.app).get(`/api/professionals/${professionalToDeleteId}`);
        expect(findRes.statusCode).toEqual(404);
    }));
    it("should FORBID a regular USER from deleting a professional", () => __awaiter(void 0, void 0, void 0, function* () {
        // Recreate the professional for this test case
        const prof = yield prismaClient_1.prisma.professional.create({
            data: { name: "Professional To Delete Again", role: "Temp Again", companyId: testCompanyId1, userId: testUserId } // Added userId
        });
        ;
        const tempId = prof.id;
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/${tempId}`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(403); // Forbidden
        // Clean up the recreated professional
        yield prismaClient_1.prisma.professional.delete({ where: { id: tempId } });
    }));
    it("should return 401 Unauthorized if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/${testProfessionalId2}`); // Use another existing one
        expect(res.statusCode).toEqual(401);
    }));
    it("should return 404 Not Found for deleting a non-existent professional", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistentId = "clxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/${nonExistentId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(404);
    }));
});
describe("DELETE /api/professionals/services/:serviceId (authenticated professional)", () => {
    let profUser;
    let profToken;
    let profProfile;
    let service;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create a user and professional profile
        profUser = yield prismaClient_1.prisma.user.create({
            data: {
                name: "ServiceRemover",
                email: `serviceremover-${Date.now()}@test.com`,
                password: "hashedpassword",
                role: client_1.UserRole.USER,
                points: 0,
                slug: `serviceremover-${Date.now()}`
            }
        });
        profToken = generateToken(profUser.id, client_1.UserRole.USER);
        profProfile = yield prismaClient_1.prisma.professional.create({
            data: {
                name: "Service Remover",
                role: "Remover",
                companyId: testCompanyId1,
                userId: profUser.id
            }
        });
        // Create a service and link to professional
        service = yield prismaClient_1.prisma.service.create({
            data: {
                name: `Removable Service ${Date.now()}`,
                description: "To be removed",
                price: new library_1.Decimal("10.00"),
                duration: "10min",
                categoryId: (yield prismaClient_1.prisma.category.findFirst()).id,
                companyId: testCompanyId1
            }
        });
        yield prismaClient_1.prisma.professionalService.create({
            data: { professionalId: profProfile.id, serviceId: service.id }
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaClient_1.prisma.professionalService.deleteMany({ where: { professionalId: profProfile.id } });
        yield prismaClient_1.prisma.service.deleteMany({ where: { id: service.id } });
        yield prismaClient_1.prisma.professional.deleteMany({ where: { id: profProfile.id } });
        yield prismaClient_1.prisma.user.deleteMany({ where: { id: profUser.id } });
    }));
    it("should allow the authenticated professional to remove a linked service", () => __awaiter(void 0, void 0, void 0, function* () {
        // Confirm the link exists
        let link = yield prismaClient_1.prisma.professionalService.findUnique({
            where: { professionalId_serviceId: { professionalId: profProfile.id, serviceId: service.id } }
        });
        expect(link).not.toBeNull();
        // Call the endpoint
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/services/${service.id}`)
            .set("Authorization", `Bearer ${profToken}`);
        expect(res.statusCode).toBe(204);
        // Confirm the link is removed
        link = yield prismaClient_1.prisma.professionalService.findUnique({
            where: { professionalId_serviceId: { professionalId: profProfile.id, serviceId: service.id } }
        });
        expect(link).toBeNull();
    }));
    it("should return 404 if the professional profile does not exist for the user", () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a new user without a professional profile
        const orphanUser = yield prismaClient_1.prisma.user.create({
            data: {
                name: "Orphan",
                email: `orphan-${Date.now()}@test.com`,
                password: "hashedpassword",
                role: client_1.UserRole.USER,
                points: 0,
                slug: `orphan-${Date.now()}`
            }
        });
        const orphanToken = generateToken(orphanUser.id, client_1.UserRole.USER);
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/services/${service.id}`)
            .set("Authorization", `Bearer ${orphanToken}`);
        expect(res.statusCode).toBe(404);
        yield prismaClient_1.prisma.user.delete({ where: { id: orphanUser.id } });
    }));
    it("should return 400 for invalid serviceId format", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/services/invalid-id-format`)
            .set("Authorization", `Bearer ${profToken}`);
        expect(res.statusCode).toBe(400);
    }));
    it("should return 401 if not authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/professionals/services/${service.id}`);
        expect(res.statusCode).toBe(401);
    }));
});
