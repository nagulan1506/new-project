# Auth App (Register, Login & Forgot Password)

A full-stack application built with Node.js, Express, MongoDB, and React (Vite) implementing user registration, login, and secure password reset functionality.

## Project Structure
- `server/`: Backend Node.js/Express server.
- `client/`: Frontend React application.

## Setup Instructions

### Backend (Server)
1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB connection string.
   - `EMAIL_USER`: Your Gmail address (for password reset emails).
   - `EMAIL_PASS`: Your Gmail App Password.
   - `RESEND_API_KEY`: (Optional) Resend API key for reliable email delivery.
4. Start the server: `node index.js`

### Frontend (Client)
1. Navigate to the `client` directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the application in your browser (usually `http://localhost:5173`).

## How to use
1. **Register**: Go to the `/register` page and create a new account.
2. **Login**: Use your credentials to log in on the `/login` page.
3. **Forgot Password**: On the login page, click "Forgot Password?". Enter your email to receive a reset link.
4. **Reset Password**: Click the link in the email and set a new password.


## Deployment Instructions

### 1. Render (Backend Deployment)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `MONGODB_URI`: Your MongoDB URI.

### 2. Netlify (Frontend Deployment)
- **Base Directory**: `client`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

