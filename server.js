require('dotenv').config();
// Server restarted to load new Google Credentials
const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// MongoDB database imports
const database = require('./config/database');
const User = require('./models/User');
const UserSession = require('./models/UserSession');
const Address = require('./models/Address');
const Laptop = require('./models/Laptop');
const Accessory = require('./models/Accessory');
const Order = require('./models/Order');
const Wishlist = require('./models/Wishlist');
const EmailLog = require('./models/EmailLog');
const Newsletter = require('./models/Newsletter');
const PricingEngine = require('./services/pricingEngine');
const emailService = require('./services/email/emailService');
const searchEngine = require('./services/searchEngine');
const uap = require('ua-parser-js');
const QRCode = require('qrcode');


const app = express();
const PORT = process.env.PORT || 3000;

// JWT secret — use env var in production
const JWT_SECRET = process.env.JWT_SECRET || 'quantera_super_secret_2026_dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH || 'quantera_refresh_secret_2026';

// ─── Security headers ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off so inline scripts work

// ─── Auth rate limiter (30 req per 15 min per IP) ───────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in 15 minutes.' }
});

// ─── JWT middleware ───────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized — no token' });
    }
    const token = header.slice(7);
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
    }
}

function requireAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden — admin only' });
        }
        next();
    });
}

// ─── Auth token generators ────────────────────────────────────────────────────
async function issueTokens(user, remember, req) {
    const payload = { id: user._id, email: user.email, name: user.name, role: user.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: remember ? '30d' : '7d' });

    // Parse device info
    const ua = uap(req.headers['user-agent']);
    const deviceInfo = {
        browser: ua.browser.name,
        os: ua.os.name,
        device: ua.device.model || 'Desktop'
    };

    // Save session to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (remember ? 30 : 7));

    await UserSession.create({
        userId: user._id,
        refreshToken,
        deviceInfo,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt
    });

    return { accessToken, refreshToken };
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: uuid + original extension
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
    }
});

// File filter to accept all image formats
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/x-icon',
        'image/vnd.microsoft.icon'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// PRICING API
// ============================================

/**
 * POST /api/pricing/calculate
 * Body: { storage, ram, processor }
 * Returns: { total, breakdown, currency }
 *
 * Pricing logic:
 *   - Base price: ₹1,19,900 (Quantéra Q1 base model)
 *   - Add-ons are added on top of the base price.
 *   - Each option maps deterministically to an addon cost.
 */
app.post('/api/pricing/calculate', (req, res) => {
    try {
        const { storage, ram, processor } = req.body;

        // ── Base price (all add-ons are relative to this)
        const BASE_PRICE = 119900;

        // ── Storage add-ons (in ₹)
        const STORAGE_PRICES = {
            '256gb': 0,
            '512gb': 10000,
            '1tb': 20000,
            '2tb': 40000,
        };

        // ── RAM add-ons (in ₹)
        const RAM_PRICES = {
            '8gb': 0,
            '16gb': 8000,
            '24gb': 16000,
            '36gb': 32000,
        };

        // ── Processor add-ons (in ₹)
        const PROCESSOR_PRICES = {
            'm2': 0,
            'm3': 15000,
            'm3-pro': 40000,
            'm3-ultra': 80000,
        };

        // ── Validate inputs — fall back to base tier if unknown
        const storageAdd = STORAGE_PRICES[storage] ?? 0;
        const ramAdd = RAM_PRICES[ram] ?? 0;
        const processorAdd = PROCESSOR_PRICES[processor] ?? 0;

        const total = BASE_PRICE + storageAdd + ramAdd + processorAdd;

        res.json({
            total,
            currency: 'INR',
            breakdown: {
                storage: storageAdd,
                ram: ramAdd,
                processor: processorAdd,
            },
        });

    } catch (error) {
        console.error('Pricing calculation error:', error);
        res.status(500).json({ error: 'Failed to calculate price.' });
    }
});

// ============================================
// UNIVERSAL PRICING ENGINE API
// ============================================

/**
 * POST /api/pricing/delta
 * Calculates the exact dynamic cost difference between two configuration states for any configurable product.
 * Returns both numerical and string-formatted values (e.g., "+₹8,000" or "-₹10,000").
 */
