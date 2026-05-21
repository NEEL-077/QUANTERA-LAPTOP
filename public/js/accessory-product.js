// =====================================================
// ACCESSORY PRODUCT DETAIL PAGE FUNCTIONALITY
// =====================================================

let currentAccessory = null;
let allAccessories = [];
let currentImageIndex = 0;
let selectedRating = 0;

// Accessory customization state
let accessoryConfiguration = {
    quantity: 1,
    color: null,
    warranty: null,
    bundles: []
};

let customizationOptions = {
    colors: [],
    warranty: [],
    bundles: []
};

let basePricing = {
    basePrice: 0,
    quantity: 1,
    upgradesCost: 0,
    totalPrice: 0
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - initializing accessory page');
    
    // Check if required elements exist
    const requiredElements = [
        'loadingState', 'productContainer', 'breadcrumbBrand', 'breadcrumbModel',
        'productBrand', 'productTitle', 'currentPrice', 'mainImage', 'thumbnailContainer'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.warn('Missing required elements:', missingElements);
    }
    
    initializeAccessoryPage();
    setupEventListeners();
    setupStickyActionBar();
});

// Initialize accessory page
async function initializeAccessoryPage() {
    try {
        // Get accessory ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessoryId = urlParams.get('id');
        
        console.log('URL params:', window.location.search);
        console.log('Accessory ID from URL:', accessoryId);
        
        if (!accessoryId) {
            showError('Accessory ID not found in URL');
            return;
        }

        // Load accessory data
        await loadAccessoryData(accessoryId);
        
        // Load related accessories
        await loadAllAccessories();
        
        // Hide loading state and show product container
        const loadingState = document.getElementById('loadingState');
        const productContainer = document.getElementById('productContainer');
        
        if (loadingState) loadingState.style.display = 'none';
        if (productContainer) productContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Error initializing accessory page:', error);
        showError('Failed to load accessory details: ' + error.message);
    }
}
// Load accessory data
async function loadAccessoryData(accessoryId) {
    try {
        console.log('Loading accessory with ID:', accessoryId);
        
        let accessories = [];
        
        try {
            const response = await fetch('/api/accessories?t=' + Date.now());
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            accessories = await response.json();
        } catch (apiError) {
            console.error('API failed, trying fallback:', apiError);
            // Use sample data as fallback
            accessories = createSampleAccessories();
            console.log('Using sample data as fallback');
        }
        
        console.log('Loaded accessories count:', accessories.length);
        
        currentAccessory = accessories.find(accessory => (accessory._id || accessory.id) == accessoryId);
        console.log('Found accessory:', currentAccessory ? 'Yes' : 'No');
        
        if (!currentAccessory) {
            console.log('Available accessory IDs:', accessories.map(a => a._id || a.id).slice(0, 20));
            throw new Error(`Accessory with ID ${accessoryId} not found. Available IDs: ${accessories.slice(0, 10).map(a => a._id || a.id).join(', ')}`);
        }
        
        renderAccessoryDetails();
        
    } catch (error) {
        console.error('Error loading accessory:', error);
        throw error;
    }
}

