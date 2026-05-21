const baseLayout = require('./baseLayout');

/**
 * Marketing Email Templates
 */
const marketingTemplates = {
    /**
     * Newsletter Welcome Email
     */
    welcomeNewsletter: (email, unsubToken) => {
        const title = 'You\'re on the list! ✨';
        const content = `
            <p>Hi there,</p>
            <p>Welcome to the <strong>Quantéra Insiders</strong> community! We're thrilled to have you with us.</p>
            <p>From now on, you'll be the first to know about:</p>
            <ul>
                <li>🚀 New product launches and experimental tech</li>
                <li>💎 Exclusive early-access drops</li>
                <li>🔧 Pro tips on maximizing your laptop performance</li>
                <li>🎁 Special member-only rewards</li>
            </ul>
            <p>We're building the future of computing, and we're glad you're part of the journey.</p>
            <p>Stay tuned — something big is coming soon.</p>
            <div class="divider"></div>
            <p style="font-size: 14px; color: #888;">
                If you didn't sign up for this, you can safely 
                <a href="${process.env.BASE_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?token=${unsubToken}" style="color: #666;">unsubscribe here</a>.
            </p>
        `;
        
        return baseLayout(title, content, 'Explore our Laptops', `${process.env.BASE_URL || 'http://localhost:3000'}/laptops`);
    }
};

module.exports = marketingTemplates;