app.post('/api/pricing/delta', (req, res) => {
    try {
        const { productId, attributeName, currentOptionId, newOptionId } = req.body;

        if (!productId || !attributeName || !currentOptionId || !newOptionId) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const deltaResult = PricingEngine.calculatePriceDelta(
            productId,
            attributeName,
            currentOptionId,
            newOptionId
        );

        res.json(deltaResult);
    } catch (error) {
        console.error('Delta calculation error:', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/pricing/total
 * Sums the base price and all absolute attribute prices for a given complete selection.
 */
app.post('/api/pricing/total', (req, res) => {
    try {
        const { productId, selectedOptions } = req.body;

        if (!productId || !selectedOptions) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const totalResult = PricingEngine.calculateTotalConfigurationPrice(productId, selectedOptions);

        res.json(totalResult);
    } catch (error) {
        console.error('Total calculation error:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/newsletter/subscribe
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email, source } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        // Check if already subscribed in Newsletter model
        let subscription = await Newsletter.findOne({ email });

        if (subscription) {
            if (subscription.active) {
                return res.status(409).json({ error: 'You are already subscribed to our newsletter!' });
            } else {
                subscription.active = true;
                await subscription.save();
                return res.json({ message: 'Welcome back! Your subscription has been reactivated.' });
            }
        }

        // Create new guest subscription
        subscription = new Newsletter({ email, source: source || 'footer' });
        await subscription.save();

        // Send a confirmation email (don't wait for it to finish)
        console.log(`📧 Attempting to send newsletter welcome to: ${email}`);
        emailService.sendNewsletterWelcome(email, subscription.unsubToken)
            .then(info => console.log(`✅ Newsletter welcome sent to ${email}: ${info.messageId}`))
            .catch(err => {
                console.error('❌ Failed to send newsletter welcome email:', err.message);
            });

        res.status(201).json({ message: 'Thank you for subscribing to Quantéra!' });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Subscription failed. Please try again later.' });
    }
});

// Session & Passport configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'quantera_session_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_SECRET',
    callbackURL: "/api/auth/google/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
            if (user) {
                user.googleId = profile.id;
                if (!user.profile.avatar) user.profile.avatar = profile.photos[0].value;
                await user.save();
            } else {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value.toLowerCase(),
                    googleId: profile.id,
                    role: 'user',
                    profile: {
                        avatar: profile.photos[0].value,
                        completionPercentage: 20
                    }
                });
                await user.save();
            }
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Serve static files from the 'public' directory with clean URLs support
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// ============================================
// AUTH ROUTES
// ============================================

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const user = await User.createUser({ name, email, password });

        // Trigger Welcome Email (async, don't wait for it to finish)
        emailService.sendWelcomeEmail(user).catch(err => {
            console.error('❌ Failed to send welcome email:', err.message);
        });

        res.status(201).json({
            message: 'Account created successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }

        if (error.code === 11000) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Google Auth Routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth.html?error=google_failed' }),
    async (req, res) => {
        try {
            // Check if account is scheduled for deletion
            if (req.user.isDeletionPending) {
                const gracePeriodDays = 14;
                const now = new Date();
                const scheduledDate = new Date(req.user.deletionScheduledAt);
                const graceEnds = new Date(scheduledDate.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));

                if (now < graceEnds) {
                    return res.redirect(`/auth.html?error=ACCOUNT_DELETION_PENDING&email=${encodeURIComponent(req.user.email)}&graceEnds=${graceEnds.getTime()}`);
                }
            }

            const { accessToken, refreshToken } = await issueTokens(req.user, true, req);
            const userJson = JSON.stringify({
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                profile: req.user.profile
            });
            res.redirect(`/auth.html?google_success=true&access=${accessToken}&refresh=${refreshToken}&user=${encodeURIComponent(userJson)}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect('/auth.html?error=token_issue_failed');
        }
    }
);

// POST /api/auth/login
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Check if account is scheduled for deletion
        if (user.isDeletionPending) {
            const gracePeriodDays = 14;
            const now = new Date();
            const scheduledDate = new Date(user.deletionScheduledAt);
            const graceEnds = new Date(scheduledDate.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));

            if (now < graceEnds) {
                return res.status(403).json({
                    error: 'ACCOUNT_DELETION_PENDING',
                    message: `Your account is scheduled for deletion on ${graceEnds.toLocaleDateString()}. would you like to restore it?`,
                    scheduledDate: user.deletionScheduledAt,
                    gracePeriodEnds: graceEnds
                });
            } else {
                return res.status(401).json({ error: 'This account has been permanently deleted.' });
            }
        }

        // Update last login
        await user.updateLastLogin();

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            const method = user.mfaDefaultMethod || 'app';
            let message = 'Please provide your 6-digit MFA code.';

            // Auto-trigger if Email or SMS
            if (method === 'email' || method === 'sms') {
                const otp = otpService.generateOtp();
                user.mfaTempCode = otp;
                user.mfaTempExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
                await user.save();

                if (method === 'email') {
                    await otpService.sendEmailOtp(user, otp);
                    message = `We've sent a 6-digit code to your email ${user.email}.`;
                } else if (method === 'sms') {
                    await otpService.sendSmsOtp(user, otp);
                    message = `We've sent a 6-digit code to your registered mobile.`;
                }
            }

            return res.json({
                mfaRequired: true,
                email: user.email,
                method,
                message
            });
        }

        const { accessToken, refreshToken } = await issueTokens(user, !!remember, req);
        const publicUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({ accessToken, refreshToken, user: publicUser });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required.' });
        }

        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        // Find and invalidate old session
        const oldSession = await UserSession.findOne({ refreshToken, isValid: true });
        if (!oldSession) {
            return res.status(401).json({ error: 'Session invalid or expired.' });
        }

        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found.' });
        }

        // Invalidate old session
        oldSession.isValid = false;
        await oldSession.save();

        const { accessToken, refreshToken: newRefresh } = await issueTokens(user, true, req);
        res.json({ accessToken, refreshToken: newRefresh });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
});

// GET /api/auth/me — get current user info
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile,
            mfaEnabled: user.mfaEnabled,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user information.' });
    }
});

// GET /api/user/sessions — list active sessions
app.get('/api/user/sessions', verifyToken, async (req, res) => {
    try {
        const sessions = await UserSession.find({
            userId: req.user.id,
            isValid: true,
            expiresAt: { $gt: new Date() }
        }).sort({ lastUsed: -1 });

        res.json(sessions);
    } catch (error) {
        console.error('List sessions error:', error);
        res.status(500).json({ error: 'Failed to list active sessions.' });
    }
});

// DELETE /api/user/sessions/:id — remote logout
app.delete('/api/user/sessions/:id', verifyToken, async (req, res) => {
    try {
        const session = await UserSession.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        session.isValid = false;
        await session.save();
        res.json({ message: 'Session terminated successfully.' });
    } catch (error) {
        console.error('Logout session error:', error);
        res.status(500).json({ error: 'Failed to terminate session.' });
    }
});

// GET /api/user/activity — security activity logs
app.get('/api/user/activity', verifyToken, async (req, res) => {
    try {
        const emailLogs = await EmailLog.find({
            'metadata.userId': req.user.id
        }).sort({ sentAt: -1 }).limit(20);

        const sessions = await UserSession.find({
            userId: req.user.id
        }).sort({ createdAt: -1 }).limit(20);

        res.json({ emails: emailLogs, sessions });
    } catch (error) {
        console.error('Activity logs error:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs.' });
    }
});

// DELETE /api/user/account — delete secondary account (GDPR)
app.delete('/api/user/account', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // Deactivate or Delete? Let's go with Deactivate for safety first
        user.isActive = false;
        await user.save();

        // Invalidate all sessions
        await UserSession.updateMany({ userId: req.user.id }, { isValid: false });

        res.json({ message: 'Account deactivated successfully. Contact support for permanent deletion.' });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ error: 'Failed to deactivate account.' });
    }
});

// ============================================
// PROFILE & ADDRESS ROUTES
// ============================================

// PUT /api/user/profile — update basic info
app.put('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const { name, phone, dob, gender, displayName, bio, preferences } = req.body;
        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (phone) user.profile.phone = phone;
        if (dob) user.profile.dob = dob;
        if (gender) user.profile.gender = gender;
        if (displayName) user.profile.displayName = displayName;
        if (bio) user.profile.bio = bio;
        if (preferences) {
            user.profile.preferences = { ...user.profile.preferences, ...preferences };
        }

        // Simple completion algorithm
        let fields = [user.name, user.profile.phone, user.profile.avatar, user.profile.dob, user.profile.gender, user.profile.bio];
        let filled = fields.filter(f => !!f).length;
        user.profile.completionPercentage = Math.round((filled / fields.length) * 100);

        await user.save();
        res.json({ message: 'Profile updated successfully.', user });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// ============================================
// EMAIL AND PHONE VERIFICATION ROUTES
// ============================================

// Rate limit helper check
const checkOtpRateLimit = async (user) => {
    const now = new Date();
    if (user.otpAttempts >= 5) {
        if (now - user.otpLastSent < 30 * 60 * 1000) {
            throw new Error('Too many attempts. Please try again in 30 minutes.');
        } else {
            user.otpAttempts = 0; // Reset after 30 mins
        }
    }
    if (user.otpLastSent && (now - user.otpLastSent) < 60000) {
        throw new Error('Please wait 60 seconds before requesting another code.');
    }
};

// 1. POST /api/user/email/start-change (Send OTP to OLD email)
app.post('/api/user/email/start-change', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.googleId) return res.status(400).json({ error: 'Google accounts cannot change email.' });

        await checkOtpRateLimit(user);

        const otp = otpService.generateOtp();
        user.emailChangeOtp = await otpService.hashOtp(otp);
        user.emailChangeOtpExpiry = new Date(Date.now() + 10 * 60000);
        user.emailChangeStep = 'verify_old';
        user.otpAttempts += 1;
        user.otpLastSent = new Date();
        await user.save();

        await emailService.sendEmailChangeOldVerification(user, otp);
        res.json({ message: 'Verification code sent to your current email.' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to start email change.' });
    }
});

