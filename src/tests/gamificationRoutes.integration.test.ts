import request from "supertest";
import { app } from "../app"; // Assuming your Express app instance is exported from app.ts
import { prisma } from "../utils/prismaClient";
import { AppointmentStatus, BadgeCode, UserRole } from "@prisma/client";
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
let testProfId: string;
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
    // Clean up potential leftovers
    await prisma.user.deleteMany({ where: { email: { in: [testUserEmail, testProfEmail] } } });
    await prisma.company.deleteMany({ where: { name: "Gamification Test Company" } });
    await prisma.service.deleteMany({ where: { name: "Gamification Test Service" } });

    // 1. Create Company
    const company = await prisma.company.create({
        data: {
            name: "Gamification Test Company",
            cnpj: "00000000000191",
            email: "gamification-company@example.com",
            phone: "11999999999",
            address: "Test Address",
            city: "Test City",
            state: "TS",
            zipCode: "00000-000",
            workingHours: { "1": { "start": "09:00", "end": "18:00" } } // Example working hours
        }
    });
    testCompanyId = company.id;

    // 2. Create Professional User
    const hashedProfPassword = await bcrypt.hash(testProfPassword, 10);
    const professionalUser = await prisma.user.create({
        data: {
            email: testProfEmail,
            password: hashedProfPassword,
            name: "Gamification Prof",
            role: UserRole.PROFESSIONAL,
            professionalData: {
                create: {
                    companyId: testCompanyId,
                    bio: "Test Professional Bio",
                    specialty: "Testing",
                    workingHours: { "1": { "start": "09:00", "end": "18:00" } }
                }
            }
        },
        include: { professionalData: true }
    });
    testProfId = professionalUser.professionalData!.id; // Get the professional profile ID
    profAccessToken = generateToken(professionalUser.id, UserRole.PROFESSIONAL);

    // 3. Create Service
    const service = await prisma.service.create({
        data: {
            name: "Gamification Test Service",
            description: "Service for gamification tests",
            price: 50.00,
            duration: "60min",
            companyId: testCompanyId,
            // Link service to professional
            professionals: {
                create: {
                    professionalId: testProfId
                }
            }
        }
    });
    testServiceId = service.id;

    // 4. Create Regular User (for testing registration event)
    const hashedUserPassword = await bcrypt.hash(testUserPassword, 10);
    const user = await prisma.user.create({
        data: {
            email: testUserEmail,
            password: hashedUserPassword,
            name: "Gamification User",
            role: UserRole.USER
        }
    });
    testUserId = user.id;
    accessToken = generateToken(testUserId);

    // Ensure gamification profile exists for the test user (might be created by trigger)
    await prisma.gamificationProfile.upsert({
        where: { userId: testUserId },
        update: { points: 0 }, // Reset points
        create: { userId: testUserId, points: 0, level: 1 }
    });
     // Ensure gamification profile exists for the professional user
    await prisma.gamificationProfile.upsert({
        where: { userId: testProfId }, // Use professional's USER id
        update: { points: 0 },
        create: { userId: testProfId, points: 0, level: 1 }
    });
});

// Teardown: Clean up created entities after tests
afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { userId: testUserId } });
    await prisma.review.deleteMany({ where: { userId: testUserId } });
    await prisma.userBadge.deleteMany({ where: { userId: { in: [testUserId, testProfId] } } });
    await prisma.gamificationProfile.deleteMany({ where: { userId: { in: [testUserId, testProfId] } } });
    await prisma.professionalService.deleteMany({ where: { serviceId: testServiceId } });
    await prisma.service.deleteMany({ where: { id: testServiceId } });
    await prisma.professional.deleteMany({ where: { id: testProfId } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserId, testProfId] } } });
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
    await prisma.$disconnect();
});

