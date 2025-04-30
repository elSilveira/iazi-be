import request from 'supertest';
import { app } from '../index'; // Import the configured app
// Import PrismaClient types but rely on the mock for implementation
import { PrismaClient, AppointmentStatus, Prisma } from '@prisma/client'; 
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express'; // Import types

// --- Mock Prisma Client --- //
// Define the mock object structure first
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

// Mock the PrismaClient module AFTER mockPrismaObject is defined
jest.mock('@prisma/client', () => {
  // Define the mock error class within the mock factory if needed
  class MockPrismaClientKnownRequestError extends Error {
    code: string;
    meta?: any;
    constructor(message: string, code: string, clientVersion: string, meta?: any) {
      super(message);
      this.code = code;
      this.meta = meta;
      this.name = 'PrismaClientKnownRequestError';
    }
  }

  return {
    PrismaClient: jest.fn(() => mockPrismaObject), // Use the object defined outside
    AppointmentStatus: {
        PENDING: 'PENDING',
        CONFIRMED: 'CONFIRMED',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
    },
    Prisma: {
        PrismaClientKnownRequestError: MockPrismaClientKnownRequestError
    }
  };
});

// --- Mock Auth Middleware --- //
type MockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

jest.mock('../middlewares/authMiddleware', (): { authMiddleware: MockAuthMiddleware } => ({
  authMiddleware: (req: any, res: Response, next: NextFunction) => {
    if (req.headers.authorization?.startsWith('Bearer ')) {
        req.user = { id: 'user-test-id' }; 
    } 
    next();
  }
}));

// Test JWT secret (ensure it's defined)
const testJwtSecret = process.env.JWT_SECRET || 'test_jwt_secret';
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = testJwtSecret; 
}

describe('Appointment API Integration Tests', () => {
  let authToken: string;
  const testUserId = 'user-test-id';
  const testServiceId = 'service-test-id';
  const testProfessionalId = 'prof-test-id';

  beforeAll(() => {
    authToken = jwt.sign({ userId: testUserId, email: 'test@example.com' }, testJwtSecret, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset specific mocks using the correctly defined object
    (mockPrismaObject.appointment.create as jest.Mock).mockReset();
    (mockPrismaObject.appointment.findMany as jest.Mock).mockReset();
    (mockPrismaObject.service.findUnique as jest.Mock).mockReset();
    (mockPrismaObject.professional.findUnique as jest.Mock).mockReset();
  });

  // --- POST /api/appointments --- //
  describe('POST /api/appointments', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 1);
      const appointmentData = {
        date: appointmentDate.toISOString(),
        serviceId: testServiceId,
        professionalId: testProfessionalId,
        notes: 'Test appointment notes',
      };

      const mockCreatedAppointment = {
        id: 'appt-test-id',
        date: appointmentDate,
        userId: testUserId,
        serviceId: testServiceId,
        professionalId: testProfessionalId,
        notes: 'Test appointment notes',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrismaObject.service.findUnique as jest.Mock).mockResolvedValue({ id: testServiceId }); 
      (mockPrismaObject.professional.findUnique as jest.Mock).mockResolvedValue({ id: testProfessionalId }); 
      (mockPrismaObject.appointment.create as jest.Mock).mockResolvedValue(mockCreatedAppointment);

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`) 
        .send(appointmentData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id', 'appt-test-id');
      expect(response.body).toHaveProperty('userId', testUserId);
      expect(mockPrismaObject.appointment.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaObject.appointment.create).toHaveBeenCalledWith({
        data: {
          date: expect.any(Date), 
          notes: 'Test appointment notes',
          user: { connect: { id: testUserId } }, 
          service: { connect: { id: testServiceId } },
          professional: { connect: { id: testProfessionalId } },
        },
      });
    });

    it('should return 401 if no token is provided', async () => {
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1);
        const appointmentData = {
            date: appointmentDate.toISOString(),
            serviceId: testServiceId,
            professionalId: testProfessionalId,
        };

        const response = await request(app)
            .post('/api/appointments')
            .send(appointmentData);

        expect(response.statusCode).toBe(401); 
        expect(response.body).toHaveProperty('message', 'Usuário não autenticado.');
        expect(mockPrismaObject.appointment.create).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
        const appointmentData = {
            notes: 'Incomplete data',
        };

        const response = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${authToken}`) 
            .send(appointmentData);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', 'Data, ID do serviço e ID do profissional são obrigatórios');
        expect(mockPrismaObject.appointment.create).not.toHaveBeenCalled();
    });

    it('should return 404 if service or professional does not exist', async () => {
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1);
        const appointmentData = {
            date: appointmentDate.toISOString(),
            serviceId: 'non-existent-service',
            professionalId: testProfessionalId,
        };
        
        // Use the actual Prisma error class from the mock setup
        const { Prisma } = jest.requireActual('@prisma/client');
        const prismaError = new Prisma.PrismaClientKnownRequestError(
            'An operation failed because it depends on one or more records that were required but not found.', 
            'P2025', 
            'test-client-version', 
            { modelName: 'Appointment', target: 'Appointment_serviceId_fkey (index)' } 
        );
        (mockPrismaObject.appointment.create as jest.Mock).mockRejectedValue(prismaError);

        const response = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${authToken}`)
            .send(appointmentData);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message', 'Serviço ou Profissional não encontrado.');
        expect(mockPrismaObject.appointment.create).toHaveBeenCalledTimes(1);
    });

  });

  // --- GET /api/appointments --- //
  describe('GET /api/appointments', () => {
    it('should return a list of appointments for the authenticated user', async () => {
        const mockAppointments = [
            { id: 'appt-1', userId: testUserId, serviceId: 'svc-1', professionalId: 'prof-1', date: new Date(), status: 'CONFIRMED' },
            { id: 'appt-2', userId: testUserId, serviceId: 'svc-2', professionalId: 'prof-2', date: new Date(), status: 'PENDING' },
        ];
        (mockPrismaObject.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);

        const response = await request(app)
            .get('/api/appointments') 
            .set('Authorization', `Bearer ${authToken}`); 

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(2);
        expect(response.body[0].id).toBe('appt-1');
        expect(mockPrismaObject.appointment.findMany).toHaveBeenCalledTimes(1);
        expect(mockPrismaObject.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ 
            where: expect.objectContaining({ userId: testUserId }) 
        }));
    });

     it('should return 400 if no token is provided and no professionalId filter', async () => {
        const response = await request(app)
            .get('/api/appointments');

        expect(response.statusCode).toBe(400); 
        expect(response.body).toHaveProperty('message', 'É necessário fornecer userId (ou estar autenticado) ou professionalId para filtrar os agendamentos');
        expect(mockPrismaObject.appointment.findMany).not.toHaveBeenCalled();
    });

    it('should return a list of appointments filtered by professionalId', async () => {
        const professionalFilterId = 'prof-filter-id';
        const mockAppointments = [
            { id: 'appt-3', userId: 'user-other', serviceId: 'svc-3', professionalId: professionalFilterId, date: new Date(), status: 'CONFIRMED' },
        ];
        (mockPrismaObject.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);

        const response = await request(app)
            .get(`/api/appointments?professionalId=${professionalFilterId}`)
            .set('Authorization', `Bearer ${authToken}`); 

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(1);
        expect(response.body[0].professionalId).toBe(professionalFilterId);
        expect(mockPrismaObject.appointment.findMany).toHaveBeenCalledTimes(1);
        expect(mockPrismaObject.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ 
            where: expect.objectContaining({ professionalId: professionalFilterId }) 
        }));
    });

  });

});

