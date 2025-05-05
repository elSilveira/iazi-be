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
const index_1 = require("../index"); // Corrected path
const prismaClient_1 = require("../utils/prismaClient");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// --- Test Setup ---
let adminToken;
let userToken;
let testCompanyId;
let testUserId;
let testAdminId;
// Helper to generate JWT token
const generateToken = (userId, role) => {
    const secret = process.env.JWT_SECRET || "test-secret";
    return jsonwebtoken_1.default.sign({ userId, role }, secret, { expiresIn: "1h" });
};
// Helper to create test data
const createTestData = () => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure categories exist
    yield prismaClient_1.prisma.category.upsert({ where: { name: "Tech Company" }, update: {}, create: { name: "Tech Company" } });
    yield prismaClient_1.prisma.category.upsert({ where: { name: "Consulting" }, update: {}, create: { name: "Consulting" } });
    yield prismaClient_1.prisma.category.upsert({ where: { name: "Software" }, update: {}, create: { name: "Software" } });
    yield prismaClient_1.prisma.category.upsert({ where: { name: "Services" }, update: {}, create: { name: "Services" } });
    yield prismaClient_1.prisma.category.upsert({ where: { name: "Test Category" }, update: {}, create: { name: "Test Category" } });
    // Create users (Admin and Regular)
    const adminUser = yield prismaClient_1.prisma.user.upsert({
        where: { email: "admin@test.com" },
        update: { role: client_1.UserRole.ADMIN },
        create: {
            name: "Test Admin",
            email: "admin@test.com",
            password: "hashedpassword",
            role: client_1.UserRole.ADMIN,
        }
    });
    const regularUser = yield prismaClient_1.prisma.user.upsert({
        where: { email: "user@test.com" },
        update: { role: client_1.UserRole.USER },
        create: {
            name: "Test User",
            email: "user@test.com",
            password: "hashedpassword",
            role: client_1.UserRole.USER,
        }
    });
    testAdminId = adminUser.id;
    testUserId = regularUser.id;
    // Generate tokens
    adminToken = generateToken(adminUser.id, adminUser.role);
    userToken = generateToken(regularUser.id, regularUser.role);
    // Create companies
    // Changed upsert to findFirst + create if not exists, as upsert requires unique `id` in `where`
    let company1 = yield prismaClient_1.prisma.company.findFirst({ where: { name: "Innovate Solutions Test" } });
    if (!company1) {
        company1 = yield prismaClient_1.prisma.company.create({
            data: {
                name: "Innovate Solutions Test",
                description: "Leading tech solutions provider",
                rating: 4.7,
                categories: ["Tech Company"],
                // ownerId: adminUser.id // Add ownerId if schema supports it
            },
        });
    }
    testCompanyId = company1.id;
    // Use findFirst + create for other companies as well to avoid potential upsert issues if name isn't unique
    let globalConsulting = yield prismaClient_1.prisma.company.findFirst({ where: { name: "Global Consulting Test" } });
    if (!globalConsulting) {
        globalConsulting = yield prismaClient_1.prisma.company.create({
            data: {
                name: "Global Consulting Test",
                description: "Expert business consulting",
                rating: 4.2,
                categories: ["Consulting"],
            }
        });
    }
    let alphaTech = yield prismaClient_1.prisma.company.findFirst({ where: { name: "Alpha Tech Test" } });
    if (!alphaTech) {
        alphaTech = yield prismaClient_1.prisma.company.create({
            data: {
                name: "Alpha Tech Test",
                description: "Software development specialists",
                rating: 4.9,
                categories: ["Tech Company", "Software"],
            }
        });
    }
    let betaServices = yield prismaClient_1.prisma.company.findFirst({ where: { name: "Beta Services Test" } });
    if (!betaServices) {
        betaServices = yield prismaClient_1.prisma.company.create({
            data: {
                name: "Beta Services Test",
                description: "General business services",
                rating: 3.9,
                categories: ["Services"],
            }
        });
    }
    // Add addresses (using the found/created company IDs)
    yield prismaClient_1.prisma.companyAddress.upsert({
        where: { companyId: company1.id },
        update: { street: "1 Test Dr", city: "Silicon Valley", state: "CA" },
        create: {
            street: "1 Test Dr", number: "100", neighborhood: "Test Park", city: "Silicon Valley", state: "CA", zipCode: "94000", companyId: company1.id,
        },
    });
    if (globalConsulting) { // Check if it was found/created
        yield prismaClient_1.prisma.companyAddress.upsert({
            where: { companyId: globalConsulting.id },
            update: { street: "200 Test Ave", city: "New York", state: "NY" },
            create: {
                street: "200 Test Ave", number: "50", neighborhood: "Test District", city: "New York", state: "NY", zipCode: "10001", companyId: globalConsulting.id,
            },
        });
    }
});
// Clean up database before and after tests
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean related tables first (order matters due to foreign keys)
    // await prisma.notification.deleteMany({}); // Model doesn't exist
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
    // Clean up again
    // await prisma.notification.deleteMany({});
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
describe("GET /api/companies", () => {
    it("should return a list of companies with default pagination", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/companies");
        expect(res.statusCode).toEqual(200);
        if (res.body.data && res.body.pagination) {
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
        }
        else {
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThanOrEqual(4);
        }
    }));
    it("should filter companies by category", () => __awaiter(void 0, void 0, void 0, function* () {
        const category = "Tech Company";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies?category=${encodeURIComponent(category)}`);
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        expect(companies.length).toBeGreaterThan(0);
        companies.forEach((company) => {
            expect(company.categories).toContain(category);
        });
    }));
    it("should filter companies by city", () => __awaiter(void 0, void 0, void 0, function* () {
        const city = "Silicon Valley";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies?city=${encodeURIComponent(city)}`);
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        expect(companies.length).toBeGreaterThan(0);
        companies.forEach((company) => {
            var _a;
            expect((_a = company.address) === null || _a === void 0 ? void 0 : _a.city).toEqual(city);
        });
    }));
    it("should filter companies by state", () => __awaiter(void 0, void 0, void 0, function* () {
        const state = "NY";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies?state=${state}`);
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        expect(companies.length).toBeGreaterThan(0);
        companies.forEach((company) => {
            var _a;
            expect((_a = company.address) === null || _a === void 0 ? void 0 : _a.state).toEqual(state);
        });
    }));
    it("should filter companies by minRating", () => __awaiter(void 0, void 0, void 0, function* () {
        const minRating = "4.5";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies?minRating=${minRating}`);
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        expect(companies.length).toBeGreaterThan(0);
        companies.forEach((company) => {
            expect(company.rating).toBeGreaterThanOrEqual(parseFloat(minRating));
        });
    }));
    it("should filter companies by search query (q)", () => __awaiter(void 0, void 0, void 0, function* () {
        const searchTerm = "Consulting";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies?q=${searchTerm}`);
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        expect(companies.length).toBeGreaterThan(0);
        const found = companies.some((company) => company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.categories.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase())));
        expect(found).toBe(true);
    }));
    it("should sort companies by name ascending (default)", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/companies");
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        const names = companies.map((c) => c.name);
        expect(names).toEqual([...names].sort());
    }));
    it("should sort companies by rating descending", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/companies?sort=rating_desc");
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        const ratings = companies.map((c) => c.rating);
        for (let i = 0; i < ratings.length - 1; i++) {
            expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
        }
    }));
    it("should return empty data array when no companies match filters", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get("/api/companies?q=NonExistentCompanyXYZ&minRating=5.1&city=Atlantis");
        expect(res.statusCode).toEqual(200);
        const companies = res.body.data || res.body;
        const pagination = res.body.pagination;
        expect(companies).toBeInstanceOf(Array);
        expect(companies.length).toEqual(0);
        if (pagination) {
            expect(pagination.totalItems).toEqual(0);
        }
    }));
});
describe("GET /api/companies/:id", () => {
    it("should return a specific company by ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies/${testCompanyId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toEqual(testCompanyId);
        expect(res.body.name).toEqual("Innovate Solutions Test");
    }));
    it("should return 404 for a non-existent company ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistentId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"; // Example random UUID
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies/${nonExistentId}`);
        expect(res.statusCode).toEqual(404);
    }));
    it("should return 400 for an invalid company ID format", () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidId = "invalid-id-format";
        const res = yield (0, supertest_1.default)(index_1.app).get(`/api/companies/${invalidId}`);
        expect(res.statusCode).toEqual(400);
    }));
});
// --- POST Tests (Admin Only) ---
describe("POST /api/companies", () => {
    const newCompanyData = {
        name: "New Test Company",
        description: "A brand new company for testing",
        categories: ["Test Category"],
        address: {
            street: "123 Test St",
            number: "1",
            neighborhood: "Test District",
            city: "Testville",
            state: "TS",
            zipCode: "12345"
        }
    };
    let createdCompanyId = null;
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        if (createdCompanyId) {
            yield prismaClient_1.prisma.companyAddress.deleteMany({ where: { companyId: createdCompanyId } });
            yield prismaClient_1.prisma.company.deleteMany({ where: { id: createdCompanyId } });
            createdCompanyId = null;
        }
    }));
    it("should allow an ADMIN to create a company", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/companies")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newCompanyData);
        expect(res.statusCode).toEqual(201);
        expect(res.body.name).toEqual(newCompanyData.name);
        expect((_a = res.body.address) === null || _a === void 0 ? void 0 : _a.street).toEqual(newCompanyData.address.street);
        createdCompanyId = res.body.id; // Store for cleanup
    }));
    it("should FORBID a regular USER from creating a company", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/companies")
            .set("Authorization", `Bearer ${userToken}`)
            .send(newCompanyData);
        expect(res.statusCode).toEqual(403);
    }));
    it("should return 401 Unauthorized if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/companies")
            .send(newCompanyData);
        expect(res.statusCode).toEqual(401);
    }));
    it("should return 400 Bad Request for missing required fields", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post("/api/companies")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ description: "Incomplete data" });
        expect(res.statusCode).toEqual(400);
    }));
});
// --- PUT Tests (Admin Only) ---
describe("PUT /api/companies/:id", () => {
    const updateData = { description: "Updated description for Innovate" };
    it("should allow an ADMIN to update a company", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/companies/${testCompanyId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData);
        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toEqual(testCompanyId);
        expect(res.body.description).toEqual(updateData.description);
    }));
    it("should FORBID a regular USER from updating a company", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/companies/${testCompanyId}`)
            .set("Authorization", `Bearer ${userToken}`)
            .send(updateData);
        expect(res.statusCode).toEqual(403);
    }));
    it("should return 401 Unauthorized if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/companies/${testCompanyId}`)
            .send(updateData);
        expect(res.statusCode).toEqual(401);
    }));
    it("should return 404 Not Found for updating a non-existent company", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistentId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"; // Example random UUID
        const res = yield (0, supertest_1.default)(index_1.app)
            .put(`/api/companies/${nonExistentId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData);
        expect(res.statusCode).toEqual(404);
    }));
});
// --- DELETE Tests (Admin Only) ---
describe("DELETE /api/companies/:id", () => {
    let companyToDeleteId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create a company specifically for delete tests
        // Use findFirst + create to avoid upsert issues
        let company = yield prismaClient_1.prisma.company.findFirst({ where: { name: "Company To Delete" } });
        if (!company) {
            company = yield prismaClient_1.prisma.company.create({
                data: { name: "Company To Delete", description: "Delete me" }
            });
        }
        companyToDeleteId = company.id;
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaClient_1.prisma.company.deleteMany({ where: { id: companyToDeleteId } });
    }));
    it("should allow an ADMIN to delete a company", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/companies/${companyToDeleteId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain("Empresa excluída com sucesso");
        // Verify it's actually deleted
        const deletedCompany = yield prismaClient_1.prisma.company.findUnique({ where: { id: companyToDeleteId } });
        expect(deletedCompany).toBeNull();
    }));
    it("should FORBID a regular USER from deleting a company", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/companies/${companyToDeleteId}`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(403);
        // Verify it wasn't deleted
        const notDeletedCompany = yield prismaClient_1.prisma.company.findUnique({ where: { id: companyToDeleteId } });
        expect(notDeletedCompany).not.toBeNull();
    }));
    it("should return 401 Unauthorized if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/companies/${companyToDeleteId}`);
        expect(res.statusCode).toEqual(401);
    }));
    it("should return 404 Not Found for deleting a non-existent company", () => __awaiter(void 0, void 0, void 0, function* () {
        const nonExistentId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33"; // Example random UUID
        const res = yield (0, supertest_1.default)(index_1.app)
            .delete(`/api/companies/${nonExistentId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(404);
    }));
});
