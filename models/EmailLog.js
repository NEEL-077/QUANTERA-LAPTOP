const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true
    },
    templateType: {
        type: String,
        enum: ['Welcome', 'PasswordReset', 'OrderConfirmation', 'StatusUpdate', 'AdminAlert', 'Newsletter', 'Bulk'],
        required: true
    },
    status: {
        type: String,
        enum: ['Sent', 'Failed'],
        default: 'Sent'
    },
    error: {
        type: String,
        default: null
    },
    metadata: {
        orderId: String,
        userId: mongoose.Schema.Types.ObjectId,
        bulkId: String
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance in admin panel
emailLogSchema.index({ sentAt: -1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ recipient: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
