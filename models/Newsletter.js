const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    source: {
        type: String,
        default: 'footer',
        enum: ['footer', 'popup', 'checkout', 'admin', 'homepage_premium_box']
    },
    unsubToken: {
        type: String,
        required: true,
        default: () => require('crypto').randomBytes(32).toString('hex')
    }
}, {
    timestamps: true
});

// Index for better email lookups and admin dashboard performance
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ active: 1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);
