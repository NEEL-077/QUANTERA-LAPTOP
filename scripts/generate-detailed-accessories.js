const fs = require('fs');
const path = require('path');

// Comprehensive accessory data structures
const accessoryTypes = {
    'Mouse': {
        brands: ['Logitech', 'Razer', 'SteelSeries', 'Corsair', 'ASUS', 'HP', 'Dell', 'Microsoft'],
        models: ['MX Master', 'G Pro', 'DeathAdder', 'Rival', 'K&M', 'Precision', 'Wireless'],
        connectivity: ['Wireless 2.4GHz', 'Bluetooth', 'USB-C', 'USB-A', 'Dual Mode'],
        features: ['RGB Lighting', 'Programmable Buttons', 'High DPI', 'Ergonomic Design', 'Gaming Grade']
    },
    'Keyboard': {
        brands: ['Logitech', 'Razer', 'Corsair', 'SteelSeries', 'ASUS', 'HP', 'Dell', 'Microsoft', 'Keychron'],
        models: ['MX Keys', 'BlackWidow', 'K95', 'Apex', 'ROG Strix', 'Elite', 'Wireless'],
        connectivity: ['Wireless 2.4GHz', 'Bluetooth', 'USB-C', 'USB-A', 'Tri-Mode'],
        features: ['Mechanical Switches', 'RGB Backlight', 'Programmable Keys', 'Media Controls', 'Wireless']
    },
    'Headset': {
        brands: ['Sony', 'Bose', 'SteelSeries', 'Razer', 'Corsair', 'HyperX', 'Audio-Technica', 'Sennheiser'],
        models: ['WH-1000XM', 'QuietComfort', 'Arctis', 'Kraken', 'HS', 'Cloud', 'ATH-M'],
        connectivity: ['Bluetooth', 'USB-C', 'USB-A', '3.5mm', 'Wireless 2.4GHz'],
        features: ['Noise Cancellation', 'Surround Sound', 'Wireless', 'Gaming Optimized', 'Studio Quality']
    },
    'Monitor': {
        brands: ['ASUS', 'Dell', 'LG', 'Samsung', 'Acer', 'HP', 'BenQ', 'MSI'],
        models: ['ProArt', 'UltraSharp', 'UltraGear', 'Odyssey', 'Predator', 'EliteDisplay', 'MOBIUZ'],
        connectivity: ['HDMI 2.1', 'USB-C', 'DisplayPort', 'Thunderbolt 4'],
        features: ['4K Resolution', 'High Refresh Rate', 'HDR Support', 'Color Accurate', 'Gaming Optimized']
    },
    'Dock': {
        brands: ['CalDigit', 'Anker', 'Belkin', 'HP', 'Dell', 'Lenovo', 'ASUS', 'Plugable'],
        models: ['TS4', 'PowerExpand', 'Connect', 'Thunderbolt', 'WD19', 'ThinkPad', 'ProArt'],
        connectivity: ['Thunderbolt 4', 'USB-C', 'USB 3.2', 'HDMI', 'DisplayPort'],
        features: ['Multi-Display', 'Power Delivery', 'Fast Charging', 'Multiple Ports', 'Compact Design']
    },
    'Bag': {
        brands: ['Targus', 'Samsonite', 'Peak Design', 'Bellroy', 'Incase', 'Thule', 'Case Logic', 'HP'],
        models: ['CitySmart', 'Classic', 'Everyday', 'Classic Brief', 'ICON', 'Accent', 'Evolution'],
        connectivity: ['N/A'],
        features: ['Water Resistant', 'Multiple Compartments', 'Laptop Protection', 'Ergonomic', 'Professional']
    },
    'Charger': {
        brands: ['Anker', 'RAVPower', 'Belkin', 'HP', 'Dell', 'Lenovo', 'ASUS', 'Apple'],
        models: ['PowerPort', 'PD Pioneer', 'BoostCharge', 'Smart', 'Adapter', 'ThinkPad', 'ZenBook'],
        connectivity: ['USB-C PD', 'USB-A', 'AC Adapter', 'Wireless'],
        features: ['Fast Charging', 'Multiple Ports', 'Compact Design', 'Universal', 'High Wattage']
    },
    'Webcam': {
        brands: ['Logitech', 'Razer', 'Microsoft', 'ASUS', 'HP', 'Dell', 'Anker', 'Elgato'],
        models: ['C920', 'Kiyo', 'LifeCam', 'ROG Eye', 'Elite', 'UltraSharp', 'PowerConf', 'Facecam'],
        connectivity: ['USB-A', 'USB-C'],
        features: ['4K Recording', 'Auto Focus', 'Low Light', 'Privacy Shutter', 'Ring Light']
    },
    'Speaker': {
        brands: ['Bose', 'JBL', 'Sony', 'Harman Kardon', 'Creative', 'Logitech', 'Razer', 'Anker'],
        models: ['SoundLink', 'Charge', 'SRS-XB', 'Onyx', 'Pebble', 'Z313', 'Nommo', 'SoundCore'],
        connectivity: ['Bluetooth', 'USB-C', 'USB-A', '3.5mm', 'Wireless'],
        features: ['Portable', 'Waterproof', 'Long Battery', 'RGB Lighting', 'Premium Sound']
    },
    'Cable': {
        brands: ['Anker', 'Belkin', 'Cable Matters', 'UGREEN', 'Baseus', 'HP', 'Dell', 'Apple'],
        models: ['PowerLine', 'Connect', 'Series', 'USB-C', 'Thunderbolt', 'HDMI', 'DisplayPort'],
        connectivity: ['USB-C to USB-C', 'USB-A to USB-C', 'HDMI', 'DisplayPort', 'Thunderbolt'],
        features: ['Fast Data Transfer', 'Power Delivery', '4K Support', 'Durable', 'High Speed']
    }
};

