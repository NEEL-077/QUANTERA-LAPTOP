const nodemailer = require('nodemailer');

/**
 * Quantéra Email Transporter Configuration
 * This module initializes the SMTP transporter using environment variables.
 */

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection configuration
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ SMTP Server is ready to take our messages');
    } catch (error) {
        console.error('❌ SMTP Connection Error:', error.message);
    }
};

module.exports = {
    transporter,
    verifyConnection
};
