import request from "supertest";
import { app } from "../app";
import { prisma } from "../utils/prismaClient";
import { User, Service, Professional, Company, Appointment, Notification, AppointmentStatus } from "@prisma/client";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { Decimal } from "@prisma/client/runtime/library";

// --- Test Setup ---
let token: string;
let user: User;
let company: Company;
let service: Service;
let professional: Professional;
let appointment: Appointment;
let professionalToken: string; // Token for the professional user
let professionalUser: User; // User account for the professional

// Helper to create a user and generate a token
const setupUserAndToken = async (role: "USER" | "ADMIN" = "USER", emailSuffix: string) => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
        data: {
            email: `testuser-notif-${emailSuffix}-${Date.now()}@example.com`,
            name: `Test User Notif ${emailSuffix}`,
            password: hashedPassword,
            role: role,
        },
    });
    const token = generateToken({ id: user.id, role: user.role });
    return { user, token };
};

// Helper to create necessary entities (Company, Service, Professional)
const setupEntities = async () => {
    company = await prisma.company.create({
        data: {
            name: "Test Company Notif",
            description: "Company for notification testing",
        },
    });

    let category = await prisma.category.findUnique({ where: { name: "Test Category Notif" } });
    if (!category) {
        category = await prisma.category.create({ data: { name: "Test Category Notif" } });
    }

    service = await prisma.service.create({
        data: {
            name: "Test Service Notif",
            description: "Service for notification testing",
            price: new Decimal("60.00"),
            duration: "45min",
            companyId: company.id,
            categoryId: category.id,
        },
    });

    // Create a user account for the professional
    const profUserData = await setupUserAndToken("USER", "prof");
    professionalUser = profUserData.user;
    professionalToken = profUserData.token;

    professional = await prisma.professional.create({
        data: {
            // Link professional profile to its user account ID
            id: professionalUser.id, // Use the user ID as the professional ID
            name: "Test Prof Notif",
            role: "Notifier",
            companyId: company.id,
        },
    });

    await prisma.professionalService.create({
        data: {
            professionalId: professional.id,
            serviceId: service.id,
        },
    });
};

// Helper to create an appointment
const createTestAppointment = async (userId: string, professionalId: string, serviceId: string, status: AppointmentStatus = AppointmentStatus.PENDING) => {
    const appointmentDate = new Date();
    appointmentDate.setHours(appointmentDate.getHours() + 5); // Book 5 hours in advance
    return await prisma.appointment.create({
        data: {
            date: appointmentDate,
            userId: userId,
            professionalId: professionalId,
            serviceId: serviceId,
            status: status,
        },
    });
};

// Clean up database after tests
const cleanupDatabase = async () => {
    await prisma.notification.deleteMany({ where: { userId: user?.id } });
    await prisma.appointment.deleteMany({ where: { userId: user?.id } });
    await prisma.professionalService.deleteMany({ where: { professionalId: professional?.id } });
    await prisma.service.deleteMany({ where: { companyId: company?.id } });
    await prisma.professional.deleteMany({ where: { companyId: company?.id } });
    await prisma.company.deleteMany({ where: { id: company?.id } });
    await prisma.user.deleteMany({ where: { id: user?.id } });
    await prisma.user.deleteMany({ where: { id: professionalUser?.id } }); // Delete professional user
    await prisma.category.deleteMany({ where: { name: "Test Category Notif" } });
};

