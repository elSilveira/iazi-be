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
const index_1 = require("../index"); // Import the configured app
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// --- Mock Prisma Client --- //
// Define the mock object structure *inside* the factory
jest.mock('@prisma/client', () => {
    // Define the mock object structure first, inside the factory
    const mockPrismaObject = {
        user: {
            findUnique: jest.fn(),
        },
        service: {
            findUnique: jest.fn(),
        },
        professional: {
            findUnique: jest.fn(),
        },
        appointment: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    };
    // Define the mock error class within the mock factory if needed
    class MockPrismaClientKnownRequestError extends Error {
        constructor(message, code, clientVersion, meta) {
            super(message);
            this.code = code;
            this.meta = meta;
            this.name = 'PrismaClientKnownRequestError';
        }
    }
    return {
        // Return the mock constructor that returns the mock object
        PrismaClient: jest.fn(() => mockPrismaObject),
        AppointmentStatus: {
            PENDING: 'PENDING',
            CONFIRMED: 'CONFIRMED',
            COMPLETED: 'COMPLETED',
            CANCELLED: 'CANCELLED',
        },
        Prisma: {
            PrismaClientKnownRequestError: MockPrismaClientKnownRequestError
        },
        // Export the mock object itself so it can be accessed in tests
        mockPrisma: mockPrismaObject
    };
});
// Use a valid UUID for the test user ID in the mock middleware
const testUserIdUUID = '123e4567-e89b-12d3-a456-426614174000';
jest.mock('../middlewares/authMiddleware', () => ({
    authMiddleware: (req, res, next) => {
        var _a;
        if ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith('Bearer ')) {
            req.user = { id: testUserIdUUID }; // Use valid UUID
        }
        next();
    }
}));
// Test JWT secret (ensure it's defined)
const testJwtSecret = process.env.JWT_SECRET || 'test_jwt_secret';
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = testJwtSecret;
}
// Import the mockPrisma object exported from the mock
const { mockPrisma } = jest.requireMock('@prisma/client');
describe('Appointment API Integration Tests', () => {
    let authToken;
    // Use valid UUIDs for test IDs
    const testServiceIdUUID = '123e4567-e89b-12d3-a456-426614174001';
    const testProfessionalIdUUID = '123e4567-e89b-12d3-a456-426614174002';
    const testAppointmentIdUUID = '123e4567-e89b-12d3-a456-426614174003';
    beforeAll(() => {
        // Sign token with the valid UUID
        authToken = jsonwebtoken_1.default.sign({ userId: testUserIdUUID, email: 'test@example.com' }, testJwtSecret, { expiresIn: '1h' });
    });
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset specific mocks using the imported mockPrisma object
        mockPrisma.appointment.create.mockReset();
        mockPrisma.appointment.findMany.mockReset();
        mockPrisma.service.findUnique.mockReset();
        mockPrisma.professional.findUnique.mockReset();
    });
    // --- POST /api/appointments --- //
    describe('POST /api/appointments', () => {
        it('should create a new appointment successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + 1);
            const appointmentEnd = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later
            const appointmentData = {
                startTime: appointmentDate.toISOString(),
                endTime: appointmentEnd.toISOString(),
                serviceId: testServiceIdUUID, // Use valid UUID
                professionalId: testProfessionalIdUUID, // Use valid UUID
                notes: 'Test appointment notes',
            };
            const mockCreatedAppointment = {
                id: testAppointmentIdUUID, // Use valid UUID
                startTime: appointmentDate,
                endTime: appointmentEnd,
                userId: testUserIdUUID, // Use valid UUID
                serviceId: testServiceIdUUID, // Use valid UUID
                professionalId: testProfessionalIdUUID, // Use valid UUID
                notes: 'Test appointment notes',
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Mock Prisma calls expected by the controller
            mockPrisma.service.findUnique.mockResolvedValue({ id: testServiceIdUUID });
            mockPrisma.professional.findUnique.mockResolvedValue({ id: testProfessionalIdUUID });
            mockPrisma.appointment.create.mockResolvedValue(mockCreatedAppointment);
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`)
                .send(appointmentData);
            // Assertions
            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('id', testAppointmentIdUUID);
            expect(response.body).toHaveProperty('userId', testUserIdUUID);
            expect(mockPrisma.appointment.create).toHaveBeenCalledTimes(1);
            expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
                data: {
                    startTime: expect.any(Date),
                    endTime: expect.any(Date),
                    notes: 'Test appointment notes',
                    user: { connect: { id: testUserIdUUID } }, // Controller gets this from req.user (mocked)
                    service: { connect: { id: testServiceIdUUID } },
                    professional: { connect: { id: testProfessionalIdUUID } },
                },
            });
        }));
        it('should return 401 if no token is provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + 1);
            const appointmentEnd = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later
            const appointmentData = {
                startTime: appointmentDate.toISOString(),
                endTime: appointmentEnd.toISOString(),
                serviceId: testServiceIdUUID, // Use valid UUID
                professionalId: testProfessionalIdUUID, // Use valid UUID
            };
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/appointments')
                .send(appointmentData);
            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('message', 'Usuário não autenticado.');
            expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
        }));
        it('should return 400 if required fields are missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const appointmentData = {
                notes: 'Incomplete data',
            };
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`)
                .send(appointmentData);
            expect(response.statusCode).toBe(400);
            // Updated expected message based on validator
            expect(response.body.errors[0].msg).toBe("Data inválida");
            expect(response.body.errors[1].msg).toBe("ID do serviço inválido");
            // professionalId is optional according to validator
            // expect(response.body.errors[2].msg).toBe("ID do profissional inválido");
            expect(mockPrisma.appointment.create).not.toHaveBeenCalled();
        }));
        it('should return 404 if service or professional does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + 1);
            const appointmentEnd = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later
            const appointmentData = {
                startTime: appointmentDate.toISOString(),
                endTime: appointmentEnd.toISOString(),
                serviceId: '123e4567-e89b-12d3-a456-426614174999', // Use a valid UUID format, but non-existent
                professionalId: testProfessionalIdUUID, // Use valid UUID
            };
            // Mock service and professional lookups
            mockPrisma.service.findUnique.mockResolvedValue(null); // Simulate service not found
            mockPrisma.professional.findUnique.mockResolvedValue({ id: testProfessionalIdUUID });
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`)
                .send(appointmentData);
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('message', 'Serviço ou Profissional não encontrado.');
            expect(mockPrisma.appointment.create).not.toHaveBeenCalled(); // create should not be called if service/prof not found
            expect(mockPrisma.service.findUnique).toHaveBeenCalledTimes(1);
            // Depending on controller logic, professional lookup might not happen if service fails first
            // expect(mockPrisma.professional.findUnique).toHaveBeenCalledTimes(1); 
        }));
    });
    // --- GET /api/appointments --- //
    describe('GET /api/appointments', () => {
        it('should return a list of appointments for the authenticated user', () => __awaiter(void 0, void 0, void 0, function* () {
            const now = new Date();
            const mockAppointments = [
                { id: '123e4567-e89b-12d3-a456-426614174010', userId: testUserIdUUID, serviceId: 'svc-1', professionalId: 'prof-1', startTime: now, endTime: new Date(now.getTime() + 60 * 60 * 1000), status: 'CONFIRMED' },
                { id: '123e4567-e89b-12d3-a456-426614174011', userId: testUserIdUUID, serviceId: 'svc-2', professionalId: 'prof-2', startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), status: 'PENDING' },
            ];
            mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/appointments')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.statusCode).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(2);
            expect(response.body[0].id).toBe('123e4567-e89b-12d3-a456-426614174010');
            expect(mockPrisma.appointment.findMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ userId: testUserIdUUID })
            }));
        }));
        it('should return 401 if no token is provided and no professionalId filter', () => __awaiter(void 0, void 0, void 0, function* () {
            // This test case seems incorrect based on the controller logic implied by other tests.
            // If not authenticated, it should likely return 401, not 400.
            // Let's adjust the expectation to 401.
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/appointments');
            expect(response.statusCode).toBe(401); // Expect 401 for unauthenticated access
            expect(response.body).toHaveProperty('message', 'Usuário não autenticado.');
            expect(mockPrisma.appointment.findMany).not.toHaveBeenCalled();
        }));
        it('should return a list of appointments filtered by professionalId (even if not authenticated)', () => __awaiter(void 0, void 0, void 0, function* () {
            // The API might allow fetching appointments by professional ID without authentication
            const professionalFilterIdUUID = '123e4567-e89b-12d3-a456-426614174020'; // Use valid UUID
            const now = new Date();
            const mockAppointments = [
                { id: '123e4567-e89b-12d3-a456-426614174021', userId: 'user-other', serviceId: 'svc-3', professionalId: professionalFilterIdUUID, startTime: now, endTime: new Date(now.getTime() + 60 * 60 * 1000), status: 'CONFIRMED' },
            ];
            mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/appointments?professionalId=${professionalFilterIdUUID}`); // No auth token
            // .set('Authorization', `Bearer ${authToken}`); 
            expect(response.statusCode).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(1);
            expect(response.body[0].professionalId).toBe(professionalFilterIdUUID);
            expect(mockPrisma.appointment.findMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ professionalId: professionalFilterIdUUID })
            }));
        }));
    });
});