// Utility functions
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomRange(min, max, decimals = 0) {
    const value = Math.random() * (max - min) + min;
    return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
}

function generateAccessoryName(type, brand, model) {
    const typeVariations = {
        'Mouse': ['Gaming Mouse', 'Wireless Mouse', 'Precision Mouse', 'Ergonomic Mouse'],
        'Keyboard': ['Gaming Keyboard', 'Wireless Keyboard', 'Mechanical Keyboard', 'Compact Keyboard'],
        'Headset': ['Gaming Headset', 'Wireless Headset', 'Noise Cancelling Headset', 'Studio Headset'],
        'Monitor': ['Gaming Monitor', '4K Monitor', 'Ultrawide Monitor', 'Professional Monitor'],
        'Dock': ['USB-C Hub', 'Thunderbolt Dock', 'Docking Station', 'Multi-Port Hub'],
        'Bag': ['Laptop Bag', 'Backpack', 'Briefcase', 'Sleeve'],
        'Charger': ['USB-C Charger', 'Wireless Charger', 'Power Adapter', 'Fast Charger'],
        'Webcam': ['4K Webcam', 'Streaming Camera', 'Conference Camera', 'HD Webcam'],
        'Speaker': ['Bluetooth Speaker', 'Desktop Speaker', 'Portable Speaker', 'Gaming Speaker'],
        'Cable': ['USB-C Cable', 'HDMI Cable', 'Thunderbolt Cable', 'Data Cable']
    };
    
    const variation = randomChoice(typeVariations[type] || [type]);
    return `${brand} ${model} ${variation}`;
}

function generateAccessoryPrice(type, brand, features) {
    const basePrices = {
        'Mouse': [1500, 8000],
        'Keyboard': [2000, 15000],
        'Headset': [3000, 25000],
        'Monitor': [15000, 80000],
        'Dock': [5000, 25000],
        'Bag': [2000, 12000],
        'Charger': [1000, 8000],
        'Webcam': [3000, 15000],
        'Speaker': [2000, 20000],
        'Cable': [500, 5000]
    };
    
    const [minPrice, maxPrice] = basePrices[type] || [1000, 10000];
    let price = randomRange(minPrice, maxPrice);
    
    // Brand multiplier
    const premiumBrands = ['Apple', 'Razer', 'Corsair', 'Bose', 'Sony', 'ASUS ROG'];
    if (premiumBrands.some(brand => brand.includes(brand))) {
        price *= randomRange(1.2, 1.8, 2);
    }
    
    // Feature multiplier
    if (features.includes('RGB Lighting') || features.includes('Gaming')) price *= 1.3;
    if (features.includes('4K') || features.includes('High Refresh Rate')) price *= 1.4;
    if (features.includes('Wireless') || features.includes('Bluetooth')) price *= 1.2;
    if (features.includes('Noise Cancellation')) price *= 1.5;
    
    return Math.round(price / 100) * 100; // Round to nearest hundred
}

