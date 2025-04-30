import request from "supertest";
import express, { Express } from "express";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient, Category } from "@prisma/client";
import categoryRouter from "../routes/categoryRoutes"; // Adjust path as needed

// Mock the Prisma client
const prismaMock = mockDeep<PrismaClient>();

// Mock the Prisma client dependency injection (if applicable, otherwise direct mock)
// Assuming direct import for now, we might need to adjust if DI is used.
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

// Setup Express app for testing
const app: Express = express();
app.use(express.json()); // Enable JSON body parsing
app.use("/api/categories", categoryRouter); // Mount the category router

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.category.findMany.mockReset();
});

describe("Category Routes", () => {
  describe("GET /api/categories", () => {
    it("should return a list of categories", async () => {
      const mockCategories: Category[] = [
        {
          id: 1,
          name: "Beleza",
          icon: "brush",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Reparos",
          icon: "wrench",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.category.findMany.mockResolvedValue(mockCategories);

      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toEqual(expect.objectContaining({
        id: 1,
        name: "Beleza",
        icon: "brush",
      }));
      expect(response.body[1]).toEqual(expect.objectContaining({
        id: 2,
        name: "Reparos",
        icon: "wrench",
      }));
      expect(prismaMock.category.findMany).toHaveBeenCalledTimes(1);
    });

    it("should return an empty list if no categories exist", async () => {
      prismaMock.category.findMany.mockResolvedValue([]);

      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(prismaMock.category.findMany).toHaveBeenCalledTimes(1);
    });

    it("should return 500 on database error", async () => {
      prismaMock.category.findMany.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/categories");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Erro ao buscar categorias" });
    });
  });
});

