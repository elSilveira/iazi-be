import request from "supertest";
import { app } from "../index";
import { prisma } from "../utils/prismaClient";
import { AppointmentStatus, UserRole } from "@prisma/client";
import { addHours, formatISO, startOfDay, addDays, setHours, setMinutes, addMinutes, isAfter, parseISO } from "date-fns";
import { generateToken } from "../utils/jwt";
import { Decimal } from "@prisma/client/runtime/library";

// Fix for Decimal class in Jest tests
jest.mock('@prisma/client/runtime/library', () => {
  return {
    Decimal: function(value: any) {
      return parseFloat(value);
    }
  };
});

// --- Test Data Setup ---
let testUser: any;
let testProfessionalUser: any;
let testCompany: any;
let testProfessional: any;
let testService1: any;
let testService2: any;
let testCategory: any;
let userToken: string;
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
const bookableTime = setHours(setMinutes(addDays(new Date(), 2), 0), 10); // 10:00 AM, 2 days from now

describe("Multi-Service Appointment Tests", () => {
  beforeAll(async () => {
    // Cleanup any existing test data
    await prisma.appointment.deleteMany({ where: { user: { email: "multiservicetest@example.com" } } });
    await prisma.professionalService.deleteMany({ where: { professional: { name: "Multi Service Test Professional" } } });
    await prisma.service.deleteMany({ where: { name: { contains: "Multi Test Service" } } });
    await prisma.professional.deleteMany({ where: { name: "Multi Service Test Professional" } });
    await prisma.user.deleteMany({ where: { email: { in: ["multiservicetest@example.com", "multitestprof@example.com"] } } });
    await prisma.company.deleteMany({ where: { name: "Multi Service Test Company" } });
    await prisma.category.deleteMany({ where: { name: "Multi Test Category" } });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: "multiservicetest@example.com",
        name: "Multi Service Test User",
        password: "password123",
        role: UserRole.USER,
        slug: "multi-service-test-user"
      }
    });

    testProfessionalUser = await prisma.user.create({
      data: {
        email: "multitestprof@example.com",
        name: "Multi Service Test Professional User",
        password: "password123",
        role: UserRole.USER,
        slug: "multi-service-test-professional"
      }
    });

    // Create test company
    testCompany = await prisma.company.create({
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
    testProfessional = await prisma.professional.create({
      data: {
        userId: testProfessionalUser.id,
        name: "Multi Service Test Professional",
        role: "Hair Stylist",
        companyId: testCompany.id,
      }
    });

    // Create test category
    testCategory = await prisma.category.create({
      data: { name: "Multi Test Category" }
    });

    // Create test services
    testService1 = await prisma.service.create({
      data: {
        name: "Multi Test Service 1",
        description: "First test service",
        price: new Decimal("30.00"),
        duration: "PT30M", // 30 minutes in ISO 8601
        categoryId: testCategory.id,
        companyId: testCompany.id,
      }
    });

    testService2 = await prisma.service.create({
      data: {
        name: "Multi Test Service 2",
        description: "Second test service",
        price: new Decimal("45.00"),
        duration: "PT45M", // 45 minutes in ISO 8601
        categoryId: testCategory.id,
        companyId: testCompany.id,
      }
    });

    // Link professional to services
    await prisma.professionalService.create({
      data: {
        professionalId: testProfessional.id,
        serviceId: testService1.id,
      }
    });

    await prisma.professionalService.create({
      data: {
        professionalId: testProfessional.id,
        serviceId: testService2.id,
      }
    });

    // Generate tokens
    userToken = generateToken({ id: testUser.id, role: testUser.role });
    professionalToken = generateToken({ id: testProfessionalUser.id, role: testProfessionalUser.role });
  });

  afterAll(async () => {
    // Clean up
    await prisma.appointment.deleteMany({ where: { user: { email: "multiservicetest@example.com" } } });
    await prisma.professionalService.deleteMany({ where: { professional: { name: "Multi Service Test Professional" } } });
    await prisma.service.deleteMany({ where: { name: { contains: "Multi Test Service" } } });
    await prisma.professional.deleteMany({ where: { name: "Multi Service Test Professional" } });
    await prisma.user.deleteMany({ where: { email: { in: ["multiservicetest@example.com", "multitestprof@example.com"] } } });
    await prisma.company.deleteMany({ where: { name: "Multi Service Test Company" } });
    await prisma.category.deleteMany({ where: { name: "Multi Test Category" } });
    await prisma.$disconnect();
  });

  describe("Creating Appointments with Multiple Services", () => {
    it("should create an appointment with multiple services", async () => {
      // Prepare date in ISO format
      const appointmentDate = formatISO(bookableTime).split('T')[0];
      const appointmentTime = bookableTime.toTimeString().slice(0, 5);

      const response = await request(app)
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
      const retrieveResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${userToken}`);
      
      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body.services).toHaveLength(2);
      
      // Verify the services in the appointment
      const serviceIds = retrieveResponse.body.services.map((s: any) => 
        s.serviceId || (s.service && s.service.id)
      ).sort();
      
      expect(serviceIds).toEqual([testService1.id, testService2.id].sort());
      
      // Check if the total duration is correct (30 + 45 = 75 minutes)
      const startTime = parseISO(retrieveResponse.body.startTime);
      const endTime = parseISO(retrieveResponse.body.endTime);
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      expect(durationMinutes).toBe(75);
    });

    it("should still support legacy format with serviceId", async () => {
      // Prepare date in ISO format
      const appointmentDate = formatISO(addHours(bookableTime, 2)).split('T')[0];
      const appointmentTime = addHours(bookableTime, 2).toTimeString().slice(0, 5);

      const response = await request(app)
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
      const retrieveResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${userToken}`);
      
      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body.services).toHaveLength(1);
      
      const serviceId = retrieveResponse.body.services[0].serviceId || 
        (retrieveResponse.body.services[0].service && retrieveResponse.body.services[0].service.id);
      
      expect(serviceId).toEqual(testService1.id);
    });
    
    it("should reject if one of the services is invalid", async () => {
      // Prepare date in ISO format
      const appointmentDate = formatISO(addHours(bookableTime, 4)).split('T')[0];
      const appointmentTime = addHours(bookableTime, 4).toTimeString().slice(0, 5);
      const invalidServiceId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
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
    });
    
    it("should require either serviceIds or serviceId field", async () => {
      // Prepare date in ISO format
      const appointmentDate = formatISO(addHours(bookableTime, 6)).split('T')[0];
      const appointmentTime = addHours(bookableTime, 6).toTimeString().slice(0, 5);

      const response = await request(app)
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
      expect(response.body.errors.some((e: any) => 
        e.message && (e.message.includes("serviço") || e.message.includes("service"))
      )).toBeTruthy();
    });
  });
});
