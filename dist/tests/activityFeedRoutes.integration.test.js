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
const index_1 = require("../index"); // Corrected import path
const prismaClient_1 = require("../utils/prismaClient");
const client_1 = require("@prisma/client"); // Added UserRole
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Import jwt directly
const bcrypt_1 = __importDefault(require("bcrypt"));
const library_1 = require("@prisma/client/runtime/library");
// --- Test Setup ---
let token;
let user;
let company;
let service;
let professional;
// Helper to generate JWT token (using jwt.sign directly)
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || "test-secret-feed"; // Use env var or a default for testing
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "1h" });
};
// Helper to create a user and generate a token
const setupUserAndToken = () => __awaiter(void 0, void 0, void 0, function* () {
    const hashedPassword = yield bcrypt_1.default.hash("password123", 10);
    user = yield prismaClient_1.prisma.user.upsert({
        where: { email: `testuser-feed@example.com` },
        update: {},
        create: {
            email: `testuser-feed@example.com`,
            name: "Test User Feed",
            password: hashedPassword,
            role: client_1.UserRole.USER, // Use enum
        },
    });
    token = generateToken({ id: user.id, role: user.role });
});
// Helper to create necessary entities (Company, Service, Professional)
const setupEntities = () => __awaiter(void 0, void 0, void 0, function* () {
    // Use findFirst + create pattern for Company
    let foundCompany = yield prismaClient_1.prisma.company.findFirst({ where: { name: "Test Company Feed" } });
    if (!foundCompany) {
        foundCompany = yield prismaClient_1.prisma.company.create({
            data: {
                name: "Test Company Feed",
                description: "Company for feed testing",
            },
        });
    }
    company = foundCompany;
    // Ensure a category exists (create if not)
    let category = yield prismaClient_1.prisma.category.upsert({
        where: { name: "Test Category Feed" },
        update: {},
        create: { name: "Test Category Feed" }
    });
    service = yield prismaClient_1.prisma.service.upsert({
        where: { name_companyId: { name: "Test Service Feed", companyId: company.id } }, // Use unique constraint
        update: {},
        create: {
            name: "Test Service Feed",
            description: "Service for feed testing",
            price: new library_1.Decimal("50.00"),
            duration: "60min",
            companyId: company.id,
            categoryId: category.id,
        },
    });
    // Use findFirst + create pattern for Professional to avoid potential unique constraint issues
    let foundProfessional = yield prismaClient_1.prisma.professional.findFirst({ where: { name: "Test Prof Feed", companyId: company.id } });
    if (!foundProfessional) {
        foundProfessional = yield prismaClient_1.prisma.professional.create({
            data: {
                name: "Test Prof Feed",
                role: "Tester",
                companyId: company.id,
            },
        });
    }
    professional = foundProfessional;
    // Link professional to service
    yield prismaClient_1.prisma.professionalService.upsert({
        where: { professionalId_serviceId: { professionalId: professional.id, serviceId: service.id } },
        update: {},
        create: {
            professionalId: professional.id,
            serviceId: service.id,
        },
    });
});
// Clean up database after tests
const cleanupDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    // Delete in reverse order of creation or use cascade deletes if configured
    yield prismaClient_1.prisma.activityLog.deleteMany({ where: { userId: user === null || user === void 0 ? void 0 : user.id } });
    yield prismaClient_1.prisma.review.deleteMany({ where: { userId: user === null || user === void 0 ? void 0 : user.id } });
    yield prismaClient_1.prisma.appointment.deleteMany({ where: { userId: user === null || user === void 0 ? void 0 : user.id } });
    // Ensure professional and service exist before trying to delete ProfessionalService
    if (professional && service) {
        yield prismaClient_1.prisma.professionalService.deleteMany({ where: { professionalId: professional.id, serviceId: service.id } });
    }
    if (service) {
        yield prismaClient_1.prisma.service.deleteMany({ where: { id: service.id } });
    }
    if (professional) {
        yield prismaClient_1.prisma.professional.deleteMany({ where: { id: professional.id } });
    }
    if (company) {
        yield prismaClient_1.prisma.company.deleteMany({ where: { id: company.id } });
    }
    if (user) {
        yield prismaClient_1.prisma.user.deleteMany({ where: { id: user.id } });
    }
    // Delete category if it was created specifically for this test
    yield prismaClient_1.prisma.category.deleteMany({ where: { name: "Test Category Feed" } });
});
// --- Test Suite ---
describe("Activity Feed API (/api/users/me/feed)", () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Setup user, token, and entities before all tests in this suite
        yield setupUserAndToken();
        yield setupEntities();
        // Clear any pre-existing logs for the user
        yield prismaClient_1.prisma.activityLog.deleteMany({ where: { userId: user.id } });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up database after all tests in this suite
        yield cleanupDatabase();
        yield prismaClient_1.prisma.$disconnect();
    }));
    // --- Test Cases ---
    let createdAppointmentId = null;
    let createdReviewId = null;
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up entities created within tests
        if (createdAppointmentId) {
            yield prismaClient_1.prisma.appointment.deleteMany({ where: { id: createdAppointmentId } });
            yield prismaClient_1.prisma.activityLog.deleteMany({ where: { relatedEntityId: createdAppointmentId } });
            createdAppointmentId = null;
        }
        if (createdReviewId) {
            yield prismaClient_1.prisma.review.deleteMany({ where: { id: createdReviewId } });
            yield prismaClient_1.prisma.activityLog.deleteMany({ where: { relatedEntityId: createdReviewId } });
            createdReviewId = null;
        }
    }));
    it("should log NEW_APPOINTMENT activity when an appointment is created", () => __awaiter(void 0, void 0, void 0, function* () {
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 2); // Book 2 days in advance
        appointmentDate.setHours(14, 0, 0, 0); // Set to 14:00
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${token}`)
            .send({
            date: appointmentDate.toISOString(),
            serviceId: service.id,
            professionalId: professional.id,
        });
        expect(response.status).toBe(201);
        createdAppointmentId = response.body.id;
        // Verify activity log exists
        const log = yield prismaClient_1.prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                type: "NEW_APPOINTMENT",
                relatedEntityId: createdAppointmentId,
            },
        });
        expect(log).not.toBeNull();
        expect(log === null || log === void 0 ? void 0 : log.message).toContain("Você agendou");
        expect(log === null || log === void 0 ? void 0 : log.message).toContain(service.name);
    }));
    // This test depends on a PATCH /cancel endpoint which might not exist
    // Assuming PATCH /api/appointments/:id/status with { status: CANCELLED } is used
    it("should log APPOINTMENT_CANCELLED activity when an appointment is cancelled", () => __awaiter(void 0, void 0, void 0, function* () {
        // First, create an appointment to cancel
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 3); // Book 3 days in advance
        appointmentDate.setHours(15, 0, 0, 0); // Set to 15:00
        const createRes = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${token}`)
            .send({
            date: appointmentDate.toISOString(),
            serviceId: service.id,
            professionalId: professional.id,
        });
        expect(createRes.status).toBe(201);
        const appointmentId = createRes.body.id;
        createdAppointmentId = appointmentId; // Mark for cleanup
        // Now, cancel the appointment using the status endpoint
        const cancelRes = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${appointmentId}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "CANCELLED" });
        expect(cancelRes.status).toBe(200);
        // Verify activity log exists
        const log = yield prismaClient_1.prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                type: "APPOINTMENT_CANCELLED",
                relatedEntityId: appointmentId,
            },
            orderBy: { createdAt: 'desc' } // Get the latest log for this appointment
        });
        expect(log).not.toBeNull();
        expect(log === null || log === void 0 ? void 0 : log.message).toContain("foi cancelado");
        expect(log === null || log === void 0 ? void 0 : log.message).toContain(service.name);
    }));
    it("should log NEW_REVIEW activity when a review is created", () => __awaiter(void 0, void 0, void 0, function* () {
        const reviewData = {
            rating: 5,
            comment: "Excellent service!",
            serviceId: service.id, // Reviewing the service
        };
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${token}`)
            .send(reviewData);
        expect(response.status).toBe(201);
        createdReviewId = response.body.id;
        // Verify activity log exists
        const log = yield prismaClient_1.prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                type: "NEW_REVIEW",
                relatedEntityId: createdReviewId,
            },
        });
        expect(log).not.toBeNull();
        expect(log === null || log === void 0 ? void 0 : log.message).toContain("Você avaliou");
        expect(log === null || log === void 0 ? void 0 : log.message).toContain(`serviço ${service.name}`);
        expect(log === null || log === void 0 ? void 0 : log.message).toContain(`${reviewData.rating} estrela(s)`);
    }));
    it("should return the user's activity feed with pagination", () => __awaiter(void 0, void 0, void 0, function* () {
        // Ensure there are at least 3 logs from previous tests
        const logsCount = yield prismaClient_1.prisma.activityLog.count({ where: { userId: user.id } });
        // Depending on test order, might be 2 or 3. Let's check >= 2
        expect(logsCount).toBeGreaterThanOrEqual(2);
        // Test fetching the first page
        const responsePage1 = yield (0, supertest_1.default)(index_1.app)
            .get("/api/users/me/feed?page=1&pageSize=2")
            .set("Authorization", `Bearer ${token}`);
        expect(responsePage1.status).toBe(200);
        expect(responsePage1.body.data).toBeInstanceOf(Array);
        // Page size is 2, so length should be min(2, logsCount)
        expect(responsePage1.body.data.length).toBe(Math.min(2, logsCount));
        expect(responsePage1.body.pagination.page).toBe(1);
        expect(responsePage1.body.pagination.pageSize).toBe(2);
        expect(responsePage1.body.pagination.totalItems).toBe(logsCount);
        expect(responsePage1.body.pagination.totalPages).toBe(Math.ceil(logsCount / 2));
        // Verify logs are ordered by createdAt descending (most recent first)
        if (responsePage1.body.data.length > 1) {
            const firstLogDate = new Date(responsePage1.body.data[0].createdAt);
            const secondLogDate = new Date(responsePage1.body.data[1].createdAt);
            expect(firstLogDate.getTime()).toBeGreaterThanOrEqual(secondLogDate.getTime());
        }
        // Test fetching the second page if there are enough logs
        if (logsCount > 2) {
            const responsePage2 = yield (0, supertest_1.default)(index_1.app)
                .get("/api/users/me/feed?page=2&pageSize=2")
                .set("Authorization", `Bearer ${token}`);
            expect(responsePage2.status).toBe(200);
            expect(responsePage2.body.data).toBeInstanceOf(Array);
            // Check if the number of items matches expected for the second page
            expect(responsePage2.body.data.length).toBe(logsCount - 2);
            expect(responsePage2.body.pagination.page).toBe(2);
            // Verify the log on page 2 is older than the last log on page 1
            const secondLogDatePage1 = new Date(responsePage1.body.data[1].createdAt);
            const firstLogDatePage2 = new Date(responsePage2.body.data[0].createdAt);
            expect(secondLogDatePage1.getTime()).toBeGreaterThanOrEqual(firstLogDatePage2.getTime());
        }
    }));
    it("should return 401 if no token is provided", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app).get("/api/users/me/feed");
        expect(response.status).toBe(401);
    }));
    it("should return 400 if pagination parameters are invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/users/me/feed?page=0&pageSize=-5") // Invalid page and pageSize
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(400);
        // The actual error message might vary based on validation middleware
        expect(response.body.message).toMatch(/inválid(o|a)s?/i); // More flexible check
    }));
});