// --- Test Suite ---
describe("Notification API (/api/notifications)", () => {
    beforeAll(async () => {
        const userData = await setupUserAndToken("USER", "main");
        user = userData.user;
        token = userData.token;
        await setupEntities();
        // Clear any pre-existing notifications for the user
        await prisma.notification.deleteMany({ where: { userId: user.id } });
    });

    afterAll(async () => {
        await cleanupDatabase();
        await prisma.$disconnect();
    });

    let notification1: Notification;
    let notification2: Notification;
    let appointmentToConfirm: Appointment;
    let appointmentToCancel: Appointment;

    it("should create APPOINTMENT_CONFIRMED notification when professional confirms", async () => {
        // 1. Create a PENDING appointment by the user
        appointmentToConfirm = await createTestAppointment(user.id, professional.id, service.id, AppointmentStatus.PENDING);

        // 2. Professional confirms the appointment
        const response = await request(app)
            .patch(`/api/appointments/${appointmentToConfirm.id}/status`)
            .set("Authorization", `Bearer ${professionalToken}`) // Use professional's token
            .send({ status: AppointmentStatus.CONFIRMED });

        expect(response.status).toBe(200);

        // 3. Verify notification exists for the USER
        notification1 = await prisma.notification.findFirst({
            where: {
                userId: user.id,
                type: "APPOINTMENT_CONFIRMED",
                relatedEntityId: appointmentToConfirm.id,
            },
        });
        expect(notification1).not.toBeNull();
        expect(notification1?.message).toContain("foi confirmado");
        expect(notification1?.isRead).toBe(false);
    });

    it("should create APPOINTMENT_CANCELLED notification when user cancels", async () => {
        // 1. Create another PENDING appointment
        appointmentToCancel = await createTestAppointment(user.id, professional.id, service.id, AppointmentStatus.PENDING);

        // 2. User cancels the appointment
        const response = await request(app)
            .patch(`/api/appointments/${appointmentToCancel.id}/cancel`)
            .set("Authorization", `Bearer ${token}`) // Use user's token
            .send();

        expect(response.status).toBe(200);

        // 3. Verify notification exists for the USER
        notification2 = await prisma.notification.findFirst({
            where: {
                userId: user.id,
                type: "APPOINTMENT_CANCELLED",
                relatedEntityId: appointmentToCancel.id,
            },
        });
        expect(notification2).not.toBeNull();
        expect(notification2?.message).toContain("foi cancelado");
        expect(notification2?.isRead).toBe(false);
    });

    it("should return 401 when getting notifications without a token", async () => {
        const response = await request(app).get("/api/notifications");
        expect(response.status).toBe(401);
    });

    it("should get unread notifications for the user with pagination", async () => {
        // We expect 2 unread notifications from previous tests
        const response = await request(app)
            .get("/api/notifications?page=1&pageSize=5")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBe(2);
        expect(response.body.pagination.totalItems).toBe(2);
        expect(response.body.pagination.totalPages).toBe(1);
        expect(response.body.data[0].id).toBe(notification2.id); // Most recent (cancelled)
        expect(response.body.data[1].id).toBe(notification1.id); // Older (confirmed)
        expect(response.body.data[0].isRead).toBe(false);
        expect(response.body.data[1].isRead).toBe(false);
    });

    it("should return 400 when getting notifications with invalid pagination params", async () => {
        const response = await request(app)
            .get("/api/notifications?page=0&pageSize=-1")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(400);
    });

    it("should return 401 when marking as read without a token", async () => {
        const response = await request(app).patch(`/api/notifications/${notification1.id}/read`);
        expect(response.status).toBe(401);
    });

    it("should return 400 when marking as read with invalid ID format", async () => {
        const response = await request(app)
            .patch("/api/notifications/invalid-uuid/read")
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(400);
    });

    it("should mark a specific notification as read", async () => {
        const response = await request(app)
            .patch(`/api/notifications/${notification1.id}/read`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(notification1.id);
        expect(response.body.isRead).toBe(true);

        // Verify in DB
        const updatedNotif = await prisma.notification.findUnique({ where: { id: notification1.id } });
        expect(updatedNotif?.isRead).toBe(true);
    });

    it("should return 404 when trying to mark a non-existent notification as read", async () => {
        const nonExistentId = "f47ac10b-58cc-4372-a567-0e02b2c3d479"; // Random valid UUID
        const response = await request(app)
            .patch(`/api/notifications/${nonExistentId}/read`)
            .set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(404);
    });

    it("should return 403 when trying to mark another user's notification as read", async () => {
        // Create a notification for the professional user
        const profNotification = await prisma.notification.create({
            data: {
                userId: professionalUser.id,
                type: "TEST_PROF_NOTIF",
                message: "Test notification for professional",
            }
        });

        // Try to mark it as read using the main user's token
        const response = await request(app)
            .patch(`/api/notifications/${profNotification.id}/read`)
            .set("Authorization", `Bearer ${token}`); // Main user's token
        expect(response.status).toBe(403);

        // Cleanup the professional's notification
        await prisma.notification.delete({ where: { id: profNotification.id } });
    });

    it("should get only the remaining unread notification", async () => {
        const response = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.pagination.totalItems).toBe(1);
        expect(response.body.data[0].id).toBe(notification2.id);
        expect(response.body.data[0].isRead).toBe(false);
    });

    it("should return 401 when marking all as read without a token", async () => {
        const response = await request(app).patch("/api/notifications/read-all");
        expect(response.status).toBe(401);
    });

    it("should mark all remaining unread notifications as read", async () => {
        const response = await request(app)
            .patch("/api/notifications/read-all")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(1); // Only notification2 was unread

        // Verify in DB
        const remainingNotifs = await prisma.notification.findMany({ where: { userId: user.id, isRead: false } });
        expect(remainingNotifs.length).toBe(0);

        const notif2AfterUpdate = await prisma.notification.findUnique({ where: { id: notification2.id } });
        expect(notif2AfterUpdate?.isRead).toBe(true);
    });

    it("should return count 0 when marking all as read if none are unread", async () => {
        const response = await request(app)
            .patch("/api/notifications/read-all")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(0);
    });

});

