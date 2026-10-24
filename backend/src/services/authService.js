/**
 * Auth Service
 * Handles authentication logic (hashing, token generation, etc.)
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
};

/**
 * Compare password with hashed password
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing passwords: ' + error.message);
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.account_type,
    name: user.full_name
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  return token;
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Decode Google OAuth JWT token
 */
export const decodeGoogleToken = (token) => {
  try {
    // Split JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode payload (second part)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('utf-8')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Error decoding Google token: ' + error.message);
  }
};