// 2. POST /api/user/email/verify-old
app.post('/api/user/email/verify-old', verifyToken, async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user.id);

        if (user.emailChangeStep !== 'verify_old') return res.status(400).json({ error: 'Invalid state for this action.' });
        if (!user.emailChangeOtpExpiry || user.emailChangeOtpExpiry < new Date()) {
            return res.status(400).json({ error: 'Verification code expired.' });
        }

        const isValid = await otpService.verifyOtp(otp, user.emailChangeOtp);
        if (!isValid) return res.status(400).json({ error: 'Invalid code.' });

        user.emailChangeStep = 'verify_new';
        user.emailChangeOtp = null;
        user.emailChangeOtpExpiry = null;
        user.otpAttempts = 0; // Reset attempts for next step
        await user.save();

        res.json({ message: 'Current email verified. You can now enter your new email.', step: 'verify_new' });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed.' });
    }
});

// 3. POST /api/user/email/verify-new (Send OTP to NEW email)
app.post('/api/user/email/verify-new', verifyToken, async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) return res.status(400).json({ error: 'Invalid email address.' });

        const user = await User.findById(req.user.id);
        if (user.emailChangeStep !== 'verify_new') return res.status(400).json({ error: 'You must verify your old email first.' });

        // Check if new email is taken
        const exists = await User.findOne({ email: newEmail.toLowerCase() });
        if (exists) return res.status(400).json({ error: 'This email is already in use.' });

        await checkOtpRateLimit(user);

        const otp = otpService.generateOtp();
        user.pendingEmail = newEmail.toLowerCase();
        user.emailChangeOtp = await otpService.hashOtp(otp);
        user.emailChangeOtpExpiry = new Date(Date.now() + 10 * 60000);
        user.otpAttempts += 1;
        user.otpLastSent = new Date();
        await user.save();

        await emailService.sendEmailChangeNewVerification(user, otp, user.pendingEmail);
        res.json({ message: `Verification code sent to ${user.pendingEmail}.` });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to send code to new email.' });
    }
});

// 4. POST /api/user/email/confirm-new
app.post('/api/user/email/confirm-new', verifyToken, async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user.id);

        if (user.emailChangeStep !== 'verify_new' || !user.pendingEmail) {
            return res.status(400).json({ error: 'Invalid state for this action.' });
        }
        if (!user.emailChangeOtpExpiry || user.emailChangeOtpExpiry < new Date()) {
            return res.status(400).json({ error: 'Verification code expired.' });
        }

        const isValid = await otpService.verifyOtp(otp, user.emailChangeOtp);
        if (!isValid) return res.status(400).json({ error: 'Invalid code.' });

        // Update the email
        user.email = user.pendingEmail;
        user.emailChangeStep = 'none';
        user.pendingEmail = null;
        user.emailChangeOtp = null;
        user.emailChangeOtpExpiry = null;
        user.otpAttempts = 0;
        await user.save();

        // Return new token with updated email payload
        const payload = { id: user._id, email: user.email, name: user.name, role: user.role };
        const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

        res.json({ message: 'Email address updated successfully!', token: newAccessToken });
    } catch (err) {
        res.status(500).json({ error: 'Failed to confirm new email.' });
    }
});

// 5. POST /api/user/phone/send-otp
app.post('/api/user/phone/send-otp', verifyToken, async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone || phone.length < 10) return res.status(400).json({ error: 'Invalid phone number.' });

        const user = await User.findById(req.user.id);
        await checkOtpRateLimit(user);

        // Recursively store the number they are trying to verify
        user.profile.phone = phone;
        user.profile.phoneVerified = false;

        const otp = otpService.generateOtp();
        user.phoneChangeOtp = await otpService.hashOtp(otp);
        user.phoneChangeOtpExpiry = new Date(Date.now() + 10 * 60000);
        user.otpAttempts += 1;
        user.otpLastSent = new Date();
        await user.save();

        await otpService.sendSmsOtp(user, otp); // This mocks SMS via console.log
        res.json({ message: `Verification code sent to ${phone}.` });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to send phone verification code.' });
    }
});

// 6. POST /api/user/phone/verify-otp
app.post('/api/user/phone/verify-otp', verifyToken, async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user.id);

        if (!user.phoneChangeOtpExpiry || user.phoneChangeOtpExpiry < new Date()) {
            return res.status(400).json({ error: 'Verification code expired.' });
        }

        const isValid = await otpService.verifyOtp(otp, user.phoneChangeOtp);
        if (!isValid) return res.status(400).json({ error: 'Invalid code.' });

        user.profile.phoneVerified = true;
        user.phoneChangeOtp = null;
        user.phoneChangeOtpExpiry = null;
        user.otpAttempts = 0;

        // Recalculate profile completion since phone is now verified
        let fields = [user.name, user.profile.phone, user.profile.avatar, user.profile.dob, user.profile.gender, user.profile.bio];
        let filled = fields.filter(f => !!f).length;
        user.profile.completionPercentage = Math.round((filled / fields.length) * 100);

        await user.save();

        res.json({ message: 'Phone number verified successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to verify phone number.' });
    }
});

// POST /api/user/avatar — update profile picture
app.post('/api/user/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

        const user = await User.findById(req.user.id);
        user.profile.avatar = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({ message: 'Avatar updated.', avatar: user.profile.avatar });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar.' });
    }
});

// DELETE /api/user/avatar — delete profile picture
app.delete('/api/user/avatar', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        user.profile.avatar = null;

        // Recalculate completion
        let fields = [user.name, user.profile.phone, user.profile.avatar, user.profile.dob, user.profile.gender, user.profile.bio];
        let filled = fields.filter(f => !!f).length;
        user.profile.completionPercentage = Math.round((filled / fields.length) * 100);

        await user.save();
        res.json({ message: 'Avatar deleted successfully.', avatar: '/images/default-avatar.png' });
    } catch (error) {
        console.error('Avatar delete error:', error);
        res.status(500).json({ error: 'Failed to delete avatar.' });
    }
});

// ============================================
// ACCOUNT DELETION & RECOVERY
// ============================================

// POST /api/user/delete-account-request
app.post('/api/user/delete-account-request', verifyToken, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: 'User not found.' });

        // Secure confirmation: Check password
        if (user.googleId && !user.passwordHash) {
            // For Google users without password, we might need another check, 
            // but for now, we'll assume the session is secure.
        } else {
            if (!password) return res.status(400).json({ error: 'Password is required to confirm deletion.' });
            const isMatch = await user.comparePassword(password);
            if (!isMatch) return res.status(401).json({ error: 'Incorrect password.' });
        }

        // Initiate soft-delete
        user.isDeletionPending = true;
        user.deletionScheduledAt = new Date();
        user.isActive = false;
        await user.save();

        // Invalidate all sessions across devices
        await UserSession.updateMany({ userId: req.user.id }, { isValid: false });

        // Send confirmation email
        const graceEnds = new Date(user.deletionScheduledAt.getTime() + (14 * 24 * 60 * 60 * 1000));
        emailService.sendDeletionInitiatedEmail(user, graceEnds).catch(err => {
            console.error('Failed to send deletion email:', err);
        });

        res.json({
            message: 'Your account has been scheduled for deletion. You have 14 days to restore it.',
            gracePeriodEnds: graceEnds
        });
    } catch (error) {
        console.error('Deletion request error:', error);
        res.status(500).json({ error: 'Failed to initiate account deletion.' });
    }
});

