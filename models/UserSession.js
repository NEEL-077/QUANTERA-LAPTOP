const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true
    },
    deviceInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip: String,
    location: {
        city: String,
        country: String
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    userAgent: String,
    isValid: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// TTL index to automatically remove expired sessions
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
userSessionSchema.index({ userId: 1 });
userSessionSchema.index({ refreshToken: 1 });

module.exports = mongoose.model('UserSession', userSessionSchema);
