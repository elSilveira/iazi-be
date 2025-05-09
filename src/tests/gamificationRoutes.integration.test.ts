import request from "supertest";
import { app } from "../index"; // Assuming your Express app instance is exported from index.ts
import { prisma } from "../utils/prismaClient";
import { AppointmentStatus, UserRole, User, Badge, Professional } from "@prisma/client"; // Added User, Badge, Professional
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Test user credentials
const testUserEmail = "gamification-test@example.com";
const testUserPassword = "password123";
let testUserId: string;
let accessToken: string;

// Test professional credentials
const testProfEmail = "gamification-prof@example.com";
const testProfPassword = "password123";
let testProfId: string; // This is the Professional profile ID
let testProfUserId: string; // This is the User ID associated with the professional
let profAccessToken: string;

// Test service
let testServiceId: string;

// Test company
let testCompanyId: string;

// Helper to generate JWT
const generateToken = (userId: string, role: UserRole = UserRole.USER): string => {
    const JWT_SECRET = process.env.JWT_SECRET || "test-secret"; // Use a default for testing if not set
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
};

// Setup: Create necessary entities before tests run
beforeAll(async () => {
    // Clean up potential leftovers (children before parents)
    await prisma.appointment.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.userBadge.deleteMany({});
    await prisma.professionalService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.professional.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { in: [testUserEmail, testProfEmail] } } });
    await prisma.companyAddress.deleteMany({}); // Added address cleanup
    await prisma.company.deleteMany({ where: { name: "Gamification Test Company" } });
    await prisma.category.deleteMany({}); // Added category cleanup
    await prisma.badge.deleteMany({}); // Added badge cleanup

    // 0. Create Badges (if they don't exist - assuming they might be seeded or created elsewhere)
    await prisma.badge.upsert({ where: { name: "Primeiros Passos" }, update: {}, create: { name: "Primeiros Passos", description: "Completou o cadastro.", iconUrl: "" } });
    await prisma.badge.upsert({ where: { name: "Primeiro Agendamento" }, update: {}, create: { name: "Primeiro Agendamento", description: "Completou o primeiro agendamento.", iconUrl: "" } });
    await prisma.badge.upsert({ where: { name: "Primeira Avaliação" }, update: {}, create: { name: "Primeira Avaliação", description: "Deixou a primeira avaliação.", iconUrl: "" } });

    // 1. Create Category
    let category = await prisma.category.findUnique({ where: { name: "Gamification Test Category" } });
    if (!category) {
        category = await prisma.category.create({ data: { name: "Gamification Test Category" } });
    }

    // 2. Create Company
    const company = await prisma.company.create({
        data: {
            name: "Gamification Test Company",
            description: "Test desc", // Added description
            address: { create: { street: "1 Gamification St", number: "10", neighborhood: "Test", city: "Test City", state: "TS", zipCode: "00000-000" } } // Added address
        }
    });
    testCompanyId = company.id;

    // 3. Create Professional User
    const hashedProfPassword = await bcrypt.hash(testProfPassword, 10);
    const professionalUser = await prisma.user.create({
        data: {
            email: testProfEmail,
            password: hashedProfPassword,
            name: "Gamification Prof",
            role: UserRole.PROFESSIONAL, // Role should be PROFESSIONAL
            points: 0, // Initialize points
            slug: "gamification-prof"
        }
    });
    testProfUserId = professionalUser.id; // Store the User ID

    // Create the Professional profile linked to the user
    const profProfile = await prisma.professional.create({
        data: {
            userId: testProfUserId, // Added userId
            companyId: testCompanyId,
            name: professionalUser.name, // Use user's name or specific professional name
            // bio: "Test Professional Bio", // Assuming bio exists on Professional model
            role: "Tester", // Added role
        }
    });
    testProfId = profProfile.id; // Get the professional profile ID

    profAccessToken = generateToken(professionalUser.id, UserRole.PROFESSIONAL);

    // 4. Create Service
    const service = await prisma.service.create({
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
    const hashedUserPassword = await bcrypt.hash(testUserPassword, 10);
    const user = await prisma.user.create({
        data: {
            email: testUserEmail,
            password: hashedUserPassword,
            name: "Gamification User",
            role: UserRole.USER,
            points: 0, // Initialize points
            slug: "gamification-user"
        }
    });
    testUserId = user.id;
    accessToken = generateToken(testUserId);
});

// Teardown: Clean up created entities after tests
afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { userId: testUserId } });
    await prisma.review.deleteMany({ where: { userId: testUserId } });
    await prisma.userBadge.deleteMany({ where: { userId: { in: [testUserId, testProfUserId] } } });
    await prisma.professionalService.deleteMany({ where: { serviceId: testServiceId } });
    await prisma.service.deleteMany({ where: { id: testServiceId } });
    await prisma.professional.deleteMany({ where: { id: testProfId } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserId, testProfUserId] } } });
    await prisma.companyAddress.deleteMany({}); // Added address cleanup
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
    await prisma.category.deleteMany({}); // Added category cleanup
    await prisma.badge.deleteMany({}); // Added badge cleanup
    await prisma.$disconnect();
});