// POST /api/user/restore-account (Requires unique token or login flow handling)
app.post('/api/user/restore-account', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.isDeletionPending) {
            return res.status(404).json({ error: 'No account found pending deletion with this email.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect credentials.' });

        // Restore
        user.isDeletionPending = false;
        user.deletionScheduledAt = null;
        user.isActive = true;
        await user.save();

        emailService.sendAccountRestoredEmail(user).catch(err => {
            console.error('Failed to send restoration email:', err);
        });

        res.json({ message: 'Welcome back! Your account has been successfully restored.' });
    } catch (error) {
        console.error('Restore account error:', error);
        res.status(500).json({ error: 'Failed to restore account.' });
    }
});

// Permanent Deletion Cron (Runs logic every 24 hours)
const cron = require('node-cron');
cron.schedule('0 0 * * *', async () => {
    console.log('📦 Running daily account cleanup (Permanent Deletion)...');
    try {
        const gracePeriodMs = 14 * 24 * 60 * 60 * 1000;
        const cutOff = new Date(Date.now() - gracePeriodMs);

        const usersToPurge = await User.find({
            isDeletionPending: true,
            deletionScheduledAt: { $lte: cutOff }
        });

        for (const user of usersToPurge) {
            console.log(`🗑️ Permanently deleting user ${user.email}...`);

            // Delete associated data
            await Address.deleteMany({ userId: user._id });
            await Wishlist.deleteMany({ userId: user._id });
            await UserSession.deleteMany({ userId: user._id });

            // Final Warning: Since user requested deletion, we send one last mail or just purge.
            // Requirement says "notify user before final deletion", handled by cron warning logic optionally.

            await User.deleteOne({ _id: user._id });
        }
        console.log(`✅ Cleanup finished. Purged ${usersToPurge.length} accounts.`);
    } catch (error) {
        console.error('Permanent cleanup error:', error);
    }
});

// GET /api/user/addresses — list all
app.get('/api/user/addresses', verifyToken, async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.user.id }).sort({ isDefaultShipping: -1, createdAt: -1 });
        res.json(addresses);
    } catch (error) {
        console.error('List addresses error:', error);
        res.status(500).json({ error: 'Failed to list addresses.' });
    }
});

// POST /api/user/addresses — create
app.post('/api/user/addresses', verifyToken, async (req, res) => {
    try {
        const addressData = { ...req.body, userId: req.user.id };
        const address = new Address(addressData);
        await address.save();
        res.status(201).json(address);
    } catch (error) {
        console.error('Create address error:', error);
        res.status(500).json({ error: error.message || 'Failed to create address.' });
    }
});

// PUT /api/user/addresses/:id — update
app.put('/api/user/addresses/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const address = await Address.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!address) return res.status(404).json({ error: 'Address not found or unauthorized.' });
        res.json(address);
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Failed to update address.' });
    }
});

// DELETE /api/user/addresses/:id — delete
app.delete('/api/user/addresses/:id', verifyToken, async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!address) return res.status(404).json({ error: 'Address not found.' });
        res.json({ message: 'Address deleted successfully.' });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Failed to delete address.' });
    }
});

// PUT /api/user/addresses/:id/default — set default
app.put('/api/user/addresses/:id/default', verifyToken, async (req, res) => {
    try {
        const { type } = req.body; // 'shipping' or 'billing'
        const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
        if (!address) return res.status(404).json({ error: 'Address not found.' });

        if (type === 'shipping') address.isDefaultShipping = true;
        else if (type === 'billing') address.isDefaultBilling = true;
        else return res.status(400).json({ error: "Type must be 'shipping' or 'billing'." });

        await address.save(); // Pre-save hook handles unsetting others
        res.json({ message: `Default ${type} address updated.`, address });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({ error: 'Failed to set default address.' });
    }
});

// SECURITY & MFA ROUTES
// ============================================
const speakeasy = require('speakeasy');
const otpService = require('./services/otpService');

// GET /api/user/mfa/status — get enabled methods and default
app.get('/api/user/mfa/status', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            enabled: user.mfaEnabled,
            methods: user.mfaEnabledMethods || [],
            defaultMethod: user.mfaDefaultMethod || 'app'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch MFA status.' });
    }
});

// POST /api/user/mfa/setup — generate app secret
app.post('/api/user/mfa/setup', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const secret = speakeasy.generateSecret({ name: `Quantéra:${user.email}` });

        // Temporarily store secret (unverified)
        user.mfaSecret = secret.base32;
        await user.save();

        const qrCodeDataUri = await QRCode.toDataURL(secret.otpauth_url);
        res.json({ secret: secret.base32, qrCodeDataUri });
    } catch (error) {
        console.error('MFA setup error:', error);
        res.status(500).json({ error: 'Failed to initiate App MFA setup.' });
    }
});

