import request from "supertest";
import { app } from "../index"; // Corrected import path
import { prisma } from "../utils/prismaClient";
import { User, Service, Professional, Company, Appointment, Review, ActivityLog, UserRole } from "@prisma/client"; // Added UserRole
import jwt from "jsonwebtoken"; // Import jwt directly
import bcrypt from "bcrypt";
import { Decimal } from "@prisma/client/runtime/library";

// --- Test Setup ---
let token: string;
let user: User;
let company: Company;
let service: Service;
let professional: Professional;

// Helper to generate JWT token (using jwt.sign directly)
const generateToken = (payload: { id: string; role: UserRole }): string => {
    const secret = process.env.JWT_SECRET || "test-secret-feed"; // Use env var or a default for testing
    return jwt.sign(payload, secret, { expiresIn: "1h" });
};

// Helper to create a user and generate a token
const setupUserAndToken = async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    user = await prisma.user.upsert({
        where: { email: `testuser-feed@example.com` },
        update: {},
        create: {
            email: `testuser-feed@example.com`,
            name: "Test User Feed",
            password: hashedPassword,
            role: UserRole.USER, // Use enum
        },
    });
    token = generateToken({ id: user.id, role: user.role });
};

// Helper to create necessary entities (Company, Service, Professional)
const setupEntities = async () => {
    // Use findFirst + create pattern for Company
    let foundCompany = await prisma.company.findFirst({ where: { name: "Test Company Feed" } });
    if (!foundCompany) {
        foundCompany = await prisma.company.create({
            data: {
                name: "Test Company Feed",
                description: "Company for feed testing",
            },
        });
    }
    company = foundCompany;

    // Ensure a category exists (create if not)
    let category = await prisma.category.upsert({ 
        where: { name: "Test Category Feed" },
        update: {},
        create: { name: "Test Category Feed" } 
    });

    service = await prisma.service.upsert({
        where: { name_companyId: { name: "Test Service Feed", companyId: company.id } }, // Use unique constraint
        update: {},
        create: {
            name: "Test Service Feed",
            description: "Service for feed testing",
            price: new Decimal("50.00"),
            duration: "60min",
            companyId: company.id,
            categoryId: category.id,
        },
    });

    // Use findFirst + create pattern for Professional to avoid potential unique constraint issues
    let foundProfessional = await prisma.professional.findFirst({ where: { name: "Test Prof Feed", companyId: company.id } });
    if (!foundProfessional) {
        foundProfessional = await prisma.professional.create({
            data: {
                name: "Test Prof Feed",
                role: "Tester",
                companyId: company.id,
                userId: user.id, // Added userId, assuming the professional is linked to the test user
            },
        });
    }
    professional = foundProfessional;

    // Link professional to service
    await prisma.professionalService.upsert({
        where: { professionalId_serviceId: { professionalId: professional.id, serviceId: service.id } },
        update: {},
        create: {
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
    if (professional && service) {
        await prisma.professionalService.deleteMany({ where: { professionalId: professional.id, serviceId: service.id } });
    }
    if (service) {
        await prisma.service.deleteMany({ where: { id: service.id } });
    }
    if (professional) {
        await prisma.professional.deleteMany({ where: { id: professional.id } });
    }
    if (company) {
        await prisma.company.deleteMany({ where: { id: company.id } });
    }
    if (user) {
        await prisma.user.deleteMany({ where: { id: user.id } });
    }
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
    let createdAppointmentId: string | null = null;
    let createdReviewId: string | null = null;

    afterEach(async () => {
        // Clean up entities created within tests
        if (createdAppointmentId) {
            await prisma.appointment.deleteMany({ where: { id: createdAppointmentId } });
            await prisma.activityLog.deleteMany({ where: { referenceId: createdAppointmentId } });
            createdAppointmentId = null;
        }
        if (createdReviewId) {
            await prisma.review.deleteMany({ where: { id: createdReviewId } });
            await prisma.activityLog.deleteMany({ where: { referenceId: createdReviewId } });
            createdReviewId = null;
        }
    });

    it("should log NEW_APPOINTMENT activity when an appointment is created", async () => {
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 2); // Book 2 days in advance
        appointmentDate.setHours(14, 0, 0, 0); // Set to 14:00

        const response = await request(app)
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
        const log = await prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                activityType: "NEW_APPOINTMENT",
                referenceId: createdAppointmentId,
            },
        });
        expect(log).not.toBeNull();
        // Ensure details is an object before accessing message
        const details = typeof log?.details === 'object' && log?.details !== null ? log.details as { message?: string } : {};
        expect(details.message).toContain("Você agendou");
        expect(details.message).toContain(service.name);
    });

    // This test depends on a PATCH /cancel endpoint which might not exist
    // Assuming PATCH /api/appointments/:id/status with { status: CANCELLED } is used
    it("should log APPOINTMENT_CANCELLED activity when an appointment is cancelled", async () => {
        // First, create an appointment to cancel
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 3); // Book 3 days in advance
        appointmentDate.setHours(15, 0, 0, 0); // Set to 15:00
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
        createdAppointmentId = appointmentId; // Mark for cleanup

        // Now, cancel the appointment using the status endpoint
        const cancelRes = await request(app)
            .patch(`/api/appointments/${appointmentId}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "CANCELLED" });

        expect(cancelRes.status).toBe(200);

        // Verify activity log exists
        const log = await prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                activityType: "APPOINTMENT_CANCELLED",
                referenceId: appointmentId,
            },
            orderBy: { createdAt: 'desc' } // Get the latest log for this appointment
        });
        expect(log).not.toBeNull();
        const detailsCancel = typeof log?.details === 'object' && log?.details !== null ? log.details as { message?: string } : {};
        expect(detailsCancel.message).toContain("foi cancelado");
        expect(detailsCancel.message).toContain(service.name);
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
        createdReviewId = response.body.id;

        // Verify activity log exists
        const log = await prisma.activityLog.findFirst({
            where: {
                userId: user.id,
                activityType: "NEW_REVIEW",
                referenceId: createdReviewId,
            },
        });
        expect(log).not.toBeNull();
        const detailsReview = typeof log?.details === 'object' && log?.details !== null ? log.details as { message?: string } : {};
        expect(detailsReview.message).toContain("Você avaliou");
        expect(detailsReview.message).toContain(`serviço ${service.name}`);
        expect(detailsReview.message).toContain(`${reviewData.rating} estrela(s)`);
    });

    it("should return the user's activity feed with pagination", async () => {
        // Ensure there are at least 3 logs from previous tests
        const logsCount = await prisma.activityLog.count({ where: { userId: user.id } });
        // Depending on test order, might be 2 or 3. Let's check >= 2
        expect(logsCount).toBeGreaterThanOrEqual(2);

        // Test fetching the first page
        const responsePage1 = await request(app)
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
            const responsePage2 = await request(app)
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
        // The actual error message might vary based on validation middleware
        expect(response.body.message).toMatch(/inválid(o|a)s?/i); // More flexible check
    });

});

