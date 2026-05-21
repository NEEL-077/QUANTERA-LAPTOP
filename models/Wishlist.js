const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        default: 'My Wishlist',
        required: true
    },
    description: String,
    isDefault: {
        type: Boolean,
        default: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'items.productType'
        },
        productType: {
            type: String,
            required: true,
            enum: ['Laptop', 'Accessory']
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure only one default wishlist per user
wishlistSchema.pre('save', async function () {
    if (this.isDefault) {
        await mongoose.model('Wishlist').updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
});

// Index for performance
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ name: 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
