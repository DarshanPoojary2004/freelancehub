# FreelanceHub Backend

Express.js REST API backend for the FreelanceHub Freelance Marketplace

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **OAuth**: Google OAuth 2.0

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── services/         # Business logic services
│   ├── utils/            # Utility functions
│   └── server.js         # Main application file
├── .env                  # Environment variables (DO NOT COMMIT)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
└── package.json          # Dependencies and scripts
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

**Dependencies installed:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `pg` - PostgreSQL database client
- `multer` - File upload handling
- `nodemon` - Auto-reload during development (dev only)

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
PORT=5000
NODE_ENV=development

# Database (PostgreSQL required)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freelancehub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup (PostgreSQL)

You must have PostgreSQL installed locally. Set it up:

```bash
# On Windows (PowerShell):
# Install PostgreSQL from: https://www.postgresql.org/download/windows/

# Or on Windows with Chocolatey:
choco install postgresql

# Connect to PostgreSQL:
psql -U postgres

# Create database:
CREATE DATABASE freelancehub;

# Verify:
\l
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## Available Scripts

```bash
npm run dev      # Start dev server with auto-reload
npm start        # Start production server
npm test         # Run tests (not configured yet)
```

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Authentication (Coming Soon)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google-login` - Google OAuth login

### Users (Coming Soon)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users` - Get all users (admin)

### Projects (Coming Soon)
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Middleware

### Authentication
- `authenticateUser` - Verify JWT token
- `authorizeRole(roles)` - Check user role permissions

### Validation
- `validateRegistrationInput` - Validate registration data
- `validateLoginInput` - Validate login data

## Services

### Authentication Service (`src/services/authService.js`)
- `hashPassword(password)` - Hash password with bcrypt
- `comparePassword(password, hash)` - Verify password
- `generateToken(user)` - Create JWT token
- `verifyToken(token)` - Verify JWT token
- `decodeGoogleToken(token)` - Decode Google OAuth JWT

## Configuration Files

### Database (`src/config/database.js`)
PostgreSQL connection pool with connection management

## Error Handling

All API responses follow a standard format:

**Success Response (2xx):**
```json
{
  "status": "success",
  "code": 200,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2026-08-13T10:00:00.000Z"
}
```

**Error Response (4xx/5xx):**
```json
{
  "status": "error",
  "code": 400,
  "message": "Error message",
  "error": { /* error details */ },
  "timestamp": "2026-08-13T10:00:00.000Z"
}
```

## Security Features

✅ Password hashing with bcrypt
✅ JWT token-based authentication
✅ CORS protection
✅ Input validation
✅ Environment variable management
✅ Role-based authorization (middleware ready)
✅ Google OAuth integration ready

## Next Steps

1. ✅ Backend structure created
2. ⏳ PostgreSQL database setup
3. ⏳ Database schema creation
4. ⏳ Authentication endpoints implementation
5. ⏳ User management endpoints
6. ⏳ Project management endpoints
7. ⏳ Proposal system endpoints
8. ⏳ Real-time chat (Socket.IO)

## Testing the Backend

### 1. Check Health Endpoint
```bash
curl http://localhost:5000/health
```

### 2. Test with Frontend
The frontend is already configured to use `http://localhost:5000` as the backend URL (via `VITE_API_BASE_URL` env var).

## Troubleshooting

**Error: Cannot find module 'express'**
- Run: `npm install`

**Error: Database connection failed**
- Ensure PostgreSQL is running
- Check DB_HOST, DB_USER, DB_PASSWORD in .env
- Make sure database `freelancehub` exists

**Error: Port 5000 already in use**
- Change PORT in .env
- Or kill the process: `lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

**Error: CORS issues**
- Update `FRONTEND_URL` in .env if frontend URL changes

## Important Notes

⚠️ **Never commit `.env` file to version control**
⚠️ **Always use strong JWT_SECRET in production**
⚠️ **Validate all user input**
⚠️ **Hash passwords with bcrypt (never store plain text)**
⚠️ **Use HTTPS in production**

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
