const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5001';
const TEST_EMAIL = process.env.EMAIL_USER; // Send to self

async function testForgotPassword() {
    console.log(`Testing Forgot Password Endpoint: ${API_URL}/api/auth/forgot-password`);
    console.log(`Target Email: ${TEST_EMAIL}`);

    try {
        const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
            email: TEST_EMAIL
        });

        console.log('✅ Success! Response:', response.data);
    } catch (error) {
        console.error('❌ Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Wait for server to start (if running in parallel) or just run
setTimeout(testForgotPassword, 2000);
