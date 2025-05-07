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
Object.defineProperty(exports, "__esModule", { value: true });
const appointmentController_1 = require("../controllers/appointmentController"); // Assuming helpers are exported or accessible for testing
const professionalRepository_1 = require("../repositories/professionalRepository");
const appointmentRepository_1 = require("../repositories/appointmentRepository");
const scheduleBlockRepository_1 = require("../repositories/scheduleBlockRepository");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
// Mock repositories
jest.mock("../repositories/professionalRepository");
jest.mock("../repositories/appointmentRepository");
jest.mock("../repositories/scheduleBlockRepository");
// Mock Date.now() for consistent testing of time differences
const MOCK_NOW = new Date("2024-05-05T10:00:00.000Z");
beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_NOW);
});
afterAll(() => {
    jest.useRealTimers();
});
beforeEach(() => {
    jest.clearAllMocks();
});
describe("Appointment Controller Helpers", () => {
    describe("parseDuration", () => {
        it("should parse minutes correctly (e.g., \"30min\")", () => {
            expect((0, appointmentController_1.parseDuration)("30min")).toBe(30);
        });
        it("should parse minutes correctly (e.g., \"60\")", () => {
            expect((0, appointmentController_1.parseDuration)("60")).toBe(60);
        });
        it("should parse hours correctly (e.g., \"1h\")", () => {
            expect((0, appointmentController_1.parseDuration)("1h")).toBe(60);
        });
        it("should parse hours correctly (e.g., \"2h\")", () => {
            expect((0, appointmentController_1.parseDuration)("2h")).toBe(120);
        });
        it("should parse hours and minutes correctly (e.g., \"1h30min\")", () => {
            expect((0, appointmentController_1.parseDuration)("1h30min")).toBe(90);
        });
        it("should parse hours and minutes correctly (e.g., \"2h15min\")", () => {
            expect((0, appointmentController_1.parseDuration)("2h15min")).toBe(135);
        });
        it("should return null for invalid format (e.g., \"abc\")", () => {
            expect((0, appointmentController_1.parseDuration)("abc")).toBeNull();
        });
        it("should return null for empty string", () => {
            expect((0, appointmentController_1.parseDuration)("")).toBeNull();
        });
        it("should return null for mixed invalid format (e.g., \"1 hour 30 mins\")", () => {
            expect((0, appointmentController_1.parseDuration)("1 hour 30 mins")).toBeNull();
        });
    });
    describe("getWorkingHoursForDay", () => {
        const testDate = new Date("2024-05-06T12:00:00.000Z"); // Monday
        const dayStart = (0, date_fns_1.startOfDay)(testDate);
        it("should return correct start and end dates for a valid working hour entry", () => {
            const workingHoursJson = { 1: { start: "09:00", end: "17:30" } }; // Monday 9:00 - 17:30
            const expectedStart = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(dayStart, 9), 0), 0);
            const expectedEnd = (0, date_fns_1.setSeconds)((0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(dayStart, 17), 30), 0);
            expect((0, appointmentController_1.getWorkingHoursForDay)(workingHoursJson, testDate)).toEqual({ start: expectedStart, end: expectedEnd });
        });
        it("should return null if no entry for the specific day", () => {
            const workingHoursJson = { 2: { start: "10:00", end: "18:00" } }; // Tuesday only
            expect((0, appointmentController_1.getWorkingHoursForDay)(workingHoursJson, testDate)).toBeNull();
        });
        it("should return null if workingHoursJson is null or undefined", () => {
            expect((0, appointmentController_1.getWorkingHoursForDay)(null, testDate)).toBeNull();
            expect((0, appointmentController_1.getWorkingHoursForDay)(undefined, testDate)).toBeNull();
        });
        it("should return null if workingHoursJson is not an object", () => {
            expect((0, appointmentController_1.getWorkingHoursForDay)("invalid", testDate)).toBeNull();
        });
        it("should return null if day entry is missing start or end", () => {
            const workingHoursJson = { 1: { start: "09:00" } }; // Missing end
            expect((0, appointmentController_1.getWorkingHoursForDay)(workingHoursJson, testDate)).toBeNull();
        });
        it("should return null if start or end time format is invalid", () => {
            const workingHoursJson = { 1: { start: "9am", end: "5:30pm" } }; // Invalid format
            expect((0, appointmentController_1.getWorkingHoursForDay)(workingHoursJson, testDate)).toBeNull();
        });
    });
    describe("checkAvailability", () => {
        const professionalId = "prof-123";
        const appointmentStart = new Date("2024-05-06T14:00:00.000Z"); // Monday 14:00
        const appointmentEnd = new Date("2024-05-06T15:00:00.000Z"); // Monday 15:00 (1 hour duration)
        const mockProfessional = {
            id: professionalId,
            name: "Test Prof",
            role: "Tester",
            image: null,
            bio: "Test bio", // Added bio
            phone: "1234567890", // Added phone
            userId: "user-for-prof-123", // Added userId
            rating: 0,
            totalReviews: 0,
            workingHours: { 1: { start: "09:00", end: "17:00" } }, // Monday 9-5
            companyId: "comp-456",
            createdAt: new Date(),
            updatedAt: new Date(),
            company: null, // Mock company if needed for fallback logic
        };
        it("should return true if slot is within working hours and no conflicts exist", () => __awaiter(void 0, void 0, void 0, function* () {
            professionalRepository_1.professionalRepository.findById.mockResolvedValue(mockProfessional);
            appointmentRepository_1.appointmentRepository.findMany.mockResolvedValue([]); // No conflicting appointments
            scheduleBlockRepository_1.scheduleBlockRepository.findMany.mockResolvedValue([]); // No conflicting blocks
            const isAvailable = yield (0, appointmentController_1.checkAvailability)(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(true);
            expect(professionalRepository_1.professionalRepository.findById).toHaveBeenCalledWith(professionalId);
            expect(appointmentRepository_1.appointmentRepository.findMany).toHaveBeenCalled();
            expect(scheduleBlockRepository_1.scheduleBlockRepository.findMany).toHaveBeenCalled();
        }));
        it("should return false if professional not found", () => __awaiter(void 0, void 0, void 0, function* () {
            professionalRepository_1.professionalRepository.findById.mockResolvedValue(null);
            yield expect((0, appointmentController_1.checkAvailability)(professionalId, appointmentStart, appointmentEnd))
                .rejects.toThrow("Profissional não encontrado para verificação de disponibilidade.");
            expect(appointmentRepository_1.appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository_1.scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        }));
        it("should return false if no working hours defined for the day", () => __awaiter(void 0, void 0, void 0, function* () {
            const profNoMondayHours = Object.assign(Object.assign({}, mockProfessional), { workingHours: { 2: { start: "10:00", end: "18:00" } } });
            professionalRepository_1.professionalRepository.findById.mockResolvedValue(profNoMondayHours);
            const isAvailable = yield (0, appointmentController_1.checkAvailability)(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(false);
            expect(appointmentRepository_1.appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository_1.scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        }));
        it("should return false if slot starts before working hours", () => __awaiter(void 0, void 0, void 0, function* () {
            const earlyStart = new Date("2024-05-06T08:00:00.000Z");
            const earlyEnd = new Date("2024-05-06T09:00:00.000Z");
            professionalRepository_1.professionalRepository.findById.mockResolvedValue(mockProfessional);
            const isAvailable = yield (0, appointmentController_1.checkAvailability)(professionalId, earlyStart, earlyEnd);
            expect(isAvailable).toBe(false);
            expect(appointmentRepository_1.appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository_1.scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        }));
        it("should return false if slot ends after working hours", () => __awaiter(void 0, void 0, void 0, function* () {
            const lateStart = new Date("2024-05-06T16:30:00.000Z");
            const lateEnd = new Date("2024-05-06T17:30:00.000Z");
            professionalRepository_1.professionalRepository.findById.mockResolvedValue(mockProfessional);
            const isAvailable = yield (0, appointmentController_1.checkAvailability)(professionalId, lateStart, lateEnd);
            expect(isAvailable).toBe(false);
            expect(appointmentRepository_1.appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository_1.scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        }));
        it("should return false if there is a conflicting appointment", () => __awaiter(void 0, void 0, void 0, function* () {
            const conflictingAppt = {
                id: "appt-789",
                date: new Date("2024-05-06T14:30:00.000Z"), // Starts during the requested slot
                status: client_1.AppointmentStatus.CONFIRMED,
                userId: "user-xyz",
                serviceId: "serv-abc",
                professionalId: professionalId,
                notes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            professionalRepository_1.professionalRepository.findById.mockResolvedValue(mockProfessional);
            appointmentRepository_1.appointmentRepository.findMany.mockResolvedValue([conflictingAppt]);
            scheduleBlockRepository_1.scheduleBlockRepository.findMany.mockResolvedValue([]);
            const isAvailable = yield (0, appointmentController_1.checkAvailability)(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(false);
            expect(scheduleBlockRepository_1.scheduleBlockRepository.findMany).not.toHaveBeenCalled(); // Should check appointments first
        }));
        it("should return false if there is a conflicting schedule block", () => __awaiter(void 0, void 0, void 0, function* () {
            const conflictingBlock = {
                id: "block-101",
                professionalId: professionalId,
                startTime: new Date("2024-05-06T13:00:00.000Z"),
                endTime: new Date("2024-05-06T14:30:00.000Z"), // Overlaps start
                reason: "Lunch",
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            professionalRepository_1.professionalRepository.findById.mockResolvedValue(mockProfessional);
            appointmentRepository_1.appointmentRepository.findMany.mockResolvedValue([]);
            scheduleBlockRepository_1.scheduleBlockRepository.findMany.mockResolvedValue([conflictingBlock]);
            const isAvailable = yield (0, appointmentController_1.checkAvailability)(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(false);
        }));
        // Add more tests for edge cases: appointment exactly at start/end, block exactly at start/end, etc.
    });
    // Unit tests for MIN_BOOKING_ADVANCE_HOURS and MIN_CANCELLATION_HOURS logic
    // These are typically tested within the controller endpoint tests (integration), 
    // but could be extracted into helper functions if complex.
    // Example (if logic was in a helper):
    // describe("checkBookingAdvanceTime", () => {
    //     it("should return true if booking is far enough in advance", () => {
    //         const futureDate = addHours(MOCK_NOW, MIN_BOOKING_ADVANCE_HOURS + 1);
    //         expect(checkBookingAdvanceTime(futureDate)).toBe(true);
    //     });
    //     it("should return false if booking is too close", () => {
    //         const closeDate = addHours(MOCK_NOW, MIN_BOOKING_ADVANCE_HOURS - 0.5);
    //         expect(checkBookingAdvanceTime(closeDate)).toBe(false);
    //     });
    // });
});
