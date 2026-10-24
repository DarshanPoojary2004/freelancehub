/**
 * Response Handler Utility
 * Standardized API responses
 */

export const successResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    status: 'success',
    code: statusCode,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: message,
    error: error,
    timestamp: new Date().toISOString()
  });
};

export const paginatedResponse = (res, statusCode, message, data, pagination) => {
  res.status(statusCode).json({
    status: 'success',
    code: statusCode,
    message: message,
    data: data,
    pagination: pagination,
    timestamp: new Date().toISOString()
  });
};
