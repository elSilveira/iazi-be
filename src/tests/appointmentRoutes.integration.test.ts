import request from "supertest";
import { app } from "../index"; // Corrected path to app
import { prisma } from "../utils/prismaClient";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { addHours, formatISO, startOfDay, addDays, setHours, setMinutes, subHours, addMinutes } from "date-fns";
import { generateToken } from "../utils/jwt"; // Corrected path to jwt utils
import { GamificationEventType } from "../services/gamificationService"; // Added import for enum

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
    // Clean up potential leftovers (order matters)
    await prisma.appointment.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.professionalService.deleteMany();
    await prisma.review.deleteMany();

    await prisma.activityLog.deleteMany(); // Added ActivityLog cleanup
    await prisma.gamificationEvent.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.badge.deleteMany(); // Added Badge cleanup
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.professionalExperience.deleteMany(); // Added
    await prisma.professionalEducation.deleteMany(); // Added
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
            price: new Decimal("30.00"),
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

    await prisma.activityLog.deleteMany();
    await prisma.gamificationEvent.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.professionalExperience.deleteMany();
    await prisma.professionalEducation.deleteMany();
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
        // Specific slot checks depend on interval logic (assuming 15min)
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
        // Check slots around the booked time (assuming 15min interval)
        expect(response.body.availableSlots).not.toContain("09:45"); // Blocked by 10:00 appt (30min duration)
        expect(response.body.availableSlots).not.toContain("10:00"); // Booked
        expect(response.body.availableSlots).not.toContain("10:15"); // Blocked by 10:00 appt (30min duration)
        expect(response.body.availableSlots).toContain("09:30");
        expect(response.body.availableSlots).toContain("10:30");

        await prisma.appointment.delete({ where: { id: conflictingAppt.id }}); // Clean up
    });

    it("should return slots excluding schedule blocks", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        const blockStart = setMinutes(setHours(nextMonday, 14), 0); // 14:00
        const blockEnd = setMinutes(setHours(nextMonday, 15), 0); // 15:00 (1 hour block)
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
        // Check slots around the block (assuming 15min interval, 30min service)
        expect(response.body.availableSlots).not.toContain("13:45"); // Blocked by 14:00 block
        expect(response.body.availableSlots).not.toContain("14:00");
        expect(response.body.availableSlots).not.toContain("14:15");
        expect(response.body.availableSlots).not.toContain("14:30");
        expect(response.body.availableSlots).not.toContain("14:45"); // Blocked by 15:00 end time
        expect(response.body.availableSlots).toContain("13:30");
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
        // Assuming validation middleware adds errors array
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
    let createdAppointmentId: string | null = null;

    afterEach(async () => {
        // Clean up appointment created in the test
        if (createdAppointmentId) {
            await prisma.appointment.deleteMany({ where: { id: createdAppointmentId } });
            await prisma.activityLog.deleteMany({ where: { relatedEntityId: createdAppointmentId } });
            await prisma.gamificationEvent.deleteMany({ where: { relatedEntityId: createdAppointmentId } });
            createdAppointmentId = null;
        }
    });

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
        createdAppointmentId = response.body.id; // Store ID for cleanup
        expect(response.body.userId).toBe(testUser.id);
        expect(response.body.professionalId).toBe(testProfessional.id);
        expect(response.body.serviceId).toBe(testService.id);
        expect(new Date(response.body.date)).toEqual(bookableTime);
        expect(response.body.status).toBe(AppointmentStatus.PENDING);

        // Check if ActivityLog and Gamification events were triggered (optional but good)
        const activityLogs = await prisma.activityLog.findMany({ where: { userId: testUser.id, relatedEntityId: createdAppointmentId }});
        expect(activityLogs.length).toBeGreaterThanOrEqual(1); // Should have at least one log for creation
        expect(activityLogs[0].type).toBe("NEW_APPOINTMENT");

        const gamificationEvents = await prisma.gamificationEvent.findMany({ where: { userId: testUser.id, relatedEntityId: createdAppointmentId }});
        // Gamification might trigger later (on CONFIRMED/COMPLETED), so this might be 0
        // expect(gamificationEvents.length).toBeGreaterThan(0); 
    });

    it("should return 401 if user is not authenticated", async () => {
        const response = await request(app)
            .post("/api/appointments")
            .send({
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        expect(response.status).toBe(401);
    });

    it("should return 400 if date is missing", async () => {
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Data é obrigatória");
    });

    it("should return 400 if date is in the past", async () => {
        const pastDate = subHours(new Date(), 2);
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: formatISO(pastDate), serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("não pode ser no passado");
    });

    it("should return 400 if booking too close to current time", async () => {
        const tooSoonDate = addMinutes(new Date(), 30); // Less than MIN_BOOKING_ADVANCE_HOURS (1 hour)
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: formatISO(tooSoonDate), serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("antecedência");
    });

    it("should return 404 if serviceId is invalid", async () => {
        const invalidServiceId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: formatISO(bookableTime), serviceId: invalidServiceId, professionalId: testProfessional.id });
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Serviço não encontrado");
    });

    it("should return 400 if professionalId is required but missing", async () => {
        // Create a second service offered by another professional
        const otherProf = await prisma.professional.create({ data: { name: "Other Prof", role: "Stylist", companyId: testCompany.id } });
        await prisma.professionalService.create({ data: { professionalId: otherProf.id, serviceId: testService.id } });

        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: formatISO(bookableTime), serviceId: testService.id }); // Missing professionalId
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("professionalId é obrigatório");

        // Cleanup
        await prisma.professionalService.deleteMany({ where: { professionalId: otherProf.id } });
        await prisma.professional.delete({ where: { id: otherProf.id } });
    });

    it("should return 400 if specified professional does not offer the service", async () => {
        const otherService = await prisma.service.create({ data: { name: "Other Service", description: "Desc for other service", price: new Decimal("50.00"), duration: "60min", categoryId: testCategory.id, companyId: testCompany.id } });
        
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: formatISO(bookableTime), serviceId: otherService.id, professionalId: testProfessional.id });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("profissional especificado não oferece este serviço");

        await prisma.service.delete({ where: { id: otherService.id } });
    });

    it("should return 409 if the slot is already booked", async () => {
        // First, book the slot
        const firstBooking = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });
        expect(firstBooking.status).toBe(201);
        createdAppointmentId = firstBooking.body.id;

        // Try to book the same slot again
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${user2Token}`) // Different user
            .send({
                date: formatISO(bookableTime),
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });

        expect(response.status).toBe(409); // Conflict
        expect(response.body.message).toContain("Horário indisponível");
    });

    it("should return 409 if the slot conflicts with a schedule block", async () => {
        const blockedTimeStart = setMinutes(setHours(nextTuesday, 15), 0); // Next Tuesday 15:00
        const blockedTimeEnd = addHours(blockedTimeStart, 1);
        const block = await prisma.scheduleBlock.create({
            data: {
                professionalId: testProfessional.id,
                startTime: blockedTimeStart,
                endTime: blockedTimeEnd,
                reason: "Meeting",
            }
        });

        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                date: formatISO(blockedTimeStart), // Try to book exactly when block starts
                serviceId: testService.id,
                professionalId: testProfessional.id,
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain("Horário indisponível");

        await prisma.scheduleBlock.delete({ where: { id: block.id } });
    });
});

describe("GET /api/appointments", () => {
    let appointment1: any;
    let appointment2: any;

    beforeAll(async () => {
        // Create some appointments for testing filtering/listing
        const time1 = addHours(setMinutes(setHours(nextMonday, 13), 0), 0); // Mon 13:00
        const time2 = addHours(setMinutes(setHours(nextTuesday, 10), 0), 0); // Tue 10:00
        appointment1 = await prisma.appointment.create({
            data: {
                date: time1,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });
        appointment2 = await prisma.appointment.create({
            data: {
                date: time2,
                userId: testUser2.id, // Different user
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.PENDING,
            }
        });
    });

    afterAll(async () => {
        await prisma.appointment.deleteMany({ where: { id: { in: [appointment1.id, appointment2.id] } } });
    });

    it("should return appointments for the authenticated user by default", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].id).toBe(appointment1.id);
        expect(response.body[0].userId).toBe(testUser.id);
    });

    it("should allow admin to get all appointments", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
        expect(response.body.some((a: any) => a.id === appointment1.id)).toBe(true);
        expect(response.body.some((a: any) => a.id === appointment2.id)).toBe(true);
    });

    it("should allow admin to filter appointments by userId", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${adminToken}`)
            .query({ userId: testUser2.id });
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].id).toBe(appointment2.id);
        expect(response.body[0].userId).toBe(testUser2.id);
    });

    it("should deny non-admin from getting another user's appointments", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .query({ userId: testUser2.id });
        
        expect(response.status).toBe(403);
    });

    it("should filter appointments by professionalId", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${adminToken}`) // Admin can see all
            .query({ professionalId: testProfessional.id });
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(2);
        expect(response.body.every((a: any) => a.professionalId === testProfessional.id)).toBe(true);
    });

    it("should filter appointments by status", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${adminToken}`)
            .query({ status: AppointmentStatus.PENDING });
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body.every((a: any) => a.status === AppointmentStatus.PENDING)).toBe(true);
        expect(response.body.some((a: any) => a.id === appointment2.id)).toBe(true);
    });

    it("should filter appointments by date", async () => {
        const dateString = formatISO(nextMonday, { representation: 'date' });
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${adminToken}`)
            .query({ date: dateString });
        
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body.every((a: any) => startOfDay(new Date(a.date)).getTime() === nextMonday.getTime())).toBe(true);
        expect(response.body.some((a: any) => a.id === appointment1.id)).toBe(true);
    });

    it("should return 400 for invalid status filter", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${adminToken}`)
            .query({ status: "INVALID_STATUS" });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Status inválido");
    });

    it("should return 400 for invalid date filter format", async () => {
        const response = await request(app)
            .get("/api/appointments")
            .set("Authorization", `Bearer ${adminToken}`)
            .query({ date: "invalid-date" });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("formato YYYY-MM-DD");
    });
});

