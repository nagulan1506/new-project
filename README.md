# Password Reset Flow

A full-stack application built with Node.js, Express, MongoDB, and React (Vite) implementing a secure password reset flow.

## Project Structure
- `server/`: Backend Node.js/Express server.
- `client/`: Frontend React application.

## Setup Instructions

### Backend (Server)
1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB connection string (already filled with the one provided).
   - `EMAIL_USER`: Your Gmail email address.
   - `EMAIL_PASS`: Your Gmail App Password (NOT your regular password).
4. Start the server: `node index.js` (or `npm start` if you add it to package.json)

### Frontend (Client)
1. Navigate to the `client` directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the application in your browser (usually `http://localhost:5173`).

## How to Test
1. **Register a User**: Use the `/api/auth/register` endpoint (via Postman or a tool like `curl`) to create a user in your MongoDB database first.
   - Example: `POST http://localhost:5000/api/auth/register` with body `{"email": "test@example.com", "password": "password123"}`
2. **Request Password Reset**: Go to the `/forgot-password` page on the frontend, enter the registered email, and click "Send Reset Link". 
3. **Check Email**: Check the email account specified in `EMAIL_USER` (it will send to the email you entered in the form).
4. **Reset Password**: Click the link in the email, which brings you to the `/reset-password/:token` page. Enter a new password and submit.
5. **Verify**: Check the database to see the hashed password updated and the reset token cleared.

## Deployment Instructions

### 1. Render (Backend Deployment)
- **Create a Web Service**: Connect your GitHub repository.
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `MONGODB_URI`: Your MongoDB URI.
  - `EMAIL_USER`: Your Gmail address.
  - `EMAIL_PASS`: Your Gmail App Password.
  - `CLIENT_URL`: The URL of your deployed Netlify app.

### 2. Netlify (Frontend Deployment)
- **Automatic Configuration**: I have added a `netlify.toml` file to the root. Netlify should automatically detect the `client` directory and build it.
- **Manual Settings (if needed)**:
  - **Base Directory**: `client`
  - **Build Command**: `npm run build`
  - **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://password-reset.onrender.com`).

## 🚨 Critical: Fix for Email Timeout (Render Free Tier)
If you get a **"Timeout of 15000ms exceeded"** error on Render, it is because Render blocks standard Gmail ports.

**The Solution: Use Resend** (1-minute setup):
1. Create a free account at **[Resend.com](https://resend.com)**.
2. Go to **API Keys** and create one (e.g., `re_123abc`).
3. Add it to your **Render Dashboard** as an Environment Variable: 
   - **Key**: `RESEND_API_KEY`
   - **Value**: (your `re_...` key)
4. Render will restart and automatically bypass the timeout by using the Resend API!
