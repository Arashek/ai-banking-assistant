const { createLogger } = require('../utils/logger');

const logger = createLogger('error-handler');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Default error message
  let message = 'Ha ocurrido un error en el servidor';
  let statusCode = 500;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    message = 'Error de validación';
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    message = 'No autorizado';
    statusCode = 401;
  } else if (err.name === 'ForbiddenError') {
    message = 'Acceso denegado';
    statusCode = 403;
  } else if (err.name === 'NotFoundError') {
    message = 'Recurso no encontrado';
    statusCode = 404;
  }

  res.status(statusCode).json({
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        detail: err.message,
        stack: err.stack,
      }),
    },
  });
};

module.exports = {
  errorHandler,
};