// Create sample accessories for fallback
function createSampleAccessories() {
    return [
        {
            id: 1,
            name: "Baseus Connect USB-C Cable",
            type: "Cable",
            brand: "Baseus",
            model: "Connect",
            price: 6200,
            discountPrice: 5500,
            stock: 73,
            connectivity: "USB-A to USB-C",
            features: ["Durable", "Power Delivery", "Fast Charging", "Data Transfer"],
            specifications: {
                length: "1m",
                dataRate: "USB 3.2",
                powerDelivery: "100W",
                material: "Braided Nylon"
            },
            description: "Reliable connectivity solution for all your data transfer and charging needs. Features durable construction with power delivery support.",
            warranty: "2 Years",
            images: [
                "https://source.unsplash.com/800x600/?cable,usb",
                "https://source.unsplash.com/800x600/?technology,cable",
                "https://source.unsplash.com/800x600/?computer,accessory"
            ],
            category: "Connectivity",
            rating: 4.2,
            reviews: 146,
            colors: ["Black", "White", "Blue"],
            compatibility: ["MacBook", "Dell XPS", "HP Laptops", "Gaming Laptops"]
        },
        {
            id: 2,
            name: "Dell Facecam 4K Webcam",
            type: "Webcam",
            brand: "Dell",
            model: "Facecam",
            price: 15700,
            discountPrice: 14444,
            stock: 90,
            connectivity: "USB-A",
            features: ["Privacy Shutter", "Auto Focus", "Low Light", "4K Recording"],
            specifications: {
                resolution: "4K UHD",
                frameRate: "30fps",
                fieldOfView: "90°",
                microphone: "Built-in Stereo"
            },
            description: "Professional 4K webcam with advanced features for video conferencing and content creation.",
            warranty: "3 Years",
            images: [
                "https://source.unsplash.com/800x600/?webcam,camera",
                "https://source.unsplash.com/800x600/?video,conference",
                "https://source.unsplash.com/800x600/?technology,camera"
            ],
            category: "Video",
            rating: 4.5,
            reviews: 89,
            colors: ["Black"],
            compatibility: ["Windows 10/11", "macOS", "Linux", "Chrome OS"]
        },
        {
            id: 3,
            name: "Logitech MX Master 3S Mouse",
            type: "Mouse",
            brand: "Logitech",
            model: "MX Master 3S",
            price: 8999,
            discountPrice: 7999,
            stock: 45,
            connectivity: "Wireless",
            features: ["Ergonomic", "Multi-device", "Precision Scroll", "Customizable"],
            specifications: {
                sensor: "Darkfield 8000 DPI",
                battery: "70 days",
                connectivity: "Bluetooth/USB Receiver",
                buttons: "7 programmable"
            },
            description: "Advanced wireless mouse designed for productivity and precision work.",
            warranty: "2 Years",
            images: [
                "https://source.unsplash.com/800x600/?mouse,computer",
                "https://source.unsplash.com/800x600/?wireless,mouse",
                "https://source.unsplash.com/800x600/?office,mouse"
            ],
            category: "Input",
            rating: 4.7,
            reviews: 234,
            colors: ["Graphite", "Pale Gray"],
            compatibility: ["Windows", "macOS", "Linux", "iPadOS"]
        }
    ];
}

// Load all accessories for recommendations
async function loadAllAccessories() {
    try {
        const response = await fetch('/api/accessories');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        allAccessories = await response.json();
        renderRecommendations();
        
    } catch (error) {
        console.error('Error loading accessories:', error);
        allAccessories = createSampleAccessories();
        renderRecommendations();
    }
}

