const baseLayout = require('./baseLayout');

/**
 * Welcome Email Template
 * Greets new users after registration.
 */
const welcomeEmail = (user) => {
    const { name } = user;
    
    const content = `
        <p>Hi ${name},</p>
        <p>Welcome to the <strong>Quantéra Elite Circle</strong>. We're thrilled to have you with us!</p>
        
        <div style="background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 20px;">💻</div>
            <h3 style="margin: 0; font-size: 20px; color: #1a1a1a;">Ready for Next-Gen Performance?</h3>
            <p style="color: #666; margin-top: 10px;">Explore our collection of premium laptops, accessories, and the latest tech essentials designed for creators, professionals, and gamers.</p>
        </div>

        <p>As a member, you'll be the first to know about:</p>
        <ul style="color: #666; line-height: 1.8;">
            <li>Exclusive product launches</li>
            <li>Limited-time dynamic offers</li>
            <li>Early access to premium reviews</li>
            <li>Dedicated priority support</li>
        </ul>

        <p>If you have any questions or need help setting up your account, our team is just an email away.</p>
    `;

    return baseLayout('Welcome to Quantéra', content, 'Start Shopping', '/laptops');
};

/**
 * Password Reset Template
 * Provides a secure link for users who forgot their password.
 */
const passwordReset = (user, resetLink) => {
    const { name } = user;
    
    const content = `
        <p>Hi ${name},</p>
        <p>A request was recently made to reset the password for your Quantéra account. To complete the process, please click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="btn" style="background: #c00; border-color: #c00;">Reset Your Password</a>
        </div>

        <div style="background: #fff8f8; border: 1px solid #fee2e2; border-radius: 8px; padding: 20px; margin-top: 30px;">
            <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">⚠️ Security Notice</p>
            <p style="color: #b91c1c; font-size: 13px; margin-top: 10px; margin-bottom: 0;">This link is valid for only 1 hour and can be used once. If you did not request a password reset, please ignore this email or contact support immediately if you have any concerns.</p>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #888;">If the button above doesn't work, copy and paste this URL into your browser:</p>
        <p style="font-size: 12px; color: #00f2ff; word-wrap: break-word;">${resetLink}</p>
    `;

    return baseLayout('Password Reset Request', content);
};

/**
 * Account Deletion Initiated Template
 */
const deletionInitiated = (user, graceEnds) => {
    const { name } = user;
    const dateStr = new Date(graceEnds).toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const content = `
        <p>Hi ${name},</p>
        <p>We've received a request to permanently delete your Quantéra account. We're sad to see you go!</p>
        
        <div style="background: #fff8f8; border: 1px solid #fee2e2; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <h3 style="margin: 0; font-size: 20px; color: #b91c1c;">📅 Scheduled Deletion Date</h3>
            <p style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-top: 10px;">${dateStr}</p>
            <p style="color: #666; margin-top: 10px;">Your data will be permanently erased after this date.</p>
        </div>

        <p><strong>Want to change your mind?</strong></p>
        <p>You have a 14-day grace period to restore your account. Simply log in to your account before the date above and choose "Restore Account".</p>

        <div style="background: #fdfdfd; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 13px; margin: 0;">If you did not request this deletion, please log in immediately to secure your account and cancel the process.</p>
        </div>
    `;

    return baseLayout('Account Deletion Scheduled', content, 'Restore My Account', '/auth.html');
};

/**
 * Account Restored Template
 */
const accountRestored = (user) => {
    const { name } = user;
    
    const content = `
        <p>Hi ${name},</p>
        <p>Welcome back! Your Quantéra account has been successfully restored, and the deletion process has been cancelled.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 20px;">✅</div>
            <h3 style="margin: 0; font-size: 20px; color: #166534;">Account Restored</h3>
            <p style="color: #666; margin-top: 10px;">All your data, orders, and preferences are safe and sound.</p>
        </div>

        <p>If you have any questions or noticed anything unusual, please contact our support team immediately.</p>
    `;

    return baseLayout('Welcome Back to Quantéra!', content, 'Go to Dashboard', '/profile.html');
};

const mfaOtpEmail = (user, otp) => {
    const { name } = user;
    
    const content = `
        <p>Hi ${name},</p>
        <p>For your security, please use the following 6-digit code to complete your login to Quantéra Store:</p>
        
        <div style="background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="font-size: 32px; font-weight: 700; color: #00e5ff; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>

        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 20px; margin-top: 30px;">
            <p style="color: #ef4444; font-size: 14px; margin: 0; font-weight: 600;">⚠️ Security Notice</p>
            <p style="color: #666; font-size: 13px; margin-top: 10px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not attempt to sign in, please secure your account immediately or contact support.</p>
        </div>
    `;

    return baseLayout('Your Quantéra Login Code', content);
};

/**
 * Old Email Verification for Email Change
 */
const emailChangeVerifyOld = (user, otp) => {
    const { name } = user;
    const content = `
        <p>Hi ${name},</p>
        <p>We received a request to change the email address associated with your Quantéra account. To confirm it's you, please enter the following 6-digit code in your profile settings:</p>
        
        <div style="background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="font-size: 32px; font-weight: 700; color: #00e5ff; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>

        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 20px; margin-top: 30px;">
            <p style="color: #ef4444; font-size: 14px; margin: 0; font-weight: 600;">⚠️ Security Notice</p>
            <p style="color: #666; font-size: 13px; margin-top: 10px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request to change your email, please secure your account immediately by changing your password.</p>
        </div>
    `;
    return baseLayout('Verify Email Change Request', content);
};

/**
 * New Email Verification for Email Change
 */
const emailChangeVerifyNew = (user, otp, newEmail) => {
    const { name } = user;
    const content = `
        <p>Hi ${name},</p>
        <p>You're almost done! To verify <strong>${newEmail}</strong> as your new email address for your Quantéra account, please enter the following 6-digit code:</p>
        
        <div style="background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
            <p style="font-size: 32px; font-weight: 700; color: #00e5ff; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>

        <p style="color: #666; font-size: 13px; margin-top: 20px;">This code is valid for 10 minutes. If you did not initiate this change, you can safely ignore this email.</p>
    `;
    return baseLayout('Verify Your New Email Address', content);
};

module.exports = {
    welcomeEmail,
    passwordReset,
    deletionInitiated,
    accountRestored,
    mfaOtpEmail,
    emailChangeVerifyOld,
    emailChangeVerifyNew
};
