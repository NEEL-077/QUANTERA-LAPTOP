const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    passwordHash: {
        type: String,
        required: function() { return !this.googleId; }, // Only required if not OAuth
        minlength: [8, 'Password must be at least 8 characters']
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple users without googleId
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeletionPending: {
        type: Boolean,
        default: false
    },
    deletionScheduledAt: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
    mfaEnabled: {
        type: Boolean,
        default: false
    },
    mfaEnabledMethods: [{
        type: String,
        enum: ['app', 'email', 'sms']
    }],
    mfaDefaultMethod: {
        type: String,
        enum: ['app', 'email', 'sms'],
        default: 'app'
    },
    mfaSecret: {
        type: String,
        default: null
    },
    mfaTempCode: {
        type: String,
        default: null
    },
    mfaTempExpiry: {
        type: Date,
        default: null
    },
    backupCodes: [{
        code: String,
        used: { type: Boolean, default: false }
    }],
    // --- Email Change Verification ---
    pendingEmail: { type: String, default: null },
    emailChangeOtp: { type: String, default: null },
    emailChangeOtpExpiry: { type: Date, default: null },
    emailChangeStep: {
        type: String,
        enum: ['none', 'verify_old', 'verify_new'],
        default: 'none'
    },
    // --- Phone Change Verification ---
    phoneChangeOtp: { type: String, default: null },
    phoneChangeOtpExpiry: { type: Date, default: null },
    // --- OTP Rate Limiting ---
    otpAttempts: { type: Number, default: 0 },
    otpLastSent: { type: Date, default: null },
    profile: {
        avatar: String,
        phone: String,
        phoneVerified: { type: Boolean, default: false },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other', 'Prefer not to say', 'Not specified'],
            default: 'Not specified'
        },
        dob: Date,
        displayName: String,
        bio: String,
        completionPercentage: {
            type: Number,
            default: 0
        },
        preferences: {
            language: { type: String, default: 'en' },
            currency: { type: String, default: 'INR' },
            timezone: { type: String, default: 'UTC' },
            newsletter: { type: Boolean, default: true },
            notifications: { type: Boolean, default: true },
            smsNotifications: { type: Boolean, default: false }
        },
        finance: {
            loyaltyPoints: { type: Number, default: 0 },
            walletBalance: { type: Number, default: 0 }
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.passwordHash;
            delete ret.resetToken;
            delete ret.mfaSecret;
            delete ret.emailChangeOtp;
            delete ret.phoneChangeOtp;
            delete ret.pendingEmail;
            delete ret.otpAttempts;
            delete ret.otpLastSent;
            return ret;
        }
    }
});

// Indexes for performance
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.createUser = async function(userData) {
    const { name, email, password } = userData;
    
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
        throw new Error('An account with this email already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new this({
        name,
        email: email.toLowerCase(),
        passwordHash
    });
    
    return user.save();
};

module.exports = mongoose.model('User', userSchema);