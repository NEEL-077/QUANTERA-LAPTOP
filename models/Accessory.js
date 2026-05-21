const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['Mouse', 'Keyboard', 'Headset', 'Monitor', 'Dock', 'Bag', 'Charger', 'Webcam', 'Speaker', 'Cable', 'Other']
    },
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    
    // Pricing
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    discountPrice: {
        type: Number,
        min: [0, 'Discount price cannot be negative'],
        validate: {
            validator: function(value) {
                return !value || value < this.price;
            },
            message: 'Discount price must be less than regular price'
        }
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    
    // Technical Specifications
    connectivity: {
        type: String,
        required: [true, 'Connectivity is required']
    },
    features: [{
        type: String,
        trim: true
    }],
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Categorization
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Input Devices', 'Audio', 'Display', 'Connectivity', 'Protection', 'Power', 'Video']
    },
    
    // Product Details
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    warranty: {
        type: String,
        default: '1 Year'
    },
    
    // Media
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                // Allow full URLs OR relative paths
                return /^https?:\/\/.+/.test(v) || /^(images\/|\/).+/.test(v);
            },
            message: 'Image must be a valid URL or local path'
        }
    }],
    image: {
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/.test(v) || /^(images\/|\/).+/.test(v);
            },
            message: 'Main image must be a valid URL or local path'
        }
    },
    
    // Ratings & Reviews
    rating: {
        type: Number,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0
    },
    reviews: {
        type: Number,
        min: [0, 'Review count cannot be negative'],
        default: 0
    },
    
    // Compatibility
    compatibility: [{
        type: String,
        trim: true
    }],
    
    // Physical Properties
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['mm', 'cm', 'inch'],
            default: 'mm'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['g', 'kg', 'lb'],
            default: 'g'
        }
    },
    
    // SEO & Marketing
    tags: [String],
    featured: {
        type: Boolean,
        default: false
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Analytics
    views: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for performance
accessorySchema.index({ type: 1 });
accessorySchema.index({ brand: 1 });
accessorySchema.index({ category: 1 });
accessorySchema.index({ price: 1 });
accessorySchema.index({ rating: -1 });
accessorySchema.index({ featured: -1, createdAt: -1 });
accessorySchema.index({ isActive: 1 });

// Text search index
accessorySchema.index({
    name: 'text',
    brand: 'text',
    description: 'text',
    type: 'text'
});

// Instance methods
accessorySchema.methods.updateStock = function(quantity) {
    this.stock = Math.max(0, this.stock + quantity);
    return this.save();
};

accessorySchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

accessorySchema.methods.recordSale = function() {
    this.sales += 1;
    this.stock = Math.max(0, this.stock - 1);
    return this.save();
};

accessorySchema.methods.updateRating = function(newRating) {
    // Simple rating update - in production, you'd want more sophisticated rating calculation
    this.rating = ((this.rating * this.reviews) + newRating) / (this.reviews + 1);
    this.reviews += 1;
    return this.save();
};

// Static methods
accessorySchema.statics.findByType = function(type) {
    return this.find({ type, isActive: true });
};

accessorySchema.statics.findByBrand = function(brand) {
    return this.find({ brand: new RegExp(brand, 'i'), isActive: true });
};

accessorySchema.statics.findByCategory = function(category) {
    return this.find({ category, isActive: true });
};

accessorySchema.statics.findInPriceRange = function(minPrice, maxPrice) {
    return this.find({ 
        price: { $gte: minPrice, $lte: maxPrice },
        isActive: true 
    });
};

accessorySchema.statics.searchAccessories = function(query) {
    return this.find({
        $text: { $search: query },
        isActive: true
    }).sort({ score: { $meta: 'textScore' } });
};

accessorySchema.statics.getFeatured = function(limit = 10) {
    return this.find({ featured: true, isActive: true })
               .sort({ createdAt: -1 })
               .limit(limit);
};

module.exports = mongoose.model('Accessory', accessorySchema);