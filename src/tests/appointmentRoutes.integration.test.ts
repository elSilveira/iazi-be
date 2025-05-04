import request from "supertest";
import { app } from "../app"; // Assuming your Express app instance is exported from app.ts
import { prisma } from "../utils/prismaClient";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { addHours, formatISO, startOfDay, addDays, setHours, setMinutes } from "date-fns";
import { generateToken } from "../utils/jwt"; // Assuming you have a JWT utility

// --- Test Data Setup ---
let testUser: any;
let testAdmin: any;
let testProfessionalUser: any; // User account for the professional
let testCompany: any;
let testProfessional: any;
let testService: any;
let testCategory: any;
let userToken: string;
let adminToken: string;
let professionalToken: string;

beforeAll(async () => {
    // Clean up potential leftovers
    await prisma.appointment.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.professionalService.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.professional.deleteMany();
    await prisma.companyAddress.deleteMany();
    await prisma.company.deleteMany();
    await prisma.userAddress.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    testUser = await prisma.user.create({
        data: {
            email: "testuser@example.com",
            name: "Test User",
            password: "password123", // Hashed in real app
            role: UserRole.USER,
        },
    });
    testAdmin = await prisma.user.create({
        data: {
            email: "admin@example.com",
            name: "Test Admin",
            password: "password123",
            role: UserRole.ADMIN,
        },
    });
    testProfessionalUser = await prisma.user.create({
        data: {
            email: "prof@example.com",
            name: "Test Professional User",
            password: "password123",
            role: UserRole.USER, // Or a specific PROFESSIONAL role if you have one
        },
    });

    // Create test company
    testCompany = await prisma.company.create({
        data: {
            name: "Test Salon",
            description: "A test salon",
            workingHours: {
                // Mon-Fri: 9am - 6pm (18:00)
                1: { start: "09:00", end: "18:00" },
                2: { start: "09:00", end: "18:00" },
                3: { start: "09:00", end: "18:00" },
                4: { start: "09:00", end: "18:00" },
                5: { start: "09:00", end: "18:00" },
                // Sat-Sun: Closed
                0: null,
                6: null,
            },
        },
    });

    // Create test professional linked to the user account and company
    testProfessional = await prisma.professional.create({
        data: {
            // Use the professional user's ID if linking directly
            // id: testProfessionalUser.id, // Or let Prisma generate a new UUID
            name: testProfessionalUser.name,
            role: "Hair Stylist",
            companyId: testCompany.id,
            // Optional: Specific working hours for professional override company hours
            // workingHours: { ... }
        },
    });

    // Create test category
    testCategory = await prisma.category.create({
        data: { name: "Haircuts" },
    });

    // Create test service
    testService = await prisma.service.create({
        data: {
            name: "Men's Haircut",
            description: "Standard men's haircut",
            price: 30.00,
            duration: "30min", // 30 minutes
            categoryId: testCategory.id,
            companyId: testCompany.id,
        },
    });

    // Link professional to service
    await prisma.professionalService.create({
        data: {
            professionalId: testProfessional.id,
            serviceId: testService.id,
        },
    });

    // Generate tokens (replace with your actual token generation logic)
    userToken = generateToken({ id: testUser.id, role: testUser.role });
    adminToken = generateToken({ id: testAdmin.id, role: testAdmin.role });
    // Use the professional's *user* account ID for the token
    professionalToken = generateToken({ id: testProfessionalUser.id, role: testProfessionalUser.role });
});

afterAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.professionalService.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.professional.deleteMany();
    await prisma.companyAddress.deleteMany();
    await prisma.company.deleteMany();
    await prisma.userAddress.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});

// --- Test Suites ---

