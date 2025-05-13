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
const index_1 = require("../index"); // Corrected path to app
const prismaClient_1 = require("../utils/prismaClient");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const jwt_1 = require("../utils/jwt"); // Corrected path to jwt utils
const gamificationService_1 = require("../services/gamificationService"); // Added import for enum
// --- Test Data Setup ---
let testUser;
let testUser2; // Second user for permission tests
let testAdmin;
let testProfessionalUser; // User account for the professional
let testCompany;
let testProfessional;
let testService;
let testCategory;
let userToken;
let user2Token;
let adminToken;
let professionalToken;
// Helper to find next specific day of the week (0=Sun, 1=Mon, ...)
const getNextDayOfWeek = (dayOfWeek) => {
    let date = (0, date_fns_1.addDays)(new Date(), 1);
    while (date.getDay() !== dayOfWeek) {
        date = (0, date_fns_1.addDays)(date, 1);
    }
    return (0, date_fns_1.startOfDay)(date);
};
const nextMonday = getNextDayOfWeek(1);
const nextTuesday = getNextDayOfWeek(2);
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up potential leftovers (order matters, children before parents)
    yield prismaClient_1.prisma.appointment.deleteMany();
    yield prismaClient_1.prisma.scheduleBlock.deleteMany();
    yield prismaClient_1.prisma.professionalService.deleteMany();
    yield prismaClient_1.prisma.review.deleteMany();
    yield prismaClient_1.prisma.activityLog.deleteMany();
    yield prismaClient_1.prisma.gamificationEvent.deleteMany();
    yield prismaClient_1.prisma.userBadge.deleteMany();
    yield prismaClient_1.prisma.badge.deleteMany();
    yield prismaClient_1.prisma.service.deleteMany();
    yield prismaClient_1.prisma.category.deleteMany();
    yield prismaClient_1.prisma.professionalExperience.deleteMany();
    yield prismaClient_1.prisma.professionalEducation.deleteMany();
    yield prismaClient_1.prisma.professional.deleteMany();
    yield prismaClient_1.prisma.companyAddress.deleteMany();
    yield prismaClient_1.prisma.company.deleteMany();
    yield prismaClient_1.prisma.userAddress.deleteMany();
    yield prismaClient_1.prisma.user.deleteMany();
    // Create test users
    testUser = yield prismaClient_1.prisma.user.create({
        data: {
            email: "testuser@example.com",
            name: "Test User",
            password: "password123", // Hashed in real app
            role: client_1.UserRole.USER,
            slug: "test-user"
        },
    });
    testUser2 = yield prismaClient_1.prisma.user.create({
        data: {
            email: "testuser2@example.com",
            name: "Test User 2",
            password: "password123",
            role: client_1.UserRole.USER,
            slug: "test-user-2"
        },
    });
    testAdmin = yield prismaClient_1.prisma.user.create({
        data: {
            email: "admin@example.com",
            name: "Test Admin",
            password: "password123",
            role: client_1.UserRole.ADMIN,
            slug: "test-admin"
        },
    });
    testProfessionalUser = yield prismaClient_1.prisma.user.create({
        data: {
            email: "prof@example.com",
            name: "Test Professional User",
            password: "password123",
            role: client_1.UserRole.USER, // Or a specific PROFESSIONAL role if you have one
            slug: "test-professional-user"
        },
    });
    // Create test company
    testCompany = yield prismaClient_1.prisma.company.create({
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
    testProfessional = yield prismaClient_1.prisma.professional.create({
        data: {
            userId: testProfessionalUser.id, // Added userId
            name: testProfessionalUser.name,
            role: "Hair Stylist",
            companyId: testCompany.id,
            // Use company working hours by default
        },
    });
    // Create test category
    testCategory = yield prismaClient_1.prisma.category.create({
        data: { name: "Haircuts" },
    });
    // Create test service
    testService = yield prismaClient_1.prisma.service.create({
        data: {
            name: "Men's Haircut",
            description: "Standard men's haircut",
            price: new library_1.Decimal("30.00"),
            duration: "30min", // 30 minutes
            categoryId: testCategory.id,
            companyId: testCompany.id,
        },
    });
    // Link professional to service
    yield prismaClient_1.prisma.professionalService.create({
        data: {
            professionalId: testProfessional.id,
            serviceId: testService.id,
        },
    });
    // Generate tokens
    userToken = (0, jwt_1.generateToken)({ id: testUser.id, role: testUser.role });
    user2Token = (0, jwt_1.generateToken)({ id: testUser2.id, role: testUser2.role });
    adminToken = (0, jwt_1.generateToken)({ id: testAdmin.id, role: testAdmin.role });
    // Use the professional's *user* account ID for the token if they log in
    professionalToken = (0, jwt_1.generateToken)({ id: testProfessionalUser.id, role: testProfessionalUser.role });
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up test data (children before parents)
    yield prismaClient_1.prisma.appointment.deleteMany();
    yield prismaClient_1.prisma.scheduleBlock.deleteMany();
    yield prismaClient_1.prisma.professionalService.deleteMany();
    yield prismaClient_1.prisma.review.deleteMany();
    yield prismaClient_1.prisma.activityLog.deleteMany();
    yield prismaClient_1.prisma.gamificationEvent.deleteMany();
    yield prismaClient_1.prisma.userBadge.deleteMany();
    yield prismaClient_1.prisma.badge.deleteMany();
    yield prismaClient_1.prisma.service.deleteMany();
    yield prismaClient_1.prisma.category.deleteMany();
    yield prismaClient_1.prisma.professionalExperience.deleteMany();
    yield prismaClient_1.prisma.professionalEducation.deleteMany();
    yield prismaClient_1.prisma.professional.deleteMany();
    yield prismaClient_1.prisma.companyAddress.deleteMany();
    yield prismaClient_1.prisma.company.deleteMany();
    yield prismaClient_1.prisma.userAddress.deleteMany();
    yield prismaClient_1.prisma.user.deleteMany();
    yield prismaClient_1.prisma.$disconnect();
}));
// --- Test Suites ---
describe("GET /api/appointments/availability", () => {
    it("should return available slots for a professional on a working day", () => __awaiter(void 0, void 0, void 0, function* () {
        const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
        const response = yield (0, supertest_1.default)(index_1.app)
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
    }));
    it("should return slots excluding booked times", () => __awaiter(void 0, void 0, void 0, function* () {
        const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
        const bookedTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextMonday, 10), 0); // 10:00
        const conflictingAppt = yield prismaClient_1.prisma.appointment.create({
            data: {
                startTime: bookedTime,
                endTime: new Date(bookedTime.getTime() + 60 * 60 * 1000), // 1 hour duration
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: client_1.AppointmentStatus.CONFIRMED,
            }
        });
        const response = yield (0, supertest_1.default)(index_1.app)
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
        yield prismaClient_1.prisma.appointment.delete({ where: { id: conflictingAppt.id } }); // Clean up
    }));
    it("should return slots excluding schedule blocks", () => __awaiter(void 0, void 0, void 0, function* () {
        const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
        const blockStart = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextMonday, 14), 0); // 14:00
        const blockEnd = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextMonday, 15), 0); // 15:00 (1 hour block)
        const block = yield prismaClient_1.prisma.scheduleBlock.create({
            data: {
                professionalId: testProfessional.id,
                startTime: blockStart,
                endTime: blockEnd,
                reason: "Lunch",
            }
        });
        const response = yield (0, supertest_1.default)(index_1.app)
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
        yield prismaClient_1.prisma.scheduleBlock.delete({ where: { id: block.id } }); // Clean up
    }));
    it("should return empty slots for a non-working day (Sunday)", () => __awaiter(void 0, void 0, void 0, function* () {
        const sunday = getNextDayOfWeek(0);
        const dateString = (0, date_fns_1.formatISO)(sunday, { representation: 'date' });
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/appointments/availability")
            .query({
            date: dateString,
            serviceId: testService.id,
            professionalId: testProfessional.id
        });
        expect(response.status).toBe(200);
        expect(response.body.availableSlots).toEqual([]);
    }));
    it("should return 400 for invalid date format", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/appointments/availability")
            .query({ date: "invalid-date", serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        // Assuming validation middleware adds errors array
        expect(response.body.errors[0].msg).toContain("formato YYYY-MM-DD");
    }));
    it("should return 400 if serviceId is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/appointments/availability")
            .query({ date: dateString, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID do serviço é obrigatório");
    }));
    it("should return 404 if serviceId is invalid or not found", () => __awaiter(void 0, void 0, void 0, function* () {
        const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
        const invalidServiceId = "00000000-0000-0000-0000-000000000000";
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/appointments/availability")
            .query({ date: dateString, serviceId: invalidServiceId, professionalId: testProfessional.id });
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Serviço não encontrado");
    }));
    it("should return 400 if professionalId and companyId are missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/appointments/availability")
            .query({ date: dateString, serviceId: testService.id });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID do profissional ou da empresa é obrigatório");
    }));
    it("should return 404 if professionalId is invalid or not found", () => __awaiter(void 0, void 0, void 0, function* () {
        const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
        const invalidProfId = "00000000-0000-0000-0000-000000000000";
        const response = yield (0, supertest_1.default)(index_1.app)
            .get("/api/appointments/availability")
            .query({ date: dateString, serviceId: testService.id, professionalId: invalidProfId });
        // Depending on implementation, might be 404 for professional or just empty slots
        // Assuming controller checks professional existence:
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Profissional não encontrado");
    }));
});
describe("POST /api/appointments", () => {
    const bookableTime = (0, date_fns_1.addHours)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextMonday, 11), 0), 0); // Next Monday 11:00
    let createdAppointmentId = null;
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up appointment created in the test
        if (createdAppointmentId) {
            yield prismaClient_1.prisma.appointment.deleteMany({ where: { id: createdAppointmentId } });
            yield prismaClient_1.prisma.activityLog.deleteMany({ where: { referenceId: createdAppointmentId } });
            createdAppointmentId = null;
        }
    }));
    it("should create an appointment for an authenticated user in an available slot", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
            date: (0, date_fns_1.formatISO)(bookableTime),
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
        expect(response.body.status).toBe(client_1.AppointmentStatus.PENDING);
        // Check if ActivityLog and Gamification events were triggered (optional but good)
        const activityLogs = yield prismaClient_1.prisma.activityLog.findMany({ where: { userId: testUser.id, referenceId: createdAppointmentId } });
        expect(activityLogs.length).toBeGreaterThanOrEqual(1); // Should have at least one log for creation
        expect(activityLogs[0].activityType).toBe("NEW_APPOINTMENT");
    }));
    it("should return 401 if user is not authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .send({
            date: (0, date_fns_1.formatISO)(bookableTime),
            serviceId: testService.id,
            professionalId: testProfessional.id,
        });
        expect(response.status).toBe(401);
    }));
    it("should return 400 if date is missing", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Data é obrigatória");
    }));
    it("should return 400 if date is in the past", () => __awaiter(void 0, void 0, void 0, function* () {
        const pastDate = (0, date_fns_1.subHours)(new Date(), 2);
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: (0, date_fns_1.formatISO)(pastDate), serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("não pode ser no passado");
    }));
    it("should return 400 if booking too close to current time", () => __awaiter(void 0, void 0, void 0, function* () {
        const tooSoonDate = (0, date_fns_1.addMinutes)(new Date(), 30); // Less than MIN_BOOKING_ADVANCE_HOURS (1 hour)
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: (0, date_fns_1.formatISO)(tooSoonDate), serviceId: testService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("antecedência");
    }));
    it("should return 404 if serviceId is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidServiceId = "00000000-0000-0000-0000-000000000000";
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: (0, date_fns_1.formatISO)(bookableTime), serviceId: invalidServiceId, professionalId: testProfessional.id });
        expect(response.status).toBe(404);
        expect(response.body.message).toContain("Serviço não encontrado");
    }));
    it("should return 400 if professionalId is required but missing", () => __awaiter(void 0, void 0, void 0, function* () {
        // Create a second service offered by another professional
        const otherProf = yield prismaClient_1.prisma.professional.create({ data: { name: "Other Prof", role: "Stylist", companyId: testCompany.id, userId: testUser2.id } }); // Added userId
        yield prismaClient_1.prisma.professionalService.create({ data: { professionalId: otherProf.id, serviceId: testService.id } });
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: (0, date_fns_1.formatISO)(bookableTime), serviceId: testService.id }); // Missing professionalId
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("professionalId é obrigatório");
        // Cleanup
        yield prismaClient_1.prisma.professionalService.deleteMany({ where: { professionalId: otherProf.id } });
        yield prismaClient_1.prisma.professional.delete({ where: { id: otherProf.id } });
    }));
    it("should return 400 if specified professional does not offer the service", () => __awaiter(void 0, void 0, void 0, function* () {
        const otherService = yield prismaClient_1.prisma.service.create({ data: { name: "Other Service", description: "Desc for other service", price: new library_1.Decimal("50.00"), duration: "60min", categoryId: testCategory.id, companyId: testCompany.id } });
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ date: (0, date_fns_1.formatISO)(bookableTime), serviceId: otherService.id, professionalId: testProfessional.id });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("profissional especificado não oferece este serviço");
        yield prismaClient_1.prisma.service.delete({ where: { id: otherService.id } });
    }));
    it("should return 409 if the slot is already booked", () => __awaiter(void 0, void 0, void 0, function* () {
        // First, book the slot
        const firstBooking = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
            date: (0, date_fns_1.formatISO)(bookableTime),
            serviceId: testService.id,
            professionalId: testProfessional.id,
        });
        expect(firstBooking.status).toBe(201);
        createdAppointmentId = firstBooking.body.id;
        // Try to book the same slot again
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${user2Token}`) // Different user
            .send({
            date: (0, date_fns_1.formatISO)(bookableTime),
            serviceId: testService.id,
            professionalId: testProfessional.id,
        });
        expect(response.status).toBe(409); // Conflict
        expect(response.body.message).toContain("Horário indisponível");
    }));
    it("should return 409 if the slot conflicts with a schedule block", () => __awaiter(void 0, void 0, void 0, function* () {
        const blockedTimeStart = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextTuesday, 15), 0); // Next Tuesday 15:00
        const blockedTimeEnd = (0, date_fns_1.addHours)(blockedTimeStart, 1);
        const block = yield prismaClient_1.prisma.scheduleBlock.create({
            data: {
                professionalId: testProfessional.id,
                startTime: blockedTimeStart,
                endTime: blockedTimeEnd,
                reason: "Meeting",
            }
        });
        const response = yield (0, supertest_1.default)(index_1.app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
            date: (0, date_fns_1.formatISO)(blockedTimeStart), // Try to book exactly when block starts
            serviceId: testService.id,
            professionalId: testProfessional.id,
        });
        expect(response.status).toBe(409);
        expect(response.body.message).toContain("Horário indisponível");
        yield prismaClient_1.prisma.scheduleBlock.delete({ where: { id: block.id } });
    }));
});
describe("GET /api/appointments", () => {
    let appointment1;
    let appointment2;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create some appointments for testing filtering/listing
        const time1 = (0, date_fns_1.addHours)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextMonday, 13), 0), 0); // Mon 13:00
        const time2 = (0, date_fns_1.addHours)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextTuesday, 10), 0), 0); // Tue 10:00        appointment1 = await prisma.appointment.create({
        data: {
            startTime: time1,
                endTime;
            (0, date_fns_1.addHours)(time1, 1),
                userId;
            testUser.id,
                serviceId;
            testService.id,
                professionalId;
            testProfessional.id,
                status;
            client_1.AppointmentStatus.CONFIRMED,
            ;
        }
    }));
    appointment2 = yield prismaClient_1.prisma.appointment.create({
        data: {
            startTime: time2,
            endTime: (0, date_fns_1.addHours)(time2, 1),
            userId: testUser2.id, // Different user
            serviceId: testService.id,
            professionalId: testProfessional.id,
            status: client_1.AppointmentStatus.PENDING,
        }
    });
});
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient_1.prisma.appointment.deleteMany({ where: { id: { in: [appointment1.id, appointment2.id] } } });
}));
it("should return appointments for the authenticated user by default", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${userToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(appointment1.id);
    expect(response.body[0].userId).toBe(testUser.id);
}));
it("should allow admin to get all appointments", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    expect(response.body.some((a) => a.id === appointment1.id)).toBe(true);
    expect(response.body.some((a) => a.id === appointment2.id)).toBe(true);
}));
it("should allow admin to filter appointments by userId", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ userId: testUser2.id });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(appointment2.id);
    expect(response.body[0].userId).toBe(testUser2.id);
}));
it("should deny non-admin from getting another user's appointments", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${userToken}`)
        .query({ userId: testUser2.id });
    expect(response.status).toBe(403);
}));
it("should filter appointments by professionalId", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`) // Admin can see all
        .query({ professionalId: testProfessional.id });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    expect(response.body.every((a) => a.professionalId === testProfessional.id)).toBe(true);
}));
it("should filter appointments by status", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ status: client_1.AppointmentStatus.PENDING });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body.every((a) => a.status === client_1.AppointmentStatus.PENDING)).toBe(true);
    expect(response.body.some((a) => a.id === appointment2.id)).toBe(true);
}));
it("should filter appointments by date", () => __awaiter(void 0, void 0, void 0, function* () {
    const dateString = (0, date_fns_1.formatISO)(nextMonday, { representation: 'date' });
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ date: dateString });
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body.every((a) => (0, date_fns_1.startOfDay)(new Date(a.date)).getTime() === nextMonday.getTime())).toBe(true);
    expect(response.body.some((a) => a.id === appointment1.id)).toBe(true);
}));
it("should return 400 for invalid status filter", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ status: "INVALID_STATUS" });
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toContain("Status inválido");
}));
it("should return 400 for invalid date filter format", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, supertest_1.default)(index_1.app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ date: "invalid-date" });
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toContain("formato YYYY-MM-DD");
}));
;
describe("GET /api/appointments/:id", () => {
    let testAppointment;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const time = (0, date_fns_1.addHours)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextMonday, 16), 0), 0); // Mon 16:00
        testAppointment = yield prismaClient_1.prisma.appointment.create({
            data: {
                date: time,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: client_1.AppointmentStatus.CONFIRMED,
            }
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaClient_1.prisma.appointment.delete({ where: { id: testAppointment.id } });
    }));
    it("should return the appointment details for the owner", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testAppointment.id);
        expect(response.body.userId).toBe(testUser.id);
    }));
    it("should return the appointment details for the assigned professional's user", () => __awaiter(void 0, void 0, void 0, function* () {
        // This assumes the professional profile is linked to testProfessionalUser
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${professionalToken}`);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testAppointment.id);
        expect(response.body.professionalId).toBe(testProfessional.id);
    }));
    it("should return the appointment details for an admin", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testAppointment.id);
    }));
    it("should return 403 for an unrelated user", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/appointments/${testAppointment.id}`)
            .set("Authorization", `Bearer ${user2Token}`);
        expect(response.status).toBe(403);
    }));
    it("should return 401 if not authenticated", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/appointments/${testAppointment.id}`);
        expect(response.status).toBe(401);
    }));
    it("should return 404 for an invalid appointment ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/appointments/${invalidId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    }));
    it("should return 400 for a malformed appointment ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const malformedId = "invalid-uuid";
        const response = yield (0, supertest_1.default)(index_1.app)
            .get(`/api/appointments/${malformedId}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("ID inválido");
    }));
});
describe("PATCH /api/appointments/:id/status", () => {
    let pendingAppointment;
    let confirmedAppointment;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create fresh appointments for each status test
        const timePending = (0, date_fns_1.addHours)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextTuesday, 11), 0), 0); // Tue 11:00
        const timeConfirmed = (0, date_fns_1.addHours)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(nextTuesday, 14), 0), 0); // Tue 14:00
        pendingAppointment = yield prismaClient_1.prisma.appointment.create({
            data: {
                date: timePending,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: client_1.AppointmentStatus.PENDING,
            }
        });
        confirmedAppointment = yield prismaClient_1.prisma.appointment.create({
            data: {
                date: timeConfirmed,
                userId: testUser2.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: client_1.AppointmentStatus.CONFIRMED,
            }
        });
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaClient_1.prisma.appointment.deleteMany({ where: { id: { in: [pendingAppointment.id, confirmedAppointment.id] } } });
        yield prismaClient_1.prisma.activityLog.deleteMany({ where: { referenceId: { in: [pendingAppointment.id, confirmedAppointment.id] } } });
    }));
    it("should allow admin to confirm a pending appointment", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: client_1.AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(client_1.AppointmentStatus.CONFIRMED);
        // Check activity log
        const logs = yield prismaClient_1.prisma.activityLog.findMany({ where: { userId: pendingAppointment.userId, referenceId: pendingAppointment.id, activityType: "APPOINTMENT_CONFIRMED" } });
        expect(logs.length).toBe(1);
    }));
    it("should allow owner to cancel a pending appointment with enough notice", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${userToken}`) // Owner token
            .send({ status: client_1.AppointmentStatus.CANCELLED });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(client_1.AppointmentStatus.CANCELLED);
        // Check activity log
        const logs = yield prismaClient_1.prisma.activityLog.findMany({ where: { userId: pendingAppointment.userId, referenceId: pendingAppointment.id, activityType: "APPOINTMENT_CANCELLED" } });
        expect(logs.length).toBe(1);
    }));
    it("should allow owner to cancel a confirmed appointment with enough notice", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${confirmedAppointment.id}/status`)
            .set("Authorization", `Bearer ${user2Token}`) // Owner token
            .send({ status: client_1.AppointmentStatus.CANCELLED });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(client_1.AppointmentStatus.CANCELLED);
    }));
    it("should deny owner cancellation if too close to appointment time", () => __awaiter(void 0, void 0, void 0, function* () {
        // Create an appointment starting soon
        const soonTime = (0, date_fns_1.addMinutes)(new Date(), 90); // 1.5 hours from now (less than MIN_CANCELLATION_HOURS = 2)
        const soonAppt = yield prismaClient_1.prisma.appointment.create({
            data: {
                date: soonTime,
                userId: testUser.id,
                serviceId: testService.id,
                professionalId: testProfessional.id,
                status: client_1.AppointmentStatus.CONFIRMED,
            }
        });
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${soonAppt.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: client_1.AppointmentStatus.CANCELLED });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("horas de antecedência");
        yield prismaClient_1.prisma.appointment.delete({ where: { id: soonAppt.id } }); // Cleanup
    }));
    it("should allow admin to mark a confirmed appointment as completed", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${confirmedAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: client_1.AppointmentStatus.COMPLETED });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(client_1.AppointmentStatus.COMPLETED);
        // Check activity log
        const logs = yield prismaClient_1.prisma.activityLog.findMany({ where: { userId: confirmedAppointment.userId, referenceId: confirmedAppointment.id, activityType: "APPOINTMENT_COMPLETED" } });
        expect(logs.length).toBe(1);
        // Check gamification event
        const gamificationEvent = yield prismaClient_1.prisma.gamificationEvent.findFirst({ where: { userId: confirmedAppointment.userId, eventType: gamificationService_1.GamificationEventType.APPOINTMENT_COMPLETED } });
        expect(gamificationEvent).toBeDefined();
    }));
    it("should deny non-admin/non-owner from changing status", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${user2Token}`) // Unrelated user
            .send({ status: client_1.AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(403);
    }));
    it("should return 400 for invalid status value", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "INVALID" });
        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain("Status inválido");
    }));
    it("should return 404 for non-existent appointment ID", () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidId = "00000000-0000-0000-0000-000000000000";
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${invalidId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: client_1.AppointmentStatus.CONFIRMED });
        expect(response.status).toBe(404);
    }));
    it("should return 403 for invalid status transition (e.g., PENDING to COMPLETED)", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(index_1.app)
            .patch(`/api/appointments/${pendingAppointment.id}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: client_1.AppointmentStatus.COMPLETED });
        expect(response.status).toBe(403);
        expect(response.body.message).toContain("Transição de status inválida");
    }));
});
const library_1 = require("@prisma/client/runtime/library");
