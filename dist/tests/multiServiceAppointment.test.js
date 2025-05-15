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
const index_1 = require("../index");
const prismaClient_1 = require("../utils/prismaClient");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const jwt_1 = require("../utils/jwt");
const library_1 = require("@prisma/client/runtime/library");
// Fix for Decimal class in Jest tests
jest.mock('@prisma/client/runtime/library', () => {
    return {
        Decimal: function (value) {
            return parseFloat(value);
        }
    };
});
// --- Test Data Setup ---
let testUser;
let testProfessionalUser;
let testCompany;
let testProfessional;
let testService1;
let testService2;
let testCategory;
let userToken;
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
const bookableTime = (0, date_fns_1.setHours)((0, date_fns_1.setMinutes)((0, date_fns_1.addDays)(new Date(), 2), 0), 10); // 10:00 AM, 2 days from now
describe("Multi-Service Appointment Tests", () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Cleanup any existing test data
        yield prismaClient_1.prisma.appointment.deleteMany({ where: { user: { email: "multiservicetest@example.com" } } });
        yield prismaClient_1.prisma.professionalService.deleteMany({ where: { professional: { name: "Multi Service Test Professional" } } });
        yield prismaClient_1.prisma.service.deleteMany({ where: { name: { contains: "Multi Test Service" } } });
        yield prismaClient_1.prisma.professional.deleteMany({ where: { name: "Multi Service Test Professional" } });
        yield prismaClient_1.prisma.user.deleteMany({ where: { email: { in: ["multiservicetest@example.com", "multitestprof@example.com"] } } });
        yield prismaClient_1.prisma.company.deleteMany({ where: { name: "Multi Service Test Company" } });
        yield prismaClient_1.prisma.category.deleteMany({ where: { name: "Multi Test Category" } });
        // Create test user
        testUser = yield prismaClient_1.prisma.user.create({
            data: {
                email: "multiservicetest@example.com",
                name: "Multi Service Test User",
                password: "password123",
                role: client_1.UserRole.USER,
                slug: "multi-service-test-user"
            }
        });
        testProfessionalUser = yield prismaClient_1.prisma.user.create({
            data: {
                email: "multitestprof@example.com",
                name: "Multi Service Test Professional User",
                password: "password123",
                role: client_1.UserRole.USER,
                slug: "multi-service-test-professional"
            }
        });
        // Create test company
        testCompany = yield prismaClient_1.prisma.company.create({
            data: {
                name: "Multi Service Test Company",
                description: "A test company for multi-service tests",
                workingHours: {
                    // Mon-Fri: 9am - 6pm
                    1: { start: "09:00", end: "18:00" },
                    2: { start: "09:00", end: "18:00" },
                    3: { start: "09:00", end: "18:00" },
                    4: { start: "09:00", end: "18:00" },
                    5: { start: "09:00", end: "18:00" },
                    // Sat-Sun: Closed
                    0: null,
                    6: null,
                },
            }
        });
        // Create test professional
        testProfessional = yield prismaClient_1.prisma.professional.create({
            data: {
                userId: testProfessionalUser.id,
                name: "Multi Service Test Professional",
                role: "Hair Stylist",
                companyId: testCompany.id,
            }
        });
        // Create test category
        testCategory = yield prismaClient_1.prisma.category.create({
            data: { name: "Multi Test Category" }
        });
        // Create test services
        testService1 = yield prismaClient_1.prisma.service.create({
            data: {
                name: "Multi Test Service 1",
                description: "First test service",
                price: new library_1.Decimal("30.00"),
                duration: "PT30M", // 30 minutes in ISO 8601
                categoryId: testCategory.id,
                companyId: testCompany.id,
            }
        });
        testService2 = yield prismaClient_1.prisma.service.create({
            data: {
                name: "Multi Test Service 2",
                description: "Second test service",
                price: new library_1.Decimal("45.00"),
                duration: "PT45M", // 45 minutes in ISO 8601
                categoryId: testCategory.id,
                companyId: testCompany.id,
            }
        });
        // Link professional to services
        yield prismaClient_1.prisma.professionalService.create({
            data: {
                professionalId: testProfessional.id,
                serviceId: testService1.id,
            }
        });
        yield prismaClient_1.prisma.professionalService.create({
            data: {
                professionalId: testProfessional.id,
                serviceId: testService2.id,
            }
        });
        // Generate tokens
        userToken = (0, jwt_1.generateToken)({ id: testUser.id, role: testUser.role });
        professionalToken = (0, jwt_1.generateToken)({ id: testProfessionalUser.id, role: testProfessionalUser.role });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up
        yield prismaClient_1.prisma.appointment.deleteMany({ where: { user: { email: "multiservicetest@example.com" } } });
        yield prismaClient_1.prisma.professionalService.deleteMany({ where: { professional: { name: "Multi Service Test Professional" } } });
        yield prismaClient_1.prisma.service.deleteMany({ where: { name: { contains: "Multi Test Service" } } });
        yield prismaClient_1.prisma.professional.deleteMany({ where: { name: "Multi Service Test Professional" } });
        yield prismaClient_1.prisma.user.deleteMany({ where: { email: { in: ["multiservicetest@example.com", "multitestprof@example.com"] } } });
        yield prismaClient_1.prisma.company.deleteMany({ where: { name: "Multi Service Test Company" } });
        yield prismaClient_1.prisma.category.deleteMany({ where: { name: "Multi Test Category" } });
        yield prismaClient_1.prisma.$disconnect();
    }));
    describe("Creating Appointments with Multiple Services", () => {
        it("should create an appointment with multiple services", () => __awaiter(void 0, void 0, void 0, function* () {
            // Prepare date in ISO format
            const appointmentDate = (0, date_fns_1.formatISO)(bookableTime).split('T')[0];
            const appointmentTime = bookableTime.toTimeString().slice(0, 5);
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/appointments")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                date: appointmentDate,
                time: appointmentTime,
                serviceIds: [testService1.id, testService2.id], // Multiple services
                professionalId: testProfessional.id,
                notes: "Test multi-service appointment"
            });
            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            // Verify the appointment was created correctly
            const appointmentId = response.body.id;
            const retrieveResponse = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/appointments/${appointmentId}`)
                .set("Authorization", `Bearer ${userToken}`);
            expect(retrieveResponse.status).toBe(200);
            expect(retrieveResponse.body.services).toHaveLength(2);
            // Verify the services in the appointment
            const serviceIds = retrieveResponse.body.services.map((s) => s.serviceId || (s.service && s.service.id)).sort();
            expect(serviceIds).toEqual([testService1.id, testService2.id].sort());
            // Check if the total duration is correct (30 + 45 = 75 minutes)
            const startTime = (0, date_fns_1.parseISO)(retrieveResponse.body.startTime);
            const endTime = (0, date_fns_1.parseISO)(retrieveResponse.body.endTime);
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            expect(durationMinutes).toBe(75);
        }));
        it("should still support legacy format with serviceId", () => __awaiter(void 0, void 0, void 0, function* () {
            // Prepare date in ISO format
            const appointmentDate = (0, date_fns_1.formatISO)((0, date_fns_1.addHours)(bookableTime, 2)).split('T')[0];
            const appointmentTime = (0, date_fns_1.addHours)(bookableTime, 2).toTimeString().slice(0, 5);
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/appointments")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                date: appointmentDate,
                time: appointmentTime,
                serviceId: testService1.id, // Legacy format
                professionalId: testProfessional.id,
                notes: "Test legacy format appointment"
            });
            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
            // Verify the appointment was created correctly
            const appointmentId = response.body.id;
            const retrieveResponse = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/appointments/${appointmentId}`)
                .set("Authorization", `Bearer ${userToken}`);
            expect(retrieveResponse.status).toBe(200);
            expect(retrieveResponse.body.services).toHaveLength(1);
            const serviceId = retrieveResponse.body.services[0].serviceId ||
                (retrieveResponse.body.services[0].service && retrieveResponse.body.services[0].service.id);
            expect(serviceId).toEqual(testService1.id);
        }));
        it("should reject if one of the services is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
            // Prepare date in ISO format
            const appointmentDate = (0, date_fns_1.formatISO)((0, date_fns_1.addHours)(bookableTime, 4)).split('T')[0];
            const appointmentTime = (0, date_fns_1.addHours)(bookableTime, 4).toTimeString().slice(0, 5);
            const invalidServiceId = "00000000-0000-0000-0000-000000000000";
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/appointments")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                date: appointmentDate,
                time: appointmentTime,
                serviceIds: [testService1.id, invalidServiceId], // One valid, one invalid
                professionalId: testProfessional.id,
                notes: "Test with invalid service"
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toContain("serviço");
        }));
        it("should require either serviceIds or serviceId field", () => __awaiter(void 0, void 0, void 0, function* () {
            // Prepare date in ISO format
            const appointmentDate = (0, date_fns_1.formatISO)((0, date_fns_1.addHours)(bookableTime, 6)).split('T')[0];
            const appointmentTime = (0, date_fns_1.addHours)(bookableTime, 6).toTimeString().slice(0, 5);
            const response = yield (0, supertest_1.default)(index_1.app)
                .post("/api/appointments")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                date: appointmentDate,
                time: appointmentTime,
                // No serviceIds or serviceId
                professionalId: testProfessional.id,
                notes: "Test without service specification"
            });
            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            // Check that the error relates to the missing service field
            expect(response.body.errors.some((e) => e.message && (e.message.includes("serviço") || e.message.includes("service")))).toBeTruthy();
        }));
    });
});
