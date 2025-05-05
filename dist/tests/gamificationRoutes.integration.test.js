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
const index_1 = require("../index"); // Assuming your Express app instance is exported from index.ts
const prismaClient_1 = require("../utils/prismaClient");
const client_1 = require("@prisma/client"); // Added User, Badge, Professional
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Test user credentials
const testUserEmail = "gamification-test@example.com";
const testUserPassword = "password123";
let testUserId;
let accessToken;
// Test professional credentials
const testProfEmail = "gamification-prof@example.com";
const testProfPassword = "password123";
let testProfId; // This is the Professional profile ID
let testProfUserId; // This is the User ID associated with the professional
let profAccessToken;
// Test service
let testServiceId;
// Test company
let testCompanyId;
// Helper to generate JWT
const generateToken = (userId, role = client_1.UserRole.USER) => {
    const JWT_SECRET = process.env.JWT_SECRET || "test-secret"; // Use a default for testing if not set
    return jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
};
// Setup: Create necessary entities before tests run
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up potential leftovers
    yield prismaClient_1.prisma.appointment.deleteMany({});
    yield prismaClient_1.prisma.review.deleteMany({});
    yield prismaClient_1.prisma.userBadge.deleteMany({});
    yield prismaClient_1.prisma.professionalService.deleteMany({});
    yield prismaClient_1.prisma.service.deleteMany({});
    yield prismaClient_1.prisma.professional.deleteMany({});
    yield prismaClient_1.prisma.user.deleteMany({ where: { email: { in: [testUserEmail, testProfEmail] } } });
    yield prismaClient_1.prisma.companyAddress.deleteMany({}); // Added address cleanup
    yield prismaClient_1.prisma.company.deleteMany({ where: { name: "Gamification Test Company" } });
    yield prismaClient_1.prisma.category.deleteMany({}); // Added category cleanup
    yield prismaClient_1.prisma.badge.deleteMany({}); // Added badge cleanup
    // 0. Create Badges (if they don't exist - assuming they might be seeded or created elsewhere)
    yield prismaClient_1.prisma.badge.upsert({ where: { name: "Primeiros Passos" }, update: {}, create: { name: "Primeiros Passos", description: "Completou o cadastro.", iconUrl: "" } });
    yield prismaClient_1.prisma.badge.upsert({ where: { name: "Primeiro Agendamento" }, update: {}, create: { name: "Primeiro Agendamento", description: "Completou o primeiro agendamento.", iconUrl: "" } });
    yield prismaClient_1.prisma.badge.upsert({ where: { name: "Primeira Avaliação" }, update: {}, create: { name: "Primeira Avaliação", description: "Deixou a primeira avaliação.", iconUrl: "" } });
    // 1. Create Category
    let category = yield prismaClient_1.prisma.category.findUnique({ where: { name: "Gamification Test Category" } });
    if (!category) {
        category = yield prismaClient_1.prisma.category.create({ data: { name: "Gamification Test Category" } });
    }
    // 2. Create Company
    const company = yield prismaClient_1.prisma.company.create({
        data: {
            name: "Gamification Test Company",
            description: "Test desc", // Added description
            address: { create: { street: "1 Gamification St", number: "10", neighborhood: "Test", city: "Test City", state: "TS", zipCode: "00000-000" } } // Added address
        }
    });
    testCompanyId = company.id;
    // 3. Create Professional User
    const hashedProfPassword = yield bcrypt_1.default.hash(testProfPassword, 10);
    const professionalUser = yield prismaClient_1.prisma.user.create({
        data: {
            email: testProfEmail,
            password: hashedProfPassword,
            name: "Gamification Prof",
            role: client_1.UserRole.PROFESSIONAL, // Role should be PROFESSIONAL
            points: 0, // Initialize points
        }
    });
    testProfUserId = professionalUser.id; // Store the User ID
    // Create the Professional profile linked to the user
    const profProfile = yield prismaClient_1.prisma.professional.create({
        data: {
            user: { connect: { id: testProfUserId } }, // Link to the created user
            companyId: testCompanyId,
            name: professionalUser.name, // Use user's name or specific professional name
            // bio: "Test Professional Bio", // Assuming bio exists on Professional model
            role: "Tester", // Added role
        }
    });
    testProfId = profProfile.id; // Get the professional profile ID
    profAccessToken = generateToken(professionalUser.id, client_1.UserRole.PROFESSIONAL);
    // 4. Create Service
    const service = yield prismaClient_1.prisma.service.create({
        data: {
            name: "Gamification Test Service",
            description: "Service for gamification tests",
            price: 50.00,
            duration: "60min",
            companyId: testCompanyId,
            categoryId: category.id, // Link to category
            // Link service to professional
            professionals: {
                create: {
                    professionalId: testProfId
                }
            }
        }
    });
    testServiceId = service.id;
    // 5. Create Regular User (for testing registration event)
    const hashedUserPassword = yield bcrypt_1.default.hash(testUserPassword, 10);
    const user = yield prismaClient_1.prisma.user.create({
        data: {
            email: testUserEmail,
            password: hashedUserPassword,
            name: "Gamification User",
            role: client_1.UserRole.USER,
            points: 0, // Initialize points
        }
    });
    testUserId = user.id;
    accessToken = generateToken(testUserId);
}));
// Teardown: Clean up created entities after tests
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient_1.prisma.appointment.deleteMany({ where: { userId: testUserId } });
    yield prismaClient_1.prisma.review.deleteMany({ where: { userId: testUserId } });
    yield prismaClient_1.prisma.userBadge.deleteMany({ where: { userId: { in: [testUserId, testProfUserId] } } });
    yield prismaClient_1.prisma.professionalService.deleteMany({ where: { serviceId: testServiceId } });
    yield prismaClient_1.prisma.service.deleteMany({ where: { id: testServiceId } });
    yield prismaClient_1.prisma.professional.deleteMany({ where: { id: testProfId } });
    yield prismaClient_1.prisma.user.deleteMany({ where: { id: { in: [testUserId, testProfUserId] } } });
    yield prismaClient_1.prisma.companyAddress.deleteMany({}); // Added address cleanup
    yield prismaClient_1.prisma.company.deleteMany({ where: { id: testCompanyId } });
    yield prismaClient_1.prisma.category.deleteMany({}); // Added category cleanup
    yield prismaClient_1.prisma.badge.deleteMany({}); // Added badge cleanup
    yield prismaClient_1.prisma.$disconnect();
}));
describe("Gamification System", () => {
    // Test USER_REGISTERED event (implicitly tested by user creation in beforeAll)
    it("should award points/badge for user registration", () => __awaiter(void 0, void 0, void 0, function* () {
        // Check the user model directly for points/level
        const user = yield prismaClient_1.prisma.user.findUnique({
            where: { id: testUserId },
            include: { badges: { include: { badge: true } } } // Include badges via UserBadge
        });
        expect(user).toBeDefined();
        // Check points based on gamificationService logic (e.g., 10 points for registration)
        expect(user.points).toBeGreaterThanOrEqual(10); // Assuming 10 points for registration
        // Check if FIRST_STEPS badge was awarded
        const hasFirstStepsBadge = user.badges.some(ub => ub.badge.name === "Primeiros Passos"); // Check code on the included badge
        expect(hasFirstStepsBadge).toBe(true);
    }));
    // Test APPOINTMENT_COMPLETED event
    it("should award points/badge for completing an appointment", () => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Create an appointment
        const appointmentTime = new Date();
        appointmentTime.setDate(appointmentTime.getDate() + 1); // Book for tomorrow
        appointmentTime.setHours(10, 0, 0, 0);
        const createResponse = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
            date: appointmentTime.toISOString(),
            serviceId: testServiceId,
            professionalId: testProfId
        });
        expect(createResponse.status).toBe(201);
        const appointmentId = createResponse.body.id;
        // 2. Confirm the appointment (by professional)
        const confirmResponse = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${appointmentId}/status`)
            .set("Authorization", `Bearer ${profAccessToken}`)
            .send({ status: client_1.AppointmentStatus.CONFIRMED });
        expect(confirmResponse.status).toBe(200);
        // 3. Complete the appointment (by professional) - This should trigger the event
        yield prismaClient_1.prisma.appointment.update({
            where: { id: appointmentId },
            data: { date: new Date(Date.now() - 60 * 60 * 1000) } // Set date to 1 hour ago
        });
        const completeResponse = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${appointmentId}/status`)
            .set("Authorization", `Bearer ${profAccessToken}`)
            .send({ status: client_1.AppointmentStatus.COMPLETED });
        expect(completeResponse.status).toBe(200);
        // 4. Check user's profile for points/badge
        yield new Promise(resolve => setTimeout(resolve, 500));
        const user = yield prismaClient_1.prisma.user.findUnique({
            where: { id: testUserId }, // Check the USER's model
            include: { badges: { include: { badge: true } } }
        });
        expect(user).toBeDefined();
        // Check points increased (e.g., by 20 points for completion)
        expect(user.points).toBeGreaterThanOrEqual(10 + 20); // Registration + Completion
        // Check if FIRST_APPOINTMENT badge was awarded (if applicable)
        const hasFirstAppointmentBadge = user.badges.some(ub => ub.badge.name === "Primeiro Agendamento"); // Check code on the included badge
        expect(hasFirstAppointmentBadge).toBe(true);
    }));
    // Test REVIEW_CREATED event
    it("should award points/badge for creating a review", () => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Create a review
        const reviewResponse = yield (0, supertest_1.default)(index_1.app)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
            rating: 5,
            comment: "Great service!",
            serviceId: testServiceId, // Reviewing the service
            professionalId: testProfId // Reviewing the professional
        });
        expect(reviewResponse.status).toBe(201);
        // 2. Check user's profile for points/badge
        yield new Promise(resolve => setTimeout(resolve, 500));
        const user = yield prismaClient_1.prisma.user.findUnique({
            where: { id: testUserId },
            include: { badges: { include: { badge: true } } }
        });
        expect(user).toBeDefined();
        // Check points increased (e.g., by 15 points for review)
        expect(user.points).toBeGreaterThanOrEqual(10 + 20 + 15); // Registration + Completion + Review
        // Check if FIRST_REVIEW badge was awarded
        const hasFirstReviewBadge = user.badges.some(ub => ub.badge.name === "Primeira Avaliação"); // Check code on the included badge
        expect(hasFirstReviewBadge).toBe(true);
    }));
    // Test GET /api/gamification/profile/me
    it("should get the authenticated user's gamification profile (from User model)", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/gamification/profile/me")
            .set("Authorization", `Bearer ${accessToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id", testUserId); // Should return User ID
        expect(response.body).toHaveProperty("points");
        expect(response.body).toHaveProperty("badges");
        expect(response.body).toHaveProperty("name", "Gamification User");
        // Check if badges array contains expected badges
        expect(Array.isArray(response.body.badges)).toBe(true);
        const badgeNames = response.body.badges.map((b) => b.badge.name); // Check name on the included badge
        expect(badgeNames).toContain("Primeiros Passos");
        expect(badgeNames).toContain("Primeiro Agendamento");
        expect(badgeNames).toContain("Primeira Avaliação");
    }));
    // Test GET /api/gamification/profile/:userId (as non-admin - should fail)
    it("should fail to get another user's gamification profile as non-admin", () => __awaiter(void 0, void 0, void 0, function* () {
        // Create another user temporarily
        const otherUser = yield prismaClient_1.prisma.user.create({ data: { email: `other-${Date.now()}@gam.com`, password: "test", name: "Other", points: 0 } });
        const otherAccessToken = generateToken(otherUser.id);
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/gamification/profile/${testUserId}`) // Try to get testUser's profile
            .set("Authorization", `Bearer ${otherAccessToken}`); // Using other user's token
        expect(response.status).toBe(403); // Forbidden
        // Clean up other user
        yield prismaClient_1.prisma.user.delete({ where: { id: otherUser.id } });
    }));
    // Test GET /api/gamification/leaderboard
    it("should get the gamification leaderboard (from User model)", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/gamification/leaderboard?limit=5")
            .set("Authorization", `Bearer ${accessToken}`); // Auth might be needed depending on implementation
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1); // At least our test user should be there
        expect(response.body.length).toBeLessThanOrEqual(5);
        // Check if the first user is the one with the most points (our test user)
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("id", testUserId); // Check User ID
            expect(response.body[0]).toHaveProperty("points");
            expect(response.body[0]).toHaveProperty("name", "Gamification User");
            // Check if sorted by points descending
            if (response.body.length > 1) {
                expect(response.body[0].points).toBeGreaterThanOrEqual(response.body[1].points);
            }
        }
    }));
});
