const axios = require('axios');

const DEPLOYED_API_URL = 'https://password-reset-backend-788i.onrender.com';
const TEST_EMAIL = 'nagulans6524@gmail.com'; // Using the email seen in logs

async function verifyDeployment() {
    console.log(`🚀 Testing Deployed API: ${DEPLOYED_API_URL}`);
    console.log(`📧 Target Email: ${DEPLOYED_API_URL}`);

    try {
        console.log('\n1. Attempting Forgot Password Request...');
        const response = await axios.post(`${DEPLOYED_API_URL}/api/auth/forgot-password`, {
            email: TEST_EMAIL
        });

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', response.data);

        if (response.status === 200) {
            console.log('\nSUCCESS: The server responded with 200 OK.');
            console.log('This means the server BELIEVES it sent the email successfully.');
            console.log('If you did not receive it, check SPAM or Quota limits.');
        }

    } catch (error) {
        console.log('\n❌ REQUEST FAILED');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
            console.log('Headers:', error.response.headers);
        } else {
            console.log('Error:', error.message);
        }
    }
}

verifyDeployment();