// Render accessory details
function renderAccessoryDetails() {
    if (!currentAccessory) return;
    
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
    safeUpdateElement('breadcrumbBrand', currentAccessory.brand);
    safeUpdateElement('breadcrumbModel', currentAccessory.model || currentAccessory.name);
    
    // Update product header
    safeUpdateElement('productBrand', currentAccessory.brand);
    safeUpdateElement('productTitle', currentAccessory.name);
    
    // Update rating
    if (currentAccessory.rating && currentAccessory.reviews) {
        safeUpdateElement('ratingText', `${currentAccessory.rating} out of 5 (${currentAccessory.reviews} reviews)`);
        safeUpdateElement('overallRating', currentAccessory.rating);
        safeUpdateElement('reviewCount', `Based on ${currentAccessory.reviews} reviews`);
        
        // Update stars
        updateStarRating('productStars', currentAccessory.rating);
        updateStarRating('overallStars', currentAccessory.rating);
    }
    
    // Update pricing
    const currentPriceEl = document.getElementById('currentPrice');
    const originalPriceEl = document.getElementById('originalPrice');
    const discountBadgeEl = document.getElementById('discountBadge');
    
    if (currentPriceEl) {
        currentPriceEl.textContent = `₹${currentAccessory.price.toLocaleString()}`;
    }
    
    if (currentAccessory.discountPrice && currentAccessory.discountPrice < currentAccessory.price) {
        if (originalPriceEl) {
            originalPriceEl.textContent = `₹${currentAccessory.price.toLocaleString()}`;
            originalPriceEl.style.display = 'inline';
        }
        if (currentPriceEl) {
            currentPriceEl.textContent = `₹${currentAccessory.discountPrice.toLocaleString()}`;
        }
        
        if (discountBadgeEl) {
            const discount = Math.round(((currentAccessory.price - currentAccessory.discountPrice) / currentAccessory.price) * 100);
            discountBadgeEl.textContent = `${discount}% OFF`;
            discountBadgeEl.style.display = 'inline';
        }
    }
    
    // Update availability
    const availabilityStatus = document.getElementById('availabilityStatus');
    if (availabilityStatus) {
        const stockStatus = availabilityStatus.querySelector('.stock-status');
        if (stockStatus) {
            if (currentAccessory.stock > 0) {
                stockStatus.textContent = `✓ In Stock (${currentAccessory.stock} available)`;
                stockStatus.className = 'stock-status in-stock';
            } else {
                stockStatus.textContent = '✗ Out of Stock';
                stockStatus.className = 'stock-status out-of-stock';
            }
        }
    }
    
    // Update images
    renderAccessoryImages();
    
    // Update key features
    renderKeyFeatures();
    
    // Initialize customization
    initializeCustomization();
    
    // Update specifications
    renderSpecifications();
    
    // Update description
    renderDescription();
    
    // Update compatibility
    renderCompatibility();
    
    // Update warranty info
    safeUpdateElement('warrantyInfo', currentAccessory.warranty || '1 Year Warranty');
    
    // Load reviews
    loadReviews();
}
// Render accessory images
function renderAccessoryImages() {
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    
    if (!mainImage || !thumbnailContainer) {
        console.warn('Image elements not found');
        return;
    }
    
    // Use accessory images or fallback
    let accessoryImages = [];
    
    if (currentAccessory.images && currentAccessory.images.length > 0) {
        accessoryImages = currentAccessory.images;
    } else if (currentAccessory.image) {
        accessoryImages = [currentAccessory.image];
    } else {
        // Fallback images based on type
        const fallbackImages = {
            'Cable': 'https://source.unsplash.com/800x600/?cable,usb',
            'Webcam': 'https://source.unsplash.com/800x600/?webcam,camera',
            'Mouse': 'https://source.unsplash.com/800x600/?mouse,computer',
            'Keyboard': 'https://source.unsplash.com/800x600/?keyboard,computer',
            'Headphones': 'https://source.unsplash.com/800x600/?headphones,audio',
            'Speaker': 'https://source.unsplash.com/800x600/?speaker,audio'
        };
        
        const fallbackImage = fallbackImages[currentAccessory.type] || 'https://source.unsplash.com/800x600/?computer,accessory';
        accessoryImages = [fallbackImage, fallbackImage, fallbackImage];
    }
    
    // Set main image
    mainImage.src = accessoryImages[0];
    mainImage.alt = currentAccessory.name;
    
    // Create thumbnails
    thumbnailContainer.innerHTML = accessoryImages.map((image, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage(${index})">
            <img src="${image}" alt="Product view ${index + 1}">
        </div>
    `).join('');
    
    // Store images for reference
    window.accessoryImages = accessoryImages;
}

// Change main image
function changeMainImage(index) {
    if (!window.accessoryImages) return;
    
    const mainImage = document.getElementById('mainImage');
    mainImage.src = window.accessoryImages[index];
    
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
    
    const features = currentAccessory.features || [
        `${currentAccessory.type} by ${currentAccessory.brand}`,
        currentAccessory.connectivity || 'Universal Connectivity',
        currentAccessory.warranty || '1 Year Warranty',
        'High Quality Construction'
    ];
    
    featuresContainer.innerHTML = features.map(feature => `<li>${feature}</li>`).join('');
}

// Initialize customization
function initializeCustomization() {
    if (!currentAccessory) return;
    
    setupCustomizationOptions();
    setDefaultConfiguration();
    renderCustomizationOptions();
    updatePricing();
}

// Setup customization options
function setupCustomizationOptions() {
    // Color options
    if (currentAccessory.colors && currentAccessory.colors.length > 0) {
        customizationOptions.colors = currentAccessory.colors.map((color, index) => ({
            id: `color-${index}`,
            name: color,
            available: true
        }));
        
        // Show color section
        const colorSection = document.getElementById('colorSection');
        if (colorSection) colorSection.style.display = 'block';
    }
    
    // Warranty options
    customizationOptions.warranty = [
        {
            id: 'warranty-standard',
            duration: 1,
            title: 'Standard Warranty',
            description: currentAccessory.warranty || '1 Year Warranty',
            price: 0,
            available: true
        },
        {
            id: 'warranty-extended',
            duration: 2,
            title: 'Extended Warranty',
            description: '2 Year Extended Protection',
            price: Math.round(currentAccessory.price * 0.15),
            available: true
        },
        {
            id: 'warranty-premium',
            duration: 3,
            title: 'Premium Protection',
            description: '3 Year Premium with Accidental Damage',
            price: Math.round(currentAccessory.price * 0.25),
            available: true
        }
    ];
    
    // Bundle options based on accessory type
    const bundleMap = {
        'Cable': [
            { name: 'Cable Management Kit', price: 999, description: 'Organizers and clips' },
            { name: 'Multi-Port Hub', price: 2999, description: 'USB-C hub with multiple ports' }
        ],
        'Webcam': [
            { name: 'Lighting Kit', price: 1999, description: 'Ring light for better video' },
            { name: 'Privacy Cover Set', price: 299, description: 'Webcam privacy covers' }
        ],
        'Mouse': [
            { name: 'Mouse Pad Pro', price: 799, description: 'Premium gaming mouse pad' },
            { name: 'Wrist Rest', price: 599, description: 'Ergonomic wrist support' }
        ]
    };
    
    const bundles = bundleMap[currentAccessory.type] || [
        { name: 'Cleaning Kit', price: 499, description: 'Professional cleaning supplies' }
    ];
    
    customizationOptions.bundles = bundles.map((bundle, index) => ({
        id: `bundle-${index}`,
        title: bundle.name,
        description: bundle.description,
        price: bundle.price,
        available: true
    }));
}

// Set default configuration
function setDefaultConfiguration() {
    accessoryConfiguration.quantity = 1;
    
    // Default color
    if (customizationOptions.colors.length > 0) {
        accessoryConfiguration.color = customizationOptions.colors[0];
    }
    
    // Default warranty
    accessoryConfiguration.warranty = customizationOptions.warranty.find(w => w.duration === 1);
    
    // No bundles by default
    accessoryConfiguration.bundles = [];
    
    // Set base price
    basePricing.basePrice = currentAccessory.discountPrice || currentAccessory.price;
    basePricing.quantity = 1;
}

// Render customization options
function renderCustomizationOptions() {
    renderColorOptions();
    renderWarrantyOptions();
    renderBundleOptions();
    setupQuantityControls();
    updateConfigurationSummary();
}

// Render color options
function renderColorOptions() {
    const container = document.getElementById('colorOptions');
    if (!container || customizationOptions.colors.length === 0) return;
    
    const colorMap = {
        'Black': '#000000',
        'White': '#FFFFFF',
        'Gray': '#808080',
        'Blue': '#0066CC',
        'Red': '#CC0000',
        'Green': '#00CC00',
        'Silver': '#C0C0C0',
        'Gold': '#FFD700',
        'Rose Gold': '#E8B4B8',
        'Space Gray': '#4A4A4A',
        'Graphite': '#2C2C2C',
        'Pale Gray': '#D3D3D3'
    };
    
    container.innerHTML = customizationOptions.colors.map(color => `
        <div class="color-option ${accessoryConfiguration.color?.id === color.id ? 'selected' : ''}" 
             style="background-color: ${colorMap[color.name] || '#666666'}"
             onclick="selectColor('${color.id}')"
             title="${color.name}">
        </div>
    `).join('');
}

// Render warranty options
function renderWarrantyOptions() {
    const container = document.getElementById('warrantyOptions');
    if (!container) return;

    container.innerHTML = customizationOptions.warranty.map(option => `
        <div class="option-card ${accessoryConfiguration.warranty?.id === option.id ? 'selected' : ''}" 
             onclick="selectWarranty('${option.id}')">
            <div class="option-title">${option.title}</div>
            <div class="option-description">${option.description}</div>
            <div class="option-price ${option.price === 0 ? 'included' : 'upgrade'}">
                ${option.price === 0 ? 'Included' : `+₹${option.price.toLocaleString()}`}
            </div>
        </div>
    `).join('');
}

// Render bundle options
function renderBundleOptions() {
    const container = document.getElementById('bundleOptions');
    if (!container) return;

    container.innerHTML = customizationOptions.bundles.map(option => `
        <div class="option-card ${accessoryConfiguration.bundles.some(b => b.id === option.id) ? 'selected' : ''}" 
             onclick="toggleBundle('${option.id}')">
            <div class="option-title">${option.title}</div>
            <div class="option-description">${option.description}</div>
            <div class="option-price upgrade">+₹${option.price.toLocaleString()}</div>
            <div class="bundle-savings">Save 15% in bundle!</div>
        </div>
    `).join('');
}

// Setup quantity controls
function setupQuantityControls() {
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const quantityInput = document.getElementById('quantityInput');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            const newQty = Math.max(1, accessoryConfiguration.quantity - 1);
            updateQuantity(newQty);
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            const newQty = Math.min(10, accessoryConfiguration.quantity + 1);
            updateQuantity(newQty);
        });
    }
    
    if (quantityInput) {
        quantityInput.addEventListener('change', (e) => {
            const newQty = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
            updateQuantity(newQty);
        });
    }
}

// Update quantity
function updateQuantity(newQuantity) {
    accessoryConfiguration.quantity = newQuantity;
    basePricing.quantity = newQuantity;
    
    const quantityInput = document.getElementById('quantityInput');
    if (quantityInput) quantityInput.value = newQuantity;
    
    // Update button states
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    
    if (decreaseBtn) decreaseBtn.disabled = newQuantity <= 1;
    if (increaseBtn) increaseBtn.disabled = newQuantity >= 10;
    
    updateConfigurationSummary();
    updatePricing();
}
// Selection functions
function selectColor(colorId) {
    const color = customizationOptions.colors.find(c => c.id === colorId);
    if (!color) return;
    
    accessoryConfiguration.color = color;
    renderColorOptions();
    updateConfigurationSummary();
}

function selectWarranty(warrantyId) {
    const warranty = customizationOptions.warranty.find(w => w.id === warrantyId);
    if (!warranty) return;
    
    accessoryConfiguration.warranty = warranty;
    renderWarrantyOptions();
    updateConfigurationSummary();
    updatePricing();
}

function toggleBundle(bundleId) {
    const bundle = customizationOptions.bundles.find(b => b.id === bundleId);
    if (!bundle) return;
    
    const existingIndex = accessoryConfiguration.bundles.findIndex(b => b.id === bundleId);
    
    if (existingIndex > -1) {
        accessoryConfiguration.bundles.splice(existingIndex, 1);
    } else {
        accessoryConfiguration.bundles.push(bundle);
    }
    
    renderBundleOptions();
    updateConfigurationSummary();
    updatePricing();
}

// Update configuration summary
function updateConfigurationSummary() {
    const container = document.getElementById('configDetails');
    if (!container) return;

    const configItems = [];
    
    configItems.push({
        label: 'Product',
        value: currentAccessory.name
    });
    
    configItems.push({
        label: 'Quantity',
        value: `${accessoryConfiguration.quantity} ${accessoryConfiguration.quantity > 1 ? 'pieces' : 'piece'}`
    });
    
    if (accessoryConfiguration.color) {
        configItems.push({
            label: 'Color',
            value: accessoryConfiguration.color.name
        });
    }
    
    if (accessoryConfiguration.warranty) {
        configItems.push({
            label: 'Warranty',
            value: accessoryConfiguration.warranty.title
        });
    }
    
    if (accessoryConfiguration.bundles.length > 0) {
        configItems.push({
            label: 'Add-ons',
            value: accessoryConfiguration.bundles.map(b => b.title).join(', ')
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
function updatePricing() {
    let upgradesCost = 0;
    
    // Calculate warranty cost
    if (accessoryConfiguration.warranty) {
        upgradesCost += accessoryConfiguration.warranty.price;
    }
    
    // Calculate bundle cost (with 15% discount)
    accessoryConfiguration.bundles.forEach(bundle => {
        upgradesCost += Math.round(bundle.price * 0.85); // 15% discount
    });
    
    basePricing.upgradesCost = upgradesCost;
    basePricing.totalPrice = (basePricing.basePrice + upgradesCost) * basePricing.quantity;
    
    updatePricingDisplay();
}

// Update pricing display
function updatePricingDisplay() {
    const basePriceEl = document.getElementById('basePrice');
    const quantityDisplayEl = document.getElementById('quantityDisplay');
    const upgradesCostEl = document.getElementById('upgradesCost');
    const totalPriceEl = document.getElementById('totalPrice');
    const currentPriceEl = document.getElementById('currentPrice');
    const stickyPriceEl = document.getElementById('stickyPrice');
    
    if (basePriceEl) {
        basePriceEl.textContent = `₹${basePricing.basePrice.toLocaleString()}`;
    }
    
    if (quantityDisplayEl) {
        quantityDisplayEl.textContent = `${basePricing.quantity}x`;
    }
    
    if (upgradesCostEl) {
        upgradesCostEl.textContent = basePricing.upgradesCost > 0 ? 
            `+₹${basePricing.upgradesCost.toLocaleString()}` : '₹0';
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

// Render specifications
function renderSpecifications() {
    const specsGrid = document.getElementById('specsGrid');
    if (!specsGrid) return;
    
    const specifications = {
        'General': {
            'Brand': currentAccessory.brand || 'N/A',
            'Model': currentAccessory.model || 'N/A',
            'Type': currentAccessory.type || 'N/A',
            'Category': currentAccessory.category || 'N/A'
        },
        'Technical': currentAccessory.specifications || {
            'Connectivity': currentAccessory.connectivity || 'N/A',
            'Warranty': currentAccessory.warranty || 'N/A'
        },
        'Physical': {
            'Colors Available': currentAccessory.colors ? currentAccessory.colors.join(', ') : 'Standard',
            'In Stock': currentAccessory.stock || 'Available'
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

// Render description
function renderDescription() {
    const descriptionContent = document.getElementById('descriptionContent');
    if (!descriptionContent) return;
    
    const description = currentAccessory.description || `
        <h3>About this ${currentAccessory.type}</h3>
        <p>The ${currentAccessory.name} by ${currentAccessory.brand} is designed for users who demand quality and reliability. This ${currentAccessory.type.toLowerCase()} combines advanced features with premium build quality.</p>
        
        <h3>Key Features</h3>
        <ul>
            ${(currentAccessory.features || ['High Quality', 'Reliable Performance', 'Easy to Use']).map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        
        <h3>Compatibility</h3>
        <p>Compatible with ${(currentAccessory.compatibility || ['Most devices']).join(', ')}. Perfect for both professional and personal use.</p>
    `;
    
    descriptionContent.innerHTML = description;
}

// Render compatibility
function renderCompatibility() {
    const compatibilityContent = document.getElementById('compatibilityContent');
    if (!compatibilityContent) return;
    
    const compatibility = currentAccessory.compatibility || ['Windows', 'macOS', 'Linux'];
    
    const compatibilityCategories = {
        'Operating Systems': compatibility.filter(item => 
            ['Windows', 'macOS', 'Linux', 'Chrome OS', 'Android', 'iOS'].some(os => item.includes(os))
        ),
        'Device Types': compatibility.filter(item => 
            ['Laptop', 'Desktop', 'MacBook', 'Gaming', 'Ultrabook'].some(type => item.includes(type))
        ),
        'Brands': compatibility.filter(item => 
            ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Apple'].some(brand => item.includes(brand))
        )
    };
    
    compatibilityContent.innerHTML = `
        <div class="compatibility-grid">
            ${Object.entries(compatibilityCategories).map(([category, items]) => 
                items.length > 0 ? `
                    <div class="compatibility-category">
                        <h4>${category}</h4>
                        <ul class="compatibility-list">
                            ${items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''
            ).join('')}
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
            <h4 style="color: var(--accent-color); margin-bottom: 8px;">Universal Compatibility</h4>
            <p style="color: rgba(255, 255, 255, 0.8); margin: 0;">This ${currentAccessory.type.toLowerCase()} is designed to work with most modern devices. If you have specific compatibility questions, please contact our support team.</p>
        </div>
    `;
}

// Update star rating display
function updateStarRating(containerId, rating) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.toggle('filled', index < Math.floor(rating));
    });
}

// Render recommendations
function renderRecommendations() {
    if (!allAccessories.length || !currentAccessory) return;
    
    // Related accessories (same category)
    const relatedAccessories = allAccessories
        .filter(acc => acc.category === currentAccessory.category && (acc._id || acc.id) !== (currentAccessory._id || currentAccessory.id))
        .slice(0, 4);
    
    renderAccessoryCarousel('relatedProducts', relatedAccessories);
    
    // Frequently bought together (same brand or complementary types)
    const frequentlyBought = allAccessories
        .filter(acc => 
            (acc.brand === currentAccessory.brand || isComplementaryType(acc.type, currentAccessory.type)) && 
            (acc._id || acc.id) !== (currentAccessory._id || currentAccessory.id)
        )
        .slice(0, 4);
    
    renderAccessoryCarousel('frequentlyBought', frequentlyBought);
    
    // Also viewed (random selection)
    const alsoViewed = allAccessories
        .filter(acc => (acc._id || acc.id) !== (currentAccessory._id || currentAccessory.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
    
    renderAccessoryCarousel('alsoViewed', alsoViewed);
}

// Check if accessory types are complementary
function isComplementaryType(type1, type2) {
    const complementaryPairs = [
        ['Mouse', 'Keyboard'],
        ['Webcam', 'Microphone'],
        ['Cable', 'Hub'],
        ['Headphones', 'Microphone']
    ];
    
    return complementaryPairs.some(pair => 
        (pair.includes(type1) && pair.includes(type2)) && type1 !== type2
    );
}

// Render accessory carousel
function renderAccessoryCarousel(containerId, accessories) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = accessories.map(accessory => {
        const price = accessory.discountPrice || accessory.price;
        const image = accessory.image || accessory.images?.[0] || 'https://source.unsplash.com/400x300/?computer,accessory';
        
        return `
            <div class="recommendation-card" onclick="goToAccessory('${accessory._id || accessory.id}')">
                <div class="recommendation-image">
                    <img src="${image}" alt="${accessory.name}">
                </div>
                <div class="recommendation-info">
                    <h4>${accessory.name}</h4>
                    <div class="recommendation-price">₹${price.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Navigate to accessory
function goToAccessory(accessoryId) {
    window.location.href = `accessory-product.html?id=${accessoryId}`;
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
    if (!currentAccessory) return;
    
    // Get current configuration
    const config = getCurrentConfiguration();
    
    // Get existing cart or create new one
    let cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');
    
    // Create cart item with configuration
    const cartItem = {
        id: currentAccessory._id || currentAccessory.id,
        name: currentAccessory.name,
        brand: currentAccessory.brand,
        type: currentAccessory.type,
        price: config.pricing.totalPrice,
        originalPrice: config.pricing.basePrice,
        image: getAccessoryImage(),
        quantity: config.configuration.quantity,
        configuration: {
            color: config.configuration.color,
            warranty: config.configuration.warranty,
            bundles: config.configuration.bundles
        },
        upgrades: config.pricing.upgradesCost,
        isAccessory: true
    };
    
    // Check if same configuration already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        (item.id === (currentAccessory._id || currentAccessory.id)) && 
        item.isAccessory &&
        JSON.stringify(item.configuration) === JSON.stringify(cartItem.configuration)
    );
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += cartItem.quantity;
    } else {
        cart.push(cartItem);
    }
    
    localStorage.setItem('quantera_cart', JSON.stringify(cart));
    
    // Show success message
    const configSummary = [
        config.configuration.color?.name,
        config.configuration.warranty?.title,
        config.configuration.bundles.length > 0 ? `${config.configuration.bundles.length} add-ons` : null
    ].filter(Boolean).join(', ');
    
    showNotification(`Added to cart: ${currentAccessory.name} ${configSummary ? `(${configSummary})` : ''}`, 'success');
    
    // Update cart count if exists
    updateCartCount();
}

// Buy now
function buyNow() {
    addToCart();
    window.location.href = 'cart.html';
}

// Toggle wishlist
function toggleWishlist() {
    if (!currentAccessory) return;
    
    let wishlist = JSON.parse(localStorage.getItem('quantera_wishlist') || '[]');
    const existingIndex = wishlist.findIndex(item => (item.id === (currentAccessory._id || currentAccessory.id)) && item.isAccessory);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        showNotification('Removed from wishlist', 'info');
        document.getElementById('wishlistBtn').innerHTML = '<span class="btn-icon">♡</span> Add to Wishlist';
    } else {
        wishlist.push({
            id: currentAccessory._id || currentAccessory.id,
            name: currentAccessory.name,
            brand: currentAccessory.brand,
            price: currentAccessory.discountPrice || currentAccessory.price,
            image: getAccessoryImage(),
            isAccessory: true
        });
        showNotification('Added to wishlist!', 'success');
        document.getElementById('wishlistBtn').innerHTML = '<span class="btn-icon">♥</span> In Wishlist';
    }
    
    localStorage.setItem('quantera_wishlist', JSON.stringify(wishlist));
}

// Get accessory image
function getAccessoryImage() {
    if (currentAccessory.image) return currentAccessory.image;
    if (currentAccessory.images && currentAccessory.images.length > 0) return currentAccessory.images[0];
    
    const fallbackImages = {
        'Cable': 'https://source.unsplash.com/400x300/?cable,usb',
        'Webcam': 'https://source.unsplash.com/400x300/?webcam,camera',
        'Mouse': 'https://source.unsplash.com/400x300/?mouse,computer',
        'Keyboard': 'https://source.unsplash.com/400x300/?keyboard,computer',
        'Headphones': 'https://source.unsplash.com/400x300/?headphones,audio'
    };
    
    return fallbackImages[currentAccessory.type] || 'https://source.unsplash.com/400x300/?computer,accessory';
}

// Get current configuration
function getCurrentConfiguration() {
    return {
        accessory: currentAccessory,
        configuration: accessoryConfiguration,
        pricing: basePricing
    };
}

// Review functions (similar to laptop product page)
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
    
    const reviewData = {
        accessoryId: currentAccessory._id || currentAccessory.id,
        rating: selectedRating,
        title: document.getElementById('reviewTitle').value,
        text: document.getElementById('reviewText').value,
        reviewerName: document.getElementById('reviewerName').value,
        date: new Date().toISOString()
    };
    
    // Save review
    let reviews = JSON.parse(localStorage.getItem('quantera_accessory_reviews') || '[]');
    reviews.push(reviewData);
    localStorage.setItem('quantera_accessory_reviews', JSON.stringify(reviews));
    
    showNotification('Review submitted successfully!', 'success');
    closeReviewModal();
    
    // Refresh reviews section
    loadReviews();
}

// Load and display reviews
function loadReviews() {
    const reviews = JSON.parse(localStorage.getItem('quantera_accessory_reviews') || '[]');
    const accessoryReviews = reviews.filter(review => review.accessoryId === (currentAccessory._id || currentAccessory.id));
    
    const reviewsList = document.getElementById('reviewsList');
    
    if (!reviewsList) {
        console.warn('Reviews list element not found');
        return;
    }
    
    if (accessoryReviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">No reviews yet. Be the first to review this accessory!</p>';
        return;
    }
    
    reviewsList.innerHTML = accessoryReviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-info">
                    <h5>${review.reviewerName}</h5>
                    <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                </div>
                <div class="review-rating">
                    ${Array.from({length: 5}, (_, i) => `
                        <span class="star ${i < review.rating ? 'filled' : ''}">★</span>
                    `).join('')}
                </div>
            </div>
            <div class="review-title">${review.title}</div>
            <div class="review-text">${review.text}</div>
        </div>
    `).join('');
}

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
        console.log(`[${type}] ${message}`);
    }
}


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
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
                <a href="accessories.html" style="color: var(--accent-color);">← Back to Accessories</a>
            </div>
        `;
    } else {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; color: #ff4757; font-family: Inter, sans-serif;">
                <div>
                    <h2>Error</h2>
                    <p>${message}</p>
                    <a href="accessories.html" style="color: #00d4ff; text-decoration: none;">← Back to Accessories</a>
                </div>
            </div>
        `;
    }
}

// Make functions globally available
window.selectColor = selectColor;
window.selectWarranty = selectWarranty;
window.toggleBundle = toggleBundle;
window.changeMainImage = changeMainImage;
window.goToAccessory = goToAccessory;

// Smart back navigation function
window.smartBackNavigation = function(targetPage) {
    if (window.navigationStateManager) {
        window.navigationStateManager.navigateBack(targetPage);
    } else {
        window.location.href = `${targetPage}.html`;
    }
};

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