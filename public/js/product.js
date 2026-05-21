// =====================================================
// PRODUCT DETAIL PAGE FUNCTIONALITY
// =====================================================

let currentProduct = null;
let allLaptops = [];
let currentImageIndex = 0;
let selectedRating = 0;

// Product customization state
let productConfiguration = {
    ram: null,
    storage: null,
    software: [],
    warranty: null
};

let customizationOptions = {
    ram: [],
    storage: [],
    software: [],
    warranty: []
};

let basePricing = {
    basePrice: 0,
    upgradesCost: 0,
    totalPrice: 0
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - initializing product page');

    // Check if required elements exist
    const requiredElements = [
        'loadingState', 'productContainer', 'breadcrumbBrand', 'breadcrumbModel',
        'productBrand', 'productTitle', 'currentPrice', 'mainImage', 'thumbnailContainer'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.warn('Missing required elements:', missingElements);
    }

    initializeProductPage();
    setupEventListeners();
    setupStickyActionBar();
});

// Initialize product page
async function initializeProductPage() {
    try {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        console.log('URL params:', window.location.search); // Debug log
        console.log('Product ID from URL:', productId); // Debug log

        if (!productId) {
            showError('Product ID not found in URL');
            return;
        }

        // Load product data
        await loadProductData(productId);

        // Load related products
        await loadAllLaptops();

        // Hide loading state and show product container
        const loadingState = document.getElementById('loadingState');
        const productContainer = document.getElementById('productContainer');

        if (loadingState) loadingState.style.display = 'none';
        if (productContainer) productContainer.style.display = 'block';

    } catch (error) {
        console.error('Error initializing product page:', error);
        showError('Failed to load product details: ' + error.message);
    }
}

// Load product data
async function loadProductData(productId) {
    try {
        console.log('Loading product with ID:', productId); // Debug log

        // Test if API is reachable
        console.log('Fetching from:', '/api/laptops?full=true');

        let laptops = [];

        try {
            const response = await fetch('/api/laptops?full=true&t=' + Date.now()); // Add cache-busting
            console.log('Response status:', response.status); // Debug log
            console.log('Response ok:', response.ok); // Debug log

            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }

            laptops = await response.json();
        } catch (apiError) {
            console.error('API failed, trying fallback:', apiError);

            // Fallback: try without full parameter
            try {
                const fallbackResponse = await fetch('/api/laptops');
                if (fallbackResponse.ok) {
                    laptops = await fallbackResponse.json();
                    console.log('Fallback API worked');
                } else {
                    throw new Error('Both API endpoints failed');
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                // Use hardcoded sample data as last resort
                laptops = createSampleLaptops();
                console.log('Using sample data as fallback');
            }
        }

        console.log('Loaded laptops count:', laptops.length); // Debug log
        console.log('First few laptop IDs:', laptops.slice(0, 5).map(l => l.id)); // Debug log

        currentProduct = laptops.find(laptop => laptop.id == productId);
        console.log('Found product:', currentProduct ? 'Yes' : 'No'); // Debug log

        if (!currentProduct) {
            console.log('Available laptop IDs:', laptops.map(l => l.id).slice(0, 20)); // Debug log
            throw new Error(`Product with ID ${productId} not found. Available IDs: ${laptops.slice(0, 10).map(l => l.id).join(', ')}`);
        }

        renderProductDetails();

    } catch (error) {
        console.error('Error loading product:', error);
        throw error;
    }
}

// Create sample laptops for fallback
function createSampleLaptops() {
    return [
        {
            id: 1,
            brand: "ASUS",
            series: "ROG Strix G16",
            modelNumber: "G614JV",
            price: 125000,
            discountPrice: 119000,
            stock: 15,
            category: "gaming",
            cpuBrand: "Intel",
            cpuModel: "i7-13650HX",
            cpuCores: 14,
            threads: 20,
            baseClock: 2.6,
            boostClock: 4.9,
            cache: 24,
            ramCapacity: 16,
            ramType: "DDR5",
            ramSpeed: 4800,
            ramSpeedUnit: "MHz",
            ramSlots: "2x SO-DIMM",
            maxRam: 32,
            storageCap: 512,
            storageType: "NVMe SSD",
            displaySize: 16,
            resolution: "1920x1200",
            aspectRatio: "16:10",
            panelType: "IPS",
            refreshRate: 165,
            brightness: 300,
            colorGamut: "100% sRGB",
            touchscreen: false,
            gpuType: "Dedicated",
            gpuModel: "RTX 4060",
            vram: 8,
            tgp: 140,
            muxSwitch: true,
            material: "Plastic",
            color: "Eclipse Gray",
            weight: 2.5,
            dimensions: "354x251x27mm",
            hinge: "180 Degree",
            milStd: false,
            wifi: "Wi-Fi 6E",
            bluetooth: "5.3",
            ports: "1x USB-C, 3x USB-A 3.2, 1x HDMI 2.1, 1x 3.5mm Audio",
            webcam: "720p HD",
            speakers: "2x 2W",
            keyboard: "4-Zone RGB",
            touchpad: "Multi-touch",
            battery: 90,
            adapter: 240,
            os: "Windows 11 Home",
            warranty: "2 Year International",
            description: "High-performance gaming laptop with RTX 4060 graphics and 165Hz display. Perfect for gaming, content creation, and professional work.",
            images: ["images/ASUS ROG STRIX G16.webp"]
        },
        {
            id: 2,
            brand: "Dell",
            series: "Alienware M16",
            modelNumber: "M16-R1",
            price: 195000,
            discountPrice: 185000,
            stock: 8,
            category: "gaming",
            cpuBrand: "Intel",
            cpuModel: "i9-13900HX",
            cpuCores: 24,
            threads: 32,
            baseClock: 2.2,
            boostClock: 5.4,
            cache: 36,
            ramCapacity: 32,
            ramType: "DDR5",
            ramSpeed: 4800,
            ramSpeedUnit: "MHz",
            ramSlots: "2x SO-DIMM",
            maxRam: 64,
            storageCap: 1024,
            storageType: "NVMe SSD",
            displaySize: 16,
            resolution: "2560x1600",
            aspectRatio: "16:10",
            panelType: "IPS",
            refreshRate: 240,
            brightness: 500,
            colorGamut: "100% DCI-P3",
            touchscreen: false,
            gpuType: "Dedicated",
            gpuModel: "RTX 4080",
            vram: 12,
            tgp: 175,
            muxSwitch: true,
            material: "Magnesium Alloy",
            color: "Dark Side of the Moon",
            weight: 3.11,
            dimensions: "366x274x25mm",
            hinge: "180 Degree",
            milStd: false,
            wifi: "Wi-Fi 6E",
            bluetooth: "5.3",
            ports: "2x USB-C Thunderbolt 4, 3x USB-A 3.2, 1x HDMI 2.1, 1x 3.5mm Audio",
            webcam: "1080p FHD",
            speakers: "4x 2W",
            keyboard: "Per-key RGB",
            touchpad: "Multi-touch",
            battery: 86,
            adapter: 330,
            os: "Windows 11 Pro",
            warranty: "3 Year Premium Support",
            description: "Ultimate gaming powerhouse with RTX 4080 graphics and 240Hz QHD display. Built for extreme gaming and professional content creation.",
            images: ["images/DELL ALIEANWARE.webp"]
        },
        {
            id: 3,
            brand: "HP",
            series: "ENVY x360",
            modelNumber: "15-fe0013dx",
            price: 89000,
            discountPrice: 82000,
            stock: 25,
            category: "ultrabook",
            cpuBrand: "Intel",
            cpuModel: "i5-1335U",
            cpuCores: 10,
            threads: 12,
            baseClock: 1.3,
            boostClock: 4.6,
            cache: 12,
            ramCapacity: 16,
            ramType: "DDR4",
            ramSpeed: 3200,
            ramSpeedUnit: "MHz",
            ramSlots: "Soldered",
            maxRam: 16,
            storageCap: 512,
            storageType: "NVMe SSD",
            displaySize: 15.6,
            resolution: "1920x1080",
            aspectRatio: "16:9",
            panelType: "IPS",
            refreshRate: 60,
            brightness: 250,
            colorGamut: "45% NTSC",
            touchscreen: true,
            gpuType: "Integrated",
            gpuModel: "Intel Iris Xe",
            vram: 0,
            tgp: 0,
            muxSwitch: false,
            material: "Aluminum",
            color: "Natural Silver",
            weight: 1.75,
            dimensions: "358x230x18mm",
            hinge: "360 Degree",
            milStd: false,
            wifi: "Wi-Fi 6",
            bluetooth: "5.2",
            ports: "2x USB-C, 2x USB-A 3.2, 1x HDMI 2.1, 1x 3.5mm Audio, 1x microSD",
            webcam: "1080p FHD",
            speakers: "2x 2W Bang & Olufsen",
            keyboard: "Backlit",
            touchpad: "Multi-touch",
            battery: 51,
            adapter: 65,
            os: "Windows 11 Home",
            warranty: "1 Year International",
            description: "Versatile 2-in-1 convertible laptop perfect for productivity, creativity, and entertainment. Features a 360-degree hinge and touchscreen display.",
            images: ["images/HP ENVY.webp"]
        }
    ];
}

