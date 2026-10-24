/**
 * Input Validation Middleware
 * Validates request data
 */

import { errorResponse } from '../utils/responseHandler.js';

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRegistrationInput = (req, res, next) => {
  const { fullName, email, password, accountType } = req.body;

  const errors = {};

  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  if (!email || !validateEmail(email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || !validatePassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!accountType || !['freelancer', 'client'].includes(accountType.toLowerCase())) {
    errors.accountType = 'Account type must be either "freelancer" or "client"';
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 400, 'Validation failed', errors);
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  const errors = {};

  if (!email || !validateEmail(email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 400, 'Validation failed', errors);
  }

  next();
};
