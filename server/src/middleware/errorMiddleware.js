/**
 * Global Error Handling Middleware
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: [${req.method}] ${req.originalUrl}`
  });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('🔥 [Server Error]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