// Load all laptops for recommendations
async function loadAllLaptops() {
    try {
        const response = await fetch('/api/laptops?full=true');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        allLaptops = await response.json();
        renderRecommendations();

    } catch (error) {
        console.error('Error loading laptops:', error);
    }
}

// Render product details
function renderProductDetails() {
    if (!currentProduct) return;

    // Helper function to safely update element content
    function safeUpdateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        } else {
            console.warn(`Element with ID '${id}' not found`);
        }
    }

    function safeUpdateHTML(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = content;
        } else {
            console.warn(`Element with ID '${id}' not found`);
        }
    }

    // Update breadcrumb
    safeUpdateElement('breadcrumbBrand', currentProduct.brand);
    safeUpdateElement('breadcrumbModel', currentProduct.series || currentProduct.modelNumber);

    // Update product header
    safeUpdateElement('productBrand', currentProduct.brand);
    safeUpdateElement('productTitle', `${currentProduct.brand} ${currentProduct.series || currentProduct.modelNumber}`);

    // Update pricing
    const currentPriceEl = document.getElementById('currentPrice');
    const originalPriceEl = document.getElementById('originalPrice');
    const discountBadgeEl = document.getElementById('discountBadge');

    if (currentPriceEl) {
        currentPriceEl.textContent = `₹${currentProduct.price.toLocaleString()}`;
    }

    if (currentProduct.discountPrice && currentProduct.discountPrice < currentProduct.price) {
        if (originalPriceEl) {
            originalPriceEl.textContent = `₹${currentProduct.price.toLocaleString()}`;
            originalPriceEl.style.display = 'inline';
        }
        if (currentPriceEl) {
            currentPriceEl.textContent = `₹${currentProduct.discountPrice.toLocaleString()}`;
        }

        if (discountBadgeEl) {
            const discount = Math.round(((currentProduct.price - currentProduct.discountPrice) / currentProduct.price) * 100);
            discountBadgeEl.textContent = `${discount}% OFF`;
            discountBadgeEl.style.display = 'inline';
        }
    }

    // Update availability
    const availabilityStatus = document.getElementById('availabilityStatus');
    if (availabilityStatus) {
        const stockStatus = availabilityStatus.querySelector('.stock-status');
        if (stockStatus) {
            if (currentProduct.stock > 0) {
                stockStatus.textContent = `✓ In Stock (${currentProduct.stock} available)`;
                stockStatus.className = 'stock-status in-stock';
            } else {
                stockStatus.textContent = '✗ Out of Stock';
                stockStatus.className = 'stock-status out-of-stock';
            }
        }
    }

    // Update images
    renderProductImages();

    // Update key features
    renderKeyFeatures();

    // Update specifications
    renderSpecifications();

    // Update description
    renderDescription();

    // Initialize product customization
    initializeCustomization();

    // Update warranty info
    safeUpdateElement('warrantyInfo', currentProduct.warranty || '1 Year International Warranty');

    // Update sticky price
    const stickyPrice = document.getElementById('stickyPrice');
    if (stickyPrice) {
        stickyPrice.textContent = `₹${(currentProduct.discountPrice || currentProduct.price).toLocaleString()}`;
    }

    // Load reviews after rendering product details
    loadReviews();
}

