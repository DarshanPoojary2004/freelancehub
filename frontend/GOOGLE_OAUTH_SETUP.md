# 🔐 Google OAuth Setup Guide - FreelanceHub

## Overview
Google OAuth authentication has been integrated into your Login and Register pages. Follow this guide to get your Google OAuth credentials working.

---

## 📋 Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account (create one if needed)

### 1.2 Create a New Project
- Click **"Select a Project"** at the top
- Click **"NEW PROJECT"**
- Project name: `FreelanceHub` (or your preferred name)
- Click **"CREATE"**
- Wait for the project to be created (this takes a moment)

### 1.3 Enable Google+ API
- In the search bar, type: `Google+ API`
- Click on **"Google+ API"**
- Click **"ENABLE"**

### 1.4 Create OAuth Credentials
- Go to **"Credentials"** in the left sidebar
- Click **"+ CREATE CREDENTIALS"** → Choose **"OAuth client ID"**
- You might be asked to configure the **OAuth consent screen** first:
  - Click **"Configure Consent Screen"**
  - Choose **"External"** user type
  - Click **"CREATE"**

### 1.5 Configure OAuth Consent Screen
**On the User Type screen:**
- Select **External**
- Click **CREATE**

**On the App Information screen:**
- App name: `FreelanceHub`
- User support email: (enter your email)
- Click **SAVE AND CONTINUE**

**On the Scopes screen:**
- Click **SAVE AND CONTINUE** (default scopes are fine)

**On the Test Users screen:**
- You can add test email addresses here (optional)
- Click **SAVE AND CONTINUE**

### 1.6 Create OAuth 2.0 Credentials
- Go back to **"Credentials"**
- Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
- Application type: **"Web application"**
- Name: `FreelanceHub Web Client`
- Click **"ADD URI"** under "Authorized JavaScript origins"
  - Add: `http://localhost:5173`
  - Add: `http://localhost:5174`
  - Add: `http://localhost:3000` (optional, for future deployments)

- Click **"ADD URI"** under "Authorized redirect URIs"
  - Add: `http://localhost:5173/login`
  - Add: `http://localhost:5174/login`
  - Add: `http://localhost:3000/login` (optional)

- Click **"CREATE"**

### 1.7 Copy Your Client ID
- A popup will show your **Client ID**
- Copy this ID (it looks like: `123456789-abc1def2ghi3jkl4mno5pqr6stu7vwx.apps.googleusercontent.com`)

---

## 🔑 Step 2: Add Client ID to Your App

### 2.1 Update .env file
1. Open: `frontend/.env`
2. Find: `VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE`
3. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your copied Client ID
4. Example:
   ```
   VITE_GOOGLE_CLIENT_ID=123456789-abc1def2ghi3jkl4mno5pqr6stu7vwx.apps.googleusercontent.com
   VITE_API_BASE_URL=http://localhost:5000
   ```

### 2.2 Save and Restart Dev Server
```bash
# Stop the dev server (Ctrl+C)
# Restart it:
npm run dev
```

---

## ✅ Step 3: Test Google OAuth

### 3.1 Test Login with Google
1. Go to: http://localhost:5174/login
2. Click **"Continue with Google"** button
3. Sign in with your Google account
4. Confirm you see: "Welcome back, [Your Name]!"
5. Check browser console (F12 → Console) for token details

### 3.2 Test Signup with Google
1. Go to: http://localhost:5174/register
2. **Select Account Type** (Freelancer or Client)
3. Click **"Sign up with Google"** button
4. Sign in with your Google account
5. Confirm you see: "Welcome to FreelanceHub, [Your Name]!"

---

## 🎯 Current Features Implemented

### Login Page
✅ Email/Password form with validation
✅ Google OAuth button
✅ Error messages for invalid input
✅ Success message after login
✅ "Forgot Password" link (placeholder)
✅ Link to Register page

