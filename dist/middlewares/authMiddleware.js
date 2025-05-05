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
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../lib/errors"); // Assuming custom errors
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            // Get user from the token payload (consider fetching from DB for validation)
            // For simplicity here, we trust the payload if the signature is valid.
            // In production, you might want to check if the user still exists or is active.
            /*
            const user = await prisma.user.findUnique({
              where: { id: decoded.userId },
              select: { id: true, role: true, isActive: true } // Select necessary fields
            });
      
            if (!user || !user.isActive) {
              next(new UnauthorizedError('User not found or inactive'));
              return;
            }
            */
            // Attach user info to the request object
            req.user = {
                userId: decoded.userId,
                role: decoded.role, // Pass role from token
            };
            next(); // Proceed to the next middleware/controller
        }
        catch (error) {
            console.error('Token verification failed:', error);
            next(new errors_1.UnauthorizedError('Not authorized, token failed'));
        }
    }
    else {
        next(new errors_1.UnauthorizedError('Not authorized, no token'));
    }
});
exports.protect = protect;
// Optional: Middleware to check for specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        var _a;
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new errors_1.UnauthorizedError(`User role ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.role} is not authorized to access this route`));
        }
        next();
    };
};
exports.authorize = authorize;