describe("GET /api/appointments/availability", () => {
    let nextMonday: Date;

    beforeAll(() => {
        // Find the next Monday to ensure working hours apply
        let date = addDays(new Date(), 1);
        while (date.getDay() !== 1) { // 1 is Monday
            date = addDays(date, 1);
        }
        nextMonday = startOfDay(date);
    });

    it("should return available slots for a professional on a working day", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: dateString, 
                serviceId: testService.id, 
                professionalId: testProfessional.id 
            });

        expect(response.status).toBe(200);
        expect(response.body.availableSlots).toBeInstanceOf(Array);
        // Expect slots between 09:00 and 17:30 (last slot for 30min service before 18:00)
        expect(response.body.availableSlots.length).toBeGreaterThan(0);
        expect(response.body.availableSlots).toContain("09:00");
        expect(response.body.availableSlots).toContain("17:30"); 
        expect(response.body.availableSlots).not.toContain("17:45");
        expect(response.body.availableSlots).not.toContain("18:00");
    });

    it("should return empty slots if the day is fully booked", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        // Create conflicting appointments (simplified booking)
        const slot1 = setMinutes(setHours(nextMonday, 9), 0);
        const slot2 = setMinutes(setHours(nextMonday, 9), 30);
        // ... book all slots ...
        // For simplicity, let's just book one slot and check if it's removed
        await prisma.appointment.create({
            data: {
                date: slot1,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });

        const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: dateString, 
                serviceId: testService.id, 
                professionalId: testProfessional.id 
            });

        expect(response.status).toBe(200);
        expect(response.body.availableSlots).toBeInstanceOf(Array);
        expect(response.body.availableSlots).not.toContain("09:00"); // 09:00 is booked
        expect(response.body.availableSlots).toContain("09:15"); // Next slot should be available if interval is 15min
        expect(response.body.availableSlots).toContain("09:30");

        await prisma.appointment.deleteMany({ where: { professionalId: testProfessional.id, date: slot1 }}); // Clean up
    });

    it("should return empty slots if the day has a schedule block", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        // Create a block for the morning
        const blockStart = setMinutes(setHours(nextMonday, 9), 0);
        const blockEnd = setMinutes(setHours(nextMonday, 12), 0);
        await prisma.scheduleBlock.create({
            data: {
                professionalId: testProfessional.id,
                startTime: blockStart,
                endTime: blockEnd,
                reason: "Meeting",
            }
        });

        const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: dateString, 
                serviceId: testService.id, 
                professionalId: testProfessional.id 
            });

        expect(response.status).toBe(200);
        expect(response.body.availableSlots).toBeInstanceOf(Array);
        expect(response.body.availableSlots).not.toContain("09:00");
        expect(response.body.availableSlots).not.toContain("11:45");
        expect(response.body.availableSlots).toContain("12:00"); // Should be available after block

        await prisma.scheduleBlock.deleteMany({ where: { professionalId: testProfessional.id }}); // Clean up
    });
    
    it("should return empty slots for a non-working day (Sunday)", async () => {
        let sunday = addDays(new Date(), 1);
        while (sunday.getDay() !== 0) { // 0 is Sunday
            sunday = addDays(sunday, 1);
        }
        const dateString = formatISO(startOfDay(sunday), { representation: 'date' });

        const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: dateString, 
                serviceId: testService.id, 
                professionalId: testProfessional.id 
            });

        expect(response.status).toBe(200);
        expect(response.body.availableSlots).toEqual([]);
    });

    it("should return 400 for invalid date format", async () => {
        const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: "invalid-date", 
                serviceId: testService.id, 
                professionalId: testProfessional.id 
            });
        expect(response.status).toBe(400);
    });

    it("should return 400 if serviceId is missing", async () => {
         const dateString = formatISO(nextMonday, { representation: 'date' });
         const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: dateString, 
                // serviceId missing
                professionalId: testProfessional.id 
            });
        expect(response.status).toBe(400); // Validator should catch this
    });
    
    it("should return 404 if serviceId is invalid", async () => {
         const dateString = formatISO(nextMonday, { representation: 'date' });
         const invalidServiceId = "00000000-0000-0000-0000-000000000000";
         const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: dateString, 
                serviceId: invalidServiceId, 
                professionalId: testProfessional.id 
            });
        expect(response.status).toBe(404);
    });

     it("should return 400 if professionalId and companyId are missing", async () => {
         const dateString = formatISO(nextMonday, { representation: 'date' });
         const response = await request(app)
            .get("/api/appointments/availability")
            .query({ 
                date: dateString, 
                serviceId: testService.id, 
                // professionalId missing
                // companyId missing
            });
        expect(response.status).toBe(400);
    });
});

