"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = void 0;
const winston_1 = __importDefault(require("winston"));
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define log level based on environment (default to 'warn' for production)
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
// Define colors for different log levels
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
// Define log format
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), // Colorize the output
winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Define transports (where logs should go)
const transports = [
    // Always log to the console
    new winston_1.default.transports.Console(),
    // Optionally, log errors to a separate file
    new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }),
    // Optionally, log all levels to another file
    // new winston.transports.File({ filename: 'logs/all.log' }),
];
// Create the logger instance
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format,
    transports,
});
// Middleware for logging HTTP requests (optional but useful)
const httpLogger = (req, res, next) => {
    // Log request details
    logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    // Log response details when finished
    res.on('finish', () => {
        logger.http(`${res.statusCode} ${res.statusMessage}; ${res.get('Content-Length') || 0}b sent`);
    });
    next();
};
exports.httpLogger = httpLogger;
exports.default = logger;
