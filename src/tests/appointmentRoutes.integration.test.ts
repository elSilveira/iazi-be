import request from "supertest";
import { app } from "../app"; // Assuming your Express app instance is exported from app.ts
import { prisma } from "../utils/prismaClient";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { addHours, formatISO, startOfDay, addDays, setHours, setMinutes, subHours, addMinutes } from "date-fns";
import { generateToken } from "../utils/jwt"; // Assuming you have a JWT utility

// --- Test Data Setup ---
let testUser: any;
let testUser2: any; // Second user for permission tests
let testAdmin: any;
let testProfessionalUser: any; // User account for the professional
let testCompany: any;
let testProfessional: any;
let testService: any;
let testCategory: any;
let userToken: string;
let user2Token: string;
let adminToken: string;
let professionalToken: string;

// Helper to find next specific day of the week (0=Sun, 1=Mon, ...)
const getNextDayOfWeek = (dayOfWeek: number): Date => {
    let date = addDays(new Date(), 1);
    while (date.getDay() !== dayOfWeek) {
        date = addDays(date, 1);
    }
    return startOfDay(date);
};

const nextMonday = getNextDayOfWeek(1);
const nextTuesday = getNextDayOfWeek(2);

beforeAll(async () => {
    // Clean up potential leftovers
    await prisma.appointment.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.professionalService.deleteMany();
    await prisma.review.deleteMany(); // Added review cleanup
    await prisma.notification.deleteMany(); // Added notification cleanup
    await prisma.gamificationEvent.deleteMany(); // Added gamification cleanup
    await prisma.userBadge.deleteMany(); // Added gamification cleanup
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
    testUser2 = await prisma.user.create({
        data: {
            email: "testuser2@example.com",
            name: "Test User 2",
            password: "password123",
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
            // Link professional profile to the professional user account if needed
            // userId: testProfessionalUser.id, 
            name: testProfessionalUser.name,
            role: "Hair Stylist",
            companyId: testCompany.id,
            // Use company working hours by default
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

    // Generate tokens
    userToken = generateToken({ id: testUser.id, role: testUser.role });
    user2Token = generateToken({ id: testUser2.id, role: testUser2.role });
    adminToken = generateToken({ id: testAdmin.id, role: testAdmin.role });
    // Use the professional's *user* account ID for the token if they log in
    professionalToken = generateToken({ id: testProfessionalUser.id, role: testProfessionalUser.role });
});

afterAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.professionalService.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.gamificationEvent.deleteMany();
    await prisma.userBadge.deleteMany();
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
        expect(response.body.availableSlots.length).toBeGreaterThan(0);
        expect(response.body.availableSlots).toContain("09:00");
        expect(response.body.availableSlots).toContain("17:30"); // Last slot for 30min service
        expect(response.body.availableSlots).not.toContain("18:00");
    });

    it("should return slots excluding booked times", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        const bookedTime = setMinutes(setHours(nextMonday, 10), 0); // 10:00
        const conflictingAppt = await prisma.appointment.create({
            data: {
                date: bookedTime,
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
        expect(response.body.availableSlots).not.toContain("10:00"); // Booked
        expect(response.body.availableSlots).toContain("09:45"); // Assuming 15min interval
        expect(response.body.availableSlots).toContain("10:15"); // Assuming 15min interval
        expect(response.body.availableSlots).toContain("10:30");

        await prisma.appointment.delete({ where: { id: conflictingAppt.id }}); // Clean up
    });

    it("should return slots excluding schedule blocks", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        const blockStart = setMinutes(setHours(nextMonday, 14), 0); // 14:00
        const blockEnd = setMinutes(setHours(nextMonday, 15), 0); // 15:00
        const block = await prisma.scheduleBlock.create({
            data: {
                professionalId: testProfessional.id,
                startTime: blockStart,
                endTime: blockEnd,
                reason: "Lunch",
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
        expect(response.body.availableSlots).not.toContain("14:00");
        expect(response.body.availableSlots).not.toContain("14:15");
        expect(response.body.availableSlots).not.toContain("14:30");
        expect(response.body.availableSlots).not.toContain("14:45");
        expect(response.body.availableSlots).toContain("13:45");
        expect(response.body.availableSlots).toContain("15:00");

        await prisma.scheduleBlock.delete({ where: { id: block.id }}); // Clean up
    });
    
    it("should return empty slots for a non-working day (Sunday)", async () => {
        const sunday = getNextDayOfWeek(0);
        const dateString = formatISO(sunday, { representation: 'date' });

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
            .query({ date: "invalid-date", serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("formato YYYY-MM-DD");
    });

    it("should return 400 if serviceId is missing", async () => {
         const dateString = formatISO(nextMonday, { representation: 'date' });
         const response = await request(app)
            .get("/api/appointments/availability")
            .query({ date: dateString, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID do serviço é obrigatório");
    });
    
    it("should return 404 if serviceId is invalid or not found", async () => {
         const dateString = formatISO(nextMonday, { representation: 'date' });
         const invalidServiceId = "00000000-0000-0000-0000-000000000000";
         const response = await request(app)
            .get("/api/appointments/availability")
            .query({ date: dateString, serviceId: invalidServiceId, professionalId: testProfessional.id });
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Serviço não encontrado");
    });

     it("should return 400 if professionalId and companyId are missing", async () => {
         const dateString = formatISO(nextMonday, { representation: 'date' });
         const response = await request(app)
            .get("/api/appointments/availability")
            .query({ date: dateString, serviceId: testService.id });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID do profissional ou da empresa é obrigatório");
    });

    it("should return 404 if professionalId is invalid or not found", async () => {
         const dateString = formatISO(nextMonday, { representation: 'date' });
         const invalidProfId = "00000000-0000-0000-0000-000000000000";
         const response = await request(app)
            .get("/api/appointments/availability")
            .query({ date: dateString, serviceId: testService.id, professionalId: invalidProfId });
        // Depending on implementation, might be 404 for professional or just empty slots
        // Assuming controller checks professional existence:
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Profissional não encontrado");
    });
});

describe("POST /api/appointments", () => {
    const bookableTime = addHours(setMinutes(setHours(nextMonday, 11), 0), 0); // Next Monday 11:00

    it("should create an appointment for an authenticated user in an available slot", async () => {
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        
        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.userId).toBe(testUser.id);
        expect(response.body.professionalId).toBe(testProfessional.id);
        expect(response.body.serviceId).toBe(testService.id);
        expect(new Date(response.body.date)).toEqual(bookableTime);
        expect(response.body.status).toBe(AppointmentStatus.PENDING);

        // Check if notification and gamification events were triggered (basic check)
        const notifications = await prisma.notification.findMany({ where: { userId: testUser.id }});
        // expect(notifications.length).toBeGreaterThan(0); // Depends if PENDING triggers notification
        const gamificationEvents = await prisma.gamificationEvent.findMany({ where: { userId: testUser.id }});
        // expect(gamificationEvents.length).toBeGreaterThan(0); // Depends if PENDING triggers event

        await prisma.appointment.delete({ where: { id: response.body.id } }); // Clean up
        await prisma.notification.deleteMany({ where: { userId: testUser.id }});
        await prisma.gamificationEvent.deleteMany({ where: { userId: testUser.id }});
    });

    it("should return 401 if user is not authenticated", async () => {
        const response = await request(app)
            .post("/api/appointments")
            // No Authorization header
            .send({
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        expect(response.status).toBe(401);
    });

    it("should return 409 conflict when booking an already taken slot", async () => {
        const conflictingAppt = await prisma.appointment.create({
            data: {
                date: bookableTime,
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
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain("Horário indisponível");

        await prisma.appointment.delete({ where: { id: conflictingAppt.id } }); // Clean up
    });

    it("should return 400 when booking without minimum advance notice", async () => {
        // Assuming MIN_BOOKING_ADVANCE_HOURS = 1
        const tooSoonTime = addMinutes(new Date(), 30); 
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(tooSoonTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("antecedência mínima");
    });

    it("should return 400 when booking in the past", async () => {
        const pastTime = subHours(new Date(), 2);
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(pastTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("não pode ser no passado");
    });

    it("should return 400 for invalid date format in body", async () => {
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: "invalid-iso-date",
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Data inválida");
    });

    it("should return 400 if serviceId is missing", async () => {
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(bookableTime),
                // serviceId missing
                professionalId: testProfessional.id,
            });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID do serviço é obrigatório");
    });

    it("should return 404 if serviceId does not exist", async () => {
        const invalidServiceId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(bookableTime),
                serviceId: invalidServiceId,
                professionalId: testProfessional.id,
            });
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Serviço não encontrado");
    });

    it("should return 404 if professionalId does not exist", async () => {
        const invalidProfId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: invalidProfId,
            });
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Profissional não encontrado");
    });

    it("should return 400 if professional is not linked to the service", async () => {
        // Create a professional not linked to the service
        const unlinkedProf = await prisma.professional.create({
            data: { name: "Unlinked Pro", role: "Stylist", companyId: testCompany.id }
        });

        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: unlinkedProf.id,
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("não oferece este serviço");

        await prisma.professional.delete({ where: { id: unlinkedProf.id }}); // Clean up
    });

    it("should return 409 when booking outside professional working hours", async () => {
        // Try booking on Tuesday at 8 AM (before 9 AM start)
        const earlyTime = setMinutes(setHours(nextTuesday, 8), 0);
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(earlyTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        expect(response.status).toBe(409);
        expect(response.body.message).toContain("Horário indisponível"); // Availability check should fail
    });
});

describe("GET /api/appointments", () => {
    let appointment1: any;
    let appointment2: any;

    beforeAll(async () => {
        // Create appointments for testUser and testUser2
        const time1 = addHours(setMinutes(setHours(nextMonday, 14), 0), 0); // Mon 14:00
        const time2 = addHours(setMinutes(setHours(nextTuesday, 10), 0), 0); // Tue 10:00
        appointment1 = await prisma.appointment.create({
            data: { date: time1, userId: testUser.id, serviceId: testService.id, professionalId: testProfessional.id, status: AppointmentStatus.CONFIRMED }
        });
        appointment2 = await prisma.appointment.create({
            data: { date: time2, userId: testUser2.id, serviceId: testService.id, professionalId: testProfessional.id, status: AppointmentStatus.PENDING }
        });
    });

    afterAll(async () => {
        await prisma.appointment.deleteMany({ where: { id: { in: [appointment1.id, appointment2.id] }}});
    });

    it("should return only the authenticated user's appointments", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].id).toBe(appointment1.id);
        expect(response.body[0].userId).toBe(testUser.id);
    });

    it("should return appointments for a specific professional if requested by admin/professional", async () => {
        // Assuming admin or the professional themselves can filter by professionalId
        const response = await request(app)
            .get(`/api/appointments?professionalId=${testProfessional.id}`)
            .set("Authorization", `Bearer ${adminToken}`); // Use admin token
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(2); // Should see both appointments
        expect(response.body.some((a:any) => a.id === appointment1.id)).toBe(true);
        expect(response.body.some((a:any) => a.id === appointment2.id)).toBe(true);
    });

    it("should filter appointments by date", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        const response = await request(app)
            .get(`/api/appointments?date=${dateString}`)
            .set("Authorization", `Bearer ${adminToken}`); // Admin sees all
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].id).toBe(appointment1.id);
    });

    it("should filter appointments by status", async () => {
        const response = await request(app)
            .get(`/api/appointments?status=${AppointmentStatus.PENDING}`)
            .set("Authorization", `Bearer ${adminToken}`); // Admin sees all
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].id).toBe(appointment2.id);
    });

    it("should return 401 if not authenticated", async () => {
        const response = await request(app).get("/api/appointments");
        expect(response.status).toBe(401);
    });
});

