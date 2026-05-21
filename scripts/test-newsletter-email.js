require('dotenv').config();
const mongoose = require('mongoose');
const database = require('../config/database');
const emailService = require('../services/email/emailService');

async function testNewsletterEmail() {
    try {
        console.log('🚀 Starting newsletter email test...');
        
        // Use a test email (check your .env for SMTP credentials)
        const testEmail = process.env.SMTP_USER || 'test@example.com';
        const testToken = 'test_unsub_token_123';

        console.log(`📧 Attempting to send welcome email to: ${testEmail}`);
        
        await emailService.sendNewsletterWelcome(testEmail, testToken);
        
        console.log('✅ Test email sent successfully! Check your inbox or EmailLog in DB.');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        mongoose.disconnect();
    }
}

testNewsletterEmail();
