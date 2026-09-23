class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const handleError = (err, res) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).json({
    status: statusCode,
    message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

module.exports = {
  ApiError,
  handleError
};