// POST /api/user/mfa/trigger-otp — for email/sms setup
app.post('/api/user/mfa/trigger-otp', verifyToken, async (req, res) => {
    try {
        const { method } = req.body;
        const user = await User.findById(req.user.id);

        if (method === 'sms' && (!user.profile?.phone)) {
            return res.status(400).json({ error: 'Please add a phone number to your profile first.' });
        }

        const otp = otpService.generateOtp();
        user.mfaTempCode = otp;
        user.mfaTempExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        if (method === 'email') await otpService.sendEmailOtp(user, otp);
        if (method === 'sms') await otpService.sendSmsOtp(user, otp);

        res.json({ message: `Verification code sent via ${method}.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send verification code.' });
    }
});

// POST /api/user/change-password
app.post('/api/user/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: 'User not found.' });

        // If user has a password, verify the current one
        if (user.passwordHash) {
            if (!currentPassword) return res.status(400).json({ error: 'Current password is required.' });
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) return res.status(401).json({ error: 'Incorrect current password.' });
        }

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters.' });
        }

        // Hash and Save
        user.passwordHash = await bcrypt.hash(newPassword, 12);
        await user.save();

        res.json({ message: 'Password updated successfully!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to update password.' });
    }
});

// POST /api/user/mfa/verify — verify and enable method
app.post('/api/user/mfa/verify', verifyToken, async (req, res) => {
    try {
        const { token, method } = req.body; // method: 'app', 'email', 'sms'
        const user = await User.findById(req.user.id);
        let isValid = false;

        if (method === 'app') {
            isValid = speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token,
                window: 1
            });
        } else {
            // Email/SMS verification
            if (user.mfaTempCode === token && user.mfaTempExpiry > new Date()) {
                isValid = true;
                user.mfaTempCode = null; // Clear after use
                user.mfaTempExpiry = null;
            }
        }

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }

        // Add to enabled methods if not already there
        if (!user.mfaEnabledMethods.includes(method)) {
            user.mfaEnabledMethods.push(method);
        }

        user.mfaEnabled = true;

        // If it's the first method, set as default
        if (user.mfaEnabledMethods.length === 1) {
            user.mfaDefaultMethod = method;
        }

        await user.save();
        res.json({ message: `${method.toUpperCase()} verification successful!`, methods: user.mfaEnabledMethods });
    } catch (error) {
        console.error('MFA verify error:', error);
        res.status(500).json({ error: 'Failed to verify MFA code.' });
    }
});

// POST /api/user/mfa/method/default — set default login method
app.post('/api/user/mfa/method/default', verifyToken, async (req, res) => {
    try {
        const { method } = req.body;
        const user = await User.findById(req.user.id);

        if (!user.mfaEnabledMethods.includes(method)) {
            return res.status(400).json({ error: 'Method must be enabled before setting as default.' });
        }

        user.mfaDefaultMethod = method;
        await user.save();
        res.json({ message: `Default method set to ${method}.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update default method.' });
    }
});

// POST /api/user/mfa/toggle — Master Switch
app.post('/api/user/mfa/toggle', verifyToken, async (req, res) => {
    try {
        const { enabled } = req.body;
        const user = await User.findById(req.user.id);

        if (enabled && user.mfaEnabledMethods.length === 0) {
            return res.status(400).json({ error: 'Please enable at least one verification method first.' });
        }

        user.mfaEnabled = enabled;
        await user.save();
        res.json({ message: `MFA ${enabled ? 'Enabled' : 'Disabled'} globally for your account.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle MFA.' });
    }
});

// POST /api/auth/login/mfa — verify mfa during login
app.post('/api/auth/login/mfa', authLimiter, async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findByEmail(email);

        if (!user || !user.mfaEnabled) {
            return res.status(401).json({ error: 'MFA not required or user not found.' });
        }

        const method = user.mfaDefaultMethod || 'app';
        let isValid = false;

        if (method === 'app') {
            isValid = speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token,
                window: 1
            });
        } else {
            // Email/SMS
            if (user.mfaTempCode === token && user.mfaTempExpiry > new Date()) {
                isValid = true;
                user.mfaTempCode = null;
                user.mfaTempExpiry = null;
                await user.save();
            }
        }

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid or expired MFA code.' });
        }

        const { accessToken, refreshToken } = await issueTokens(user, true, req);
        res.json({
            accessToken, refreshToken, user: {
                id: user._id, name: user.name, email: user.email, role: user.role
            }
        });
    } catch (error) {
        console.error('MFA login error:', error);
        res.status(500).json({ error: 'MFA verification failed.' });
    }
});

// ============================================
// ORDER & HISTORY ROUTES
// ============================================

// GET /api/user/orders — user specific history
app.get('/api/user/orders', verifyToken, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = { 'customer.userId': req.user.id };

        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const orders = await Order.find(query)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Order.countDocuments(query);

        res.json({
            orders,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('User orders error:', error);
        res.status(500).json({ error: 'Failed to fetch your order history.' });
    }
});

// POST /api/user/orders/:id/reorder — one-click reorder
app.post('/api/user/orders/:id/reorder', verifyToken, async (req, res) => {
    try {
        const oldOrder = await Order.findOne({ _id: req.params.id, 'customer.userId': req.user.id });
        if (!oldOrder) return res.status(404).json({ error: 'Original order not found.' });

        // Create new order with same items but new ID/Date
        const newOrderData = {
            customer: oldOrder.customer,
            items: oldOrder.items,
            subtotal: oldOrder.subtotal,
            tax: oldOrder.tax,
            shipping: oldOrder.shipping,
            totalAmount: oldOrder.totalAmount,
            shippingAddress: oldOrder.shippingAddress,
            billingAddress: oldOrder.billingAddress,
            payment: {
                method: oldOrder.payment.method,
                status: 'Pending'
            }
        };

        const newOrder = new Order(newOrderData);
        await newOrder.save();

        res.status(201).json({ message: 'Reorder successful. Please complete payment.', orderId: newOrder.orderId });
    } catch (error) {
        console.error('Reorder error:', error);
        res.status(500).json({ error: 'Failed to process reorder.' });
    }
});

const PDFDocument = require('pdfkit');

// GET /api/orders/:id/invoice — generate PDF
app.get('/api/orders/:id/invoice', verifyToken, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, 'customer.userId': req.user.id });
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.orderId}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('QUANTERA LAPTOP STORE', { align: 'center' });
        doc.fontSize(10).text('Premium Computing Specialists', { align: 'center' }).moveDown(2);

        // Order Info
        doc.fontSize(12).text(`Invoice No: ${order.orderId}`);
        doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`);
        doc.text(`Status: ${order.status}`).moveDown();

        // Customer Info
        doc.text('Bill To:', { underline: true });
        doc.text(order.customer.name);
        doc.text(order.customer.email);
        doc.text(`${order.shippingAddress.street}, ${order.shippingAddress.city}`).moveDown();

        // Table Header
        const tableTop = 250;
        doc.fontSize(10).text('Item', 50, tableTop);
        doc.text('Qty', 250, tableTop);
        doc.text('Price', 350, tableTop);
        doc.text('Subtotal', 450, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke().moveDown();

        // Items
        let y = tableTop + 25;
        order.items.forEach(item => {
            doc.text(item.name, 50, y);
            doc.text(item.quantity.toString(), 250, y);
            doc.text(`INR ${item.price.toLocaleString()}`, 350, y);
            doc.text(`INR ${item.subtotal.toLocaleString()}`, 450, y);
            y += 20;
        });

        // Totals
        doc.moveTo(350, y + 10).lineTo(550, y + 10).stroke();
        doc.text('Total Amount:', 350, y + 20, { bold: true });
        doc.text(`INR ${order.totalAmount.toLocaleString()}`, 450, y + 20);

        doc.fontSize(8).text('Thank you for shopping with Quantéra!', 50, 700, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ error: 'Failed to generate invoice.' });
    }
});

// ============================================
// WISHLIST & LOYALTY ROUTES
// ============================================

// GET /api/user/wishlist — list default wishlist
app.get('/api/user/wishlist', verifyToken, async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ userId: req.user.id, isDefault: true });

        if (!wishlist) {
            wishlist = new Wishlist({ userId: req.user.id, name: 'My Wishlist', isDefault: true });
            await wishlist.save();
        }
        res.json(wishlist);
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist.' });
    }
});

