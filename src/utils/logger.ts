import winston from 'winston';

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

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }), // Colorize the output
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports (where logs should go)
const transports = [
  // Always log to the console
  new winston.transports.Console(),
  // Optionally, log errors to a separate file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // Optionally, log all levels to another file
  // new winston.transports.File({ filename: 'logs/all.log' }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Middleware for logging HTTP requests (optional but useful)
export const httpLogger = (req: any, res: any, next: any) => {
    // Log request details
    logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    
    // Log response details when finished
    res.on('finish', () => {
        logger.http(`${res.statusCode} ${res.statusMessage}; ${res.get('Content-Length') || 0}b sent`);
    });
    
    next();
};

export default logger;

