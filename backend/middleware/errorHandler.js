/**
 * Error Handler Middleware — centralized error response formatting.
 */
const logger = require('../logger')

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  logger.error('Request error', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    stack: err.stack,
  })

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
}

function notFoundHandler(req, res) {
  logger.warn('Route not found', { method: req.method, url: req.originalUrl })
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404,
    },
  })
}

module.exports = { errorHandler, notFoundHandler }
