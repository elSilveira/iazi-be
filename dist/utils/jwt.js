"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Placeholder for JWT secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret'; // Use Secret type
// Placeholder function to satisfy imports in tests
const generateToken = (payload, expiresIn = '60d') => {
    console.log(`Generating token for payload: ${JSON.stringify(payload)} with secret (placeholder)`);
    // Create SignOptions object. expiresIn type is now more restricted.
    const options = { expiresIn };
    // This assignment should now be compatible as ExpiresInLiteral is a subset of StringValue | number
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
};
exports.generateToken = generateToken;
// Placeholder for verifying token if needed elsewhere
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        console.error('Invalid token:', error);
        return 'Invalid token';
    }
};
exports.verifyToken = verifyToken;