describe("Gamification System", () => {

    // Test USER_REGISTERED event (implicitly tested by user creation in beforeAll)
    it("should award points/badge for user registration", async () => {
        // Check if the profile was created/updated by the trigger
        const profile = await prisma.gamificationProfile.findUnique({
            where: { userId: testUserId },
            include: { badges: { include: { badge: true } } }
        });
        expect(profile).toBeDefined();
        // Check points based on gamificationService logic (e.g., 10 points for registration)
        expect(profile!.points).toBeGreaterThanOrEqual(10); // Assuming 10 points for registration
        // Check if FIRST_STEPS badge was awarded
        const hasFirstStepsBadge = profile!.badges.some(ub => ub.badge.code === BadgeCode.FIRST_STEPS);
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
        // Need to ensure the appointment date is in the past relative to the check, or mock time.
        // For simplicity, we'll assume the check allows completion slightly early or mock time.
        // Or, update the appointment date to the past before completing.
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
        // Allow some time for the async event processing
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const profile = await prisma.gamificationProfile.findUnique({
            where: { userId: testUserId }, // Check the USER's profile
            include: { badges: { include: { badge: true } } }
        });
        expect(profile).toBeDefined();
        // Check points increased (e.g., by 20 points for completion)
        expect(profile!.points).toBeGreaterThanOrEqual(10 + 20); // Registration + Completion
        // Check if FIRST_APPOINTMENT badge was awarded (if applicable)
        const hasFirstAppointmentBadge = profile!.badges.some(ub => ub.badge.code === BadgeCode.FIRST_APPOINTMENT);
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
        // Allow some time for the async event processing
        await new Promise(resolve => setTimeout(resolve, 500)); 

        const profile = await prisma.gamificationProfile.findUnique({
            where: { userId: testUserId },
            include: { badges: { include: { badge: true } } }
        });
        expect(profile).toBeDefined();
        // Check points increased (e.g., by 15 points for review)
        expect(profile!.points).toBeGreaterThanOrEqual(10 + 20 + 15); // Registration + Completion + Review
        // Check if FIRST_REVIEW badge was awarded
        const hasFirstReviewBadge = profile!.badges.some(ub => ub.badge.code === BadgeCode.FIRST_REVIEW);
        expect(hasFirstReviewBadge).toBe(true);
    });

    // Test GET /api/gamification/profile/me
    it("should get the authenticated user's gamification profile", async () => {
        const response = await request(app)
            .get("/api/gamification/profile/me")
            .set("Authorization", `Bearer ${accessToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("userId", testUserId);
        expect(response.body).toHaveProperty("points");
        expect(response.body).toHaveProperty("level");
        expect(response.body).toHaveProperty("badges");
        expect(response.body.user).toHaveProperty("id", testUserId);
        expect(response.body.user).toHaveProperty("name", "Gamification User");
        // Check if badges array contains expected badges
        expect(Array.isArray(response.body.badges)).toBe(true);
        const badgeCodes = response.body.badges.map((b: any) => b.badge.code);
        expect(badgeCodes).toContain(BadgeCode.FIRST_STEPS);
        expect(badgeCodes).toContain(BadgeCode.FIRST_APPOINTMENT);
        expect(badgeCodes).toContain(BadgeCode.FIRST_REVIEW);
    });

    // Test GET /api/gamification/profile/:userId (as admin - assuming admin role exists)
    // it("should get another user's gamification profile as admin", async () => { ... });
    // Test GET /api/gamification/profile/:userId (as non-admin - should fail)
    it("should fail to get another user's gamification profile as non-admin", async () => {
        // Create another user temporarily
        const otherUser = await prisma.user.create({ data: { email: "other@gam.com", password: "test", name: "Other" } });
        const otherAccessToken = generateToken(otherUser.id);

        const response = await request(app)
            .get(`/api/gamification/profile/${testUserId}`) // Try to get testUser's profile
            .set("Authorization", `Bearer ${otherAccessToken}`); // Using other user's token
        
        expect(response.status).toBe(403); // Forbidden

        // Clean up other user
        await prisma.user.delete({ where: { id: otherUser.id } });
    });

    // Test GET /api/gamification/leaderboard
    it("should get the gamification leaderboard", async () => {
        const response = await request(app)
            .get("/api/gamification/leaderboard?limit=5")
            .set("Authorization", `Bearer ${accessToken}`); // Auth might be needed depending on implementation
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1); // At least our test user should be there
        expect(response.body.length).toBeLessThanOrEqual(5);
        // Check if the first user is the one with the most points (our test user)
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("userId", testUserId);
            expect(response.body[0]).toHaveProperty("points");
            expect(response.body[0].user).toHaveProperty("name", "Gamification User");
            // Check if sorted by points descending
            if (response.body.length > 1) {
                expect(response.body[0].points).toBeGreaterThanOrEqual(response.body[1].points);
            }
        }
    });

    // Test badge awarding logic (e.g., multiple appointments -> higher badge?)
    // Add more tests for specific badge conditions if needed.

});