function generateAccessoryDescription(name, type, features, connectivity) {
    const typeDescriptions = {
        'Mouse': 'Precision and comfort meet in this high-performance mouse designed for productivity and gaming.',
        'Keyboard': 'Experience superior typing with this premium keyboard featuring advanced switches and customization.',
        'Headset': 'Immerse yourself in crystal-clear audio with this professional-grade headset.',
        'Monitor': 'Elevate your visual experience with this high-resolution display featuring cutting-edge technology.',
        'Dock': 'Expand your connectivity options with this versatile docking solution.',
        'Bag': 'Protect your laptop in style with this durable and functional carrying solution.',
        'Charger': 'Keep your devices powered with this efficient and reliable charging solution.',
        'Webcam': 'Capture life in stunning detail with this high-definition camera.',
        'Speaker': 'Experience rich, immersive sound with this premium audio system.',
        'Cable': 'Reliable connectivity solution for all your data transfer and charging needs.'
    };
    
    let description = typeDescriptions[type] || 'High-quality accessory designed for modern computing needs.';
    
    if (features.length > 0) {
        description += ` Features include ${features.slice(0, 3).join(', ').toLowerCase()}.`;
    }
    
    if (connectivity !== 'N/A') {
        description += ` Connects via ${connectivity.toLowerCase()}.`;
    }
    
    return description;
}

function generateDetailedAccessory(id) {
    const type = randomChoice(Object.keys(accessoryTypes));
    const typeData = accessoryTypes[type];
    const brand = randomChoice(typeData.brands);
    const model = randomChoice(typeData.models);
    const connectivity = randomChoice(typeData.connectivity);
    const features = [];
    
    // Select 2-4 random features
    const numFeatures = randomRange(2, 5);
    const availableFeatures = [...typeData.features];
    for (let i = 0; i < numFeatures && availableFeatures.length > 0; i++) {
        const featureIndex = randomRange(0, availableFeatures.length);
        features.push(availableFeatures.splice(featureIndex, 1)[0]);
    }
    
    const name = generateAccessoryName(type, brand, model);
    const price = generateAccessoryPrice(type, brand, features);
    const discountPrice = Math.random() > 0.7 ? Math.round(price * randomRange(0.8, 0.95, 2)) : null;
    const description = generateAccessoryDescription(name, type, features, connectivity);
    
    // Generate specifications based on type
    const specifications = generateSpecifications(type, features);
    
    return {
        id: id,
        name: name,
        type: type,
        brand: brand,
        model: model,
        price: price,
        discountPrice: discountPrice,
        stock: randomRange(10, 100),
        connectivity: connectivity,
        features: features,
        specifications: specifications,
        description: description,
        warranty: randomChoice(['1 Year', '2 Years', '3 Years', '6 Months']),
        images: [
            `https://source.unsplash.com/800x600/?${type.toLowerCase()},${brand.toLowerCase()}`,
            `https://source.unsplash.com/800x600/?computer,accessory,${type.toLowerCase()}`,
            `https://source.unsplash.com/800x600/?technology,${type.toLowerCase()}`,
            `https://source.unsplash.com/800x600/?modern,${type.toLowerCase()}`
        ],
        image: `https://source.unsplash.com/800x600/?${type.toLowerCase()},${brand.toLowerCase()}`,
        category: generateCategory(type),
        rating: randomRange(3.5, 5.0, 1),
        reviews: randomRange(10, 500)
    };
}

