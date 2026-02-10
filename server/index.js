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
    origin: ['http://localhost:5173', 'https://jovial-torte-834bf7.netlify.app', 'https://heroic-daffodil-8b2525.netlify.app', process.env.CLIENT_URL],
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

app.get('/api/debug/test-db', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

        // Try a simple query
        const count = await User.countDocuments();

        res.json({
            state: states[state] || state,
            userCount: count,
            message: 'Database connection is working'
        });
    } catch (err) {
        res.status(500).json({ error: 'DB Test Failed', details: err.message });
    }
});

app.get('/api/debug/test-email', async (req, res) => {
    const testEmail = req.query.to || process.env.EMAIL_USER;
    if (!testEmail) return res.status(400).json({ error: 'No test email provided' });

    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.verify();
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: testEmail,
            subject: 'Debug Email Test',
            text: 'If you received this, email sending is working on Render.'
        });

        res.json({ message: 'Email sent successfully', messageId: info.messageId });
    } catch (err) {
        res.status(500).json({ error: 'Email Test Failed', details: err.message });
    }
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
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            // Security: Don't reveal if user exists or not, but for debugging we might want to know. 
            // Standard practice is to say "If that email exists, a link has been sent."
            // But checking the user's previous code, they returned 404. I will keep it consistent or follow best practice?
            // User's code returned 404. I'll stick to it for now to avoid confusion, or maybe improve validation.
            return res.status(404).json({ message: 'User not found' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password/${token}`;
        console.log(`[ForgotPassword] Token generated for ${email}. Link: ${resetLink}`);

        let emailSent = false;
        let lastError = null;

        // 1. Try using Resend if API Key is provided
        if (process.env.RESEND_API_KEY) {
            console.log('[ForgotPassword] Attempting to send via Resend...');
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const { data, error } = await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: email, // Free tier limitation: Must be verified email
                    subject: 'Password Reset',
                    html: `<p>You requested a password reset. Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
                });

                if (error) {
                    console.error('[ForgotPassword] Resend API Error:', error);
                    lastError = error;
                } else {
                    console.log('[ForgotPassword] Email sent via Resend:', data);
                    emailSent = true;
                }
            } catch (resendError) {
                console.error('[ForgotPassword] Resend execution error:', resendError);
                lastError = resendError;
            }
        }

        // 2. Use Nodemailer ONLY if Resend failed or not present
        if (!emailSent) {
            console.log('[ForgotPassword] Attempting to send via Nodemailer to:', email);
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail', // Use service shorthand for better compatibility
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                // Verify connection first
                console.log('[ForgotPassword] Verifying Nodemailer transporter...');
                await transporter.verify();
                console.log('[ForgotPassword] Nodemailer connection verified.');

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Password Reset',
                    text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
                    html: `<p>You requested a password reset. Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
                };

                console.log('[ForgotPassword] Sending mail...');
                const info = await transporter.sendMail(mailOptions);
                console.log('[ForgotPassword] Email sent via Nodemailer:', info.messageId);
                emailSent = true;

            } catch (nodemailerError) {
                console.error('[ForgotPassword] Nodemailer error details:', nodemailerError);
                lastError = nodemailerError;
            }
        }

        if (emailSent) {
            console.log('[ForgotPassword] Success!');
            return res.status(200).json({ message: 'Reset link sent to email' });
        } else {
            console.error('[ForgotPassword] FAILED. Last error:', lastError);
            return res.status(500).json({
                message: 'Failed to send email. Please try again later.',
                debug: lastError ? lastError.message : 'Unknown error',
                details: lastError ? JSON.stringify(lastError, Object.getOwnPropertyNames(lastError)) : 'No details'
            });
        }

    } catch (err) {
        console.error('[ForgotPassword] Setup Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verify Token Endpoint
app.get('/api/auth/verify-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        res.status(200).json({ message: 'Token is valid' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        console.log('Received Reset Request for Token:', token);

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            console.log('Invalid or expired token for:', token);
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        console.log('Password reset successful for user:', user.email);
        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
