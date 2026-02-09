const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.EMAIL_USER;
const TEST_PASSWORD = 'password123';
const NEW_PASSWORD = 'newpassword456';

async function testResetFlow() {
    console.log('--- Starting Full Reset Password Flow Test ---');

    try {
        // 1. Register/Login to ensure user exists
        console.log(`\n1. Ensuring user ${TEST_EMAIL} exists...`);
        try {
            await axios.post(`${API_URL}/api/auth/register`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });
            console.log('User registered.');
        } catch (e) {
            console.log('User likely already exists (expected).');
        }

        // 2. Request Forgot Password
        console.log('\n2. Requesting Forgot Password...');
        // We need to capture the token. Since the real email sends it out, 
        // we can't easily grab it from the client side unless we inspect the DB or logs.
        // For this test, verifying the BACKEND flow, we might need to inspect the DB 
        // OR mock the email sending to return the token?
        // Actually, let's just trigger it and then Query the DB directly if possible?
        // No, I can't query DB easily from this script without mongoose setup.

        // BETTER APPROACH:
        // Use the debug endpoint or similar? No.
        // I will connect to Mongoose in this script to fetch the token.

        const mongoose = require('mongoose');
        const User = require('./models/User'); // Assuming path

        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in env');
        }
        await mongoose.connect(process.env.MONGODB_URI);

        await axios.post(`${API_URL}/api/auth/forgot-password`, {
            email: TEST_EMAIL
        });
        console.log('Forgot Password request sent.');

        // 3. Fetch Token from DB
        console.log('\n3. Fetching token from Database...');
        // Wait a bit for DB update
        await new Promise(r => setTimeout(r, 1000));

        const user = await User.findOne({ email: TEST_EMAIL });
        if (!user || !user.resetToken) {
            throw new Error('Reset token not found in DB!');
        }
        const token = user.resetToken;
        console.log(`Token retained: ${token}`);

        // 4. Reset Password
        console.log('\n4. Attempting to Reset Password...');
        const resetResponse = await axios.post(`${API_URL}/api/auth/reset-password`, {
            token: token,
            newPassword: NEW_PASSWORD
        });

        console.log('✅ Success! Reset Response:', resetResponse.data);

        // 5. Verify Login with New Password
        console.log('\n5. Verifying Login with New Password...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: TEST_EMAIL,
            password: NEW_PASSWORD
        });
        console.log('✅ Login Successful:', loginResponse.data.message);

        mongoose.disconnect();

    } catch (error) {
        console.error('❌ Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        // Try to disconnect just in case
        try { require('mongoose').disconnect(); } catch (e) { }
    }
}

testResetFlow();
