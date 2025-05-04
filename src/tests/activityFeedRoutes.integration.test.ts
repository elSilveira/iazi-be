import request from "supertest";
import { app } from "../app"; // Assuming your Express app instance is exported from app.ts
import { prisma } from "../utils/prismaClient";
import { User, Service, Professional, Company, Appointment, Review, ActivityLog } from "@prisma/client";
import { generateToken } from "../utils/jwt"; // Assuming you have a JWT utility
import bcrypt from "bcrypt";
import { Decimal } from "@prisma/client/runtime/library";

// --- Test Setup ---
let token: string;
let user: User;
let company: Company;
let service: Service;
let professional: Professional;

// Helper to create a user and generate a token
const setupUserAndToken = async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    user = await prisma.user.create({
        data: {
            email: `testuser-feed-${Date.now()}@example.com`,
            name: "Test User Feed",
            password: hashedPassword,
            role: "USER",
        },
    });
    token = generateToken({ id: user.id, role: user.role });
};

// Helper to create necessary entities (Company, Service, Professional)
const setupEntities = async () => {
    company = await prisma.company.create({
        data: {
            name: "Test Company Feed",
            description: "Company for feed testing",
        },
    });

    // Ensure a category exists (create if not)
    let category = await prisma.category.findUnique({ where: { name: "Test Category Feed" } });
    if (!category) {
        category = await prisma.category.create({ data: { name: "Test Category Feed" } });
    }

    service = await prisma.service.create({
        data: {
            name: "Test Service Feed",
            description: "Service for feed testing",
            price: new Decimal("50.00"),
            duration: "60min",
            companyId: company.id,
            categoryId: category.id,
        },
    });

    professional = await prisma.professional.create({
        data: {
            name: "Test Prof Feed",
            role: "Tester",
            companyId: company.id,
        },
    });

    // Link professional to service
    await prisma.professionalService.create({
        data: {
            professionalId: professional.id,
            serviceId: service.id,
        },
    });
};

// Clean up database after tests
const cleanupDatabase = async () => {
    // Delete in reverse order of creation or use cascade deletes if configured
    await prisma.activityLog.deleteMany({ where: { userId: user?.id } });
    await prisma.review.deleteMany({ where: { userId: user?.id } });
    await prisma.appointment.deleteMany({ where: { userId: user?.id } });
    await prisma.professionalService.deleteMany({ where: { professionalId: professional?.id } });
    await prisma.service.deleteMany({ where: { companyId: company?.id } });
    await prisma.professional.deleteMany({ where: { companyId: company?.id } });
    await prisma.company.deleteMany({ where: { id: company?.id } });
    await prisma.user.deleteMany({ where: { id: user?.id } });
    // Delete category if it was created specifically for this test
    await prisma.category.deleteMany({ where: { name: "Test Category Feed" } });
};

