import request from 'supertest';
import { app } from '../index'; // Import the configured app
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock Prisma Client
const prisma = new PrismaClient();
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
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
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    AppointmentStatus: {
        PENDING: 'PENDING',
        CONFIRMED: 'CONFIRMED',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
    }
  };
});

// Test JWT secret
const testJwtSecret = process.env.JWT_SECRET || 'test_jwt_secret';

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
  });

  // --- POST /api/appointments --- //
  describe('POST /api/appointments', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 1);
      const appointmentData = {
        date: appointmentDate.toISOString(),
        // userId is now taken from token
        serviceId: testServiceId,
        professionalId: testProfessionalId,
        notes: 'Test appointment notes',
      };

      const mockCreatedAppointment = {
        id: 'appt-test-id',
        ...appointmentData,
        userId: testUserId, // Add userId back for the response check
        date: appointmentDate,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.service.findUnique as jest.Mock).mockResolvedValue({ id: testServiceId });
      (prisma.professional.findUnique as jest.Mock).mockResolvedValue({ id: testProfessionalId });
      (prisma.appointment.create as jest.Mock).mockResolvedValue(mockCreatedAppointment);

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id', 'appt-test-id');
      expect(response.body).toHaveProperty('userId', testUserId);
      expect(response.body).toHaveProperty('serviceId', testServiceId);
      expect(response.body).toHaveProperty('professionalId', testProfessionalId);
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(prisma.appointment.create).toHaveBeenCalledWith({
        data: {
          date: expect.any(Date), // Controller converts ISO string to Date
          notes: 'Test appointment notes',
          user: { connect: { id: testUserId } }, // Controller should get this from req.user
          service: { connect: { id: testServiceId } },
          professional: { connect: { id: testProfessionalId } },
          // Status should be handled by default in Prisma or controller
        },
      });
    });

    it('should return 401 if no token is provided', async () => {
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1);
        const appointmentData = {
            date: appointmentDate.toISOString(),
            serviceId: testServiceId,
        };

        const response = await request(app)
            .post('/api/appointments')
            .send(appointmentData);

        expect(response.statusCode).toBe(401);
        expect(prisma.appointment.create).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
        const appointmentData = {
            // Missing date, serviceId
            notes: 'Incomplete data',
        };

        const response = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${authToken}`)
            .send(appointmentData);

        expect(response.statusCode).toBe(400);
        // Check for the specific validation error structure from express-validator
        expect(response.body).toHaveProperty('message', 'Erro de validação');
        expect(response.body).toHaveProperty('errors');
        expect(response.body.errors).toBeInstanceOf(Array);
        // Check that the errors array contains the expected missing fields
        expect(response.body.errors.some((err: any) => err.path === 'date')).toBe(true);
        expect(response.body.errors.some((err: any) => err.path === 'serviceId')).toBe(true);
        expect(prisma.appointment.create).not.toHaveBeenCalled();
    });

  });

  // --- GET /api/appointments --- //
  describe('GET /api/appointments', () => {
    it('should return a list of appointments for the authenticated user', async () => {
        const mockAppointments = [
            { id: 'appt-1', userId: testUserId, serviceId: 'svc-1', date: new Date(), status: 'CONFIRMED' },
            { id: 'appt-2', userId: testUserId, serviceId: 'svc-2', date: new Date(), status: 'PENDING' },
        ];
        (prisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments);

        const response = await request(app)
            .get('/api/appointments') // No query param needed, should use req.user.id
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(2);
        expect(response.body[0].id).toBe('appt-1');
        expect(response.body[1].id).toBe('appt-2');
        // Expect the controller to filter by the authenticated user's ID
        expect(prisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ 
            where: expect.objectContaining({ userId: testUserId }) 
        }));
    });

     it('should return 401 if no token is provided', async () => {
        const response = await request(app).get('/api/appointments');
        expect(response.statusCode).toBe(401);
    });
  });

});

