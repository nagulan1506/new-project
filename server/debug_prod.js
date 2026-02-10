const axios = require('axios');

async function debugProd() {
    try {
        console.log('Sending request to production...');
        const response = await axios.post('https://password-reset-backend-788i.onrender.com/api/auth/forgot-password', {
            email: 'nagulans6524@gmail.com'
        });
        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

debugProd();
