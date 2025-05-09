import request from "supertest";
import express, { Express } from "express";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient, User, UserRole } from "@prisma/client"; // Added UserRole
import userRouter from "../routes/userRoutes"; // Adjust path as needed
import { authMiddleware } from "../middlewares/authMiddleware"; // Adjust path
import { Request, Response, NextFunction } from "express";

// Define a type for the authenticated user on the request object
interface AuthenticatedUser {
    id: string;
    role: UserRole;
}

// Extend Express Request interface for 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser; // Use the defined interface
    }
  }
}

// Mock the Prisma client
const prismaMock = mockDeep<PrismaClient>();

// Mock the auth middleware
jest.mock("../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn((req: Request, res: Response, next: NextFunction) => {
    // Simulate an authenticated user with correct type
    req.user = { id: "test-user-id", role: UserRole.USER }; 
    next();
  }),
}));

// Mock the Prisma client dependency injection (if applicable, otherwise direct mock)
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaMock),
  // Need to export enums if they are used directly from @prisma/client
  UserRole: { USER: "USER", ADMIN: "ADMIN" }, 
}));

// Setup Express app for testing
const app: Express = express();
app.use(express.json()); // Enable JSON body parsing
app.use("/api/users", userRouter); // Mount the user router

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.update.mockReset();
});

describe("User Routes", () => {
  describe("GET /api/users/me", () => {
    it("should return user profile for authenticated user", async () => {
      // Add missing 'points' property to mock User
      const mockUser: User = {
        id: "test-user-id",
        email: "test@example.com",
        password: "hashedpassword",
        name: "Test User",
        phone: "123456789",
        role: UserRole.USER, // Use enum
        points: 100, // Added points
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: null,
        bio: null,
        slug: "test-user-id"
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        points: 100, // Expect points
      }));
      expect(response.body.password).toBeUndefined();
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "test-user-id" },
        select: { // Ensure password is excluded and points is included
          id: true,
          email: true,
          name: true,
          phone: true,
          // address: true, // Removed if not directly on User model
          role: true,
          avatar: true,
          bio: true,
          points: true, // Added points to select
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should return 404 if user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: "Usuário não encontrado" });
    });

    it("should return 500 on database error", async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(500);
      // Adjust error message if controller has specific handling
      // expect(response.body).toEqual({ message: "Erro ao buscar perfil do usuário" });
    });
  });

  describe("PUT /api/users/me", () => {
    it("should update user profile and return updated user", async () => {
      const updateData = {
        name: "Updated Test User",
        phone: "987654321",
      };
      // Add missing 'points' property
      const updatedUser: User = {
        id: "test-user-id",
        email: "test@example.com",
        password: "hashedpassword",
        name: "Updated Test User",
        phone: "987654321",
        role: UserRole.USER,
        points: 100, // Added points
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: null,
        bio: null,
        slug: "test-user-id"
      };

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put("/api/users/me")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        id: "test-user-id",
        name: "Updated Test User",
        phone: "987654321",
        points: 100,
      }));
      expect(response.body.password).toBeUndefined(); // Ensure password is not returned
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-id" },
        data: updateData,
        select: { // Ensure password is excluded and points included
          id: true,
          email: true,
          name: true,
          phone: true,
          // address: true, // Removed if not directly on User model
          role: true,
          avatar: true,
          bio: true,
          points: true, // Added points
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should return 400 for invalid update data", async () => {
      const invalidData = {
        email: "not-an-email", // Invalid email format
      };

      const response = await request(app)
        .put("/api/users/me")
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain("E-mail inválido"); 
    });

    it("should return 500 on database error during update", async () => {
      const updateData = { name: "Another User" };
      prismaMock.user.update.mockRejectedValue(new Error("Database update error"));

      const response = await request(app)
        .put("/api/users/me")
        .send(updateData);

      expect(response.status).toBe(500);
      // Adjust error message if controller has specific handling
      // expect(response.body).toEqual({ message: "Erro ao atualizar perfil do usuário" });
    });
  });
});

