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
// Mock environment variables FIRST, before importing the controller
const testJwtSecret = 'test_jwt_secret';
const testRefreshSecret = 'test_refresh_secret';
const testAccessTokenExpiration = '15m';
const testRefreshTokenExpiration = '7d';
process.env.JWT_SECRET = testJwtSecret;
process.env.REFRESH_TOKEN_SECRET = testRefreshSecret;
process.env.ACCESS_TOKEN_EXPIRATION = testAccessTokenExpiration;
process.env.REFRESH_TOKEN_EXPIRATION = testRefreshTokenExpiration;
// Mock dependencies
jest.mock('../repositories/userRepository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
// Now import the controller AFTER setting env vars and mocking
const authController_1 = require("../controllers/authController");
const userRepository_1 = require("../repositories/userRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock Express request, response, and next objects
const mockRequest = (body = {}, params = {}, query = {}) => {
    const req = {};
    req.body = body;
    req.params = params;
    req.query = query;
    return req;
};
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = jest.fn();
describe('Auth Controller', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Ensure env vars are set for each test (redundant due to top-level setting, but safe)
        process.env.JWT_SECRET = testJwtSecret;
        process.env.REFRESH_TOKEN_SECRET = testRefreshSecret;
        process.env.ACCESS_TOKEN_EXPIRATION = testAccessTokenExpiration;
        process.env.REFRESH_TOKEN_EXPIRATION = testRefreshTokenExpiration;
    });
    // --- Register Tests --- //
    describe('register', () => {
        it('should register a new user successfully and return tokens', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'new@example.com', password: 'password123', name: 'New User' });
            const res = mockResponse();
            const hashedPassword = 'hashedPassword';
            const newUser = { id: 'uuid-1', email: 'new@example.com', name: 'New User', password: hashedPassword, avatar: null, createdAt: new Date(), updatedAt: new Date() };
            const accessToken = 'newAccessToken';
            const refreshTokenVal = 'newRefreshToken';
            userRepository_1.userRepository.findByEmail.mockResolvedValue(null);
            bcrypt_1.default.hash.mockResolvedValue(hashedPassword);
            userRepository_1.userRepository.create.mockResolvedValue(newUser);
            jsonwebtoken_1.default.sign
                .mockImplementationOnce((payload, secret, options) => {
                if (secret === testJwtSecret && (options === null || options === void 0 ? void 0 : options.expiresIn) === testAccessTokenExpiration)
                    return accessToken;
                return 'wrong_token_type_or_secret';
            })
                .mockImplementationOnce((payload, secret, options) => {
                if (secret === testRefreshSecret && (options === null || options === void 0 ? void 0 : options.expiresIn) === testRefreshTokenExpiration)
                    return refreshTokenVal;
                return 'wrong_token_type_or_secret';
            });
            yield (0, authController_1.register)(req, res, mockNext);
            expect(userRepository_1.userRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
            expect(bcrypt_1.default.hash).toHaveBeenCalledWith('password123', 10);
            expect(userRepository_1.userRepository.create).toHaveBeenCalledWith({ email: 'new@example.com', password: hashedPassword, name: 'New User', avatar: undefined, slug: 'new-user' });
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledTimes(2);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: newUser.id, email: newUser.email }, testJwtSecret, { expiresIn: testAccessTokenExpiration });
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: newUser.id }, testRefreshSecret, { expiresIn: testRefreshTokenExpiration });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Usuário registrado com sucesso',
                accessToken,
                refreshToken: refreshTokenVal,
                user: {
                    id: 'uuid-1',
                    email: 'new@example.com',
                    name: 'New User',
                    avatar: null,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        }));
        it('should return 409 if email already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'existing@example.com', password: 'password123', name: 'Existing User' });
            const res = mockResponse();
            const existingUser = { id: 'uuid-2', email: 'existing@example.com', name: 'Existing User' };
            userRepository_1.userRepository.findByEmail.mockResolvedValue(existingUser);
            yield (0, authController_1.register)(req, res, mockNext);
            expect(userRepository_1.userRepository.findByEmail).toHaveBeenCalledWith('existing@example.com');
            expect(bcrypt_1.default.hash).not.toHaveBeenCalled();
            expect(userRepository_1.userRepository.create).not.toHaveBeenCalled();
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Email já cadastrado', statusCode: 409 }));
        }));
        it('should call next with error if bcrypt.hash fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'error@example.com', password: 'password123', name: 'Error User' });
            const res = mockResponse();
            const hashError = new Error('Hashing failed');
            userRepository_1.userRepository.findByEmail.mockResolvedValue(null);
            bcrypt_1.default.hash.mockRejectedValue(hashError);
            yield (0, authController_1.register)(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(hashError);
        }));
        it('should call next with error if userRepository.create fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'createfail@example.com', password: 'password123', name: 'Create Fail' });
            const res = mockResponse();
            const hashedPassword = 'hashedPassword';
            const createError = new Error('DB create failed');
            userRepository_1.userRepository.findByEmail.mockResolvedValue(null);
            bcrypt_1.default.hash.mockResolvedValue(hashedPassword);
            userRepository_1.userRepository.create.mockRejectedValue(createError);
            yield (0, authController_1.register)(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(createError);
        }));
    });
    // --- Login Tests --- //
    describe('login', () => {
        it('should login successfully and return tokens', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'test@example.com', password: 'password123' });
            const res = mockResponse();
            const user = { id: 'uuid-3', email: 'test@example.com', password: 'hashedPassword', name: 'Test User', avatar: null, createdAt: new Date(), updatedAt: new Date() };
            const accessToken = 'loginAccessToken';
            const refreshTokenVal = 'loginRefreshToken';
            userRepository_1.userRepository.findByEmail.mockResolvedValue(user);
            bcrypt_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign
                .mockImplementationOnce((payload, secret, options) => {
                if (secret === testJwtSecret && (options === null || options === void 0 ? void 0 : options.expiresIn) === testAccessTokenExpiration)
                    return accessToken;
                return 'wrong_token_type_or_secret';
            })
                .mockImplementationOnce((payload, secret, options) => {
                if (secret === testRefreshSecret && (options === null || options === void 0 ? void 0 : options.expiresIn) === testRefreshTokenExpiration)
                    return refreshTokenVal;
                return 'wrong_token_type_or_secret';
            });
            yield (0, authController_1.login)(req, res, mockNext);
            expect(userRepository_1.userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledTimes(2);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: user.id, email: user.email }, testJwtSecret, { expiresIn: testAccessTokenExpiration });
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: user.id }, testRefreshSecret, { expiresIn: testRefreshTokenExpiration });
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login bem-sucedido',
                accessToken,
                refreshToken: refreshTokenVal,
                user: {
                    id: 'uuid-3',
                    email: 'test@example.com',
                    name: 'Test User',
                    avatar: null,
                    bio: undefined,
                    phone: undefined,
                    slug: undefined,
                    role: undefined,
                    professionalId: null,
                    isProfessional: false,
                    hasCompany: undefined,
                    isAdmin: false,
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                },
            });
            expect(mockNext).not.toHaveBeenCalled();
        }));
        it('should return 401 if user not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'notfound@example.com', password: 'password123' });
            const res = mockResponse();
            userRepository_1.userRepository.findByEmail.mockResolvedValue(null);
            yield (0, authController_1.login)(req, res, mockNext);
            expect(userRepository_1.userRepository.findByEmail).toHaveBeenCalledWith('notfound@example.com');
            expect(bcrypt_1.default.compare).not.toHaveBeenCalled();
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Credenciais inválidas', statusCode: 401 }));
        }));
        it('should return 401 if password does not match', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'test@example.com', password: 'wrongpassword' });
            const res = mockResponse();
            const user = { id: 'uuid-4', email: 'test@example.com', password: 'hashedPassword' };
            userRepository_1.userRepository.findByEmail.mockResolvedValue(user);
            bcrypt_1.default.compare.mockResolvedValue(false);
            yield (0, authController_1.login)(req, res, mockNext);
            expect(userRepository_1.userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt_1.default.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Credenciais inválidas', statusCode: 401 }));
        }));
        it('should call next with error if userRepository.findByEmail fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'dberror@example.com', password: 'password123' });
            const res = mockResponse();
            const dbError = new Error('DB find failed');
            userRepository_1.userRepository.findByEmail.mockRejectedValue(dbError);
            yield (0, authController_1.login)(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(dbError);
        }));
        it('should call next with error if bcrypt.compare fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ email: 'comparefail@example.com', password: 'password123' });
            const res = mockResponse();
            const user = { id: 'uuid-5', email: 'comparefail@example.com', password: 'hashedPassword' };
            const compareError = new Error('Compare failed');
            userRepository_1.userRepository.findByEmail.mockResolvedValue(user);
            bcrypt_1.default.compare.mockRejectedValue(compareError);
            yield (0, authController_1.login)(req, res, mockNext);
            expect(mockNext).toHaveBeenCalledWith(compareError);
        }));
    });
    // --- Refresh Token Tests --- //
    describe('refreshToken', () => {
        it('should return a new access token for a valid refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ token: 'validRefreshToken' });
            const res = mockResponse();
            const decodedPayload = { userId: 'uuid-6' };
            const newAccessToken = 'newAccessTokenFromRefresh';
            jsonwebtoken_1.default.verify.mockImplementation((token, secret) => {
                if (secret === testRefreshSecret)
                    return decodedPayload;
                throw new Error('Invalid secret');
            });
            jsonwebtoken_1.default.sign.mockImplementation((payload, secret, options) => {
                if (secret === testJwtSecret && (options === null || options === void 0 ? void 0 : options.expiresIn) === testAccessTokenExpiration)
                    return newAccessToken;
                return 'wrong_token_type_or_secret';
            });
            yield (0, authController_1.refreshToken)(req, res, mockNext);
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('validRefreshToken', testRefreshSecret);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: 'uuid-6' }, testJwtSecret, { expiresIn: testAccessTokenExpiration });
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access token atualizado com sucesso',
                accessToken: newAccessToken,
            });
            expect(mockNext).not.toHaveBeenCalled();
        }));
        it('should return 400 if refresh token is not provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({}); // No token in body
            const res = mockResponse();
            yield (0, authController_1.refreshToken)(req, res, mockNext);
            expect(jsonwebtoken_1.default.verify).not.toHaveBeenCalled();
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Refresh token não fornecido', statusCode: 400 }));
        }));
        it('should return 401 if refresh token is invalid or expired', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({ token: 'invalidOrExpiredToken' });
            const res = mockResponse();
            const verifyError = new Error('Invalid token');
            jsonwebtoken_1.default.verify.mockImplementation((token, secret) => {
                if (secret === testRefreshSecret)
                    throw verifyError;
                return {};
            });
            yield (0, authController_1.refreshToken)(req, res, mockNext);
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith('invalidOrExpiredToken', testRefreshSecret);
            expect(jsonwebtoken_1.default.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Refresh token inválido ou expirado', statusCode: 401 }));
        }));
    });
});
