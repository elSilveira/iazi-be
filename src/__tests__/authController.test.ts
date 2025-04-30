import { Request, Response, NextFunction } from 'express';

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
import { login, register, refreshToken } from '../controllers/authController';
import { userRepository } from '../repositories/userRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock Express request, response, and next objects
const mockRequest = (body = {}, params = {}, query = {}) => {
    const req = {} as Request;
    req.body = body;
    req.params = params;
    req.query = query;
    return req;
};

const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn() as NextFunction;

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
        it('should register a new user successfully and return tokens', async () => {
            const req = mockRequest({ email: 'new@example.com', password: 'password123', name: 'New User' });
            const res = mockResponse();
            const hashedPassword = 'hashedPassword';
            const newUser = { id: 'uuid-1', email: 'new@example.com', name: 'New User', password: hashedPassword, avatar: null, createdAt: new Date(), updatedAt: new Date() };
            const accessToken = 'newAccessToken';
            const refreshTokenVal = 'newRefreshToken';

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            (userRepository.create as jest.Mock).mockResolvedValue(newUser);
            (jwt.sign as jest.Mock)
                .mockImplementationOnce((payload, secret, options) => {
                    if (secret === testJwtSecret && options?.expiresIn === testAccessTokenExpiration) return accessToken;
                    return 'wrong_token_type_or_secret';
                })
                .mockImplementationOnce((payload, secret, options) => {
                    if (secret === testRefreshSecret && options?.expiresIn === testRefreshTokenExpiration) return refreshTokenVal;
                    return 'wrong_token_type_or_secret';
                });

            await register(req, res, mockNext);

            expect(userRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(userRepository.create).toHaveBeenCalledWith({ email: 'new@example.com', password: hashedPassword, name: 'New User', avatar: undefined });
            expect(jwt.sign).toHaveBeenCalledTimes(2);
            expect(jwt.sign).toHaveBeenCalledWith({ userId: newUser.id, email: newUser.email }, testJwtSecret, { expiresIn: testAccessTokenExpiration });
            expect(jwt.sign).toHaveBeenCalledWith({ userId: newUser.id }, testRefreshSecret, { expiresIn: testRefreshTokenExpiration });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Usuário registrado com sucesso',
                accessToken,
                refreshToken: refreshTokenVal,
                user: { id: 'uuid-1', email: 'new@example.com', name: 'New User', avatar: null, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 409 if email already exists', async () => {
            const req = mockRequest({ email: 'existing@example.com', password: 'password123', name: 'Existing User' });
            const res = mockResponse();
            const existingUser = { id: 'uuid-2', email: 'existing@example.com', name: 'Existing User' };

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(existingUser);

            await register(req, res, mockNext);

            expect(userRepository.findByEmail).toHaveBeenCalledWith('existing@example.com');
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(userRepository.create).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Email já cadastrado', statusCode: 409 }));
        });

        it('should call next with error if bcrypt.hash fails', async () => {
            const req = mockRequest({ email: 'error@example.com', password: 'password123', name: 'Error User' });
            const res = mockResponse();
            const hashError = new Error('Hashing failed');

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockRejectedValue(hashError);

            await register(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(hashError);
        });

        it('should call next with error if userRepository.create fails', async () => {
            const req = mockRequest({ email: 'createfail@example.com', password: 'password123', name: 'Create Fail' });
            const res = mockResponse();
            const hashedPassword = 'hashedPassword';
            const createError = new Error('DB create failed');

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            (userRepository.create as jest.Mock).mockRejectedValue(createError);

            await register(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(createError);
        });
    });

    // --- Login Tests --- //
    describe('login', () => {
        it('should login successfully and return tokens', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'password123' });
            const res = mockResponse();
            const user = { id: 'uuid-3', email: 'test@example.com', password: 'hashedPassword', name: 'Test User', avatar: null, createdAt: new Date(), updatedAt: new Date() };
            const accessToken = 'loginAccessToken';
            const refreshTokenVal = 'loginRefreshToken';

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock)
                .mockImplementationOnce((payload, secret, options) => {
                    if (secret === testJwtSecret && options?.expiresIn === testAccessTokenExpiration) return accessToken;
                    return 'wrong_token_type_or_secret';
                })
                .mockImplementationOnce((payload, secret, options) => {
                    if (secret === testRefreshSecret && options?.expiresIn === testRefreshTokenExpiration) return refreshTokenVal;
                    return 'wrong_token_type_or_secret';
                });

            await login(req, res, mockNext);

            expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(jwt.sign).toHaveBeenCalledTimes(2);
            expect(jwt.sign).toHaveBeenCalledWith({ userId: user.id, email: user.email }, testJwtSecret, { expiresIn: testAccessTokenExpiration });
            expect(jwt.sign).toHaveBeenCalledWith({ userId: user.id }, testRefreshSecret, { expiresIn: testRefreshTokenExpiration });
            expect(res.json).toHaveBeenCalledWith({
                message: 'Login bem-sucedido',
                accessToken,
                refreshToken: refreshTokenVal,
                user: { id: 'uuid-3', email: 'test@example.com', name: 'Test User', avatar: null, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if user not found', async () => {
            const req = mockRequest({ email: 'notfound@example.com', password: 'password123' });
            const res = mockResponse();

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

            await login(req, res, mockNext);

            expect(userRepository.findByEmail).toHaveBeenCalledWith('notfound@example.com');
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Credenciais inválidas', statusCode: 401 }));
        });

        it('should return 401 if password does not match', async () => {
            const req = mockRequest({ email: 'test@example.com', password: 'wrongpassword' });
            const res = mockResponse();
            const user = { id: 'uuid-4', email: 'test@example.com', password: 'hashedPassword' };

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await login(req, res, mockNext);

            expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Credenciais inválidas', statusCode: 401 }));
        });

        it('should call next with error if userRepository.findByEmail fails', async () => {
            const req = mockRequest({ email: 'dberror@example.com', password: 'password123' });
            const res = mockResponse();
            const dbError = new Error('DB find failed');

            (userRepository.findByEmail as jest.Mock).mockRejectedValue(dbError);

            await login(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(dbError);
        });

        it('should call next with error if bcrypt.compare fails', async () => {
            const req = mockRequest({ email: 'comparefail@example.com', password: 'password123' });
            const res = mockResponse();
            const user = { id: 'uuid-5', email: 'comparefail@example.com', password: 'hashedPassword' };
            const compareError = new Error('Compare failed');

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockRejectedValue(compareError);

            await login(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(compareError);
        });
    });

    // --- Refresh Token Tests --- //
    describe('refreshToken', () => {
        it('should return a new access token for a valid refresh token', async () => {
            const req = mockRequest({ token: 'validRefreshToken' });
            const res = mockResponse();
            const decodedPayload = { userId: 'uuid-6' };
            const newAccessToken = 'newAccessTokenFromRefresh';

            (jwt.verify as jest.Mock).mockImplementation((token, secret) => {
                if (secret === testRefreshSecret) return decodedPayload;
                throw new Error('Invalid secret');
            });
            (jwt.sign as jest.Mock).mockImplementation((payload, secret, options) => {
                if (secret === testJwtSecret && options?.expiresIn === testAccessTokenExpiration) return newAccessToken;
                return 'wrong_token_type_or_secret';
            });

            await refreshToken(req, res, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('validRefreshToken', testRefreshSecret);
            expect(jwt.sign).toHaveBeenCalledWith({ userId: 'uuid-6' }, testJwtSecret, { expiresIn: testAccessTokenExpiration });
            expect(res.json).toHaveBeenCalledWith({
                message: 'Access token atualizado com sucesso',
                accessToken: newAccessToken,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if refresh token is not provided', async () => {
            const req = mockRequest({}); // No token in body
            const res = mockResponse();

            await refreshToken(req, res, mockNext);

            expect(jwt.verify).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Refresh token não fornecido', statusCode: 400 }));
        });

        it('should return 401 if refresh token is invalid or expired', async () => {
            const req = mockRequest({ token: 'invalidOrExpiredToken' });
            const res = mockResponse();
            const verifyError = new Error('Invalid token');

            (jwt.verify as jest.Mock).mockImplementation((token, secret) => {
                if (secret === testRefreshSecret) throw verifyError;
                return {};
            });

            await refreshToken(req, res, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('invalidOrExpiredToken', testRefreshSecret);
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Refresh token inválido ou expirado', statusCode: 401 }));
        });
    });
});