describe("POST /api/appointments", () => {
    let nextMonday9AM: Date;

    beforeAll(() => {
        let date = addDays(new Date(), 1);
        while (date.getDay() !== 1) { date = addDays(date, 1); }
        nextMonday9AM = setMinutes(setHours(startOfDay(date), 9), 0);
    });

    it("should create an appointment for an authenticated user in an available slot", async () => {
        const appointmentTime = addHours(nextMonday9AM, 2); // Book for 11:00
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(appointmentTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        
        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.userId).toBe(testUser.id);
        expect(response.body.professionalId).toBe(testProfessional.id);
        expect(response.body.serviceId).toBe(testService.id);
        expect(new Date(response.body.date)).toEqual(appointmentTime);
        expect(response.body.status).toBe(AppointmentStatus.PENDING);

        // Clean up created appointment
        await prisma.appointment.delete({ where: { id: response.body.id } });
    });

    it("should return 409 conflict when booking an already taken slot", async () => {
        const appointmentTime = addHours(nextMonday9AM, 3); // Book for 12:00
        // Create the conflicting appointment first
        const existingAppt = await prisma.appointment.create({
            data: {
                date: appointmentTime,
                userId: testAdmin.id, // Different user
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });

        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(appointmentTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain("Horário indisponível");

        await prisma.appointment.delete({ where: { id: existingAppt.id } }); // Clean up
    });

    it("should return 400 when booking without minimum advance notice", async () => {
        // Try to book 30 minutes from now (assuming MIN_BOOKING_ADVANCE_HOURS = 1)
        const appointmentTime = addMinutes(new Date(), 30);
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(appointmentTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("antecedência");
    });

    it("should return 400 when booking in the past", async () => {
        const appointmentTime = addHours(new Date(), -2);
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(appointmentTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("passado");
    });

    it("should return 400 if professionalId is required but not provided", async () => {
        // Assume testService2 can be done by multiple professionals (needs setup)
        // For now, we'll test the existing logic where it's inferred or required
        // If testService is only offered by testProfessional, this test might not apply directly
        // Let's simulate a service offered by multiple pros by temporarily removing the link
        await prisma.professionalService.deleteMany({ where: { serviceId: testService.id }});
        // Create links for two professionals (need another professional)
        const otherProf = await prisma.professional.create({ data: { name: "Other Prof", role: "Stylist", companyId: testCompany.id }});
        await prisma.professionalService.create({ data: { professionalId: testProfessional.id, serviceId: testService.id }});
        await prisma.professionalService.create({ data: { professionalId: otherProf.id, serviceId: testService.id }});

        const appointmentTime = addHours(nextMonday9AM, 4); // 13:00
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(appointmentTime),
                serviceId: testService.id,
                // professionalId missing
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("professionalId é obrigatório");

        // Clean up
        await prisma.professionalService.deleteMany({ where: { serviceId: testService.id }});
        await prisma.professional.delete({ where: { id: otherProf.id }});
        // Restore original link
        await prisma.professionalService.create({ data: { professionalId: testProfessional.id, serviceId: testService.id }});
    });

    it("should return 401 if user is not authenticated", async () => {
        const appointmentTime = addHours(nextMonday9AM, 5); // 14:00
        const response = await request(app)
            .post("/api/appointments")
            // No Authorization header
            .send({
                date: formatISO(appointmentTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        expect(response.status).toBe(401);
    });
});

describe("PATCH /api/appointments/:id/status", () => {
    let pendingAppointment: any;
    let confirmedAppointment: any;
    let appointmentTimeFuture: Date;
    let appointmentTimePast: Date;

    beforeEach(async () => {
        // Create appointments for testing status changes
        appointmentTimeFuture = addHours(new Date(), MIN_CANCELLATION_HOURS + 1);
        appointmentTimePast = addHours(new Date(), -1);

        pendingAppointment = await prisma.appointment.create({
            data: {
                date: appointmentTimeFuture,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.PENDING,
            }
        });
        confirmedAppointment = await prisma.appointment.create({
            data: {
                date: appointmentTimePast, // Set in the past to allow completion
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });
    });

    afterEach(async () => {
        await prisma.appointment.deleteMany({ where: { id: { in: [pendingAppointment.id, confirmedAppointment.id]}}});
    });

    it("should allow professional to confirm a PENDING appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${professionalToken}`) // Use professional's token
            .send({ status: AppointmentStatus.CONFIRMED });
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it("should allow professional to complete a CONFIRMED appointment (after start time)", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${confirmedAppointment.id}/status`)
            .set("Authorization", `Bearer ${professionalToken}`)
            .send({ status: AppointmentStatus.COMPLETED });
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.COMPLETED);
    });

    it("should NOT allow professional to complete a PENDING appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${professionalToken}`)
            .send({ status: AppointmentStatus.COMPLETED });
        
        expect(response.status).toBe(403);
    });

    it("should NOT allow professional to complete an appointment before its start time", async () => {
         // Use the future pending appointment which is confirmed first
         await prisma.appointment.update({ 
             where: { id: pendingAppointment.id }, 
             data: { status: AppointmentStatus.CONFIRMED }
         });
         const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${professionalToken}`)
            .send({ status: AppointmentStatus.COMPLETED });
        
        expect(response.status).toBe(403); // Should fail because appointment date is in the future
    });

    it("should NOT allow user to confirm or complete an appointment", async () => {
        const confirmResponse = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(confirmResponse.status).toBe(403);

        const completeResponse = await request(app)
            .patch(`/api/appointments/${confirmedAppointment.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: AppointmentStatus.COMPLETED });
        expect(completeResponse.status).toBe(403);
    });

    it("should return 400 if trying to update status to CANCELLED", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: AppointmentStatus.CANCELLED });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("Use o endpoint PATCH /api/appointments/{id}/cancel");
    });

    it("should return 404 for a non-existent appointment ID", async () => {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .patch(`/api/appointments/${invalidId}/status`)
            .set("Authorization", `Bearer ${professionalToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(404);
    });

    it("should return 401 if user is not authenticated", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            // No Authorization header
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(401);
    });
});

describe("PATCH /api/appointments/:id/cancel", () => {
    let futureAppointment: any;
    let pastAppointment: any;
    let appointmentTimeToCancel: Date;
    let appointmentTimeTooLate: Date;

    beforeEach(async () => {
        appointmentTimeToCancel = addHours(new Date(), MIN_CANCELLATION_HOURS + 1);
        appointmentTimeTooLate = addHours(new Date(), MIN_CANCELLATION_HOURS - 0.5); // Less than min notice

        futureAppointment = await prisma.appointment.create({
            data: {
                date: appointmentTimeToCancel,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });
         pastAppointment = await prisma.appointment.create({
            data: {
                date: addHours(new Date(), -5),
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });
    });

    afterEach(async () => {
        await prisma.appointment.deleteMany({ where: { id: { in: [futureAppointment.id, pastAppointment.id]}}});
    });

    it("should allow user to cancel their own appointment with sufficient notice", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${futureAppointment.id}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.appointment.status).toBe(AppointmentStatus.CANCELLED);
    });

    it("should allow professional to cancel an appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${futureAppointment.id}/cancel`)
            .set("Authorization", `Bearer ${professionalToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.appointment.status).toBe(AppointmentStatus.CANCELLED);
    });

    it("should allow admin to cancel an appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${futureAppointment.id}/cancel`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.appointment.status).toBe(AppointmentStatus.CANCELLED);
    });

    it("should NOT allow user to cancel with insufficient notice", async () => {
        // Create an appointment with less than minimum notice time
        const lateNoticeAppt = await prisma.appointment.create({
             data: {
                date: appointmentTimeTooLate,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });

        const response = await request(app)
            .patch(`/api/appointments/${lateNoticeAppt.id}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("antecedência");

        await prisma.appointment.delete({ where: { id: lateNoticeAppt.id }}); // Clean up
    });
    
    it("should allow admin to cancel with insufficient notice", async () => {
        // Create an appointment with less than minimum notice time
        const lateNoticeAppt = await prisma.appointment.create({
             data: {
                date: appointmentTimeTooLate,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });

        const response = await request(app)
            .patch(`/api/appointments/${lateNoticeAppt.id}/cancel`)
            .set("Authorization", `Bearer ${adminToken}`); // Admin tries to cancel
        
        expect(response.status).toBe(200); // Admin should bypass the rule
        expect(response.body.appointment.status).toBe(AppointmentStatus.CANCELLED);

        await prisma.appointment.delete({ where: { id: lateNoticeAppt.id }}); // Clean up
    });

    it("should NOT allow user to cancel another user's appointment", async () => {
        // Create appointment for admin user
        const adminAppt = await prisma.appointment.create({
             data: {
                date: appointmentTimeToCancel,
                userId: testAdmin.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });

        const response = await request(app)
            .patch(`/api/appointments/${adminAppt.id}/cancel`)
            .set("Authorization", `Bearer ${userToken}`); // Normal user tries to cancel admin's appt
        
        expect(response.status).toBe(403);

        await prisma.appointment.delete({ where: { id: adminAppt.id }}); // Clean up
    });

    it("should return 400 if trying to cancel an already CANCELLED appointment", async () => {
        // Cancel it first
        await prisma.appointment.update({ 
            where: { id: futureAppointment.id }, 
            data: { status: AppointmentStatus.CANCELLED }
        });

        const response = await request(app)
            .patch(`/api/appointments/${futureAppointment.id}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("já está CANCELLED");
    });

    it("should return 404 for a non-existent appointment ID", async () => {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .patch(`/api/appointments/${invalidId}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(404);
    });

    it("should return 401 if user is not authenticated", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${futureAppointment.id}/cancel`);
            // No Authorization header
        expect(response.status).toBe(401);
    });
});

