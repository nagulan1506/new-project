const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const User = require('./models/User');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Password Reset API is running and healthy!');
});

// Debug endpoint (Required for final verification)
app.get('/api/debug/env', (req, res) => {
    res.json({
        EMAIL_USER_SET: !!process.env.EMAIL_USER,
        EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
        RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
        MONGODB_URI_SET: !!process.env.MONGODB_URI,
        CLIENT_URL: process.env.CLIENT_URL || 'Not Set'
    });
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Register (for testing purposes, to have a user in DB)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email: normalizedEmail, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
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

        console.log(`Forgot password request for: ${normalizedEmail}`);
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email credentials missing in environment variables');
            return res.status(500).json({ message: 'Server email configuration missing' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password/${token}`;

        // 1. Try using Resend if API Key is provided (Highly recommended for Render)
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'onboarding@resend.dev', // Default test sender
                    to: email,
                    subject: 'Password Reset',
                    html: `<p>You requested a password reset. Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
                });
                console.log('Reset email sent via Resend to:', email);
                return res.status(200).json({ message: 'Reset link sent to email via Resend' });
            } catch (resendError) {
                console.error('Resend error:', resendError);
                // Fall through to Nodemailer...
            }
        }

        // 2. Fallback to Nodemailer (SMTP)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 5000, // 5 seconds
            greetingTimeout: 5000   // 5 seconds
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click the link to reset your password: ${resetLink}`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Reset email sent via Nodemailer to:', email);
            res.status(200).json({ message: 'Reset link sent to email' });
        } catch (error) {
            console.error('Nodemailer sendMail error:', error);
            res.status(500).json({
                message: 'Failed to send email. Check your Render logs and Environment variables.',
                error: error.message
            });
        }

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
