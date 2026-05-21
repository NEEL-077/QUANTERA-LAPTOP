const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const emailService = require('./email/emailService');

/**
 * OTP Service for Multi-Method MFA
 * Handles generation and delivery of 6-digit codes via Email or SMS.
 */
const otpService = {
    /**
     * Generate a secure 6-digit numeric OTP
     */
    generateOtp: () => {
        return crypto.randomInt(100000, 999999).toString();
    },

    /**
     * Hash OTP for secure storage
     */
    hashOtp: async (otp) => {
        return await bcrypt.hash(otp, 10);
    },

    /**
     * Verify plain OTP against hashed OTP
     */
    verifyOtp: async (plainOtp, hashedOtp) => {
        if (!plainOtp || !hashedOtp) return false;
        return await bcrypt.compare(plainOtp, hashedOtp);
    },

    /**
     * Send OTP via Email
     */
    sendEmailOtp: async (user, otp) => {
        try {
            await emailService.sendMfaOtp(user, otp);
            return true;
        } catch (error) {
            console.error('📧 OTP Service: Failed to send email:', error);
            return false;
        }
    },

    /**
     * Send OTP via SMS
     */
    sendSmsOtp: async (user, otp) => {
        const phone = user.profile?.phone;
        if (!phone) throw new Error('No phone number attached to this user');

        const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || TWILIO_ACCOUNT_SID === 'your_account_sid_here') {
            // Graceful fallback if credentials aren't configured yet
            console.log(`\x1b[33m%s\x1b[0m`, `📱 [MOCK SMS] To: ${phone} | Code: ${otp}`);
            console.warn('⚠️ Twilio is not configured in .env. Falling back to console logging.');
            return true;
        }

        try {
            const twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
            await twilioClient.messages.create({
                body: `Your Quantéra verification code is: ${otp}`,
                from: TWILIO_PHONE_NUMBER,
                to: phone
            });
            console.log(`📱 [TWILIO SMS] Successfully sent to: ${phone}`);
            return true;
        } catch (error) {
            console.error('📱 [TWILIO SMS] Failed to send:', error.message);
            // Throw so the frontend catches it and displays "Failed to send SMS" instead of a false success
            throw new Error(`Text delivery failed. Please check your number formatting.`);
        }
    },

    /**
     * Send Transactional SMS (Order Updates, Alerts)
     */
    sendTransactionalSms: async (phone, message) => {
        if (!phone) return false;

        const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || TWILIO_ACCOUNT_SID === 'your_account_sid_here') {
            console.log(`\x1b[33m%s\x1b[0m`, `📱 [MOCK SMS ALERT] To: ${phone} | Msg: ${message}`);
            return true;
        }

        try {
            const twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
            await twilioClient.messages.create({
                body: message,
                from: TWILIO_PHONE_NUMBER,
                to: phone
            });
            console.log(`📱 [TWILIO SMS] Alert sent to: ${phone}`);
            return true;
        } catch (error) {
            console.error('📱 [TWILIO SMS] Alert failed:', error.message);
            return false;
        }
    }
};

module.exports = otpService;