describe("Gamification System", () => {

    // Test USER_REGISTERED event (implicitly tested by user creation in beforeAll)
    it("should award points/badge for user registration", async () => {
        // Check the user model directly for points/level
        const user = await prisma.user.findUnique({
            where: { id: testUserId },
            include: { badges: { include: { badge: true } } } // Include badges via UserBadge
        });
        expect(user).toBeDefined();
        // Check points based on gamificationService logic (e.g., 10 points for registration)
        expect(user!.points).toBeGreaterThanOrEqual(10); // Assuming 10 points for registration
        // Check if FIRST_STEPS badge was awarded
        const hasFirstStepsBadge = user!.badges.some(ub => ub.badge.name === "Primeiros Passos"); // Check code on the included badge
        expect(hasFirstStepsBadge).toBe(true);
    });

    // Test APPOINTMENT_COMPLETED event
    it("should award points/badge for completing an appointment", async () => {
        // 1. Create an appointment
        const appointmentTime = new Date();
        appointmentTime.setDate(appointmentTime.getDate() + 1); // Book for tomorrow
        appointmentTime.setHours(10, 0, 0, 0);

        const createResponse = await request(app)
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
        const confirmResponse = await request(app)
            .patch(`/api/appointments/${appointmentId}/status`)
            .set("Authorization", `Bearer ${profAccessToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(confirmResponse.status).toBe(200);

        // 3. Complete the appointment (by professional) - This should trigger the event
        await prisma.appointment.update({ 
            where: { id: appointmentId }, 
            data: { date: new Date(Date.now() - 60 * 60 * 1000) } // Set date to 1 hour ago
        });

        const completeResponse = await request(app)
            .patch(`/api/appointments/${appointmentId}/status`)
            .set("Authorization", `Bearer ${profAccessToken}`)
            .send({ status: AppointmentStatus.COMPLETED });
        expect(completeResponse.status).toBe(200);

        // 4. Check user's profile for points/badge
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const user = await prisma.user.findUnique({
            where: { id: testUserId }, // Check the USER's model
            include: { badges: { include: { badge: true } } }
        });
        expect(user).toBeDefined();
        // Check points increased (e.g., by 20 points for completion)
        expect(user!.points).toBeGreaterThanOrEqual(10 + 20); // Registration + Completion
        // Check if FIRST_APPOINTMENT badge was awarded (if applicable)
        const hasFirstAppointmentBadge = user!.badges.some(ub => ub.badge.name === "Primeiro Agendamento"); // Check code on the included badge
        expect(hasFirstAppointmentBadge).toBe(true);
    });

    // Test REVIEW_CREATED event
    it("should award points/badge for creating a review", async () => {
        // 1. Create a review
        const reviewResponse = await request(app)
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
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const user = await prisma.user.findUnique({
            where: { id: testUserId },
            include: { badges: { include: { badge: true } } }
        });
        expect(user).toBeDefined();
        // Check points increased (e.g., by 15 points for review)
        expect(user!.points).toBeGreaterThanOrEqual(10 + 20 + 15); // Registration + Completion + Review
        // Check if FIRST_REVIEW badge was awarded
        const hasFirstReviewBadge = user!.badges.some(ub => ub.badge.name === "Primeira Avaliação"); // Check code on the included badge
        expect(hasFirstReviewBadge).toBe(true);
    });

    // Test GET /api/gamification/profile/me
    it("should get the authenticated user's gamification profile (from User model)", async () => {
        const response = await request(app)
            .get("/api/gamification/profile/me")
            .set("Authorization", `Bearer ${accessToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id", testUserId); // Should return User ID
        expect(response.body).toHaveProperty("points");
        expect(response.body).toHaveProperty("badges");
        expect(response.body).toHaveProperty("name", "Gamification User");
        // Check if badges array contains expected badges
        expect(Array.isArray(response.body.badges)).toBe(true);
        const badgeNames = response.body.badges.map((b: any) => b.badge.name); // Check name on the included badge
        expect(badgeNames).toContain("Primeiros Passos");
        expect(badgeNames).toContain("Primeiro Agendamento");
        expect(badgeNames).toContain("Primeira Avaliação");
    });

    // Test GET /api/gamification/profile/:userId (as non-admin - should fail)
    it("should fail to get another user's gamification profile as non-admin", async () => {
        // Create another user temporarily
        const otherUser = await prisma.user.create({ data: { email: `other-${Date.now()}@gam.com`, password: "test", name: "Other", points: 0, slug: `other-user-${Date.now()}` } });
        const otherAccessToken = generateToken(otherUser.id);

        const response = await request(app)
            .get(`/api/gamification/profile/${testUserId}`) // Try to get testUser's profile
            .set("Authorization", `Bearer ${otherAccessToken}`); // Using other user's token
        
        expect(response.status).toBe(403); // Forbidden

        // Clean up other user
        await prisma.user.delete({ where: { id: otherUser.id } });
    });

    // Test GET /api/gamification/leaderboard
    it("should get the gamification leaderboard (from User model)", async () => {
        const response = await request(app)
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
    });

});

