const logger = require('../utils/logger.util');

const errorMiddleware = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal server error';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${message}`, { stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
