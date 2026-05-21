const mongoose = require('mongoose');

const laptopSchema = new mongoose.Schema({
    // Basic Information
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true
    },
    series: {
        type: String,
        required: [true, 'Series is required'],
        trim: true
    },
    modelNumber: {
        type: String,
        required: [true, 'Model number is required'],
        trim: true
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    launchYear: {
        type: Number,
        min: 2015,
        max: 2030
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
    category: {
        type: String,
        enum: ['gaming', 'business', 'student', 'professional', 'creator', 'ultrabook'],
        required: [true, 'Category is required']
    },
    
    // Design & Build
    design: {
        material: String,
        color: String,
        weight: {
            type: Number,
            min: [0.5, 'Weight must be at least 0.5kg'],
            max: [10, 'Weight cannot exceed 10kg']
        },
        dimensions: String,
        hinge: {
            type: String,
            enum: ['Standard', '180 Degree', '360 Degree (2-in-1)']
        },
        milStd: {
            type: Boolean,
            default: false
        }
    },
    
    // Display
    display: {
        size: {
            type: Number,
            required: [true, 'Display size is required'],
            min: [10, 'Display size must be at least 10 inches'],
            max: [20, 'Display size cannot exceed 20 inches']
        },
        resolution: {
            type: String,
            required: [true, 'Display resolution is required']
        },
        aspectRatio: String,
        panelType: {
            type: String,
            enum: ['IPS', 'OLED', 'Mini-LED', 'TN', 'VA']
        },
        refreshRate: {
            type: Number,
            min: [60, 'Refresh rate must be at least 60Hz'],
            max: [500, 'Refresh rate cannot exceed 500Hz']
        },
        responseTime: Number,
        brightness: {
            type: Number,
            min: [100, 'Brightness must be at least 100 nits'],
            max: [2000, 'Brightness cannot exceed 2000 nits']
        },
        colorGamut: String,
        touchscreen: {
            type: Boolean,
            default: false
        }
    },
    
    // CPU
    cpu: {
        brand: {
            type: String,
            required: [true, 'CPU brand is required'],
            enum: ['Intel', 'AMD', 'Apple']
        },
        model: {
            type: String,
            required: [true, 'CPU model is required']
        },
        cores: {
            type: Number,
            min: [2, 'CPU must have at least 2 cores'],
            max: [32, 'CPU cannot have more than 32 cores']
        },
        pCores: Number,
        eCores: Number,
        threads: {
            type: Number,
            min: [2, 'CPU must have at least 2 threads'],
            max: [64, 'CPU cannot have more than 64 threads']
        },
        baseClock: {
            type: Number,
            min: [0.5, 'Base clock must be at least 0.5 GHz'],
            max: [6, 'Base clock cannot exceed 6 GHz']
        },
        boostClock: {
            type: Number,
            min: [0.5, 'Boost clock must be at least 0.5 GHz'],
            max: [8, 'Boost clock cannot exceed 8 GHz']
        },
        cache: {
            type: Number,
            min: [1, 'Cache must be at least 1 MB'],
            max: [128, 'Cache cannot exceed 128 MB']
        },
        npu: {
            type: Number,
            min: [0, 'NPU TOPS cannot be negative'],
            max: [100, 'NPU TOPS cannot exceed 100']
        }
    },
    
    // GPU
    gpu: {
        type: {
            type: String,
            required: [true, 'GPU type is required'],
            enum: ['Dedicated', 'Integrated']
        },
        model: {
            type: String,
            required: [true, 'GPU model is required']
        },
        vram: {
            type: Number,
            min: [0, 'VRAM cannot be negative'],
            max: [48, 'VRAM cannot exceed 48GB']
        },
        tgp: {
            type: Number,
            min: [0, 'TGP cannot be negative'],
            max: [300, 'TGP cannot exceed 300W']
        },
        muxSwitch: {
            type: Boolean,
            default: false
        }
    },
    
    // Memory
    memory: {
        capacity: {
            type: Number,
            required: [true, 'RAM capacity is required'],
            enum: [4, 8, 16, 32, 64, 128]
        },
        type: {
            type: String,
            required: [true, 'RAM type is required'],
            enum: ['DDR4', 'DDR5', 'LPDDR4X', 'LPDDR5', 'Unified Memory']
        },
        speed: {
            type: Number,
            min: [1600, 'RAM speed must be at least 1600 MHz'],
            max: [8000, 'RAM speed cannot exceed 8000 MHz']
        },
        speedUnit: {
            type: String,
            enum: ['MHz', 'MT/s'],
            default: 'MHz'
        },
        slots: String,
        maxSupported: {
            type: Number,
            min: [4, 'Max RAM must be at least 4GB'],
            max: [256, 'Max RAM cannot exceed 256GB']
        }
    },
    
    // Storage
    storage: {
        capacity: {
            type: Number,
            required: [true, 'Storage capacity is required'],
            min: [128, 'Storage must be at least 128GB'],
            max: [8192, 'Storage cannot exceed 8TB']
        },
        type: {
            type: String,
            required: [true, 'Storage type is required'],
            enum: ['NVMe PCIe 3.0', 'NVMe PCIe 4.0', 'NVMe Gen4', 'SATA SSD', 'HDD']
        },
        extraSlots: {
            type: Number,
            min: [0, 'Extra slots cannot be negative'],
            max: [4, 'Cannot have more than 4 extra slots']
        }
    },
    
    // Connectivity
    connectivity: {
        wifi: {
            type: String,
            required: [true, 'WiFi specification is required']
        },
        bluetooth: {
            type: String,
            required: [true, 'Bluetooth specification is required']
        },
        ports: {
            type: String,
            required: [true, 'Ports specification is required']
        }
    },
    
    // Multimedia
    multimedia: {
        webcam: String,
        speakers: String
    },
    
    // Input
    input: {
        keyboard: String,
        touchpad: String
    },
    
    // Power
    power: {
        battery: {
            type: Number,
            min: [20, 'Battery must be at least 20Wh'],
            max: [150, 'Battery cannot exceed 150Wh']
        },
        adapter: {
            type: Number,
            min: [30, 'Adapter must be at least 30W'],
            max: [300, 'Adapter cannot exceed 300W']
        }
    },
    
    // Software
    software: {
        os: {
            type: String,
            required: [true, 'Operating system is required']
        },
        warranty: String
    },
    
    // Media
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                // Allow full URLs OR relative paths starting with images/ or /
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
    
    // SEO & Marketing
    description: {
        type: String,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
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
laptopSchema.index({ brand: 1, series: 1 });
laptopSchema.index({ category: 1 });
laptopSchema.index({ price: 1 });
laptopSchema.index({ 'cpu.brand': 1 });
laptopSchema.index({ 'gpu.type': 1 });
laptopSchema.index({ stock: 1 });
laptopSchema.index({ featured: -1, createdAt: -1 });
laptopSchema.index({ isActive: 1 });

// Text search index
laptopSchema.index({
    brand: 'text',
    series: 'text',
    modelNumber: 'text',
    description: 'text',
    'cpu.model': 'text',
    'gpu.model': 'text'
});

// Virtual for display name
laptopSchema.virtual('displayName').get(function() {
    return `${this.brand} ${this.series} ${this.modelNumber}`;
});

// Instance methods
laptopSchema.methods.updateStock = function(quantity) {
    this.stock = Math.max(0, this.stock + quantity);
    return this.save();
};

laptopSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

laptopSchema.methods.recordSale = function() {
    this.sales += 1;
    this.stock = Math.max(0, this.stock - 1);
    return this.save();
};

// Static methods
laptopSchema.statics.findByBrand = function(brand) {
    return this.find({ brand: new RegExp(brand, 'i'), isActive: true });
};

laptopSchema.statics.findByCategory = function(category) {
    return this.find({ category, isActive: true });
};

laptopSchema.statics.findInPriceRange = function(minPrice, maxPrice) {
    return this.find({ 
        price: { $gte: minPrice, $lte: maxPrice },
        isActive: true 
    });
};

laptopSchema.statics.searchLaptops = function(query) {
    return this.find({
        $text: { $search: query },
        isActive: true
    }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Laptop', laptopSchema);