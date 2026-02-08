const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000';
const TEST_EMAIL = 'unverified.user.test@example.com';
const TEST_PASSWORD = 'password123';

async function testUniversalEmail() {
    console.log('--- Testing Email Delivery to Unverified Email ---');
    console.log(`Target: ${TEST_EMAIL}`);
    console.log(`API URL: ${API_URL}`);

    try {
        // 0. Health Check
        try {
            console.log('Pinging server root...');
            const health = await axios.get(`${API_URL}/`);
            console.log('✅ Server is reachable:', health.data);
        } catch (e) {
            console.error('❌ Server is NOT reachable at', API_URL);
            console.error('Error:', e.message);
            process.exit(1);
        }

        // 1. Register the user first
        console.log('\n1. Registering user...');
        try {
            await axios.post(`${API_URL}/api/auth/register`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });
            console.log('User registered.');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log('User already exists (expected).');
            } else {
                console.error('Registration failed:', e.message);
                if (e.response) console.error('Data:', e.response.data);
            }
        }

        // 2. Request Forgot Password
        console.log('\n2. Requesting Forgot Password...');
        const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
            email: TEST_EMAIL
        });

        console.log('✅ Success! Server accepted the request.');
        console.log('Response:', response.data);
        console.log('Check server logs to confirm "Email sent via Nodemailer".');

    } catch (error) {
        console.error('\n❌ Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testUniversalEmail();