describe("GET /api/appointments/:id", () => {
    let appointment: any;

    beforeAll(async () => {
        const time = addHours(setMinutes(setHours(nextMonday, 15), 0), 0); // Mon 15:00
        appointment = await prisma.appointment.create({
            data: { date: time, userId: testUser.id, serviceId: testService.id, professionalId: testProfessional.id, status: AppointmentStatus.CONFIRMED }
        });
    });

    afterAll(async () => {
        await prisma.appointment.delete({ where: { id: appointment.id }});
    });

    it("should return appointment details for the owner", async () => {
        const response = await request(app)
            .get(`/api/appointments/${appointment.id}`)
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(appointment.id);
        expect(response.body.userId).toBe(testUser.id);
    });

    it("should return appointment details for an admin", async () => {
        const response = await request(app)
            .get(`/api/appointments/${appointment.id}`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(appointment.id);
    });

    it("should return appointment details for the assigned professional", async () => {
        // Assuming the professional's user account can view their assigned appointments
        const response = await request(app)
            .get(`/api/appointments/${appointment.id}`)
            .set("Authorization", `Bearer ${professionalToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(appointment.id);
        expect(response.body.professionalId).toBe(testProfessional.id);
    });

    it("should return 403 forbidden for a different user", async () => {
        const response = await request(app)
            .get(`/api/appointments/${appointment.id}`)
            .set("Authorization", `Bearer ${user2Token}`); // Different user
        
        expect(response.status).toBe(403);
        expect(response.body.message).toContain("não autorizado");
    });

    it("should return 404 for a non-existent appointment ID", async () => {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .get(`/api/appointments/${invalidId}`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(404);
    });

    it("should return 400 for an invalid UUID format", async () => {
        const invalidId = "not-a-uuid";
        const response = await request(app)
            .get(`/api/appointments/${invalidId}`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID inválido");
    });

    it("should return 401 if not authenticated", async () => {
        const response = await request(app).get(`/api/appointments/${appointment.id}`);
        expect(response.status).toBe(401);
    });
});

describe("PATCH /api/appointments/:id/status", () => {
    let appointment: any;

    beforeEach(async () => {
        // Create a fresh appointment for each status test
        const time = addHours(setMinutes(setHours(nextTuesday, 11), 0), 0); // Tue 11:00
        appointment = await prisma.appointment.create({
            data: { date: time, userId: testUser.id, serviceId: testService.id, professionalId: testProfessional.id, status: AppointmentStatus.PENDING }
        });
    });

    afterEach(async () => {
        await prisma.appointment.delete({ where: { id: appointment.id }});
        await prisma.notification.deleteMany({ where: { relatedEntityId: appointment.id }});
        await prisma.gamificationEvent.deleteMany({ where: { relatedEntityId: appointment.id }});
    });

    it("should allow admin to update status to CONFIRMED", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(appointment.id);
        expect(response.body.status).toBe(AppointmentStatus.CONFIRMED);

        // Check for notification
        const notification = await prisma.notification.findFirst({ where: { relatedEntityId: appointment.id, type: "APPOINTMENT_CONFIRMED" }});
        expect(notification).not.toBeNull();
        expect(notification?.userId).toBe(testUser.id);
    });

    it("should allow professional to update status to COMPLETED", async () => {
        // First confirm it (e.g., by admin)
        await prisma.appointment.update({ where: { id: appointment.id }, data: { status: AppointmentStatus.CONFIRMED }});

        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/status`)
            .set("Authorization", `Bearer ${professionalToken}`)
            .send({ status: AppointmentStatus.COMPLETED });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.COMPLETED);

        // Check for gamification event
        const event = await prisma.gamificationEvent.findFirst({ where: { relatedEntityId: appointment.id, eventType: "APPOINTMENT_COMPLETED" }});
        expect(event).not.toBeNull();
        expect(event?.userId).toBe(testUser.id);
    });

    it("should prevent user from updating status", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });
        
        expect(response.status).toBe(403); // Forbidden
        expect(response.body.message).toContain("não autorizado");
    });

    it("should return 400 for invalid status value", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "INVALID_STATUS" });
        
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Status inválido");
    });

    it("should return 400 if status is missing", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ }); // Missing status
        
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Status é obrigatório");
    });

    it("should return 404 for non-existent appointment ID", async () => {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .patch(`/api/appointments/${invalidId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(404);
    });

    it("should return 401 if not authenticated", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/status`)
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(401);
    });
});

