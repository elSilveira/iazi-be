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
const express_1 = __importDefault(require("express"));
const jest_mock_extended_1 = require("jest-mock-extended");
const categoryRoutes_1 = __importDefault(require("../routes/categoryRoutes")); // Adjust path as needed
// Mock the Prisma client
const prismaMock = (0, jest_mock_extended_1.mockDeep)();
// Mock the Prisma client dependency injection (if applicable, otherwise direct mock)
// Assuming direct import for now, we might need to adjust if DI is used.
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn(() => prismaMock),
}));
// Setup Express app for testing
const app = (0, express_1.default)();
app.use(express_1.default.json()); // Enable JSON body parsing
app.use("/api/categories", categoryRoutes_1.default); // Mount the category router
// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.category.findMany.mockReset();
});
describe("Category Routes", () => {
    describe("GET /api/categories", () => {
        it("should return a list of categories", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockCategories = [
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
            const response = yield (0, supertest_1.default)(app).get("/api/categories");
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
        }));
        it("should return an empty list if no categories exist", () => __awaiter(void 0, void 0, void 0, function* () {
            prismaMock.category.findMany.mockResolvedValue([]);
            const response = yield (0, supertest_1.default)(app).get("/api/categories");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
            expect(prismaMock.category.findMany).toHaveBeenCalledTimes(1);
        }));
        it("should return 500 on database error", () => __awaiter(void 0, void 0, void 0, function* () {
            prismaMock.category.findMany.mockRejectedValue(new Error("Database error"));
            const response = yield (0, supertest_1.default)(app).get("/api/categories");
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: "Erro ao buscar categorias" });
        }));
    });
});
