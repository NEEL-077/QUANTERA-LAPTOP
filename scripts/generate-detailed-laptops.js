const fs = require('fs');
const path = require('path');

// Comprehensive data structures for realistic laptop generation
const brands = {
    'ASUS': {
        series: ['ROG Zephyrus', 'ROG Strix', 'TUF Gaming', 'Zenbook', 'Vivobook', 'ProArt', 'ExpertBook'],
        colors: ['Eclipse Gray', 'Moonlight White', 'Off Black', 'Quiet Blue', 'Indie Black']
    },
    'Dell': {
        series: ['XPS', 'Inspiron', 'Alienware', 'G Series', 'Latitude', 'Precision', 'Vostro'],
        colors: ['Platinum Silver', 'Frost White', 'Lunar Light', 'Dark Side of the Moon', 'Abyss Blue']
    },
    'HP': {
        series: ['Omen', 'Pavilion', 'Envy', 'EliteBook', 'ProBook', 'Spectre', 'ZBook'],
        colors: ['Natural Silver', 'Ceramic White', 'Nightfall Black', 'Pale Gold', 'Forest Teal']
    },
    'Lenovo': {
        series: ['ThinkPad', 'IdeaPad', 'Legion', 'Yoga', 'ThinkBook', 'LOQ'],
        colors: ['Storm Grey', 'Arctic Grey', 'Phantom Blue', 'Cloud Grey', 'Onyx Grey']
    },
    'Acer': {
        series: ['Predator', 'Nitro', 'Swift', 'Aspire', 'ConceptD', 'TravelMate', 'Chromebook'],
        colors: ['Charcoal Black', 'Pure Silver', 'Steel Gray', 'Obsidian Black', 'Safari Gold']
    },
    'MSI': {
        series: ['Gaming', 'Creator', 'Modern', 'Prestige', 'Summit', 'Stealth', 'Katana'],
        colors: ['Core Black', 'Urban Silver', 'Carbon Gray', 'Mystic Light', 'Dragon Center']
    },
    'Apple': {
        series: ['MacBook Air', 'MacBook Pro'],
        colors: ['Space Gray', 'Silver', 'Gold', 'Midnight', 'Starlight']
    },
    'Razer': {
        series: ['Blade', 'Book'],
        colors: ['Black', 'Mercury White', 'Quartz Pink']
    }
};

const processors = {
    'Intel': {
        models: ['i3-1115G4', 'i5-1135G7', 'i5-1240P', 'i5-12450H', 'i5-13420H', 'i7-1165G7', 'i7-1260P', 'i7-12700H', 'i7-13620H', 'i9-12900H', 'i9-13900H', 'i9-14900HX'],
        cores: { 'i3': [4], 'i5': [6, 8, 10], 'i7': [8, 10, 12], 'i9': [12, 14, 16] },
        threads: { 4: 8, 6: 12, 8: 16, 10: 16, 12: 20, 14: 20, 16: 24 },
        baseClock: [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4],
        boostClock: [3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0, 5.2],
        cache: [8, 12, 16, 18, 20, 24, 30, 36]
    },
    'AMD': {
        models: ['Ryzen 3 5300U', 'Ryzen 5 5500U', 'Ryzen 5 5600H', 'Ryzen 5 6600H', 'Ryzen 5 7530U', 'Ryzen 7 5800H', 'Ryzen 7 6800H', 'Ryzen 7 7735HS', 'Ryzen 9 5900HX', 'Ryzen 9 6900HX', 'Ryzen 9 7940HS'],
        cores: { 'Ryzen 3': [4], 'Ryzen 5': [6, 8], 'Ryzen 7': [8], 'Ryzen 9': [8, 12, 16] },
        threads: { 4: 8, 6: 12, 8: 16, 12: 24, 16: 32 },
        baseClock: [1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2],
        boostClock: [3.5, 3.7, 3.9, 4.1, 4.3, 4.5, 4.7, 4.9, 5.1],
        cache: [8, 12, 16, 20, 32, 64]
    },
    'Apple': {
        models: ['M1', 'M1 Pro', 'M1 Max', 'M2', 'M2 Pro', 'M2 Max', 'M3', 'M3 Pro', 'M3 Max'],
        cores: { 'M1': [8], 'M1 Pro': [8, 10], 'M1 Max': [10], 'M2': [8], 'M2 Pro': [10, 12], 'M2 Max': [12], 'M3': [8], 'M3 Pro': [11, 12], 'M3 Max': [14, 16] },
        threads: { 8: 8, 10: 10, 11: 11, 12: 12, 14: 14, 16: 16 },
        baseClock: [3.2, 3.4, 3.5, 3.6, 3.7, 3.8],
        boostClock: [3.2, 3.4, 3.5, 3.6, 3.7, 3.8],
        cache: [16, 24, 32, 48, 64]
    }
};

