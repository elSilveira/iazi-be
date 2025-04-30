import request from "supertest";
import express, { Express } from "express";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient, User } from "@prisma/client";
import userRouter from "../routes/userRoutes"; // Adjust path as needed
import { authMiddleware } from "../middlewares/authMiddleware"; // Adjust path
import { Request, Response, NextFunction } from "express";

// Mock the Prisma client
const prismaMock = mockDeep<PrismaClient>();

// Mock the auth middleware
jest.mock("../middlewares/authMiddleware", () => ({
  authMiddleware: jest.fn((req: Request, res: Response, next: NextFunction) => {
    // Simulate an authenticated user
    req.user = { id: "test-user-id" }; 
    next();
  }),
}));

// Mock the Prisma client dependency injection (if applicable, otherwise direct mock)
// This depends on how PrismaClient is instantiated and used in controllers/repositories
// Assuming direct import for now, we might need to adjust if DI is used.
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaMock),
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
      const mockUser: User = {
        id: "test-user-id",
        email: "test@example.com",
        password: "hashedpassword",
        name: "Test User",
        phone: "123456789",
        address: "123 Test St",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
        avatarUrl: null,
        bio: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        // Don't expect password to be returned
      }));
      expect(response.body.password).toBeUndefined();
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "test-user-id" },
        select: { // Ensure password is excluded if select is used in controller
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          role: true,
          avatarUrl: true,
          bio: true,
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
      expect(response.body).toEqual({ message: "Erro ao buscar perfil do usuário" });
    });
  });

  describe("PUT /api/users/me", () => {
    it("should update user profile and return updated user", async () => {
      const updateData = {
        name: "Updated Test User",
        phone: "987654321",
      };
      const updatedUser: User = {
        id: "test-user-id",
        email: "test@example.com",
        password: "hashedpassword",
        name: "Updated Test User",
        phone: "987654321",
        address: "123 Test St",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
        avatarUrl: null,
        bio: null,
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
      }));
      expect(response.body.password).toBeUndefined(); // Ensure password is not returned
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "test-user-id" },
        data: updateData,
        select: { // Ensure password is excluded
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          role: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it("should return 400 for invalid update data", async () => {
      const invalidData = {
        email: "not-an-email", // Invalid email format
      };

      // No need to mock prisma, validation should fail first
      const response = await request(app)
        .put("/api/users/me")
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      // Check for specific validation error message if needed
      expect(response.body.errors[0].msg).toContain("E-mail inválido"); 
    });

    it("should return 500 on database error during update", async () => {
      const updateData = { name: "Another User" };
      prismaMock.user.update.mockRejectedValue(new Error("Database update error"));

      const response = await request(app)
        .put("/api/users/me")
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Erro ao atualizar perfil do usuário" });
    });
  });
});

