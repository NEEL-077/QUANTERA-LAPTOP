/**
 * Universal Configuration Pricing Engine
 * 
 * Provides a scalable, robust backend system for dynamically calculating 
 * configuration upgrade/downgrade deltas and total prices across multiple 
 * configurable products.
 */

// Universal Registry Data Structure
// In a fully scaled app, this will be fetched from MongoDB.
// For now, it serves as the in-memory master configuration schema.
const productsConfigRegistry = {
    // Example Universal ID structure. Normally Maps to a MongoDB UUID or slug.
    "laptop-q1": {
        basePrice: 119900,
        attributes: {
            ram: [
                { id: "8gb", label: "8GB", price: 0 },
                { id: "16gb", label: "16GB", price: 8000 },
                { id: "24gb", label: "24GB", price: 16000 },
                { id: "32gb", label: "32GB", price: 18000 },
                { id: "36gb", label: "36GB", price: 32000 },
                { id: "64gb", label: "64GB", price: 35000 }
            ],
            storage: [
                { id: "256gb", label: "256GB SSD", price: 0 },
                { id: "512gb", label: "512GB SSD", price: 5000 },
                { id: "1tb", label: "1TB SSD", price: 12000 },
                { id: "2tb", label: "2TB SSD", price: 25000 }
            ],
            processor: [
                { id: "m2", label: "M2 Chip", price: 0 },
                { id: "m3", label: "M3 Chip", price: 15000 },
                { id: "m3-pro", label: "M3 Pro", price: 40000 },
                { id: "m3-ultra", label: "M3 Ultra", price: 80000 }
            ]
        }
    }
    // other products like generic laptops, headphones, etc. can be dynamically added here.
};

/**
 * Format a number to Indian Rupees (₹) string.
 */
const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

/**
 * Retrieves the specific absolute price of a given option.
 */
const getOptionPrice = (productId, attributeName, optionId) => {
    const productConfig = productsConfigRegistry[productId];
    if (!productConfig) {
        throw new Error(`Product ID '${productId}' not found in registry.`);
    }

    const attributeArr = productConfig.attributes[attributeName];
    if (!attributeArr) {
        throw new Error(`Attribute '${attributeName}' not found for product '${productId}'.`);
    }

    const option = attributeArr.find(opt => opt.id === optionId);
    if (!option) {
        throw new Error(`Option '${optionId}' not found in attribute '${attributeName}'.`);
    }

    return option.price;
};

/**
 * calculatePriceDelta
 * 
 * Calculates the exact dynamic cost difference between a current selection and a target selection.
 * Returns both the numerical delta and a string-formatted display delta (e.g., "+₹8,000", "-₹10,000").
 *
 * @param {string} productId - the product ID
 * @param {string} attributeName - the attribute being configured (e.g. "ram")
 * @param {string} currentOptionId - the ID of the currently selected option
 * @param {string} newOptionId - the ID of the target option
 * @returns {Object} { deltaValue: Number, formattedDelta: String }
 */
const calculatePriceDelta = (productId, attributeName, currentOptionId, newOptionId) => {
    try {
        const currentPrice = getOptionPrice(productId, attributeName, currentOptionId);
        const newPrice = getOptionPrice(productId, attributeName, newOptionId);

        const deltaValue = newPrice - currentPrice;

        let formattedDelta;
        if (deltaValue > 0) {
            formattedDelta = `+${formatPrice(deltaValue)}`;
        } else if (deltaValue < 0) {
            formattedDelta = `-${formatPrice(Math.abs(deltaValue))}`;
        } else {
            formattedDelta = `₹0`;
        }

        return { deltaValue, formattedDelta, currency: "INR" };

    } catch (e) {
        throw e;
    }
};

/**
 * calculateTotalConfigurationPrice
 * 
 * Iterates through a complete selected state map of attributes and their choices,
 * summing the absolute costs against the product's base price.
 * 
 * @param {string} productId 
 * @param {Object} selectedOptions - e.g., { ram: "32gb", storage: "1tb" }
 * @returns {Object} { total: Number, basePrice: Number, upgrades: Number, breakdown: Object, gstBreakdown: Object }
 */
const calculateTotalConfigurationPrice = (productId, selectedOptions) => {
    const productConfig = productsConfigRegistry[productId];
    if (!productConfig) {
        throw new Error(`Product ID '${productId}' not found in registry.`);
    }

    const basePrice = productConfig.basePrice;
    let totalUpgradesCost = 0;
    let breakdown = {};

    for (const [attributeName, optionId] of Object.entries(selectedOptions)) {
        try {
            const cost = getOptionPrice(productId, attributeName, optionId);
            totalUpgradesCost += cost;
            breakdown[attributeName] = cost;
        } catch (e) {
            // Ignore missing options in iteration, or log them
            console.warn(`Warn: ${e.message}`);
        }
    }

    const total = basePrice + totalUpgradesCost;
    const gstData = extractGST(total, 18);

    return {
        finalPrice: total,
        configurationBreakdown: breakdown, // The RAM/Storage cost breakdown
        breakdown: {
            basePrice: gstData.basePrice,
            gst: gstData.gstAmount,
            gstRate: gstData.gstRate
        },
        formattedTotal: formatPrice(total)
    };
};

/**
 * extractGST
 * 
 * Computes the internal base price and GST component from a fully GST-inclusive final price.
 * Calculates accurately to 2 decimal places to ensure exact accounting bounds.
 * 
 * @param {Number} inclusivePrice 
 * @param {Number} gstRate - percentage (e.g., 18 for 18%, or 0.18)
 * @returns {Object} { basePrice, gstAmount, gstRate }
 */
const extractGST = (inclusivePrice, gstRate = 18) => {
    // Standardize rate to decimal if passed as integer
    const decimalRate = gstRate > 1 ? gstRate / 100 : gstRate;
    
    // Formula: Base = Inclusive / (1 + Rate)
    const rawBasePrice = inclusivePrice / (1 + decimalRate);
    
    // Round to 2 decimal places carefully
    const basePrice = Math.round(rawBasePrice * 100) / 100;
    
    // Formula: GST = Inclusive - Base (Ensures total matches exactly)
    const gstAmount = Math.round((inclusivePrice - basePrice) * 100) / 100;
    
    return {
        basePrice,
        gstAmount,
        gstRate: decimalRate * 100 // return as integer percentage like 18
    };
};

/**
 * calculateCartSummary
 * 
 * Aggregates a list of cart items and computes the overall financial breakdown.
 * 
 * @param {Array} items - List of cart items with { price, quantity }
 * @param {Number} shippingThreshold - Amount after which shipping is free
 * @returns {Object} { subtotal, shipping, tax, total, itemCount }
 */
const calculateCartSummary = (items, shippingThreshold = 50000) => {
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const grossTotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    
    const shipping = grossTotal > shippingThreshold || grossTotal === 0 ? 0 : 500;
    const gstData = extractGST(grossTotal, 18);
    
    return {
        itemCount,
        subtotal: gstData.basePrice, // Net price before tax
        shipping,
        tax: gstData.gstAmount,      // GST component
        total: grossTotal + shipping, // Final customer payment
        grossTotal                   // Items total (inclusive)
    };
};

module.exports = {
    productsConfigRegistry,
    calculatePriceDelta,
    calculateTotalConfigurationPrice,
    extractGST,
    calculateCartSummary,
    formatPrice
};
