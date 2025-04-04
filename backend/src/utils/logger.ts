import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const LOG_DIR = path.join(__dirname, '../../logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transport for error logs
const errorTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
});

// Create transport for combined logs
const combinedTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Create logger factory
export const createLogger = (module: string) => {
  return winston.createLogger({
    format: logFormat,
    defaultMeta: { module },
    transports: [
      // Write all logs error (and below) to error file
      errorTransport,
      // Write all logs to combined file
      combinedTransport,
      // Write all logs to console in development
      ...(process.env.NODE_ENV !== 'production'
        ? [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
              ),
            }),
          ]
        : []),
    ],
  });
};

// Create default logger
export const logger = createLogger('app');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Give time for logs to be written before exiting
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
  });
});

// Export error handling middleware
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    body: req.body,
  });

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : err.message,
  });
};
