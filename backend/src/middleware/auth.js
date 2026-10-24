/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/responseHandler.js';

export const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 401, 'No token provided. Please login first.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token has expired. Please login again.');
    }
    return errorResponse(res, 401, 'Invalid token. Authentication failed.');
  }
};

export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'User not authenticated.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'You do not have permission to access this resource.');
    }

    next();
  };
};
