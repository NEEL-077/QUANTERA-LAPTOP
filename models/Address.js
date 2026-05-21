const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    label: {
        type: String,
        default: 'Home'
    },
    fullName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    alternatePhone: String,
    street: {
        type: String,
        required: true
    },
    landmark: String,
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
        default: 'India'
    },
    isDefaultShipping: {
        type: Boolean,
        default: false
    },
    isDefaultBilling: {
        type: Boolean,
        default: false
    },
    geoTag: {
        lat: Number,
        lng: Number
    },
    deliveryInstructions: String
}, {
    timestamps: true
});

// Pre-save to ensure only one default per user
addressSchema.pre('save', async function () {
    if (this.isDefaultShipping) {
        await mongoose.model('Address').updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefaultShipping: false }
        );
    }
    if (this.isDefaultBilling) {
        await mongoose.model('Address').updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefaultBilling: false }
        );
    }
});

// Index for performance
addressSchema.index({ userId: 1 });
addressSchema.index({ isDefaultShipping: -1 });

module.exports = mongoose.model('Address', addressSchema);
