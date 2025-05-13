import {
    parseDuration,
    getWorkingHoursForDay,
    checkAvailability,
    MIN_BOOKING_ADVANCE_HOURS,
    MIN_CANCELLATION_HOURS
} from "../controllers/appointmentController"; // Assuming helpers are exported or accessible for testing
import { professionalRepository } from "../repositories/professionalRepository";
import { appointmentRepository } from "../repositories/appointmentRepository";
import { scheduleBlockRepository } from "../repositories/scheduleBlockRepository";
import { AppointmentStatus, Professional, Company, Appointment, ScheduleBlock } from "@prisma/client";
import { parseISO, addMinutes, getDay, setHours, setMinutes, setSeconds, startOfDay, addHours, subHours } from "date-fns";

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
            expect(parseDuration("30min")).toBe(30);
        });
        it("should parse minutes correctly (e.g., \"60\")", () => {
            expect(parseDuration("60")).toBe(60);
        });
        it("should parse hours correctly (e.g., \"1h\")", () => {
            expect(parseDuration("1h")).toBe(60);
        });
        it("should parse hours correctly (e.g., \"2h\")", () => {
            expect(parseDuration("2h")).toBe(120);
        });
        it("should parse hours and minutes correctly (e.g., \"1h30min\")", () => {
            expect(parseDuration("1h30min")).toBe(90);
        });
         it("should parse hours and minutes correctly (e.g., \"2h15min\")", () => {
            expect(parseDuration("2h15min")).toBe(135);
        });
        it("should return null for invalid format (e.g., \"abc\")", () => {
            expect(parseDuration("abc")).toBeNull();
        });
        it("should return null for empty string", () => {
            expect(parseDuration("")).toBeNull();
        });
         it("should return null for mixed invalid format (e.g., \"1 hour 30 mins\")", () => {
            expect(parseDuration("1 hour 30 mins")).toBeNull();
        });
    });

    describe("getWorkingHoursForDay", () => {
        const testDate = new Date("2024-05-06T12:00:00.000Z"); // Monday
        const dayStart = startOfDay(testDate);

        it("should return correct start and end dates for a valid working hour entry", () => {
            const workingHoursJson = { 1: { start: "09:00", end: "17:30" } }; // Monday 9:00 - 17:30
            const expectedStart = setSeconds(setMinutes(setHours(dayStart, 9), 0), 0);
            const expectedEnd = setSeconds(setMinutes(setHours(dayStart, 17), 30), 0);
            expect(getWorkingHoursForDay(workingHoursJson, testDate)).toEqual({ start: expectedStart, end: expectedEnd });
        });

        it("should return null if no entry for the specific day", () => {
            const workingHoursJson = { 2: { start: "10:00", end: "18:00" } }; // Tuesday only
            expect(getWorkingHoursForDay(workingHoursJson, testDate)).toBeNull();
        });

        it("should return null if workingHoursJson is null or undefined", () => {
            expect(getWorkingHoursForDay(null, testDate)).toBeNull();
            expect(getWorkingHoursForDay(undefined, testDate)).toBeNull();
        });

        it("should return null if workingHoursJson is not an object", () => {
            expect(getWorkingHoursForDay("invalid", testDate)).toBeNull();
        });

        it("should return null if day entry is missing start or end", () => {
            const workingHoursJson = { 1: { start: "09:00" } }; // Missing end
            expect(getWorkingHoursForDay(workingHoursJson, testDate)).toBeNull();
        });

        it("should return null if start or end time format is invalid", () => {
            const workingHoursJson = { 1: { start: "9am", end: "5:30pm" } }; // Invalid format
            expect(getWorkingHoursForDay(workingHoursJson, testDate)).toBeNull();
        });
    });

    describe("checkAvailability", () => {
        const professionalId = "prof-123";
        const appointmentStart = new Date("2024-05-06T14:00:00.000Z"); // Monday 14:00
        const appointmentEnd = new Date("2024-05-06T15:00:00.000Z"); // Monday 15:00 (1 hour duration)

        const mockProfessional: Professional & { company: Company | null } = {
            id: professionalId,
            name: "Test Prof",
            role: "Tester",
            image: null,
            coverImage: null,
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

        it("should return true if slot is within working hours and no conflicts exist", async () => {
            (professionalRepository.findById as jest.Mock).mockResolvedValue(mockProfessional);
            (appointmentRepository.findMany as jest.Mock).mockResolvedValue([]); // No conflicting appointments
            (scheduleBlockRepository.findMany as jest.Mock).mockResolvedValue([]); // No conflicting blocks

            const isAvailable = await checkAvailability(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(true);
            expect(professionalRepository.findById).toHaveBeenCalledWith(professionalId);
            expect(appointmentRepository.findMany).toHaveBeenCalled();
            expect(scheduleBlockRepository.findMany).toHaveBeenCalled();
        });

        it("should return false if professional not found", async () => {
            (professionalRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(checkAvailability(professionalId, appointmentStart, appointmentEnd))
                  .rejects.toThrow("Profissional não encontrado para verificação de disponibilidade.");
            expect(appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        });

        it("should return false if no working hours defined for the day", async () => {
            const profNoMondayHours = { ...mockProfessional, workingHours: { 2: { start: "10:00", end: "18:00" } } };
            (professionalRepository.findById as jest.Mock).mockResolvedValue(profNoMondayHours);

            const isAvailable = await checkAvailability(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(false);
            expect(appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        });

        it("should return false if slot starts before working hours", async () => {
            const earlyStart = new Date("2024-05-06T08:00:00.000Z");
            const earlyEnd = new Date("2024-05-06T09:00:00.000Z");
            (professionalRepository.findById as jest.Mock).mockResolvedValue(mockProfessional);

            const isAvailable = await checkAvailability(professionalId, earlyStart, earlyEnd);
            expect(isAvailable).toBe(false);
            expect(appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        });

        it("should return false if slot ends after working hours", async () => {
            const lateStart = new Date("2024-05-06T16:30:00.000Z");
            const lateEnd = new Date("2024-05-06T17:30:00.000Z");
            (professionalRepository.findById as jest.Mock).mockResolvedValue(mockProfessional);

            const isAvailable = await checkAvailability(professionalId, lateStart, lateEnd);
            expect(isAvailable).toBe(false);
            expect(appointmentRepository.findMany).not.toHaveBeenCalled();
            expect(scheduleBlockRepository.findMany).not.toHaveBeenCalled();
        });        it("should return false if there is a conflicting appointment", async () => {
            const conflictingAppt: Appointment = {
                id: "appt-789",
                startTime: new Date("2024-05-06T14:30:00.000Z"), // Starts during the requested slot
                endTime: new Date("2024-05-06T15:30:00.000Z"), // Ends an hour later
                companyId: null, // Added this field
                status: AppointmentStatus.CONFIRMED,
                userId: "user-xyz",
                serviceId: "serv-abc",
                professionalId: professionalId,
                notes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            (professionalRepository.findById as jest.Mock).mockResolvedValue(mockProfessional);
            (appointmentRepository.findMany as jest.Mock).mockResolvedValue([conflictingAppt]);
            (scheduleBlockRepository.findMany as jest.Mock).mockResolvedValue([]);

            const isAvailable = await checkAvailability(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(false);
            expect(scheduleBlockRepository.findMany).not.toHaveBeenCalled(); // Should check appointments first
        });

        it("should return false if there is a conflicting schedule block", async () => {
            const conflictingBlock: ScheduleBlock = {
                id: "block-101",
                professionalId: professionalId,
                startTime: new Date("2024-05-06T13:00:00.000Z"),
                endTime: new Date("2024-05-06T14:30:00.000Z"), // Overlaps start
                reason: "Lunch",
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            (professionalRepository.findById as jest.Mock).mockResolvedValue(mockProfessional);
            (appointmentRepository.findMany as jest.Mock).mockResolvedValue([]);
            (scheduleBlockRepository.findMany as jest.Mock).mockResolvedValue([conflictingBlock]);

            const isAvailable = await checkAvailability(professionalId, appointmentStart, appointmentEnd);
            expect(isAvailable).toBe(false);
        });

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