// POST /api/user/wishlist/add — add product
app.post('/api/user/wishlist/add', verifyToken, async (req, res) => {
    try {
        const { productId, productType } = req.body;
        let wishlist = await Wishlist.findOne({ userId: req.user.id, isDefault: true });

        if (!wishlist) {
            wishlist = new Wishlist({ userId: req.user.id, name: 'My Wishlist', isDefault: true });
        }

        // Check if already exists
        const exists = wishlist.items.find(item => item.productId.toString() === productId);
        if (exists) return res.status(409).json({ error: 'Product already in wishlist.' });

        wishlist.items.push({ productId, productType });
        await wishlist.save();
        res.json({ message: 'Added to wishlist.', wishlist });
    } catch (error) {
        console.error('Wishlist add error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist.' });
    }
});

// DELETE /api/user/wishlist/:productId — remove
app.delete('/api/user/wishlist/:productId', verifyToken, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user.id, isDefault: true });
        if (!wishlist) return res.status(404).json({ error: 'Wishlist not found.' });

        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== req.params.productId);
        await wishlist.save();
        res.json({ message: 'Removed from wishlist.', wishlist });
    } catch (error) {
        console.error('Wishlist remove error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist.' });
    }
});

// GET /api/user/loyalty — check points
// GET /api/user/loyalty — check points
app.get('/api/user/loyalty', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('profile.finance');
        res.json(user.profile.finance);
    } catch (error) {
        console.error('Loyalty check error:', error);
        res.status(500).json({ error: 'Failed to fetch loyalty data.' });
    }
});

// API Route to get featured laptops (for gallery & home)
app.get('/api/laptops/featured', async (req, res) => {
    try {
        const laptops = await Laptop.find({ featured: true }).limit(12);

        // If no featured laptops, return latest 10 as fallback
        if (laptops.length === 0) {
            laptops = await Laptop.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(12);
        }

        // Transform for frontend
        const transformedLaptops = laptops.map(laptop => ({
            id: laptop._id,
            brand: laptop.brand,
            series: laptop.series,
            modelNumber: laptop.modelNumber,
            price: laptop.price,
            image: laptop.image,
            images: laptop.images,
            description: laptop.description,
            cpuBrand: laptop.cpu?.brand,
            cpuModel: laptop.cpu?.model,
            gpuModel: laptop.gpu?.model,
            ramCapacity: laptop.memory?.capacity,
            storageCap: laptop.storage?.capacity,
            storageType: laptop.storage?.type
        }));

        res.json(transformedLaptops);
    } catch (error) {
        console.error('Get featured laptops error:', error);
        res.status(500).json({ error: 'Failed to fetch featured laptops' });
    }
});

// API Route to get featured accessories
app.get('/api/accessories/featured', async (req, res) => {
    try {
        const accessories = await Accessory.find({ featured: true }).limit(12);

        // Fallback to latest 10 if none featured
        if (accessories.length === 0) {
            accessories = await Accessory.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(12);
        }

        res.json(accessories);
    } catch (error) {
        console.error('Get featured accessories error:', error);
        res.status(500).json({ error: 'Failed to fetch featured accessories' });
    }
});

