const errorHandler = (err, req, res, next) => {
  const isMongoError =
    err.name === 'MongooseError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError' ||
    err.name === 'MongoError' ||
    err.message?.toLowerCase().includes('database') ||
    err.message?.toLowerCase().includes('mongo') ||
    err.message?.toLowerCase().includes('buffering timed out');

  const statusCode = isMongoError ? 503 : (err.statusCode || err.httpStatus || 500);
  const code = isMongoError ? 'DATABASE_ERROR' : (err.code || 'INTERNAL_SERVER_ERROR');
  const message = isMongoError
    ? `Data fetching error from database: ${err.message}`
    : (err.message || 'An unexpected server error occurred.');

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      httpStatus: statusCode,
      message
    }
  });
};

module.exports = errorHandler;