// --- Test Suite ---
describe("Activity Feed API (/api/users/me/feed)", () => {
    beforeAll(async () => {
        // Setup user, token, and entities before all tests in this suite
        await setupUserAndToken();
        await setupEntities();
        // Clear any pre-existing logs for the user
        await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    });

    afterAll(async () => {
        // Clean up database after all tests in this suite
        await cleanupDatabase();
        await prisma.$disconnect();
    });

    // --- Test Cases ---

    it("should log NEW_APPOINTMENT activity when an appointment is created", async () => {
        const appointmentDate = new Date();
        appointmentDate.setHours(appointmentDate.getHours() + 3); // Book 3 hours in advance

        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${token}`)
            .send({
                date: appointmentDate.toISOString(),
                serviceId: service.id,
                professionalId: professional.id,
            });

        expect(response.status).toBe(201);
        const appointmentId = response.body.id;

        // Verify activity log exists
        const log = await prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                type: "NEW_APPOINTMENT",
                relatedEntityId: appointmentId,
            },
        });
        expect(log).not.toBeNull();
        expect(log?.message).toContain("Você agendou");
        expect(log?.message).toContain(service.name);
    });

    it("should log APPOINTMENT_CANCELLED activity when an appointment is cancelled", async () => {
        // First, create an appointment to cancel
        const appointmentDate = new Date();
        appointmentDate.setHours(appointmentDate.getHours() + 4); // Book 4 hours in advance
        const createRes = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${token}`)
            .send({
                date: appointmentDate.toISOString(),
                serviceId: service.id,
                professionalId: professional.id,
            });
        expect(createRes.status).toBe(201);
        const appointmentId = createRes.body.id;

        // Now, cancel the appointment
        const cancelRes = await request(app)
            .patch(`/api/appointments/${appointmentId}/cancel`)
            .set("Authorization", `Bearer ${token}`)
            .send();

        expect(cancelRes.status).toBe(200);

        // Verify activity log exists
        const log = await prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                type: "APPOINTMENT_CANCELLED",
                relatedEntityId: appointmentId,
            },
            orderBy: { createdAt: 'desc' } // Get the latest log for this appointment
        });
        expect(log).not.toBeNull();
        expect(log?.message).toContain("foi cancelado");
        expect(log?.message).toContain(service.name);
    });

    it("should log NEW_REVIEW activity when a review is created", async () => {
        const reviewData = {
            rating: 5,
            comment: "Excellent service!",
            serviceId: service.id, // Reviewing the service
        };

        const response = await request(app)
            .post("/api/reviews")
            .set("Authorization", `Bearer ${token}`)
            .send(reviewData);

        expect(response.status).toBe(201);
        const reviewId = response.body.id;

        // Verify activity log exists
        const log = await prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                type: "NEW_REVIEW",
                relatedEntityId: reviewId,
            },
        });
        expect(log).not.toBeNull();
        expect(log?.message).toContain("Você avaliou");
        expect(log?.message).toContain(`serviço ${service.name}`);
        expect(log?.message).toContain(`${reviewData.rating} estrela(s)`);
    });

    it("should return the user's activity feed with pagination", async () => {
        // Ensure there are at least 3 logs from previous tests
        const logsCount = await prisma.activityLog.count({ where: { userId: user.id } });
        expect(logsCount).toBeGreaterThanOrEqual(3);

        // Test fetching the first page
        const responsePage1 = await request(app)
            .get("/api/users/me/feed?page=1&pageSize=2")
            .set("Authorization", `Bearer ${token}`);

        expect(responsePage1.status).toBe(200);
        expect(responsePage1.body.data).toBeInstanceOf(Array);
        expect(responsePage1.body.data.length).toBe(2);
        expect(responsePage1.body.pagination.page).toBe(1);
        expect(responsePage1.body.pagination.pageSize).toBe(2);
        expect(responsePage1.body.pagination.totalItems).toBe(logsCount);
        expect(responsePage1.body.pagination.totalPages).toBe(Math.ceil(logsCount / 2));

        // Verify logs are ordered by createdAt descending (most recent first)
        const firstLogDate = new Date(responsePage1.body.data[0].createdAt);
        const secondLogDate = new Date(responsePage1.body.data[1].createdAt);
        expect(firstLogDate.getTime()).toBeGreaterThanOrEqual(secondLogDate.getTime());

        // Test fetching the second page
        const responsePage2 = await request(app)
            .get("/api/users/me/feed?page=2&pageSize=2")
            .set("Authorization", `Bearer ${token}`);
        
        expect(responsePage2.status).toBe(200);
        expect(responsePage2.body.data).toBeInstanceOf(Array);
        // Check if the number of items matches expected for the second page
        expect(responsePage2.body.data.length).toBe(logsCount - 2); // Assuming logsCount is 3
        expect(responsePage2.body.pagination.page).toBe(2);

        // Verify the log on page 2 is older than the last log on page 1
        const thirdLogDate = new Date(responsePage2.body.data[0].createdAt);
        expect(secondLogDate.getTime()).toBeGreaterThanOrEqual(thirdLogDate.getTime());
    });

    it("should return 401 if no token is provided", async () => {
        const response = await request(app).get("/api/users/me/feed");
        expect(response.status).toBe(401);
    });

    it("should return 400 if pagination parameters are invalid", async () => {
        const response = await request(app)
            .get("/api/users/me/feed?page=0&pageSize=-5") // Invalid page and pageSize
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("Parâmetros de paginação inválidos");
    });

});

