const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.httpStatus || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      httpStatus: statusCode,
      message: err.message || 'An unexpected server error occurred.'
    }
  });
};

module.exports = errorHandler;
