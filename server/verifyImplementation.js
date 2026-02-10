const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Load env from .env file
dotenv.config();

const API_URL = 'http://localhost:5000';
const TEST_EMAIL = 'verify_test@example.com';
const TEST_PASSWORD = 'password123';
const NEW_PASSWORD = 'newpassword789';

// Mongoose Model (Inline to avoid dependency issues if file paths differ)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: String,
    resetTokenExpiry: Date
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function runVerification() {
    console.log('🚀 Starting Verification of Password Reset Flow...');

    try {
        // 0. Connect to DB to manage test user
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing in .env');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Cleanup & Setup Test User
        await User.deleteOne({ email: TEST_EMAIL });
        // Create user via API to ensure password hashing works (or just register)
        try {
            await axios.post(`${API_URL}/api/auth/register`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });
            console.log('✅ Test user registered');
        } catch (e) {
            console.error('❌ Registration failed:', e.response?.data || e.message);
            process.exit(1);
        }

        // 2. Request Forgot Password
        await axios.post(`${API_URL}/api/auth/forgot-password`, { email: TEST_EMAIL });
        console.log('✅ Forgot Password request sent');

        // 3. Get Token from DB (Simulating email link click)
        await new Promise(r => setTimeout(r, 1000)); // Wait for DB update
        const user = await User.findOne({ email: TEST_EMAIL });
        const token = user.resetToken;
        if (!token) throw new Error('Reset token not found in user record');
        console.log(`✅ Token retrieved from DB: ${token}`);

        // 4. Verify Token (Valid Case)
        try {
            const verifyRes = await axios.get(`${API_URL}/api/auth/verify-token/${token}`);
            if (verifyRes.status === 200) console.log('✅ Token verification successful (200 OK)');
        } catch (e) {
            console.error('❌ Token verification failed:', e.response?.data || e.message);
            throw e;
        }

        // 5. Verify Token (Invalid Case)
        try {
            await axios.get(`${API_URL}/api/auth/verify-token/${token}_invalid`);
            console.error('❌ Invalid token check FAILED (Should have returned 400)');
        } catch (e) {
            if (e.response?.status === 400) {
                console.log('✅ Invalid token check successful (Returned 400 as expected)');
            } else {
                console.error('❌ Invalid token check failed with unexpected error:', e.message);
            }
        }

        // 6. Reset Password
        try {
            await axios.post(`${API_URL}/api/auth/reset-password`, {
                token: token,
                newPassword: NEW_PASSWORD
            });
            console.log('✅ Password reset successful');
        } catch (e) {
            console.error('❌ Password reset failed:', e.response?.data || e.message);
            throw e;
        }

        // 7. Login with New Password
        try {
            await axios.post(`${API_URL}/api/auth/login`, {
                email: TEST_EMAIL,
                password: NEW_PASSWORD
            });
            console.log('✅ Login with new password successful');
        } catch (e) {
            console.error('❌ Login with new password failed:', e.response?.data || e.message);
            throw e;
        }

        console.log('\n✨ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ✨');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED ❌');
        console.error(error.response?.data || error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
