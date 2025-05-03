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
const userRoutes_1 = __importDefault(require("../routes/userRoutes")); // Adjust path as needed
// Mock the Prisma client
const prismaMock = (0, jest_mock_extended_1.mockDeep)();
// Mock the auth middleware
jest.mock("../middlewares/authMiddleware", () => ({
    authMiddleware: jest.fn((req, res, next) => {
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
const app = (0, express_1.default)();
app.use(express_1.default.json()); // Enable JSON body parsing
app.use("/api/users", userRoutes_1.default); // Mount the user router
// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.update.mockReset();
});
describe("User Routes", () => {
    describe("GET /api/users/me", () => {
        it("should return user profile for authenticated user", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockUser = {
                id: "test-user-id",
                email: "test@example.com",
                password: "hashedpassword",
                name: "Test User",
                phone: "123456789",
                // address: "123 Test St", // Removed: User model doesn't have direct address string
                role: "USER",
                createdAt: new Date(),
                updatedAt: new Date(),
                avatar: null,
                bio: null,
            };
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            const response = yield (0, supertest_1.default)(app).get("/api/users/me");
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
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    address: true,
                    role: true,
                    avatar: true,
                    bio: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }));
        it("should return 404 if user not found", () => __awaiter(void 0, void 0, void 0, function* () {
            prismaMock.user.findUnique.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app).get("/api/users/me");
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: "Usuário não encontrado" });
        }));
        it("should return 500 on database error", () => __awaiter(void 0, void 0, void 0, function* () {
            prismaMock.user.findUnique.mockRejectedValue(new Error("Database error"));
            const response = yield (0, supertest_1.default)(app).get("/api/users/me");
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: "Erro ao buscar perfil do usuário" });
        }));
    });
    describe("PUT /api/users/me", () => {
        it("should update user profile and return updated user", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                name: "Updated Test User",
                phone: "987654321",
            };
            const updatedUser = {
                id: "test-user-id",
                email: "test@example.com",
                password: "hashedpassword",
                name: "Updated Test User",
                phone: "987654321",
                // address: "123 Test St", // Removed
                role: "USER",
                createdAt: new Date(),
                updatedAt: new Date(),
                avatar: null,
                bio: null,
            };
            prismaMock.user.update.mockResolvedValue(updatedUser);
            const response = yield (0, supertest_1.default)(app)
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
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    address: true,
                    role: true,
                    avatar: true,
                    bio: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }));
        it("should return 400 for invalid update data", () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                email: "not-an-email", // Invalid email format
            };
            // No need to mock prisma, validation should fail first
            const response = yield (0, supertest_1.default)(app)
                .put("/api/users/me")
                .send(invalidData);
            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
            // Check for specific validation error message if needed
            expect(response.body.errors[0].msg).toContain("E-mail inválido");
        }));
        it("should return 500 on database error during update", () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = { name: "Another User" };
            prismaMock.user.update.mockRejectedValue(new Error("Database update error"));
            const response = yield (0, supertest_1.default)(app)
                .put("/api/users/me")
                .send(updateData);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: "Erro ao atualizar perfil do usuário" });
        }));
    });
});