const gpus = {
    'NVIDIA': ['RTX 3050', 'RTX 3060', 'RTX 3070', 'RTX 3080', 'RTX 4050', 'RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090', 'GTX 1650', 'GTX 1660 Ti'],
    'AMD': ['RX 6600M', 'RX 6700M', 'RX 6800M', 'RX 7600M', 'RX 7700M', 'RX 7800M'],
    'Intel': ['Intel Iris Xe', 'Intel Arc A350M', 'Intel Arc A370M', 'Intel UHD Graphics'],
    'Integrated': ['Integrated Graphics', 'Apple GPU (7-core)', 'Apple GPU (8-core)', 'Apple GPU (10-core)', 'Apple GPU (16-core)', 'Apple GPU (24-core)', 'Apple GPU (32-core)', 'Apple GPU (38-core)']
};

const vramMapping = {
    'RTX 4090': 16, 'RTX 4080': 12, 'RTX 4070': 8, 'RTX 4060': 6, 'RTX 4050': 4,
    'RTX 3080': 10, 'RTX 3070': 8, 'RTX 3060': 6, 'RTX 3050': 4,
    'RX 7800M': 12, 'RX 7700M': 8, 'RX 7600M': 6, 'RX 6800M': 12, 'RX 6700M': 10, 'RX 6600M': 8,
    'GTX 1660 Ti': 6, 'GTX 1650': 4,
    'Intel Arc A370M': 4, 'Intel Arc A350M': 4
};

const tgpMapping = {
    'RTX 4090': [150, 175], 'RTX 4080': [125, 150], 'RTX 4070': [100, 125], 'RTX 4060': [75, 100], 'RTX 4050': [50, 75],
    'RTX 3080': [125, 150], 'RTX 3070': [100, 125], 'RTX 3060': [75, 100], 'RTX 3050': [50, 75],
    'RX 7800M': [120, 145], 'RX 7700M': [100, 120], 'RX 7600M': [75, 100]
};

const displaySizes = [13.3, 14.0, 15.6, 16.0, 17.3, 18.0];
const resolutions = ['1920x1080', '1920x1200', '2560x1440', '2560x1600', '2880x1800', '3840x2160', '3840x2400'];
const refreshRates = [60, 90, 120, 144, 165, 240, 300];
const panelTypes = ['IPS', 'OLED', 'Mini-LED', 'TN', 'VA'];

const ramConfigs = [8, 16, 32, 64];
const ramTypes = ['DDR4', 'DDR5', 'LPDDR4X', 'LPDDR5'];
const ramSpeeds = { 'DDR4': [2400, 2666, 3200], 'DDR5': [4800, 5200, 5600], 'LPDDR4X': [3733, 4266], 'LPDDR5': [5500, 6400] };

const storageCapacities = [256, 512, 1024, 2048];
const storageTypes = ['NVMe PCIe 3.0', 'NVMe PCIe 4.0', 'NVMe Gen4', 'SATA SSD'];

const categories = ['gaming', 'business', 'student', 'professional', 'creator', 'ultrabook'];

const materials = ['Aluminum', 'Magnesium Alloy', 'Carbon Fiber', 'Plastic', 'CNC Aluminum', 'Anodized Aluminum'];
const hingeTypes = ['Standard', '180 Degree', '360 Degree (2-in-1)'];

const operatingSystems = ['Windows 11 Home', 'Windows 11 Pro', 'macOS Monterey', 'macOS Ventura', 'macOS Sonoma'];
const warranties = ['1 Year International', '2 Year On-site', '3 Year Premium Support', '1 Year Accidental Damage Protection'];