function generateSpecifications(type, features) {
    const specs = {};
    
    switch (type) {
        case 'Mouse':
            specs.dpi = randomRange(800, 25000);
            specs.buttons = randomRange(3, 12);
            specs.weight = randomRange(60, 150) + 'g';
            specs.batteryLife = features.includes('Wireless') ? randomRange(30, 200) + ' hours' : 'N/A';
            break;
            
        case 'Keyboard':
            specs.layout = randomChoice(['Full Size', 'Tenkeyless', '60%', '65%', '75%']);
            specs.switches = randomChoice(['Cherry MX Red', 'Cherry MX Blue', 'Cherry MX Brown', 'Membrane', 'Optical']);
            specs.keycaps = randomChoice(['ABS', 'PBT', 'Double-shot PBT']);
            specs.batteryLife = features.includes('Wireless') ? randomRange(20, 100) + ' hours' : 'N/A';
            break;
            
        case 'Headset':
            specs.driverSize = randomRange(40, 53) + 'mm';
            specs.frequency = '20Hz - ' + randomRange(20000, 40000) + 'Hz';
            specs.impedance = randomRange(16, 300) + 'Ω';
            specs.batteryLife = features.includes('Wireless') ? randomRange(15, 50) + ' hours' : 'N/A';
            break;
            
        case 'Monitor':
            specs.size = randomChoice(['21.5"', '24"', '27"', '32"', '34"', '38"']);
            specs.resolution = randomChoice(['1920x1080', '2560x1440', '3840x2160', '3440x1440']);
            specs.refreshRate = randomChoice(['60Hz', '75Hz', '144Hz', '165Hz', '240Hz', '360Hz']);
            specs.panelType = randomChoice(['IPS', 'VA', 'TN', 'OLED']);
            break;
            
        case 'Dock':
            specs.ports = randomRange(4, 12) + ' ports';
            specs.powerDelivery = randomRange(60, 100) + 'W';
            specs.displaySupport = randomChoice(['Single 4K', 'Dual 4K', 'Triple 1080p']);
            specs.dataTransfer = randomChoice(['USB 3.2', 'Thunderbolt 3', 'Thunderbolt 4']);
            break;
            
        case 'Webcam':
            specs.resolution = randomChoice(['720p', '1080p', '4K']);
            specs.frameRate = randomChoice(['30fps', '60fps', '90fps']);
            specs.fieldOfView = randomRange(65, 90) + '°';
            specs.focusType = randomChoice(['Auto Focus', 'Fixed Focus']);
            break;
            
        case 'Speaker':
            specs.power = randomRange(5, 50) + 'W';
            specs.frequency = '50Hz - ' + randomRange(18000, 25000) + 'Hz';
            specs.batteryLife = features.includes('Portable') ? randomRange(8, 24) + ' hours' : 'N/A';
            specs.waterRating = features.includes('Waterproof') ? randomChoice(['IPX4', 'IPX5', 'IPX7']) : 'N/A';
            break;
            
        default:
            specs.length = randomRange(1, 3) + 'm';
            specs.dataRate = randomChoice(['USB 2.0', 'USB 3.2', 'Thunderbolt 3', 'Thunderbolt 4']);
            break;
    }
    
    return specs;
}

function generateCategory(type) {
    const categories = {
        'Mouse': 'Input Devices',
        'Keyboard': 'Input Devices',
        'Headset': 'Audio',
        'Monitor': 'Display',
        'Dock': 'Connectivity',
        'Bag': 'Protection',
        'Charger': 'Power',
        'Webcam': 'Video',
        'Speaker': 'Audio',
        'Cable': 'Connectivity'
    };
    
    return categories[type] || 'Accessories';
}

// Generate accessories
function generateAllAccessories(count = 200) {
    const accessories = [];
    
    for (let i = 1; i <= count; i++) {
        const accessory = generateDetailedAccessory(i);
        accessories.push(accessory);
    }
    
    return accessories;
}

// Generate and save the data
console.log('Generating detailed accessories...');
const accessories = generateAllAccessories(200);

// Save to file
const outputDir = path.join(__dirname, '..', 'data');
fs.writeFileSync(
    path.join(outputDir, 'accessories.json'),
    JSON.stringify(accessories, null, 2)
);

console.log(`✅ Generated ${accessories.length} detailed accessories`);
console.log('📊 Type distribution:');

const typeCounts = {};
accessories.forEach(accessory => {
    typeCounts[accessory.type] = (typeCounts[accessory.type] || 0) + 1;
});

Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} models`);
});

console.log('\n📁 File saved: data/accessories.json');
console.log('🎯 All accessories now include complete specifications!');