// Render product images
function renderProductImages() {
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.getElementById('thumbnailContainer');

    if (!mainImage || !thumbnailContainer) {
        console.warn('Image elements not found');
        return;
    }

    const brandImageMap = {
        'ASUS': 'images/ASUS ROG STRIX G16.webp',
        'Dell': 'images/DELL ALIEANWARE.webp',
        'HP': 'images/HP ENVY.webp',
        'Lenovo': 'images/MACBOOK PRO.jpg',
        'Acer': 'images/ACER HELIOS.jpg',
        'MSI': 'images/MSI RAIDER.jpg',
        'Apple': 'images/MACBOOK PRO.jpg',
        'Razer': 'images/ASUS ROG ZEPHYRUS.webp'
    };

    // Use brand-specific images or fallback to product images
    let productImages = [];

    if (currentProduct.images && currentProduct.images.length > 0) {
        productImages = currentProduct.images;
    } else if (brandImageMap[currentProduct.brand]) {
        // Create multiple views of the same product
        const baseImage = brandImageMap[currentProduct.brand];
        productImages = [baseImage, baseImage, baseImage, baseImage];
    } else {
        productImages = ['images/ASUS ROG STRIX G16.webp'];
    }

    // Set main image
    mainImage.src = productImages[0];
    mainImage.alt = `${currentProduct.brand} ${currentProduct.series || currentProduct.modelNumber}`;

    // Create thumbnails
    thumbnailContainer.innerHTML = productImages.map((image, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage(${index})">
            <img src="${image}" alt="Product view ${index + 1}">
        </div>
    `).join('');

    // Store images for reference
    window.productImages = productImages;
}

// Change main image
function changeMainImage(index) {
    if (!window.productImages) return;

    const mainImage = document.getElementById('mainImage');
    mainImage.src = window.productImages[index];

    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });

    currentImageIndex = index;
}

// Render key features
function renderKeyFeatures() {
    const featuresContainer = document.querySelector('.features-list');
    if (!featuresContainer) {
        console.warn('Features container not found');
        return;
    }

    const features = [
        `${currentProduct.cpuBrand || 'Intel'} ${currentProduct.cpuModel || 'Processor'}`,
        `${currentProduct.ramCapacity || '8'}GB ${currentProduct.ramType || 'RAM'}`,
        `${currentProduct.storageCap || '256'}GB ${currentProduct.storageType || 'SSD'} Storage`,
        `${currentProduct.displaySize || '15'}" ${currentProduct.resolution || 'Full HD'} Display`,
        `${currentProduct.gpuModel || currentProduct.gpuType || 'Graphics'}`,
        `${currentProduct.os || 'Windows 11'} Operating System`
    ];

    featuresContainer.innerHTML = features.map(feature => `<li>${feature}</li>`).join('');
}

// Render specifications
function renderSpecifications() {
    const specsGrid = document.getElementById('specsGrid');
    if (!specsGrid) {
        console.warn('Specs grid not found');
        return;
    }

    const specifications = {
        'Processor': {
            'Brand': currentProduct.cpuBrand || 'N/A',
            'Model': currentProduct.cpuModel || 'N/A',
            'Cores': currentProduct.cpuCores || 'N/A',
            'Threads': currentProduct.threads || 'N/A',
            'Base Clock': currentProduct.baseClock ? `${currentProduct.baseClock} GHz` : 'N/A',
            'Boost Clock': currentProduct.boostClock ? `${currentProduct.boostClock} GHz` : 'N/A',
            'Cache': currentProduct.cache ? `${currentProduct.cache} MB` : 'N/A'
        },
        'Memory & Storage': {
            'RAM': `${currentProduct.ramCapacity || 'N/A'}GB ${currentProduct.ramType || ''}`,
            'RAM Speed': currentProduct.ramSpeed ? `${currentProduct.ramSpeed} ${currentProduct.ramSpeedUnit || 'MHz'}` : 'N/A',
            'Storage': `${currentProduct.storageCap || 'N/A'}GB ${currentProduct.storageType || ''}`,
            'Max RAM': currentProduct.maxRam ? `${currentProduct.maxRam}GB` : 'N/A',
            'RAM Slots': currentProduct.ramSlots || 'N/A',
            'Extra Slots': currentProduct.extraSlots || 'N/A'
        },
        'Display': {
            'Size': currentProduct.displaySize ? `${currentProduct.displaySize}"` : 'N/A',
            'Resolution': currentProduct.resolution || 'N/A',
            'Aspect Ratio': currentProduct.aspectRatio || 'N/A',
            'Panel Type': currentProduct.panelType || 'N/A',
            'Refresh Rate': currentProduct.refreshRate ? `${currentProduct.refreshRate}Hz` : 'N/A',
            'Brightness': currentProduct.brightness ? `${currentProduct.brightness} nits` : 'N/A',
            'Color Gamut': currentProduct.colorGamut || 'N/A',
            'Touchscreen': currentProduct.touchscreen ? 'Yes' : 'No'
        },
        'Graphics': {
            'Type': currentProduct.gpuType || 'N/A',
            'Model': currentProduct.gpuModel || 'N/A',
            'VRAM': currentProduct.vram ? `${currentProduct.vram}GB` : 'Shared',
            'TGP': currentProduct.tgp ? `${currentProduct.tgp}W` : 'N/A',
            'MUX Switch': currentProduct.muxSwitch ? 'Yes' : 'No'
        },
        'Design & Build': {
            'Material': currentProduct.material || 'N/A',
            'Color': currentProduct.color || 'N/A',
            'Weight': currentProduct.weight ? `${currentProduct.weight} kg` : 'N/A',
            'Dimensions': currentProduct.dimensions || 'N/A',
            'Hinge': currentProduct.hinge || 'N/A',
            'MIL-STD': currentProduct.milStd ? 'Yes' : 'No'
        },
        'Connectivity': {
            'WiFi': currentProduct.wifi || 'N/A',
            'Bluetooth': currentProduct.bluetooth || 'N/A',
            'Ports': currentProduct.ports || 'N/A',
            'Webcam': currentProduct.webcam || 'N/A',
            'Speakers': currentProduct.speakers || 'N/A'
        },
        'Input & Power': {
            'Keyboard': currentProduct.keyboard || 'N/A',
            'Touchpad': currentProduct.touchpad || 'N/A',
            'Battery': currentProduct.battery ? `${currentProduct.battery}Wh` : 'N/A',
            'Adapter': currentProduct.adapter ? `${currentProduct.adapter}W` : 'N/A',
            'Operating System': currentProduct.os || 'N/A',
            'Warranty': currentProduct.warranty || 'N/A'
        }
    };

    specsGrid.innerHTML = Object.entries(specifications).map(([category, specs]) => `
        <div class="spec-category">
            <h4>${category}</h4>
            ${Object.entries(specs).map(([label, value]) => `
                <div class="spec-item">
                    <span class="spec-label">${label}</span>
                    <span class="spec-value">${value || 'N/A'}</span>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// Render description — supports Q:/A: Q&A format
function renderDescription() {
    const descriptionContent = document.getElementById('descriptionContent');
    if (!descriptionContent) {
        console.warn('Description content not found');
        return;
    }

    const rawDesc = currentProduct.description || '';

    // Detect Q&A format: lines starting with "Q:" or "A:"
    const lines = rawDesc.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const hasQA = lines.some(l => /^Q:/i.test(l) || /^A:/i.test(l));

    if (hasQA) {
        // Parse into Q&A pairs
        const pairs = [];
        let currentQ = null;
        lines.forEach(line => {
            if (/^Q:/i.test(line)) {
                if (currentQ) pairs.push(currentQ);
                currentQ = { q: line.replace(/^Q:\s*/i, ''), a: '' };
            } else if (/^A:/i.test(line) && currentQ) {
                currentQ.a = line.replace(/^A:\s*/i, '');
            } else if (currentQ && currentQ.a === '') {
                // continuation of question
                currentQ.q += ' ' + line;
            } else if (currentQ) {
                // continuation of answer
                currentQ.a += ' ' + line;
            }
        });
        if (currentQ) pairs.push(currentQ);

        descriptionContent.innerHTML = `
            <div class="qa-container">
                ${pairs.map((pair, i) => `
                    <div class="qa-item" onclick="this.classList.toggle('qa-open')">
                        <div class="qa-question">
                            <span class="qa-icon">Q</span>
                            <span class="qa-q-text">${pair.q}</span>
                            <span class="qa-chevron">▾</span>
                        </div>
                        <div class="qa-answer">
                            <span class="qa-icon qa-icon-a">A</span>
                            <span class="qa-a-text">${pair.a || '—'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <style>
                .qa-container { display: flex; flex-direction: column; gap: 12px; }
                .qa-item {
                    border: 1px solid rgba(212,175,55,0.25);
                    border-radius: 12px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: border-color 0.25s, box-shadow 0.25s;
                    background: rgba(255,255,255,0.03);
                }
                .qa-item:hover { border-color: rgba(212,175,55,0.55); box-shadow: 0 4px 20px rgba(212,175,55,0.12); }
                .qa-item.qa-open { border-color: rgba(212,175,55,0.6); }
                .qa-question {
                    display: flex; align-items: center; gap: 12px;
                    padding: 16px 18px;
                    font-weight: 600; font-size: 0.95rem; color: #fff;
                }
                .qa-answer {
                    display: none; align-items: flex-start; gap: 12px;
                    padding: 0 18px 16px;
                    font-size: 0.9rem; color: rgba(255,255,255,0.75);
                    border-top: 1px solid rgba(255,255,255,0.07);
                    padding-top: 14px;
                }
                .qa-item.qa-open .qa-answer { display: flex; }
                .qa-icon {
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 28px; height: 28px; border-radius: 50%;
                    font-size: 0.78rem; font-weight: 800; flex-shrink: 0;
                    background: linear-gradient(135deg, #d4af37, #c8961e);
                    color: #0a0a0a;
                }
                .qa-icon-a {
                    background: rgba(212,175,55,0.15);
                    color: #d4af37;
                    border: 1px solid rgba(212,175,55,0.35);
                }
                .qa-chevron { margin-left: auto; font-size: 1.1rem; color: #d4af37; transition: transform 0.25s; }
                .qa-item.qa-open .qa-chevron { transform: rotate(180deg); }
                .qa-q-text { flex: 1; }
                .qa-a-text { flex: 1; line-height: 1.6; }
            </style>
        `;
        return;
    }

    // Fallback: plain text or HTML description
    const description = rawDesc || `
        <h3>About this laptop</h3>
        <p>The ${currentProduct.brand} ${currentProduct.series || currentProduct.modelNumber} is designed for ${currentProduct.category || 'professional'} users who demand exceptional performance and reliability.</p>
        <h3>Performance</h3>
        <p>Powered by the ${currentProduct.cpuBrand || 'Intel'} ${currentProduct.cpuModel || 'processor'} and ${currentProduct.gpuModel || 'integrated graphics'}. ${currentProduct.ramCapacity || '8'}GB ${currentProduct.ramType || 'RAM'} with ${currentProduct.storageCap || '256'}GB ${currentProduct.storageType || 'SSD'}.</p>
        <h3>Display & Design</h3>
        <p>${currentProduct.displaySize || '15'}\" ${currentProduct.resolution || 'Full HD'} ${currentProduct.panelType || ''} display. ${currentProduct.material || 'Premium'} build in ${currentProduct.color || 'sleek'} finish.</p>
        <h3>Connectivity</h3>
        <p>${currentProduct.wifi || 'Wi-Fi'} • ${currentProduct.bluetooth || 'Bluetooth'} • ${currentProduct.ports || 'Multiple ports'}</p>
    `;
    descriptionContent.innerHTML = description;
}

// Render recommendations
function renderRecommendations() {
    if (!allLaptops.length || !currentProduct) return;

    // Related products (same brand)
    const relatedProducts = allLaptops
        .filter(laptop => laptop.brand === currentProduct.brand && laptop.id !== currentProduct.id)
        .slice(0, 4);

    renderProductCarousel('relatedProducts', relatedProducts);

    // Also viewed (similar price range)
    const priceRange = currentProduct.price * 0.3;
    const alsoViewed = allLaptops
        .filter(laptop =>
            laptop.id !== currentProduct.id &&
            Math.abs(laptop.price - currentProduct.price) <= priceRange
        )
        .slice(0, 4);

    renderProductCarousel('alsoViewed', alsoViewed);
}

// Render product carousel
function renderProductCarousel(containerId, products) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.warn(`Container with ID '${containerId}' not found`);
        return;
    }

    const brandImageMap = {
        'ASUS': 'images/ASUS ROG STRIX G16.webp',
        'Dell': 'images/DELL ALIEANWARE.webp',
        'HP': 'images/HP ENVY.webp',
        'Lenovo': 'images/MACBOOK PRO.jpg',
        'Acer': 'images/ACER HELIOS.jpg',
        'MSI': 'images/MSI RAIDER.jpg',
        'Apple': 'images/MACBOOK PRO.jpg',
        'Razer': 'images/ASUS ROG ZEPHYRUS.webp'
    };

    container.innerHTML = products.map(product => {
        const image = brandImageMap[product.brand] || 'images/ASUS ROG STRIX G16.webp';
        const price = product.discountPrice || product.price;

        return `
            <div class="recommendation-card" onclick="goToProduct(${product.id})">
                <div class="recommendation-image">
                    <img src="${image}" alt="${product.brand} ${product.series}">
                </div>
                <div class="recommendation-info">
                    <h4>${product.brand} ${product.series || product.modelNumber}</h4>
                    <div class="recommendation-price">₹${price.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Navigate to product
function goToProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Action buttons - with null checks
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');

    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
    if (buyNowBtn) buyNowBtn.addEventListener('click', buyNow);
    if (wishlistBtn) wishlistBtn.addEventListener('click', toggleWishlist);

    // Sticky action buttons - with null checks
    const stickyCart = document.querySelector('.sticky-cart');
    const stickyBuy = document.querySelector('.sticky-buy');

    if (stickyCart) stickyCart.addEventListener('click', addToCart);
    if (stickyBuy) stickyBuy.addEventListener('click', buyNow);

    // Review modal - with null checks
    const writeReviewBtn = document.getElementById('writeReviewBtn');
    const closeBtn = document.getElementById('closeReviewModal');
    const cancelBtn = document.getElementById('cancelReview');
    const reviewForm = document.getElementById('reviewForm');
    const reviewModal = document.getElementById('reviewModal');
    const starRating = document.getElementById('starRating');

    if (writeReviewBtn) writeReviewBtn.addEventListener('click', openReviewModal);
    if (closeBtn) closeBtn.addEventListener('click', closeReviewModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeReviewModal);
    if (reviewForm) reviewForm.addEventListener('submit', submitReview);

    // Star rating - with null checks
    if (starRating) {
        starRating.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => setRating(parseInt(star.dataset.rating)));
            star.addEventListener('mouseenter', () => highlightStars(parseInt(star.dataset.rating)));
        });

        starRating.addEventListener('mouseleave', () => highlightStars(selectedRating));
    }

    // Close modal on overlay click - with null check
    if (reviewModal) {
        reviewModal.addEventListener('click', (e) => {
            if (e.target.id === 'reviewModal') closeReviewModal();
        });
    }
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Setup sticky action bar
function setupStickyActionBar() {
    const stickyBar = document.getElementById('stickyActionBar');
    const productDetails = document.querySelector('.product-details');

    if (!stickyBar || !productDetails) {
        console.warn('Sticky action bar elements not found');
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (window.innerWidth <= 768) {
                stickyBar.style.display = entry.isIntersecting ? 'none' : 'flex';
            } else {
                stickyBar.style.display = 'none';
            }
        });
    });

    observer.observe(productDetails);
}

// Add to cart
function addToCart() {
    if (!currentProduct) return;

    // Get current configuration
    const config = getCurrentConfiguration();

    // Get existing cart or create new one
    let cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');

    // Create cart item with configuration
    const cartItem = {
        id: currentProduct.id,
        brand: currentProduct.brand,
        series: currentProduct.series || currentProduct.modelNumber,
        price: config.pricing.totalPrice,
        originalPrice: config.pricing.basePrice,
        image: getProductImage(),
        quantity: 1,
        configuration: {
            ram: config.configuration.ram,
            storage: config.configuration.storage,
            software: config.configuration.software,
            warranty: config.configuration.warranty
        },
        upgrades: config.pricing.upgradesCost
    };

    // Check if same configuration already exists in cart
    const existingItemIndex = cart.findIndex(item =>
        item.id === currentProduct.id &&
        JSON.stringify(item.configuration) === JSON.stringify(cartItem.configuration)
    );

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }

    localStorage.setItem('quantera_cart', JSON.stringify(cart));

    // Show success message with configuration details
    const configSummary = [
        config.configuration.ram?.title,
        config.configuration.storage?.title,
        config.configuration.software.length > 0 ? `${config.configuration.software.length} software items` : null,
        config.configuration.warranty?.title
    ].filter(Boolean).join(', ');

    showNotification(`Added to cart: ${currentProduct.brand} ${currentProduct.series} (${configSummary})`, 'success');

    // Update cart count if exists
    updateCartCount();
}

// Buy now
function buyNow() {
    addToCart();
    // Redirect to checkout or cart page
    window.location.href = 'cart.html';
}

// Toggle wishlist
function toggleWishlist() {
    if (!currentProduct) return;

    let wishlist = JSON.parse(localStorage.getItem('quantera_wishlist') || '[]');
    const existingIndex = wishlist.findIndex(item => item.id === currentProduct.id);

    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        showNotification('Removed from wishlist', 'info');
        document.getElementById('wishlistBtn').innerHTML = '<span class="btn-icon">♡</span> Add to Wishlist';
    } else {
        wishlist.push({
            id: currentProduct.id,
            brand: currentProduct.brand,
            series: currentProduct.series || currentProduct.modelNumber,
            price: currentProduct.discountPrice || currentProduct.price,
            image: getProductImage()
        });
        showNotification('Added to wishlist!', 'success');
        document.getElementById('wishlistBtn').innerHTML = '<span class="btn-icon">♥</span> In Wishlist';
    }

    localStorage.setItem('quantera_wishlist', JSON.stringify(wishlist));
}

// Get product image
function getProductImage() {
    const brandImageMap = {
        'ASUS': 'images/ASUS ROG STRIX G16.webp',
        'Dell': 'images/DELL ALIEANWARE.webp',
        'HP': 'images/HP ENVY.webp',
        'Lenovo': 'images/MACBOOK PRO.jpg',
        'Acer': 'images/ACER HELIOS.jpg',
        'MSI': 'images/MSI RAIDER.jpg',
        'Apple': 'images/MACBOOK PRO.jpg',
        'Razer': 'images/ASUS ROG ZEPHYRUS.webp'
    };

    return brandImageMap[currentProduct.brand] || 'images/ASUS ROG STRIX G16.webp';
}

// Review modal functions
function openReviewModal() {
    document.getElementById('reviewModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    resetReviewForm();
}

function resetReviewForm() {
    document.getElementById('reviewForm').reset();
    selectedRating = 0;
    highlightStars(0);
}

function setRating(rating) {
    selectedRating = rating;
    highlightStars(rating);
}

function highlightStars(rating) {
    document.querySelectorAll('#starRating .star').forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

function submitReview(e) {
    e.preventDefault();

    if (selectedRating === 0) {
        showNotification('Please select a rating', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const reviewData = {
        productId: currentProduct.id,
        rating: selectedRating,
        title: document.getElementById('reviewTitle').value,
        text: document.getElementById('reviewText').value,
        reviewerName: document.getElementById('reviewerName').value,
        date: new Date().toISOString()
    };

    // Save review (in real app, send to server)
    let reviews = JSON.parse(localStorage.getItem('quantera_reviews') || '[]');
    reviews.push(reviewData);
    localStorage.setItem('quantera_reviews', JSON.stringify(reviews));

    showNotification('Review submitted successfully!', 'success');
    closeReviewModal();

    // Refresh reviews section
    loadReviews();
}

// Load and display reviews
function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem('quantera_reviews') || '[]');
    const productReviews = reviews.filter(review => review.productId === currentProduct.id);

    const reviewsList = document.getElementById('reviewsList');

    if (!reviewsList) {
        console.warn('Reviews list element not found');
        return;
    }

    if (productReviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">No reviews yet. Be the first to review this product!</p>';
        return;
    }

    reviewsList.innerHTML = productReviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-info">
                    <h5>${review.reviewerName}</h5>
                    <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                </div>
                <div class="review-rating">
                    ${Array.from({ length: 5 }, (_, i) => `
                        <span class="star ${i < review.rating ? 'filled' : ''}">★</span>
                    `).join('')}
                </div>
            </div>
            <div class="review-title">${review.title}</div>
            <div class="review-text">${review.text}</div>
        </div>
    `).join('');
}

// =====================================================
// PRODUCT CUSTOMIZATION SYSTEM
// =====================================================

// Initialize product customization
function initializeCustomization() {
    if (!currentProduct) return;

    // Set up customization options based on product
    setupCustomizationOptions();

    // Set default configuration
    setDefaultConfiguration();

    // Render customization UI
    renderCustomizationOptions();

    // Update pricing
    updatePricing();
}

// Setup available customization options
function setupCustomizationOptions() {
    // RAM Options
    customizationOptions.ram = [
        {
            id: 'ram-8gb',
            capacity: 8,
            type: currentProduct.ramType || 'DDR4',
            title: '8GB RAM',
            description: `8GB ${currentProduct.ramType || 'DDR4'}`,
            price: 0,
            available: true
        },
        {
            id: 'ram-16gb',
            capacity: 16,
            type: currentProduct.ramType || 'DDR4',
            title: '16GB RAM',
            description: `16GB ${currentProduct.ramType || 'DDR4'}`,
            price: 8000,
            available: true
        },
        {
            id: 'ram-32gb',
            capacity: 32,
            type: currentProduct.ramType || 'DDR4',
            title: '32GB RAM',
            description: `32GB ${currentProduct.ramType || 'DDR4'}`,
            price: 18000,
            available: currentProduct.maxRam >= 32
        },
        {
            id: 'ram-64gb',
            capacity: 64,
            type: currentProduct.ramType || 'DDR4',
            title: '64GB RAM',
            description: `64GB ${currentProduct.ramType || 'DDR4'}`,
            price: 35000,
            available: currentProduct.maxRam >= 64
        }
    ];

    // Storage Options
    customizationOptions.storage = [
        {
            id: 'storage-256gb',
            capacity: 256,
            type: 'NVMe SSD',
            title: '256GB SSD',
            description: '256GB NVMe SSD',
            price: 0,
            available: true
        },
        {
            id: 'storage-512gb',
            capacity: 512,
            type: 'NVMe SSD',
            title: '512GB SSD',
            description: '512GB NVMe SSD',
            price: 5000,
            available: true
        },
        {
            id: 'storage-1tb',
            capacity: 1024,
            type: 'NVMe SSD',
            title: '1TB SSD',
            description: '1TB NVMe SSD',
            price: 12000,
            available: true
        },
        {
            id: 'storage-2tb',
            capacity: 2048,
            type: 'NVMe SSD',
            title: '2TB SSD',
            description: '2TB NVMe SSD',
            price: 25000,
            available: true
        }
    ];

    // Software Options
    customizationOptions.software = [
        {
            id: 'office-2024',
            title: 'Microsoft Office 2024',
            description: 'Word, Excel, PowerPoint, Outlook',
            price: 8999,
            available: true
        },
        {
            id: 'antivirus-premium',
            title: 'Norton 360 Premium',
            description: '1-year subscription with VPN',
            price: 3999,
            available: true
        },
        {
            id: 'adobe-creative',
            title: 'Adobe Creative Suite',
            description: '1-year subscription (Photoshop, Illustrator)',
            price: 15999,
            available: true
        },
        {
            id: 'gaming-bundle',
            title: 'Gaming Software Bundle',
            description: 'Steam, Discord, OBS Studio',
            price: 0,
            available: currentProduct.category === 'gaming'
        }
    ];

    // Warranty Options
    customizationOptions.warranty = [
        {
            id: 'warranty-1year',
            duration: 1,
            title: '1 Year Standard',
            description: 'Standard manufacturer warranty',
            price: 0,
            available: true
        },
        {
            id: 'warranty-2year',
            duration: 2,
            title: '2 Year Extended',
            description: 'Extended warranty with priority support',
            price: 4999,
            available: true
        },
        {
            id: 'warranty-3year',
            duration: 3,
            title: '3 Year Premium',
            description: 'Premium warranty with on-site service',
            price: 9999,
            available: true
        },
        {
            id: 'warranty-accidental',
            duration: 2,
            title: '2 Year + Accidental',
            description: 'Extended warranty with accidental damage protection',
            price: 12999,
            available: true
        }
    ];
}

// Set default configuration based on current product
function setDefaultConfiguration() {
    // Set default RAM (closest to current product)
    const currentRam = currentProduct.ramCapacity || 8;
    productConfiguration.ram = customizationOptions.ram.find(option =>
        option.capacity === currentRam && option.available
    ) || customizationOptions.ram.find(option => option.available);

    // Set default storage (closest to current product)
    const currentStorage = currentProduct.storageCap || 256;
    productConfiguration.storage = customizationOptions.storage.find(option =>
        option.capacity === currentStorage && option.available
    ) || customizationOptions.storage.find(option => option.available);

    // No software selected by default
    productConfiguration.software = [];

    // Default warranty
    productConfiguration.warranty = customizationOptions.warranty.find(option =>
        option.duration === 1 && option.available
    );

    // Set base price
    basePricing.basePrice = currentProduct.discountPrice || currentProduct.price;
}

// Render customization options
function renderCustomizationOptions() {
    renderRamOptions();
    renderStorageOptions();
    renderSoftwareOptions();
    renderWarrantyOptions();
    updateConfigurationSummary();
}

// Helper to dynamically calculate and format differences in price tiers
function formatOptionDelta(optionPrice, currentSelectionPrice) {
    if (typeof currentSelectionPrice !== 'number') {
        return optionPrice === 0 ? 'Included' : `+₹${optionPrice.toLocaleString()}`;
    }
    const delta = optionPrice - currentSelectionPrice;
    if (delta > 0) return `+₹${delta.toLocaleString()}`;
    if (delta < 0) return `-₹${Math.abs(delta).toLocaleString()}`;
    return 'Included';
}

// Helper to determine styling class for price display based on delta
function getDeltaClass(optionPrice, currentSelectionPrice) {
    if (typeof currentSelectionPrice !== 'number') return optionPrice === 0 ? 'included' : 'upgrade';
    return optionPrice === currentSelectionPrice ? 'included' : 'upgrade';
}

// Render RAM options
function renderRamOptions() {
    const container = document.getElementById('ramOptions');
    if (!container) return;

    container.innerHTML = customizationOptions.ram.map(option => `
        <div class="option-card ${!option.available ? 'disabled' : ''} ${productConfiguration.ram?.id === option.id ? 'selected' : ''}" 
             data-option-type="ram" 
             data-option-id="${option.id}"
             ${option.available ? `onclick="selectOption('ram', '${option.id}')"` : ''}>
            <div class="option-title">${option.title}</div>
            <div class="option-description">${option.description}</div>
            <div class="option-price ${getDeltaClass(option.price, productConfiguration.ram?.price)}">
                ${formatOptionDelta(option.price, productConfiguration.ram?.price)}
            </div>
        </div>
    `).join('');
}

// Render storage options
function renderStorageOptions() {
    const container = document.getElementById('storageOptions');
    if (!container) return;

    container.innerHTML = customizationOptions.storage.map(option => `
        <div class="option-card ${!option.available ? 'disabled' : ''} ${productConfiguration.storage?.id === option.id ? 'selected' : ''}" 
             data-option-type="storage" 
             data-option-id="${option.id}"
             ${option.available ? `onclick="selectOption('storage', '${option.id}')"` : ''}>
            <div class="option-title">${option.title}</div>
            <div class="option-description">${option.description}</div>
            <div class="option-price ${getDeltaClass(option.price, productConfiguration.storage?.price)}">
                ${formatOptionDelta(option.price, productConfiguration.storage?.price)}
            </div>
        </div>
    `).join('');
}

// Render software options
function renderSoftwareOptions() {
    const container = document.getElementById('softwareOptions');
    if (!container) return;

    container.innerHTML = customizationOptions.software.map(option => `
        <div class="option-card ${!option.available ? 'disabled' : ''} ${productConfiguration.software.some(s => s.id === option.id) ? 'selected' : ''}" 
             data-option-type="software" 
             data-option-id="${option.id}"
             ${option.available ? `onclick="toggleSoftwareOption('${option.id}')"` : ''}>
            <div class="option-title">${option.title}</div>
            <div class="option-description">${option.description}</div>
            <div class="option-price ${option.price === 0 ? 'included' : 'upgrade'}">
                ${option.price === 0 ? 'Free' : `+₹${option.price.toLocaleString()}`}
            </div>
        </div>
    `).join('');
}

// Render warranty options
function renderWarrantyOptions() {
    const container = document.getElementById('warrantyOptions');
    if (!container) return;

    container.innerHTML = customizationOptions.warranty.map(option => `
        <div class="option-card ${!option.available ? 'disabled' : ''} ${productConfiguration.warranty?.id === option.id ? 'selected' : ''}" 
             data-option-type="warranty" 
             data-option-id="${option.id}"
             ${option.available ? `onclick="selectOption('warranty', '${option.id}')"` : ''}>
            <div class="option-title">${option.title}</div>
            <div class="option-description">${option.description}</div>
            <div class="option-price ${getDeltaClass(option.price, productConfiguration.warranty?.price)}">
                ${formatOptionDelta(option.price, productConfiguration.warranty?.price)}
            </div>
        </div>
    `).join('');
}

// Select an option (for single-select options like RAM, storage, warranty)
function selectOption(type, optionId) {
    const option = customizationOptions[type].find(opt => opt.id === optionId);
    if (!option || !option.available) return;

    productConfiguration[type] = option;

    // Update UI
    updateOptionSelection(type, optionId);
    updateConfigurationSummary();
    updatePricing();
}

// Toggle software option (for multi-select)
function toggleSoftwareOption(optionId) {
    const option = customizationOptions.software.find(opt => opt.id === optionId);
    if (!option || !option.available) return;

    const existingIndex = productConfiguration.software.findIndex(s => s.id === optionId);

    if (existingIndex > -1) {
        // Remove if already selected
        productConfiguration.software.splice(existingIndex, 1);
    } else {
        // Add if not selected
        productConfiguration.software.push(option);
    }

    // Update UI
    updateSoftwareSelection();
    updateConfigurationSummary();
    updatePricing();
}

// Update option selection UI
function updateOptionSelection(type, selectedId) {
    if (type === 'ram') renderRamOptions();
    if (type === 'storage') renderStorageOptions();
    if (type === 'warranty') renderWarrantyOptions();
}

// Update software selection UI
function updateSoftwareSelection() {
    const container = document.getElementById('softwareOptions');
    if (!container) return;

    container.querySelectorAll('.option-card').forEach(card => {
        const optionId = card.dataset.optionId;
        const isSelected = productConfiguration.software.some(s => s.id === optionId);
        card.classList.toggle('selected', isSelected);
    });
}

// Update configuration summary
function updateConfigurationSummary() {
    const container = document.getElementById('configDetails');
    if (!container) return;

    const configItems = [];

    if (productConfiguration.ram) {
        configItems.push({
            label: 'Memory (RAM)',
            value: productConfiguration.ram.title
        });
    }

    if (productConfiguration.storage) {
        configItems.push({
            label: 'Storage',
            value: productConfiguration.storage.title
        });
    }

    if (productConfiguration.software.length > 0) {
        configItems.push({
            label: 'Software',
            value: productConfiguration.software.map(s => s.title).join(', ')
        });
    }

    if (productConfiguration.warranty) {
        configItems.push({
            label: 'Warranty',
            value: productConfiguration.warranty.title
        });
    }

    container.innerHTML = configItems.map(item => `
        <div class="config-item">
            <span class="config-label">${item.label}:</span>
            <span class="config-value">${item.value}</span>
        </div>
    `).join('');
}

// Update pricing
// Calculate pricing locally to natively support dynamic database products
async function updatePricing() {
    try {
        if (!currentProduct) return;

        let totalUpgradesCost = 0;
        
        // Use the actual listed price as the base for calculations
        const listingPrice = currentProduct.discountPrice || currentProduct.price || 0;
        
        // Find default spec prices based on what the laptop actually comes with
        const defaultRam = customizationOptions.ram.find(o => o.capacity === (currentProduct.ramCapacity || 8)) || customizationOptions.ram[0];
        const defaultStorage = customizationOptions.storage.find(o => o.capacity === (currentProduct.storageCap || 256)) || customizationOptions.storage[0];
        const defaultWarranty = customizationOptions.warranty.find(o => o.duration === 1) || customizationOptions.warranty[0];
        
        const defaultRamPrice = defaultRam ? (defaultRam.price || 0) : 0;
        const defaultStoragePrice = defaultStorage ? (defaultStorage.price || 0) : 0;
        const defaultWarrantyPrice = defaultWarranty ? (defaultWarranty.price || 0) : 0;

        // Calculate deltas relative to the shipping configuration
        if (productConfiguration.ram) {
            totalUpgradesCost += (productConfiguration.ram.price - defaultRamPrice);
        }
        if (productConfiguration.storage) {
            totalUpgradesCost += (productConfiguration.storage.price - defaultStoragePrice);
        }
        if (productConfiguration.warranty) {
            totalUpgradesCost += (productConfiguration.warranty.price - defaultWarrantyPrice);
        }
        
        // Add software additions
        if (productConfiguration.software && productConfiguration.software.length) {
            productConfiguration.software.forEach(software => {
                totalUpgradesCost += (software.price || 0);
            });
        }
        
        basePricing.basePrice = listingPrice;
        basePricing.upgradesCost = totalUpgradesCost;
        basePricing.totalPrice = listingPrice + totalUpgradesCost;

        updatePricingDisplay();

    } catch (error) {
        console.error("Critical: Local pricing calculation failed:", error);
        // Safety fallback to listed price
        const fallbackPrice = currentProduct ? (currentProduct.discountPrice || currentProduct.price) : 0;
        basePricing.basePrice = fallbackPrice;
        basePricing.upgradesCost = 0;
        basePricing.totalPrice = fallbackPrice;
        updatePricingDisplay();
    }
}

// Update pricing display
function updatePricingDisplay() {
    const basePriceEl = document.getElementById('basePrice');
    const upgradesCostEl = document.getElementById('upgradesCost');
    const totalPriceEl = document.getElementById('totalPrice');
    const currentPriceEl = document.getElementById('currentPrice');
    const stickyPriceEl = document.getElementById('stickyPrice');

    if (basePriceEl) {
        basePriceEl.textContent = `₹${basePricing.basePrice.toLocaleString()}`;
    }

    if (upgradesCostEl) {
        if (basePricing.upgradesCost > 0) {
            upgradesCostEl.textContent = `+₹${basePricing.upgradesCost.toLocaleString()}`;
            upgradesCostEl.style.color = '#00ff7f'; // Green for upgrades
        } else if (basePricing.upgradesCost < 0) {
            upgradesCostEl.textContent = `-₹${Math.abs(basePricing.upgradesCost).toLocaleString()}`;
            upgradesCostEl.style.color = '#ff4444'; // Red for savings
        } else {
            upgradesCostEl.textContent = '₹0';
            upgradesCostEl.style.color = '';
        }
    }

    if (totalPriceEl) {
        totalPriceEl.textContent = `₹${basePricing.totalPrice.toLocaleString()}`;
        totalPriceEl.classList.add('price-update');
        setTimeout(() => totalPriceEl.classList.remove('price-update'), 600);
    }

    // Update main price display
    if (currentPriceEl) {
        currentPriceEl.textContent = `₹${basePricing.totalPrice.toLocaleString()}`;
    }

    // Update sticky price
    if (stickyPriceEl) {
        stickyPriceEl.textContent = `₹${basePricing.totalPrice.toLocaleString()}`;
    }
}

// Get current configuration for cart/purchase
function getCurrentConfiguration() {
    return {
        product: currentProduct,
        configuration: productConfiguration,
        pricing: basePricing
    };
}

// Make customization functions globally available
window.selectOption = selectOption;
window.toggleSoftwareOption = toggleSoftwareOption;

// Smart back navigation function
window.smartBackNavigation = function (targetPage) {
    if (window.navigationStateManager) {
        window.navigationStateManager.navigateBack(targetPage);
    } else {
        window.location.href = `${targetPage}.html`;
    }
};

// Utility functions
// Utility functions
function showNotification(message, type = 'info') {
    if (window.QuanteraUI && window.QuanteraUI.showAlert) {
        window.QuanteraUI.showAlert({
            title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Heads up!',
            description: message,
            variant: type,
            duration: 4000
        });
    } else {
        // Fallback to basic console if UI utils not yet loaded
        console.log(`[${type}] ${message}`);
    }
}


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update cart count in navbar if exists
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }

    // Dispatch event for navbar to update
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

function showError(message) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.innerHTML = `
            <div style="text-align: center; color: #ff4757;">
                <h2>Error</h2>
                <p>${message}</p>
                <a href="laptops.html" style="color: var(--accent-color);">← Back to Laptops</a>
            </div>
        `;
    } else {
        // Fallback: create error message in body
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; color: #ff4757; font-family: Inter, sans-serif;">
                <div>
                    <h2>Error</h2>
                    <p>${message}</p>
                    <a href="laptops.html" style="color: #00d4ff; text-decoration: none;">← Back to Laptops</a>
                </div>
            </div>
        `;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);