### Register Page
✅ Full Name field
✅ Email field with validation
✅ Password field (min 6 characters)
✅ Account Type dropdown (Freelancer/Client)
✅ Form validation with error messages
✅ Google OAuth button with account type selection
✅ Success message after signup
✅ Link to Login page

### Auth Service
✅ `googleAuthService.js` - Handles:
  - Google token decoding
  - User data extraction
  - localStorage storage
  - Login/Signup functions
  - User session management

---

## 📝 What Happens When User Logs In with Google

1. User clicks **"Continue with Google"** button
2. Google sign-in popup appears
3. User authenticates with their Google account
4. Google returns a **JWT token** with user information
5. Our app decodes the token and extracts:
   - User ID (sub)
   - Email
   - Full name
   - Profile picture
   - Account type (for signup)
6. User data is stored in `localStorage`
7. Success message is displayed
8. *(Next: Backend will verify token and create user account)*

---

## 🔄 Next Steps: Backend Integration

When your Node.js/Express backend is ready:

1. **Frontend sends token to backend:**
   ```javascript
   POST /api/auth/google-login
   Body: { token: "jwt-token-from-google" }
   ```

2. **Backend verifies token:**
   - Validate signature with Google's public key
   - Extract user information
   - Check if user exists in database
   - Create new user if needed
   - Return JWT token for session

3. **Update `googleAuthService.js`:**
   ```javascript
   // Send to backend for verification
   const response = await fetch('/api/auth/google-login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ token })
   });
   ```

---

## 🚀 Deployment Notes

When deploying to production:

1. Add your domain to Google OAuth credentials:
   - Authorized JavaScript origins: `https://yourapp.com`
   - Authorized redirect URIs: `https://yourapp.com/login`

2. Update `.env` in production:
   ```
   VITE_GOOGLE_CLIENT_ID=your_production_client_id
   VITE_API_BASE_URL=https://api.yourapp.com
   ```

3. Never commit `.env` file to version control
   - Use `.env.example` for reference

---

## 🐛 Troubleshooting

### Issue: "Client ID is not set" warning
**Solution:** 
- Check if `.env` file exists in `frontend/` directory
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Restart dev server after updating `.env`

### Issue: Google button not appearing
**Solution:**
- Make sure you added the Client ID to `.env`
- Check browser console for errors (F12 → Console)
- Verify `@react-oauth/google` is installed: `npm list @react-oauth/google`

### Issue: "Redirect URI mismatch" error
**Solution:**
- Go back to Google Cloud Console
- Check your authorized redirect URIs match your localhost port
- Add both `http://localhost:5173` and `http://localhost:5174`

### Issue: Token verification fails
**Solution:**
- Token might be expired (Google tokens expire in 1 hour)
- Try logging in again
- Check browser console for detailed error messages

---

## 📚 Files Created/Modified

### New Files:
- `frontend/src/services/googleAuthService.js` - OAuth handler
- `frontend/.env` - Environment variables
- `frontend/.env.example` - Template for env variables

### Modified Files:
- `frontend/src/App.jsx` - Added GoogleOAuthProvider wrapper
- `frontend/src/pages/Login.jsx` - Added Google Login with form validation
- `frontend/src/pages/Register.jsx` - Added Google Signup with form validation
- `frontend/src/pages/Login.css` - Added error/success message styles
- `frontend/src/pages/Register.css` - Added error/success message styles

---

## 💡 Tips

1. **For Testing:** Use a test Google account to avoid issues with your personal account
2. **Check localStorage:** Open DevTools (F12) → Application → localStorage to see stored user data
3. **Token Decoding:** The JWT token from Google is base64 encoded; we decode it in `googleAuthService.js`
4. **Security:** In production, always verify the token on the backend, never trust client-side validation alone

---

## 📞 Support

If you encounter issues:
1. Check the browser console (F12 → Console) for error messages
2. Verify Google Cloud Console settings
3. Ensure `.env` file is in the correct location with correct Client ID
4. Restart the dev server after making changes

