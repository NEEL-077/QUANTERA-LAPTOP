const Laptop = require('../models/Laptop');
const Accessory = require('../models/Accessory');

/**
 * Senior Architect Search Engine
 * Features:
 * - In-memory pre-processed indexing
 * - Weighted relevance scoring
 * - Multi-stage matching (Exact > Prefix > Includes)
 * - Auto-refresh for Data Sync
 */
class SearchEngine {
    constructor() {
        this.index = [];
        this.isInitialized = false;
        this.refreshInterval = 15 * 60 * 1000; // 15 minutes
    }

    /**
     * Bootstraps the in-memory index
     */
    async initialize() {
        console.log('🚀 [SearchEngine] Initializing in-memory search index...');
        try {
            await this.refreshIndex();
            this.isInitialized = true;
            
            // Set periodic refresh
            setInterval(() => this.refreshIndex(), this.refreshInterval);
            console.log(`✅ [SearchEngine] Index built successfully with ${this.index.length} items.`);
        } catch (error) {
            console.error('❌ [SearchEngine] Initialization failed:', error);
        }
    }

    /**
     * Fetches and pre-processes all searchable products
     */
    async refreshIndex() {
        const [laptops, accessories] = await Promise.all([
            Laptop.find({ isActive: true }).lean(),
            Accessory.find({ isActive: true }).lean()
        ]);

        this.index = [
            ...laptops.map(p => this.normalizeProduct(p, 'laptop')),
            ...accessories.map(a => this.normalizeProduct(a, 'accessory'))
        ];
    }

    /**
     * Pre-processes product data for efficient single-pass scoring
     */
    normalizeProduct(p, type) {
        // Laptop specific nomenclature
        const title = type === 'laptop' 
            ? `${p.brand} ${p.series} ${p.modelNumber}`.trim()
            : p.name.trim();

        // Searchable strings (normalized)
        return {
            id: p._id,
            title: title,
            brand: (p.brand || '').toLowerCase(),
            category: (p.category || '').toLowerCase(),
            type: type,
            // Combined searchable blob for fallback
            searchBlob: `${title} ${p.brand || ''} ${p.category || ''} ${p.description || ''} ${p.tags ? p.tags.join(' ') : ''}`.toLowerCase(),
            // Display data
            display: {
                id: p._id,
                title: title,
                type: type,
                category: p.category,
                price: p.price,
                image: p.image,
                url: type === 'laptop' ? `product.html?id=${p._id}` : `accessory-product.html?id=${p._id}`
            }
        };
    }

    /**
     * Main Search Routine
     * @param {string} query 
     * @returns {Array} Ranked Results
     */
    search(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase().trim();

        const results = this.index
            .map(item => {
                const score = this.calculateScore(q, item);
                return { ...item.display, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);

        return results;
    }

    /**
     * Weighted Scoring Algorithm
     * Weights: Title (10) > Category (5) > General Blob (2)
     */
    calculateScore(query, item) {
        let score = 0;
        const normalizedTitle = item.title.toLowerCase();

        // 1. Title/Name Match (Weight: 10)
        if (normalizedTitle === query) {
            score += 20; // Perfect match bonus
        } else if (normalizedTitle.startsWith(query)) {
            score += 15; // Prefix match bonus
        } else if (normalizedTitle.includes(query)) {
            score += 10;
        }

        // 2. Category/Brand Match (Weight: 5)
        if (item.brand === query || item.category === query) {
            score += 10; // Exact brand/cat match
        } else if (item.brand.includes(query) || item.category.includes(query)) {
            score += 5;
        }

        // 3. Deep Match (Description/Tags) (Weight: 2)
        if (item.searchBlob.includes(query)) {
            score += 2;
        }

        return score;
    }
}

// Singleton instantiation
const searchEngineInstance = new SearchEngine();
module.exports = searchEngineInstance;
