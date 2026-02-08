const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config();

async function verifyEmailConfig() {
    console.log('--- Starting Email Configuration Verification ---');

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const resendApiKey = process.env.RESEND_API_KEY;

    console.log(`EMAIL_USER: ${emailUser ? 'Set' : 'Not Set'}`);
    console.log(`EMAIL_PASS: ${emailPass ? 'Set' : 'Not Set'}`);
    console.log(`RESEND_API_KEY: ${resendApiKey ? 'Set' : 'Not Set'}`);

    // 1. Test Resend
    if (resendApiKey) {
        console.log('\n--- Testing Resend ---');
        try {
            const resend = new Resend(resendApiKey);
            const { data, error } = await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: emailUser, // Sending to self
                subject: 'Resend Verification Test',
                html: '<p>This is a test email from Resend verification script.</p>'
            });

            if (error) {
                console.error('❌ Resend Failed:', error);
            } else {
                console.log('✅ Resend Success:', data);
            }
        } catch (err) {
            console.error('❌ Resend Exception:', err.message);
        }
    } else {
        console.log('\n--- Skipping Resend (No API Key) ---');
    }

    // 2. Test Nodemailer
    if (emailUser && emailPass) {
        console.log('\n--- Testing Nodemailer (Gmail) ---');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });

        try {
            await transporter.verify();
            console.log('✅ Nodemailer Connection Verified');

            const info = await transporter.sendMail({
                from: emailUser,
                to: emailUser, // Sending to self
                subject: 'Nodemailer Verification Test',
                text: 'This is a test email from Nodemailer verification script.'
            });
            console.log('✅ Nodemailer Email Sent:', info.messageId);
        } catch (err) {
            console.error('❌ Nodemailer Failed:', err.message);
        }
    } else {
        console.log('\n--- Skipping Nodemailer (Missing Credentials) ---');
    }

    console.log('\n--- Verification Complete ---');
}

verifyEmailConfig();
