import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger';
import tokenStorage from '../services/tokenStorage';

const logger = createLogger('psd2-middleware');

// Rate limiting middleware
export const psd2RateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id,
    });
    res.status(429).json({
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(req.rateLimit?.resetTime || 900),
    });
  },
});

// Validate PSD2 access middleware
export const validatePSD2Access = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user has valid consent
    const consentData = await tokenStorage.getConsentData(userId);
    if (!consentData) {
      return res.status(403).json({
        message: 'PSD2 access not authorized',
        code: 'PSD2_ACCESS_REQUIRED',
      });
    }

    // Check if consent has expired
    const consentExpiry = new Date(consentData.expiresAt);
    if (consentExpiry < new Date()) {
      return res.status(403).json({
        message: 'PSD2 access has expired',
        code: 'PSD2_ACCESS_EXPIRED',
      });
    }

    // Check if access token exists
    const accessToken = await tokenStorage.getAccessToken(userId);
    if (!accessToken) {
      return res.status(403).json({
        message: 'PSD2 access token not found',
        code: 'PSD2_TOKEN_MISSING',
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating PSD2 access', {
      userId: req.user?.id,
      error: error.message,
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Error handling middleware for PSD2 API errors
export const handlePSD2Error = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!error.isAxiosError) {
    return next(error);
  }

  const status = error.response?.status || 500;
  const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';
  const errorMessage = error.response?.data?.message || 'An error occurred';

  logger.error('PSD2 API error', {
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    status,
    errorCode,
    errorMessage,
  });

  // Map common PSD2 API errors to appropriate responses
  switch (status) {
    case 400:
      res.status(400).json({
        message: 'Invalid request',
        code: errorCode,
        details: errorMessage,
      });
      break;

    case 401:
      res.status(401).json({
        message: 'Authentication failed',
        code: 'PSD2_AUTH_FAILED',
      });
      break;

    case 403:
      res.status(403).json({
        message: 'Access denied',
        code: 'PSD2_ACCESS_DENIED',
      });
      break;

    case 404:
      res.status(404).json({
        message: 'Resource not found',
        code: 'PSD2_NOT_FOUND',
      });
      break;

    case 429:
      res.status(429).json({
        message: 'Too many requests',
        code: 'PSD2_RATE_LIMIT',
        retryAfter: error.response?.headers['retry-after'] || 60,
      });
      break;

    default:
      res.status(500).json({
        message: 'Internal server error',
        code: 'PSD2_SERVER_ERROR',
      });
  }
};

// Request logging middleware
export const logPSD2Request = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log request
  logger.info('PSD2 API request', {
    userId: req.user?.id,
    method: req.method,
    path: req.path,
    query: req.query,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('PSD2 API response', {
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });
  });

  next();
};