describe("GET /api/appointments/:id", () => {
    let testAppointment: any;

    beforeAll(async () => {
        const time = addHours(setMinutes(setHours(nextMonday, 16), 0), 0); // Mon 16:00
        testAppointment = await prisma.appointment.create({
            data: {
                date: time,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });
    });

    afterAll(async () => {
        await prisma.appointment.delete({ where: { id: testAppointment.id } });
    });

    it("should return the appointment details for the owner", async () => {
        const response = await request(app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${userToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testAppointment.id);
        expect(response.body.userId).toBe(testUser.id);
    });

    it("should return the appointment details for the assigned professional's user", async () => {
        // This assumes the professional profile is linked to testProfessionalUser
        const response = await request(app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${professionalToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testAppointment.id);
        expect(response.body.professionalId).toBe(testProfessional.id);
    });

    it("should return the appointment details for an admin", async () => {
        const response = await request(app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testAppointment.id);
    });

    it("should return 403 for an unrelated user", async () => {
        const response = await request(app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${user2Token}`);
        
        expect(response.status).toBe(403);
    });

    it("should return 401 if not authenticated", async () => {
        const response = await request(app)
            .get(`/api/appointments/${testAppointment.id}`);
        expect(response.status).toBe(401);
    });

    it("should return 404 for an invalid appointment ID", async () => {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .get(`/api/appointments/${invalidId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });

    it("should return 400 for a malformed appointment ID", async () => {
        const malformedId = "invalid-uuid";
        const response = await request(app)
            .get(`/api/appointments/${malformedId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID inválido");
    });
});

describe("PATCH /api/appointments/:id/status", () => {
    let pendingAppointment: any;
    let confirmedAppointment: any;

    beforeEach(async () => {
        // Create fresh appointments for each status test
        const timePending = addHours(setMinutes(setHours(nextTuesday, 11), 0), 0); // Tue 11:00
        const timeConfirmed = addHours(setMinutes(setHours(nextTuesday, 14), 0), 0); // Tue 14:00
        pendingAppointment = await prisma.appointment.create({
            data: {
                date: timePending,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.PENDING,
            }
        });
        confirmedAppointment = await prisma.appointment.create({
            data: {
                date: timeConfirmed,
                userId: testUser2.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });
    });

    afterEach(async () => {
        await prisma.appointment.deleteMany({ where: { id: { in: [pendingAppointment.id, confirmedAppointment.id] } } });
        await prisma.activityLog.deleteMany({ where: { relatedEntityId: { in: [pendingAppointment.id, confirmedAppointment.id] } } });
        await prisma.gamificationEvent.deleteMany({ where: { relatedEntityId: { in: [pendingAppointment.id, confirmedAppointment.id] } } });
    });

    it("should allow admin to confirm a pending appointment", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.CONFIRMED);

        // Check activity log
        const logs = await prisma.activityLog.findMany({ where: { userId: pendingAppointment.userId, relatedEntityId: pendingAppointment.id, type: "APPOINTMENT_CONFIRMED" } });
        expect(logs.length).toBe(1);
    });

    it("should allow owner to cancel a pending appointment with enough notice", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${userToken}`) // Owner token
            .send({ status: AppointmentStatus.CANCELLED });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.CANCELLED);

        // Check activity log
        const logs = await prisma.activityLog.findMany({ where: { userId: pendingAppointment.userId, relatedEntityId: pendingAppointment.id, type: "APPOINTMENT_CANCELLED" } });
        expect(logs.length).toBe(1);
    });

    it("should allow owner to cancel a confirmed appointment with enough notice", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${confirmedAppointment.id}/status`)
            .set("Authorization", `Bearer ${user2Token}`) // Owner token
            .send({ status: AppointmentStatus.CANCELLED });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.CANCELLED);
    });

    it("should deny owner cancellation if too close to appointment time", async () => {
        // Create an appointment starting soon
        const soonTime = addMinutes(new Date(), 90); // 1.5 hours from now (less than MIN_CANCELLATION_HOURS = 2)
        const soonAppt = await prisma.appointment.create({
            data: {
                date: soonTime,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: AppointmentStatus.CONFIRMED,
            }
        });

        const response = await request(app)
            .patch(`/api/appointments/${soonAppt.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: AppointmentStatus.CANCELLED });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("horas de antecedência");

        await prisma.appointment.delete({ where: { id: soonAppt.id } }); // Cleanup
    });

    it("should allow admin to mark a confirmed appointment as completed", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${confirmedAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: AppointmentStatus.COMPLETED });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe(AppointmentStatus.COMPLETED);

        // Check activity log
        const logs = await prisma.activityLog.findMany({ where: { userId: confirmedAppointment.userId, relatedEntityId: confirmedAppointment.id, type: "APPOINTMENT_COMPLETED" } });
        expect(logs.length).toBe(1);

        // Check gamification event
        const gamificationEvent = await prisma.gamificationEvent.findFirst({ where: { userId: confirmedAppointment.userId, relatedEntityId: confirmedAppointment.id, eventType: GamificationEventType.APPOINTMENT_COMPLETED }});
        expect(gamificationEvent).toBeDefined();
    });



    it("should deny non-admin/non-owner from changing status", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${user2Token}`) // Unrelated user
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(403);
    });

    it("should return 400 for invalid status value", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "INVALID" });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Status inválido");
    });

    it("should return 404 for non-existent appointment ID", async () => {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = await request(app)
            .patch(`/api/appointments/${invalidId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(404);
    });

    it("should return 403 for invalid status transition (e.g., PENDING to COMPLETED)", async () => {
        const response = await request(app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: AppointmentStatus.COMPLETED });
        expect(response.status).toBe(403);
        expect(response.body.message).toContain("Transição de status inválida");
    });
});


import { Decimal } from "@prisma/client/runtime/library";