/**
 * Authentication Routes
 * POST /api/auth/register - Register new user
 * POST /api/auth/login - Login user
 * POST /api/auth/google-login - Google OAuth login
 */

import express from 'express';
import { query } from '../config/database.js';
import { comparePassword, generateToken, hashPassword } from '../services/authService.js';
import { validateLoginInput, validateRegistrationInput } from '../middleware/validation.js';
import { errorResponse, successResponse } from '../utils/responseHandler.js';

const router = express.Router();

router.post('/register', validateRegistrationInput, async (req, res, next) => {
  try {
    const { fullName, email, password, accountType } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

    if (existingUser.rowCount > 0) {
      return errorResponse(res, 409, 'An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, account_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, account_type`,
      [fullName.trim(), normalizedEmail, passwordHash, accountType.toLowerCase()]
    );
    const user = result.rows[0];

    return successResponse(res, 201, 'Account created successfully', {
      token: generateToken(user),
      user: { id: user.id, name: user.full_name, email: user.email, accountType: user.account_type }
    });
  } catch (error) {
    console.error('Register error:', error);

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return errorResponse(res, 503, 'Database unavailable. Check PostgreSQL is running on localhost:5432 and your password in backend/.env is correct.');
    }

    if (error.code === '23505') {
      return errorResponse(res, 409, 'An account with this email already exists');
    }

    return errorResponse(res, 500, 'Registration failed. Please try again later.', {
      detail: error.message
    });
  }
});

router.post('/login', validateLoginInput, async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.trim().toLowerCase();
    const result = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = result.rows[0];

    if (!user || !user.password_hash || !(await comparePassword(req.body.password, user.password_hash))) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    return successResponse(res, 200, 'Login successful', {
      token: generateToken(user),
      user: { id: user.id, name: user.full_name, email: user.email, accountType: user.account_type }
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return errorResponse(res, 503, 'Database unavailable. Check PostgreSQL is running on localhost:5432 and your password in backend/.env is correct.');
    }

    return errorResponse(res, 500, 'Login failed. Please try again later.', {
      detail: error.message
    });
  }
});

router.post('/google-login', (req, res) => {
  errorResponse(res, 501, 'Google OAuth endpoint coming soon');
});

export default router;