describe("PATCH /api/appointments/:id/cancel", () => {
    let appointment: any;
    let appointmentFarFuture: any;

    beforeEach(async () => {
        // Create appointments for cancellation tests
        const time = addHours(setMinutes(setHours(nextTuesday, 14), 0), 0); // Tue 14:00
        const timeFar = addDays(time, 10); // Far future appointment
        appointment = await prisma.appointment.create({
            data: { date: time, userId: testUser.id, serviceId: testService.id, professionalId: testProfessional.id, status: AppointmentStatus.CONFIRMED }
        });
        appointmentFarFuture = await prisma.appointment.create({
            data: { date: timeFar, userId: testUser2.id, serviceId: testService.id, professionalId: testProfessional.id, status: AppointmentStatus.CONFIRMED }
        });
    });

    afterEach(async () => {
        await prisma.appointment.deleteMany({ where: { id: { in: [appointment.id, appointmentFarFuture.id] }}});
        await prisma.notification.deleteMany({ where: { relatedEntityId: { in: [appointment.id, appointmentFarFuture.id] }}});
    });

    it("should allow the owner to cancel their appointment (if within policy)", async () => {
        // Assuming cancellation is allowed > MIN_CANCELLATION_HOURS before
        // If appointment is too close, this test might fail - adjust time or policy
        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);

        // Check if cancellation is allowed based on time
        const hoursUntil = (appointment.date.getTime() - new Date().getTime()) / (1000 * 60 * 60);
        const minCancellationHours = 2; // Example policy

        if (hoursUntil > minCancellationHours) {
            expect(response.status).toBe(200);
            expect(response.body.status).toBe(AppointmentStatus.CANCELLED);
            // Check for notification
            const notification = await prisma.notification.findFirst({ where: { relatedEntityId: appointment.id, type: "APPOINTMENT_CANCELLED" }});
            expect(notification).not.toBeNull();
        } else {
            expect(response.status).toBe(400); // Or appropriate error for policy violation
            expect(response.body.message).toContain("cancelado com antecedência");
        }
    });

    it("should allow admin to cancel any appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointmentFarFuture.id}/cancel`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.CANCELLED);
        // Check notification for user2
        const notification = await prisma.notification.findFirst({ where: { relatedEntityId: appointmentFarFuture.id, type: "APPOINTMENT_CANCELLED", userId: testUser2.id }});
        expect(notification).not.toBeNull();
    });

    it("should allow professional to cancel their assigned appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/cancel`)
            .set("Authorization", `Bearer ${professionalToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.CANCELLED);
        // Check notification for user1
        const notification = await prisma.notification.findFirst({ where: { relatedEntityId: appointment.id, type: "APPOINTMENT_CANCELLED", userId: testUser.id }});
        expect(notification).not.toBeNull();
    });

    it("should prevent a user from cancelling another user's appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${appointmentFarFuture.id}/cancel`) // appointmentFarFuture belongs to user2
            .set("Authorization", `Bearer ${userToken}`); // user1 trying to cancel
        
        expect(response.status).toBe(403);
        expect(response.body.message).toContain("não autorizado");
    });

    it("should return 400 when trying to cancel an already cancelled appointment", async () => {
        // Cancel it first
        await prisma.appointment.update({ where: { id: appointment.id }, data: { status: AppointmentStatus.CANCELLED }});

        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("já está cancelado");
    });

    it("should return 400 when trying to cancel a completed appointment", async () => {
        await prisma.appointment.update({ where: { id: appointment.id }, data: { status: AppointmentStatus.COMPLETED }});

        const response = await request(app)
            .patch(`/api/appointments/${appointment.id}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("não pode ser cancelado");
    });

    it("should return 404 for a non-existent appointment ID", async () => {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .patch(`/api/appointments/${invalidId}/cancel`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(404);
    });

    it("should return 401 if not authenticated", async () => {
        const response = await request(app).patch(`/api/appointments/${appointment.id}/cancel`);
        expect(response.status).toBe(401);
    });
});

// TODO: Add tests for other endpoints (Users, Professionals, Companies, Services, Reviews, Gamification, Notifications) focusing on:
// - Error handling (invalid input, non-existent IDs)
// - Permission checks (user roles, ownership)
// - Interactions (e.g., creating a review should update professional rating, trigger gamification)