// Utility functions
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomRange(min, max, decimals = 0) {
    const value = Math.random() * (max - min) + min;
    return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
}

function generateModelNumber(brand, series, year) {
    const prefixes = {
        'ASUS': ['GA', 'GU', 'GX', 'UX', 'UM', 'X'],
        'Dell': ['XPS', 'G', 'ALW', 'INS', 'LAT'],
        'HP': ['15', '16', '17', 'dv', 'dw', 'dx'],
        'Lenovo': ['20', '21', '82', '83', '15', '16'],
        'Acer': ['AN', 'SF', 'A', 'PT', 'NH'],
        'MSI': ['GF', 'GP', 'GE', 'GT', 'MS'],
        'Apple': ['MBP', 'MBA'],
        'Razer': ['RZ']
    };
    
    const prefix = randomChoice(prefixes[brand] || ['LT']);
    const numbers = Math.floor(Math.random() * 900) + 100;
    const suffix = randomChoice(['H', 'U', 'X', 'T', 'S', '']);
    
    return `${prefix}${numbers}${suffix}`;
}

function generateSKU(brand, modelNumber) {
    const brandCode = brand.substring(0, 3).toUpperCase();
    const randomCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${brandCode}-${modelNumber}-${randomCode}`;
}

function generatePrice(category, specs) {
    let basePrice = 50000; // Base price in rupees
    
    // Category multiplier
    const categoryMultipliers = {
        'gaming': 1.5,
        'professional': 1.4,
        'creator': 1.6,
        'business': 1.2,
        'ultrabook': 1.3,
        'student': 1.0
    };
    
    basePrice *= categoryMultipliers[category] || 1.0;
    
    // CPU multiplier
    if (specs.cpuModel.includes('i9') || specs.cpuModel.includes('Ryzen 9')) basePrice *= 1.8;
    else if (specs.cpuModel.includes('i7') || specs.cpuModel.includes('Ryzen 7')) basePrice *= 1.4;
    else if (specs.cpuModel.includes('i5') || specs.cpuModel.includes('Ryzen 5')) basePrice *= 1.2;
    else if (specs.cpuModel.includes('M3')) basePrice *= 2.0;
    else if (specs.cpuModel.includes('M2')) basePrice *= 1.8;
    else if (specs.cpuModel.includes('M1')) basePrice *= 1.6;
    
    // GPU multiplier
    if (specs.gpuModel.includes('RTX 4090')) basePrice *= 2.5;
    else if (specs.gpuModel.includes('RTX 4080')) basePrice *= 2.2;
    else if (specs.gpuModel.includes('RTX 4070')) basePrice *= 1.8;
    else if (specs.gpuModel.includes('RTX 4060')) basePrice *= 1.5;
    else if (specs.gpuModel.includes('RTX 4050')) basePrice *= 1.3;
    else if (specs.gpuModel.includes('RTX 30')) basePrice *= 1.4;
    
    // RAM multiplier
    if (specs.ramCapacity >= 32) basePrice *= 1.4;
    else if (specs.ramCapacity >= 16) basePrice *= 1.2;
    
    // Storage multiplier
    if (specs.storageCap >= 2048) basePrice *= 1.3;
    else if (specs.storageCap >= 1024) basePrice *= 1.15;
    
    // Display multiplier
    if (specs.resolution.includes('3840')) basePrice *= 1.3;
    else if (specs.resolution.includes('2880') || specs.resolution.includes('2560')) basePrice *= 1.15;
    
    if (specs.refreshRate >= 240) basePrice *= 1.2;
    else if (specs.refreshRate >= 144) basePrice *= 1.1;
    
    // Add some randomness
    basePrice *= randomRange(0.9, 1.1, 2);
    
    return Math.round(basePrice / 1000) * 1000; // Round to nearest thousand
}

function generateDetailedLaptop(id, brand) {
    const brandData = brands[brand];
    const series = randomChoice(brandData.series);
    const year = randomRange(2020, 2026);
    const modelNumber = generateModelNumber(brand, series, year);
    const sku = generateSKU(brand, modelNumber);
    const color = randomChoice(brandData.colors);
    const category = randomChoice(categories);
    
    // CPU Selection
    const cpuBrand = brand === 'Apple' ? 'Apple' : randomChoice(['Intel', 'AMD']);
    const cpuData = processors[cpuBrand];
    const cpuModel = randomChoice(cpuData.models);
    const cpuFamily = cpuModel.split('-')[0] || cpuModel.split(' ')[0] + ' ' + cpuModel.split(' ')[1];
    const cores = randomChoice(cpuData.cores[cpuFamily] || [8]);
    const threads = cpuData.threads[cores] || cores * 2;
    const baseClock = randomChoice(cpuData.baseClock);
    const boostClock = randomChoice(cpuData.boostClock.filter(b => b > baseClock));
    const cache = randomChoice(cpuData.cache);
    
    // GPU Selection
    let gpuType, gpuModel, vram = 0, tgp = 0;
    if (brand === 'Apple') {
        gpuType = 'Integrated';
        gpuModel = randomChoice(gpus['Integrated'].filter(g => g.includes('Apple')));
        vram = 0; // Unified memory
    } else if (category === 'gaming' || category === 'creator' || category === 'professional') {
        gpuType = 'Dedicated';
        gpuModel = randomChoice([...gpus['NVIDIA'], ...gpus['AMD']]);
        vram = vramMapping[gpuModel] || randomRange(4, 12);
        tgp = tgpMapping[gpuModel] ? randomRange(...tgpMapping[gpuModel]) : randomRange(50, 150);
    } else {
        gpuType = Math.random() > 0.7 ? 'Dedicated' : 'Integrated';
        if (gpuType === 'Dedicated') {
            gpuModel = randomChoice(['RTX 3050', 'RTX 4050', 'GTX 1650', 'Intel Arc A350M']);
            vram = vramMapping[gpuModel] || 4;
            tgp = tgpMapping[gpuModel] ? randomRange(...tgpMapping[gpuModel]) : randomRange(35, 75);
        } else {
            gpuModel = randomChoice(gpus['Intel']);
        }
    }
    
    // RAM Configuration
    const ramCapacity = randomChoice(ramConfigs);
    const ramType = brand === 'Apple' ? 'Unified Memory' : randomChoice(ramTypes);
    const ramSpeed = ramType === 'Unified Memory' ? 0 : randomChoice(ramSpeeds[ramType] || [3200]);
    const ramSlots = ramCapacity <= 16 ? '2x SO-DIMM' : '4x SO-DIMM';
    const maxRam = ramCapacity * 2;
    
    // Storage Configuration
    const storageCap = randomChoice(storageCapacities);
    const storageType = randomChoice(storageTypes);
    const extraSlots = randomRange(0, 2);
    
    // Display Configuration
    const displaySize = randomChoice(displaySizes);
    const resolution = randomChoice(resolutions);
    const refreshRate = category === 'gaming' ? randomChoice([120, 144, 165, 240, 300]) : randomChoice([60, 90, 120]);
    const panelType = randomChoice(panelTypes);
    const brightness = randomRange(250, 500);
    const colorGamut = randomChoice(['100% sRGB', '100% DCI-P3', '100% Adobe RGB', '72% NTSC']);
    const touchscreen = Math.random() > 0.8;
    
    // Design & Build
    const material = randomChoice(materials);
    const weight = randomRange(1.2, 3.5, 2);
    const dimensions = `${randomRange(310, 400)}x${randomRange(210, 280)}x${randomRange(15, 25, 1)}mm`;
    const hinge = randomChoice(hingeTypes);
    const milStd = Math.random() > 0.85;
    
    // Power & Battery
    const battery = randomRange(40, 100);
    const adapter = randomRange(45, 240);
    
    // Connectivity
    const wifi = randomChoice(['Wi-Fi 6', 'Wi-Fi 6E', 'Wi-Fi 7']);
    const bluetooth = randomChoice(['5.1', '5.2', '5.3', '5.4']);
    const ports = generatePorts(displaySize, category);
    
    // Multimedia
    const webcam = randomChoice(['720p HD', '1080p FHD', '1080p IR', '4K UHD']);
    const speakers = randomChoice(['2x 2W Stereo', '4x 2W Quad', '6x 2W with Subwoofer', '4x 2W Dolby Atmos']);
    
    // Input
    const keyboard = randomChoice(['White Backlight', 'RGB Backlight', 'Per-Key RGB', '4-Zone RGB', 'No Backlight']);
    const touchpad = randomChoice(['Precision Touchpad', 'Multi-touch Touchpad', 'Glass Touchpad']);
    
    // Software
    const os = brand === 'Apple' ? randomChoice(['macOS Monterey', 'macOS Ventura', 'macOS Sonoma']) : randomChoice(['Windows 11 Home', 'Windows 11 Pro']);
    const warranty = randomChoice(warranties);
    
    // Generate price based on specifications
    const specs = { cpuModel, gpuModel, ramCapacity, storageCap, resolution, refreshRate };
    const price = generatePrice(category, specs);
    const discountPrice = Math.random() > 0.7 ? Math.round(price * randomRange(0.85, 0.95, 2)) : null;
    
    // Generate description
    const description = generateDescription(brand, series, modelNumber, category, specs);
    
    return {
        id: id,
        brand: brand,
        series: series,
        modelNumber: modelNumber,
        sku: sku,
        launchYear: year,
        price: price,
        discountPrice: discountPrice,
        stock: randomRange(5, 50),
        category: category,
        
        // Design
        material: material,
        color: color,
        weight: weight,
        dimensions: dimensions,
        hinge: hinge,
        milStd: milStd,
        
        // Display
        displaySize: displaySize,
        resolution: resolution,
        aspectRatio: calculateAspectRatio(resolution),
        panelType: panelType,
        refreshRate: refreshRate,
        responseTime: randomRange(1, 5, 1),
        brightness: brightness,
        colorGamut: colorGamut,
        touchscreen: touchscreen,
        
        // CPU
        cpuBrand: cpuBrand,
        cpuModel: cpuModel,
        cpuCores: cores,
        pCores: cpuBrand === 'Intel' && cores > 4 ? Math.ceil(cores * 0.6) : cores,
        eCores: cpuBrand === 'Intel' && cores > 4 ? Math.floor(cores * 0.4) : 0,
        threads: threads,
        baseClock: baseClock,
        boostClock: boostClock,
        cache: cache,
        npu: Math.random() > 0.6 ? randomRange(10, 45) : 0,
        
        // GPU
        gpuType: gpuType,
        gpuModel: gpuModel,
        vram: vram,
        tgp: tgp,
        muxSwitch: gpuType === 'Dedicated' && Math.random() > 0.5,
        
        // Memory
        ramCapacity: ramCapacity,
        ramType: ramType,
        ramSpeed: ramSpeed,
        ramSpeedUnit: 'MHz',
        ramSlots: ramSlots,
        maxRam: maxRam,
        
        // Storage
        storageCap: storageCap,
        storageType: storageType,
        extraSlots: extraSlots,
        
        // Connectivity
        wifi: wifi,
        bluetooth: bluetooth,
        ports: ports,
        
        // Multimedia
        webcam: webcam,
        speakers: speakers,
        
        // Input
        keyboard: keyboard,
        touchpad: touchpad,
        
        // Power
        battery: battery,
        adapter: adapter,
        
        // Software
        os: os,
        warranty: warranty,
        description: description,
        
        // Images (placeholder URLs)
        images: generateImageUrls(brand, series, modelNumber),
        image: `https://source.unsplash.com/800x600/?laptop,${brand.toLowerCase()}`
    };
}

