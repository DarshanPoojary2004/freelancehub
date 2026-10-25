/**
 * Database Configuration
 * PostgreSQL connection setup
 * Supports both DATABASE_URL (Neon/Render) and individual env vars (local)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// Neon / Render use DATABASE_URL; local dev uses individual vars
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'freelancehub',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: false,
    });

pool.on('connect', () => {
  console.log('✓ Database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message);
});

export const query = (text, params) => pool.query(text, params);

export const getClient = async () => pool.connect();

export const ensureDatabaseExists = async () => {
  // When using DATABASE_URL (Neon), the database already exists — skip creation
  if (process.env.DATABASE_URL) {
    console.log('✓ Using DATABASE_URL — skipping database creation check');
    return;
  }

  const DB_NAME = process.env.DB_NAME || 'freelancehub';
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 5,
    connectionTimeoutMillis: 5000,
    ssl: false,
  });

  try {
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [DB_NAME]
    );

    if (result.rowCount === 0) {
      console.log(`Database "${DB_NAME}" does not exist. Creating it...`);
      await adminPool.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database "${DB_NAME}" created successfully.`);
    }
  } finally {
    await adminPool.end();
  }
};

export const testDatabaseConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    return result.rows[0];
  } catch (error) {
    console.error('Database connection check failed:', error.message);
    throw error;
  }
};

export default pool;

