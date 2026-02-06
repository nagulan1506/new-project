const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const User = require('./models/User');

// Load environment variables from .env file in development, or from Render's environment in production
dotenv.config();

const app = express();

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'https://jovial-torte-834bf7.netlify.app', process.env.CLIENT_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Auth API is running and healthy!');
});

// Debug endpoint
app.get('/api/debug/env', (req, res) => {
    res.json({
        EMAIL_USER_SET: !!process.env.EMAIL_USER,
        EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
        RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
        MONGODB_URI_SET: !!process.env.MONGODB_URI,
        CLIENT_URL: process.env.CLIENT_URL || 'Not Set'
    });
});

// Improved MongoDB Connection
const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('FATAL ERROR: MONGODB_URI is undefined. Please set this environment variable in your Render Dashboard.');
        // We cannot proceed without a database, but we won't crash the process so the debug endpoint still works
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        // Do not exit process, allowing the server to stay up (though endpoints will fail)
    }
};
connectDB();

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email: normalizedEmail, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // In a real app, you would generate a JWT here
        res.status(200).json({
            message: 'Login successful',
            user: { email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password/${token}`;

        // 1. Try using Resend if API Key is provided
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: email,
                    subject: 'Password Reset',
                    html: `<p>You requested a password reset. Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
                });
                return res.status(200).json({ message: 'Reset link sent to email via Resend' });
            } catch (resendError) {
                console.error('Resend error:', resendError);
            }
        }

        // 2. Fallback to Nodemailer
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Reset link sent to email' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
