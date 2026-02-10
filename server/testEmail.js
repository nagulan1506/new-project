const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

async function testEmail() {
    console.log('Testing Email Configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Success: Email connection is verified!');

        console.log('Sending a test email to yourself...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Email from Password Reset App',
            text: 'If you see this, your email configuration is working perfectly!'
        });
        console.log('✅ Success: Test email sent!');
        console.log('Message ID:', info.messageId);
        console.log('\nNOTE: If you dont see it in your inbox, please check your SPAM folder!');
    } catch (error) {
        console.error('❌ Failed: Email configuration is incorrect.');
        console.error('Error details:', error.message);

        if (error.message.includes('535') || error.message.includes('534')) {
            console.log('\n--- HOW TO FIX THIS ERROR ---');
            console.log('1. Go to: https://myaccount.google.com/apppasswords');
            console.log('2. If it says "not available", you must first turn on "2-Step Verification" in Security.');
            console.log('3. Create a name like "Node Server" and click Create.');
            console.log('4. Copy the 16-character code (example: aaaa bbbb cccc dddd).');
            console.log('5. Paste THAT code into your .env file as EMAIL_PASS.');
            console.log('-----------------------------\n');
        }
    }
}

testEmail();
