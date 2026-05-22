require('dotenv').config();
const emailService = require('../services/email/emailService');

async function testSend() {
    try {
        console.log('Sending test email to the.quantera@gmail.com (self)...');
        const info = await emailService.sendEmail(
            'the.quantera@gmail.com', 
            'Test Email Delivery', 
            '<h1>It works!</h1><p>If you see this, email sending is working.</p>', 
            'Test'
        );
        console.log('Success! Message ID:', info.messageId);
    } catch (e) {
        console.error('Failed:', e);
    }
}

testSend();