// API Route to upload images
app.post('/api/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Return array of file paths
        const filePaths = req.files.map(file => `/uploads/${file.filename}`);
        res.json({
            message: 'Images uploaded successfully',
            images: filePaths
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// API Route to get laptop data
app.get('/api/laptops', async (req, res) => {
    try {
        const {
            full,
            brand,
            category,
            minPrice,
            maxPrice,
            search,
            page = 1,
            limit = 50
        } = req.query;

        let query = { isActive: true };

        // Apply filters
        if (brand) {
            query.brand = new RegExp(brand, 'i');
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        let laptopsQuery = Laptop.find(query);

        // Text search
        if (search) {
            laptopsQuery = Laptop.find({
                ...query,
                $text: { $search: search }
            }).sort({ score: { $meta: 'textScore' } });
        }

        // Pagination (only if not requesting full dataset)
        if (full !== 'true') {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            laptopsQuery = laptopsQuery.skip(skip).limit(parseInt(limit));
        }

        const laptops = await laptopsQuery.sort({ createdAt: -1 });

        // Transform data for frontend compatibility
        const transformedLaptops = laptops.map(laptop => ({
            id: laptop._id,
            brand: laptop.brand,
            series: laptop.series,
            modelNumber: laptop.modelNumber,
            sku: laptop.sku,
            launchYear: laptop.launchYear,
            price: laptop.price,
            discountPrice: laptop.discountPrice,
            stock: laptop.stock,
            category: laptop.category,

            // Flatten nested objects for compatibility
            material: laptop.design?.material,
            color: laptop.design?.color,
            weight: laptop.design?.weight,
            dimensions: laptop.design?.dimensions,
            hinge: laptop.design?.hinge,
            milStd: laptop.design?.milStd,

            displaySize: laptop.display?.size,
            resolution: laptop.display?.resolution,
            aspectRatio: laptop.display?.aspectRatio,
            panelType: laptop.display?.panelType,
            refreshRate: laptop.display?.refreshRate,
            responseTime: laptop.display?.responseTime,
            brightness: laptop.display?.brightness,
            colorGamut: laptop.display?.colorGamut,
            touchscreen: laptop.display?.touchscreen,

            cpuBrand: laptop.cpu?.brand,
            cpuModel: laptop.cpu?.model,
            cpuCores: laptop.cpu?.cores,
            pCores: laptop.cpu?.pCores,
            eCores: laptop.cpu?.eCores,
            threads: laptop.cpu?.threads,
            baseClock: laptop.cpu?.baseClock,
            boostClock: laptop.cpu?.boostClock,
            cache: laptop.cpu?.cache,
            npu: laptop.cpu?.npu,

            gpuType: laptop.gpu?.type,
            gpuModel: laptop.gpu?.model,
            vram: laptop.gpu?.vram,
            tgp: laptop.gpu?.tgp,
            muxSwitch: laptop.gpu?.muxSwitch,

            ramCapacity: laptop.memory?.capacity,
            ramType: laptop.memory?.type,
            ramSpeed: laptop.memory?.speed,
            ramSpeedUnit: laptop.memory?.speedUnit,
            ramSlots: laptop.memory?.slots,
            maxRam: laptop.memory?.maxSupported,

            storageCap: laptop.storage?.capacity,
            storageType: laptop.storage?.type,
            extraSlots: laptop.storage?.extraSlots,

            wifi: laptop.connectivity?.wifi,
            bluetooth: laptop.connectivity?.bluetooth,
            ports: laptop.connectivity?.ports,

            webcam: laptop.multimedia?.webcam,
            speakers: laptop.multimedia?.speakers,

            keyboard: laptop.input?.keyboard,
            touchpad: laptop.input?.touchpad,

            battery: laptop.power?.battery,
            adapter: laptop.power?.adapter,

            os: laptop.software?.os,
            warranty: laptop.software?.warranty,

            images: laptop.images,
            image: laptop.image,
            description: laptop.description,

            createdAt: laptop.createdAt,
            updatedAt: laptop.updatedAt
        }));

        res.json(transformedLaptops);

    } catch (error) {
        console.error('Get laptops error:', error);
        res.status(500).json({ error: 'Failed to fetch laptops' });
    }
});

// API Route to save laptop data
app.post('/api/laptops', async (req, res) => {
    try {
        const laptopData = req.body;

        // Transform flat data to nested structure
        const laptop = new Laptop({
            brand: laptopData.brand,
            series: laptopData.series,
            modelNumber: laptopData.modelNumber,
            sku: laptopData.sku,
            launchYear: laptopData.launchYear,
            price: laptopData.price,
            discountPrice: laptopData.discountPrice,
            stock: laptopData.stock,
            category: laptopData.category,

            design: {
                material: laptopData.material,
                color: laptopData.color,
                weight: laptopData.weight,
                dimensions: laptopData.dimensions,
                hinge: laptopData.hinge,
                milStd: laptopData.milStd
            },

            display: {
                size: laptopData.displaySize,
                resolution: laptopData.resolution,
                aspectRatio: laptopData.aspectRatio,
                panelType: laptopData.panelType,
                refreshRate: laptopData.refreshRate,
                responseTime: laptopData.responseTime,
                brightness: laptopData.brightness,
                colorGamut: laptopData.colorGamut,
                touchscreen: laptopData.touchscreen
            },

            cpu: {
                brand: laptopData.cpuBrand,
                model: laptopData.cpuModel,
                cores: laptopData.cpuCores,
                pCores: laptopData.pCores,
                eCores: laptopData.eCores,
                threads: laptopData.threads,
                baseClock: laptopData.baseClock,
                boostClock: laptopData.boostClock,
                cache: laptopData.cache,
                npu: laptopData.npu
            },

            gpu: {
                type: laptopData.gpuType,
                model: laptopData.gpuModel,
                vram: laptopData.vram,
                tgp: laptopData.tgp,
                muxSwitch: laptopData.muxSwitch
            },

            memory: {
                capacity: laptopData.ramCapacity,
                type: laptopData.ramType,
                speed: laptopData.ramSpeed,
                speedUnit: laptopData.ramSpeedUnit,
                slots: laptopData.ramSlots,
                maxSupported: laptopData.maxRam
            },

            storage: {
                capacity: laptopData.storageCap,
                type: laptopData.storageType,
                extraSlots: laptopData.extraSlots
            },

            connectivity: {
                wifi: laptopData.wifi,
                bluetooth: laptopData.bluetooth,
                ports: laptopData.ports
            },

            multimedia: {
                webcam: laptopData.webcam,
                speakers: laptopData.speakers
            },

            input: {
                keyboard: laptopData.keyboard,
                touchpad: laptopData.touchpad
            },

            power: {
                battery: laptopData.battery,
                adapter: laptopData.adapter
            },

            software: {
                os: laptopData.os,
                warranty: laptopData.warranty
            },

            images: laptopData.images,
            image: laptopData.image,
            description: laptopData.description
        });

        await laptop.save();

        res.json({
            message: 'Laptop added successfully',
            id: laptop._id
        });

    } catch (error) {
        console.error('Save laptop error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ error: messages });
        }
        if (error.code === 11000) {
            return res.status(409).json({ error: 'A laptop with this SKU already exists.' });
        }
        res.status(500).json({ error: 'Failed to save laptop' });
    }
});

// API Route to update laptop by ID
app.put('/api/laptops/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const d = req.body; // flat form data

        // Transform flat → nested (same mapping as POST)
        const updateData = {
            brand:       d.brand,
            series:      d.series,
            modelNumber: d.modelNumber,
            sku:         d.sku,
            launchYear:  d.launchYear,
            price:       d.price,
            discountPrice: d.discountPrice,
            stock:       d.stock,
            category:    d.category,

            design: {
                material:   d.material,
                color:      d.color,
                weight:     d.weight,
                dimensions: d.dimensions,
                hinge:      d.hinge,
                milStd:     d.milStd
            },
            display: {
                size:         d.displaySize,
                resolution:   d.resolution,
                aspectRatio:  d.aspectRatio,
                panelType:    d.panelType,
                refreshRate:  d.refreshRate,
                responseTime: d.responseTime,
                brightness:   d.brightness,
                colorGamut:   d.colorGamut,
                touchscreen:  d.touchscreen
            },
            cpu: {
                brand:     d.cpuBrand,
                model:     d.cpuModel,
                cores:     d.cpuCores,
                pCores:    d.pCores,
                eCores:    d.eCores,
                threads:   d.threads,
                baseClock: d.baseClock,
                boostClock:d.boostClock,
                cache:     d.cache,
                npu:       d.npu
            },
            gpu: {
                type:      d.gpuType,
                model:     d.gpuModel,
                vram:      d.vram,
                tgp:       d.tgp,
                muxSwitch: d.muxSwitch
            },
            memory: {
                capacity:    d.ramCapacity,
                type:        d.ramType,
                speed:       d.ramSpeed,
                speedUnit:   d.ramSpeedUnit,
                slots:       d.ramSlots,
                maxSupported:d.maxRam
            },
            storage: {
                capacity:   d.storageCap,
                type:       d.storageType,
                extraSlots: d.extraSlots
            },
            connectivity: {
                wifi:      d.wifi,
                bluetooth: d.bluetooth,
                ports:     d.ports
            },
            multimedia: {
                webcam:   d.webcam,
                speakers: d.speakers
            },
            input: {
                keyboard: d.keyboard,
                touchpad: d.touchpad
            },
            power: {
                battery: d.battery,
                adapter: d.adapter
            },
            software: {
                os:       d.os,
                warranty: d.warranty
            },

            // Only update images if new ones were provided
            ...(d.images && { images: d.images, image: d.image || d.images[0] }),
            description: d.description
        };

        // Remove undefined nested objects to avoid overwriting with empty data
        Object.keys(updateData).forEach(key => {
            if (updateData[key] && typeof updateData[key] === 'object' && !Array.isArray(updateData[key])) {
                const hasValue = Object.values(updateData[key]).some(v => v !== undefined && v !== null && v !== '');
                if (!hasValue) delete updateData[key];
            }
        });

        const laptop = await Laptop.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!laptop) {
            return res.status(404).json({ error: 'Laptop not found' });
        }

        res.json({ message: 'Laptop updated successfully', laptop });

    } catch (error) {
        console.error('Update laptop error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ error: messages });
        }
        if (error.code === 11000) {
            return res.status(409).json({ error: 'A laptop with this SKU already exists.' });
        }
        res.status(500).json({ error: 'Failed to update laptop' });
    }
});

// API Route to delete laptop by ID
app.delete('/api/laptops/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const laptop = await Laptop.findByIdAndDelete(id);

        if (!laptop) {
            return res.status(404).json({ error: 'Laptop not found' });
        }

        res.json({ message: 'Laptop deleted successfully' });

    } catch (error) {
        console.error('Delete laptop error:', error);
        res.status(500).json({ error: 'Failed to delete laptop' });
    }
});

