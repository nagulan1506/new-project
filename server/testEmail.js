const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

async function testEmail() {
    console.log('Testing Email Configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Success: Email connection is verified!');

        console.log('Sending a test email to yourself...');
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Email from Password Reset App',
            text: 'If you see this, your email configuration is working perfectly!'
        });
        console.log('✅ Success: Test email sent!');
    } catch (error) {
        console.error('❌ Failed: Email configuration is incorrect.');
        console.error('Error details:', error.message);
        console.log('\nCommon fixes:');
        console.log('1. Make sure you use a GMAIL APP PASSWORD, not your login password.');
        console.log('2. Check if "Less secure app access" is enabled (not recommended, use App Password).');
        console.log('3. Ensure your .env file is correctly formatted (no quotes or spaces around values).');
    }
}

testEmail();