function calculateAspectRatio(resolution) {
    const [width, height] = resolution.split('x').map(Number);
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

function generatePorts(displaySize, category) {
    const basePorts = ['1x USB-C', '2x USB-A 3.2', '1x HDMI 2.1', '1x 3.5mm Audio'];
    
    if (displaySize >= 15.6) {
        basePorts.push('1x Ethernet RJ45');
    }
    
    if (category === 'gaming' || category === 'professional') {
        basePorts.push('1x USB-C Thunderbolt 4');
        basePorts.push('1x SD Card Reader');
    }
    
    if (Math.random() > 0.5) {
        basePorts.push('1x USB-C Power Delivery');
    }
    
    return basePorts.join(', ');
}

function generateImageUrls(brand, series, modelNumber) {
    const baseUrl = 'https://source.unsplash.com/800x600/?laptop';
    return [
        `${baseUrl},${brand.toLowerCase()}`,
        `${baseUrl},computer,${brand.toLowerCase()}`,
        `${baseUrl},technology,${brand.toLowerCase()}`,
        `${baseUrl},modern,laptop`
    ];
}

function generateDescription(brand, series, modelNumber, category, specs) {
    const categoryDescriptions = {
        'gaming': 'Unleash your gaming potential with this high-performance laptop featuring cutting-edge graphics and lightning-fast processing.',
        'business': 'Professional-grade laptop designed for productivity and reliability in demanding business environments.',
        'student': 'Perfect balance of performance and affordability, ideal for students and everyday computing needs.',
        'professional': 'Premium laptop engineered for professionals who demand exceptional performance and build quality.',
        'creator': 'Content creation powerhouse with professional-grade components for video editing, 3D rendering, and creative workflows.',
        'ultrabook': 'Ultra-portable design meets powerful performance in this sleek and lightweight laptop.'
    };
    
    const baseDescription = categoryDescriptions[category] || 'High-quality laptop with modern features and reliable performance.';
    
    const highlights = [];
    if (specs.cpuModel.includes('i9') || specs.cpuModel.includes('Ryzen 9') || specs.cpuModel.includes('M3')) {
        highlights.push('flagship processor');
    }
    if (specs.gpuModel.includes('RTX 40') || specs.gpuModel.includes('RX 7')) {
        highlights.push('latest-generation graphics');
    }
    if (specs.ramCapacity >= 32) {
        highlights.push('high-capacity memory');
    }
    if (specs.refreshRate >= 144) {
        highlights.push('high refresh rate display');
    }
    
    let description = `${baseDescription} The ${brand} ${series} ${modelNumber} combines ${highlights.join(', ')} to deliver exceptional performance.`;
    
    if (highlights.length > 0) {
        description += ` Key features include ${specs.cpuModel} processor, ${specs.gpuModel} graphics, ${specs.ramCapacity}GB RAM, and ${specs.storageCap}GB storage.`;
    }
    
    return description;
}

// Generate all 1200 laptops
function generateAllLaptops() {
    const laptops = [];
    const brandNames = Object.keys(brands);
    const laptopsPerBrand = Math.floor(1200 / brandNames.length);
    const remainder = 1200 % brandNames.length;
    
    let currentId = 1;
    
    brandNames.forEach((brand, index) => {
        const count = laptopsPerBrand + (index < remainder ? 1 : 0);
        
        for (let i = 0; i < count; i++) {
            const laptop = generateDetailedLaptop(currentId, brand);
            laptops.push(laptop);
            currentId++;
        }
    });
    
    return laptops;
}

// Generate and save the data
console.log('Generating 1200 detailed laptop models...');
const laptops = generateAllLaptops();

// Save to files
const outputDir = path.join(__dirname, '..', 'data');

// Full dataset
fs.writeFileSync(
    path.join(outputDir, 'laptops-full-detailed.json'),
    JSON.stringify(laptops, null, 2)
);

// Sample dataset (first 50)
fs.writeFileSync(
    path.join(outputDir, 'laptops-sample-detailed.json'),
    JSON.stringify(laptops.slice(0, 50), null, 2)
);

// Replace the current files
fs.writeFileSync(
    path.join(outputDir, 'laptops-full.json'),
    JSON.stringify(laptops, null, 2)
);

fs.writeFileSync(
    path.join(outputDir, 'laptops-sample.json'),
    JSON.stringify(laptops.slice(0, 50), null, 2)
);

console.log(`✅ Generated ${laptops.length} detailed laptop models`);
console.log('📊 Brand distribution:');

const brandCounts = {};
laptops.forEach(laptop => {
    brandCounts[laptop.brand] = (brandCounts[laptop.brand] || 0) + 1;
});

Object.entries(brandCounts).forEach(([brand, count]) => {
    console.log(`   ${brand}: ${count} models`);
});

console.log('\n📁 Files saved:');
console.log('   - data/laptops-full-detailed.json (backup)');
console.log('   - data/laptops-sample-detailed.json (backup)');
console.log('   - data/laptops-full.json (updated)');
console.log('   - data/laptops-sample.json (updated)');

console.log('\n🎯 All laptop models now include complete specifications matching your Admin Panel structure!');