// API Route to get accessory data
app.get('/api/accessories', async (req, res) => {
    try {
        const {
            type,
            brand,
            category,
            minPrice,
            maxPrice,
            search,
            page = 1,
            limit = 50
        } = req.query;

        let query = { isActive: true };

        // Apply filters
        if (type) {
            query.type = type;
        }

        if (brand) {
            query.brand = new RegExp(brand, 'i');
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        let accessoriesQuery = Accessory.find(query);

        // Text search
        if (search) {
            accessoriesQuery = Accessory.find({
                ...query,
                $text: { $search: search }
            }).sort({ score: { $meta: 'textScore' } });
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        accessoriesQuery = accessoriesQuery.skip(skip).limit(parseInt(limit));

        const accessories = await accessoriesQuery.sort({ createdAt: -1 });

        res.json(accessories);

    } catch (error) {
        console.error('Get accessories error:', error);
        res.status(500).json({ error: 'Failed to fetch accessories' });
    }
});

/**
 * ─── HIGH-PERFORMANCE WEIGHTED SEARCH API ──────────────────────────────────
 * Uses the in-memory search engine for sub-10ms relevance-ranked results.
 */
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        const results = searchEngine.search(query);
        res.json({ results });
    } catch (error) {
        console.error('Unified search error:', error);
        res.status(500).json({ error: 'Search service unavailable' });
    }
});

// API Route to save accessory data
app.post('/api/accessories', async (req, res) => {
    try {
        const accessory = new Accessory(req.body);
        await accessory.save();

        res.json({
            message: 'Accessory added successfully',
            id: accessory._id
        });

    } catch (error) {
        console.error('Save accessory error:', error);
        res.status(500).json({ error: 'Failed to save accessory' });
    }
});

// API Route to update accessory by ID
app.put('/api/accessories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const accessory = await Accessory.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!accessory) {
            return res.status(404).json({ error: 'Accessory not found' });
        }

        res.json({
            message: 'Accessory updated successfully',
            accessory
        });

    } catch (error) {
        console.error('Update accessory error:', error);
        res.status(500).json({ error: 'Failed to update accessory' });
    }
});

// API Route to delete accessory by ID
app.delete('/api/accessories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const accessory = await Accessory.findByIdAndDelete(id);

        if (!accessory) {
            return res.status(404).json({ error: 'Accessory not found' });
        }

        res.json({ message: 'Accessory deleted successfully' });

    } catch (error) {
        console.error('Delete accessory error:', error);
        res.status(500).json({ error: 'Failed to delete accessory' });
    }
});

// ============================================
// ORDER MANAGEMENT API ROUTES
// ============================================

// API Route to get all orders (for admin)
app.get('/api/orders', async (req, res) => {
    try {
        const {
            status,
            customer,
            page = 1,
            limit = 50
        } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (customer) {
            query['customer.email'] = new RegExp(customer, 'i');
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(query)
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json(orders);

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// API Route to send bulk newsletter
app.post('/api/admin/newsletter/send', async (req, res) => {
    try {
        const { subject, title, body, ctaLabel, ctaLink } = req.body;

        if (!subject || !title || !body) {
            return res.status(400).json({ error: 'Subject, Title, and Body are required' });
        }

        // Find all users who subscribed to newsletter
        const subscribers = await User.find({
            'profile.preferences.newsletter': true,
            isActive: true
        }).select('email');

        if (subscribers.length === 0) {
            return res.status(200).json({ message: 'No subscribers found' });
        }

        const emails = subscribers.map(s => s.email);

        // Trigger bulk send (async)
        emailService.sendBulkEmail(emails, subject, title, body, ctaLabel, ctaLink).catch(err => {
            console.error('❌ Bulk email partial failure:', err.message);
        });

        res.json({
            message: `Newsletter queued for ${emails.length} subscribers`,
            recipientCount: emails.length
        });

    } catch (error) {
        console.error('Send newsletter error:', error);
        res.status(500).json({ error: 'Failed to send newsletter' });
    }
});

// API Route to fetch email logs for admin
app.get('/api/admin/email-logs', async (req, res) => {
    try {
        const logs = await EmailLog.find().sort({ sentAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        console.error('Fetch email logs error:', error);
        res.status(500).json({ error: 'Failed to fetch email logs' });
    }
});

// API Route to fetch newsletter subscribers for admin
app.get('/api/admin/subscribers', async (req, res) => {
    try {
        // Fetch from Newsletter model
        const guestSubscribers = await Newsletter.find().sort({ subscribedAt: -1 });

        // Fetch from User model (users who opted in)
        const userSubscribers = await User.find({ 'profile.preferences.newsletter': true }).select('name email createdAt');

        res.json({
            guests: guestSubscribers,
            users: userSubscribers,
            totalCount: guestSubscribers.length + userSubscribers.length
        });
    } catch (error) {
        console.error('Fetch subscribers error:', error);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});

// API Route to get specific order by ID
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByOrderId(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// API Route to create new order
app.post('/api/orders', async (req, res) => {
    try {
        console.log('Received order request:', JSON.stringify(req.body, null, 2));
        const order = new Order(req.body);
        await order.save();

        // Send Order Confirmation Email (async, don't wait for it to finish)
        emailService.sendOrderConfirmation(order).catch(err => {
            console.error('❌ Failed to send order confirmation email:', err.message);
        });

        console.log('Order saved successfully:', order.orderId);
        res.json({
            message: 'Order created successfully',
            orderId: order.orderId,
            order
        });

    } catch (error) {
        console.error('Create order error:', error);
        if (error.name === 'ValidationError') {
            console.error('Validation details:', JSON.stringify(error.errors, null, 2));
            return res.status(400).json({ error: 'Order validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// API Route to update order status
app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const order = await Order.findByOrderId(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await order.updateStatus(status, note, req.user?.id);

        // Trigger Status Update Email (async, don't wait for it to finish)
        emailService.sendOrderStatusUpdate(order, status, note).catch(err => {
            console.error('❌ Failed to send status update email:', err.message);
        });

        // Trigger SMS Update if customer has a phone number
        if (order.customer.phone || order.shippingAddress.phone) {
            const phone = order.customer.phone || order.shippingAddress.phone;
            const smsMessage = `Quantéra Update: Your order ${orderId} is now ${status}! ${note ? `Note: ${note}` : ''}`.trim();

            // Using the new generic transactional SMS method we just wrote
            otpService.sendTransactionalSms(phone, smsMessage).catch(err => {
                console.error('❌ Failed to send status SMS:', err.message);
            });
        }

        res.json({
            message: 'Order status updated successfully',
            order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// API Route to delete order
app.delete('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOneAndDelete({ orderId: orderId.toUpperCase() });
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Static page routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/order-tracking', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'order-tracking.html'));
});

// Fallback route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to database and start server
async function startServer() {
    try {
        console.log('🔗 Attempting to connect to MongoDB...');
        await database.connect();
    } catch (error) {
        console.error('❌ Database connection failed. The server will start, but features relying on the DB will not work.');
    }

    app.listen(PORT, async () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        
        // Build Search Index
        if (database.isConnected()) {
             await searchEngine.initialize();
        }

        const status = database.isConnected() ? 'Connected (Active)' : 'DISCONNECTED';
        console.log(`📊 Status: ${status}`);
        console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await database.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    await database.disconnect();
    process.exit(0);
});

startServer();