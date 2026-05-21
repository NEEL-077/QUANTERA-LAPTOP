const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        refPath: 'productType'
    },
    productType: {
        type: String,
        required: true,
        enum: ['Laptop', 'Accessory', 'Other']
    },
    name: {
        type: String,
        required: true
    },
    brand: String,
    model: String,
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        max: [100, 'Quantity cannot exceed 100']
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

const orderSchema = new mongoose.Schema({
    // Order Identification
    orderId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    
    // Customer Information
    customer: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null // null for guest orders
        },
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Customer email is required'],
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
        },
        phone: {
            type: String,
            trim: true
        }
    },
    
    // Order Items
    items: [orderItemSchema],
    
    // Pricing
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
    },
    shipping: {
        type: Number,
        default: 0,
        min: [0, 'Shipping cost cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative']
    },
    
    // Shipping Information
    shippingAddress: {
        street: {
            type: String,
            required: [true, 'Street address is required']
        },
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        zipCode: {
            type: String,
            required: [true, 'ZIP code is required']
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            default: 'India'
        }
    },
    
    billingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        sameAsShipping: {
            type: Boolean,
            default: true
        }
    },
    
    // Order Status
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },
    
    // Payment Information
    payment: {
        method: {
            type: String,
            enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash on Delivery', 'Wallet', 'card', 'upi', 'netbanking', 'cod', 'Credit/Debit Card', 'UPI Payment'],
            required: [true, 'Payment method is required']
        },
        status: {
            type: String,
            enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
            default: 'Pending'
        },
        transactionId: String,
        paymentDate: Date,
        gateway: String // Razorpay, Stripe, etc.
    },
    
    // Tracking Information
    tracking: {
        carrier: String,
        trackingNumber: String,
        estimatedDelivery: Date,
        actualDelivery: Date
    },
    
    // Order Timeline
    timeline: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Additional Information
    notes: {
        customer: String,
        internal: String
    },
    
    // Discounts & Coupons
    coupon: {
        code: String,
        discount: Number,
        type: {
            type: String,
            enum: ['percentage', 'fixed']
        }
    },
    
    // Order Dates
    orderDate: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    
    // Flags
    isGuestOrder: {
        type: Boolean,
        default: false
    },
    isPriority: {
        type: Boolean,
        default: false
    },
    requiresSignature: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for performance
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.userId': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to update lastUpdated
orderSchema.pre('save', function() {
    this.lastUpdated = new Date();
});

// Pre-save middleware to generate order ID
orderSchema.pre('save', function() {
    if (!this.orderId) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderId = `ORD-${dateStr}-${randomStr}`;
    }
});

// Pre-save middleware to add timeline entry
orderSchema.pre('save', function() {
    if (this.isModified('status')) {
        this.timeline.push({
            status: this.status,
            timestamp: new Date(),
            note: `Order status changed to ${this.status}`
        });
    }
});

// Instance methods
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
    this.status = newStatus;
    this.timeline.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || `Order status changed to ${newStatus}`,
        updatedBy
    });
    return this.save();
};

orderSchema.methods.addTrackingInfo = function(carrier, trackingNumber, estimatedDelivery) {
    this.tracking.carrier = carrier;
    this.tracking.trackingNumber = trackingNumber;
    this.tracking.estimatedDelivery = estimatedDelivery;
    return this.updateStatus('Shipped', `Order shipped via ${carrier}. Tracking: ${trackingNumber}`);
};

orderSchema.methods.markAsDelivered = function() {
    this.tracking.actualDelivery = new Date();
    return this.updateStatus('Delivered', 'Order delivered successfully');
};

orderSchema.methods.calculateTotal = function() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.totalAmount = this.subtotal + this.tax + this.shipping - this.discount;
    return this.totalAmount;
};

// Static methods
orderSchema.statics.findByOrderId = function(orderId) {
    return this.findOne({ orderId: orderId.toUpperCase() });
};

orderSchema.statics.findByCustomer = function(email) {
    return this.find({ 'customer.email': email.toLowerCase() })
               .sort({ orderDate: -1 });
};

orderSchema.statics.findByStatus = function(status) {
    return this.find({ status }).sort({ orderDate: -1 });
};

orderSchema.statics.getRecentOrders = function(limit = 10) {
    return this.find({})
               .sort({ orderDate: -1 })
               .limit(limit)
               .populate('customer.userId', 'name email');
};

orderSchema.statics.getOrderStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ]);
};

module.exports = mongoose.model('Order', orderSchema);