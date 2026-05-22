const fs = require('fs');
const path = require('path');
const { transporter, verifyConnection } = require('./emailConfig');
const orderTemplates = require('./templates/orderTemplates');
const authTemplates = require('./templates/authTemplates');
const marketingTemplates = require('./templates/marketingTemplates');
const EmailLog = require('../../models/EmailLog');

// Root of the public folder where local images are served from
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

/**
 * Quantéra Email Service
 * High-quality email dispatcher for order notifications, authentication, and marketing.
 */

/**
 * Converts a local image path (relative to /public) into a Base64 data URI so 
 * that email clients (Gmail, Outlook) can display it without a public internet URL.
 * Falls back to the original path if the file cannot be read.
 * 
 * @param {string} imgPath - e.g. "images/ASUS ROG STRIX G16.webp" or "/images/..."
 * @returns {string} - data:image/... base64 URI, or original path if not found
 */
function imageToBase64(imgPath) {
    try {
        // Strip leading slash
        const cleaned = imgPath.replace(/^\//, '');
        const fullPath = path.join(PUBLIC_DIR, cleaned);
        if (!fs.existsSync(fullPath)) return imgPath;

        const data = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase().replace('.', '');
        // Map extension to MIME type
        const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', avif: 'avif', gif: 'gif', svg: 'svg+xml' };
        const mime = mimeMap[ext] || 'jpeg';
        return `data:image/${mime};base64,${data.toString('base64')}`;
    } catch (e) {
        console.warn('⚠️ Could not embed image:', imgPath, e.message);
        return imgPath;
    }
}

/**
 * Resolves all item images in an order to Base64 data URIs (or keeps full https:// URLs).
 */
function resolveItemImages(order) {
    if (!order || !order.items) return order;
    const cloned = JSON.parse(JSON.stringify(order)); // deep clone
    cloned.items = cloned.items.map(item => {
        if (item.image) {
            if (item.image.startsWith('http')) {
                // Already a public URL — use as-is
            } else {
                item.image = imageToBase64(item.image);
            }
        }
        return item;
    });
    return cloned;
}

class EmailService {
    constructor() {
        this.from = process.env.EMAIL_FROM || '"Quantéra Laptop Store" <support@quantera.com>';
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        
        // Initial connection check
        verifyConnection();
    }

    /**
     * Send email helper with automatic auditing
     */
    async sendEmail(to, subject, html, templateType = 'Bulk', metadata = {}) {
        let status = 'Sent';
        let errorMsg = null;

        try {
            const info = await transporter.sendMail({
                from: this.from,
                to,
                subject,
                html
            });
            console.log(`📧 Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            status = 'Failed';
            errorMsg = error.message;
            console.error('❌ Email failed to send:', error.message);
            throw error;
        } finally {
            try {
                // Save log to database
                await EmailLog.create({
                    recipient: to,
                    subject,
                    templateType,
                    status,
                    error: errorMsg,
                    metadata: {
                        ...metadata,
                        userId: metadata.userId || null,
                        orderId: metadata.orderId || null,
                        bulkId: metadata.bulkId || null
                    }
                });
            } catch (err) {
                console.error('❌ Failed to save email log:', err.message);
            }
        }
    }

    /**
     * AUTH: Send Welcome Email
     */
    async sendWelcomeEmail(user) {
        const html = authTemplates.welcomeEmail(user);
        return this.sendEmail(user.email, '🎉 Welcome to Quantéra!', html, 'Welcome', { userId: user._id });
    }

    /**
     * AUTH: Send Password Reset Email
     */
    async sendPasswordReset(user, resetToken) {
        // Construct clear reset link - update routing as needed
        const resetLink = `${this.baseUrl}/auth?tab=reset&token=${resetToken}`;
        const html = authTemplates.passwordReset(user, resetLink);
        return this.sendEmail(user.email, '🔐 Password Reset Request - Quantéra', html, 'PasswordReset', { userId: user._id });
    }

    /**
     * ORDERS: Send Order Confirmation
     */
    async sendOrderConfirmation(order) {
        // Embed local images as Base64 so Gmail can display them
        const resolvedOrder = resolveItemImages(order);
        const html = orderTemplates.orderConfirmation(resolvedOrder);
        
        // Send to customer
        await this.sendEmail(order.customer.email, `🛍️ Order Confirmed! (ID: ${order.orderId})`, html, 'OrderConfirmation', { orderId: order.orderId });
        
        // Notify Admin
        const adminHtml = orderTemplates.adminNewOrder(resolvedOrder);
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            await this.sendEmail(adminEmail, `🚨 New Order Alert: ${order.orderId}`, adminHtml, 'AdminAlert', { orderId: order.orderId });
        }
    }

    /**
     * ORDERS: Send Status Update
     */
    async sendOrderStatusUpdate(order, status, note = '') {
        const resolvedOrder = resolveItemImages(order);
        const html = orderTemplates.statusUpdate(resolvedOrder, status, note);
        return this.sendEmail(order.customer.email, `📢 Order Status Update: ${status}`, html, 'StatusUpdate', { orderId: order.orderId });
    }

    /**
     * AUTH: Send Deletion Initiated Email
     */
    async sendDeletionInitiatedEmail(user, graceEnds) {
        const html = authTemplates.deletionInitiated(user, graceEnds);
        return this.sendEmail(user.email, '🛡️ Account Deletion Scheduled - Quantéra', html, 'DeletionInitiated', { userId: user._id });
    }

    /**
     * AUTH: Send Account Restored Email
     */
    async sendAccountRestoredEmail(user) {
        const html = authTemplates.accountRestored(user);
        return this.sendEmail(user.email, '✅ Welcome Back! Account Restored', html, 'AccountRestored', { userId: user._id });
    }

    /**
     * AUTH: Send MFA OTP Email
     */
    async sendMfaOtp(user, otp) {
        const html = authTemplates.mfaOtpEmail(user, otp);
        return this.sendEmail(user.email, `🔐 Your Quantéra Login Code: ${otp}`, html, 'MFA_OTP', { userId: user._id });
    }

    /**
     * UPDATE: Send Email Change Verification (Old Email)
     */
    async sendEmailChangeOldVerification(user, otp) {
        const html = authTemplates.emailChangeVerifyOld(user, otp);
        return this.sendEmail(user.email, `🔒 Verify Email Change Request - Quantéra`, html, 'EmailChangeVerifyOld', { userId: user._id });
    }

    /**
     * UPDATE: Send Email Change Verification (New Email)
     */
    async sendEmailChangeNewVerification(user, otp, newEmail) {
        const html = authTemplates.emailChangeVerifyNew(user, otp, newEmail);
        return this.sendEmail(newEmail, `Verify Your New Email Address - Quantéra`, html, 'EmailChangeVerifyNew', { userId: user._id });
    }

    /**
     * MARKETING: Send Newsletter Welcome
     */
    async sendNewsletterWelcome(email, unsubToken) {
        const html = marketingTemplates.welcomeNewsletter(email, unsubToken);
        return this.sendEmail(email, '✨ Welcome to the Quantéra Insider!', html, 'Newsletter');
    }
}

module.exports = new EmailService();
