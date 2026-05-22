require('dotenv').config();
const database = require('../config/database');
const Laptop = require('../models/Laptop');
const Accessory = require('../models/Accessory');
const Order = require('../models/Order');
const Newsletter = require('../models/Newsletter');

async function seedDb() {
    await database.connect();
    try {
        const laptopCount = await Laptop.countDocuments();
        if (laptopCount === 0) {
            console.log('Seeding laptops...');
            await Laptop.create([
                {
                    brand: 'Quantum',
                    series: 'Blade 15',
                    modelNumber: 'QB15-2026',
                    sku: 'QBL-001',
                    launchYear: 2025,
                    price: 129999,
                    discountPrice: 119999,
                    stock: 20,
                    category: 'gaming',
                    design: { material: 'Aluminum', color: 'Black', weight: 2.2, dimensions: '355 x 245 x 19 mm', hinge: 'Standard', milStd: false },
                    display: { size: 15.6, resolution: '2560x1440', aspectRatio: '16:9', panelType: 'IPS', refreshRate: 165, responseTime: 3, brightness: 300, colorGamut: '100% sRGB', touchscreen: false },
                    cpu: { brand: 'Intel', model: 'Core i9-13900HX', cores: 8, pCores: 8, eCores: 8, threads: 24, baseClock: 2.2, boostClock: 5.4, cache: 24 },
                    gpu: { type: 'Dedicated', model: 'NVIDIA RTX 4080', vram: 12, tgp: 150, muxSwitch: true },
                    memory: { capacity: 32, type: 'DDR5', speed: 5200, speedUnit: 'MHz', slots: '2x SO-DIMM', maxSupported: 64 },
                    storage: { capacity: 1000, type: 'NVMe PCIe 4.0', extraSlots: 1 },
                    connectivity: { wifi: 'Wi-Fi 6E', bluetooth: '5.3', ports: 'USB-C, USB-A, HDMI, Ethernet, SD card' },
                    multimedia: { webcam: '1080p IR', speakers: '2x 3W Stereo' },
                    input: { keyboard: 'RGB Backlit', touchpad: 'Precision Touchpad' },
                    power: { battery: 90, adapter: 240 },
                    software: { os: 'Windows 11 Home', warranty: '1 Year' },
                    images: ['https://source.unsplash.com/800x600/?gaming,laptop'],
                    image: 'https://source.unsplash.com/800x600/?gaming,laptop',
                    description: 'A high-performance gaming laptop for premium performance and productivity.',
                    isActive: true,
                    views: 0,
                    sales: 0
                }
            ]);
            console.log('Laptops seeded.');
        } else {
            console.log(`Laptops already exist (${laptopCount}). Skipping laptop seed.`);
        }

        const accessoryCount = await Accessory.countDocuments();
        if (accessoryCount === 0) {
            console.log('Seeding accessories...');
            await Accessory.create([
                {
                    name: 'Quantum Pro Wireless Mouse',
                    type: 'Mouse',
                    brand: 'Quantum',
                    model: 'QWM-100',
                    price: 2499,
                    discountPrice: 1999,
                    stock: 80,
                    connectivity: 'Wireless Bluetooth + USB Receiver',
                    features: ['Ergonomic design', 'Adjustable DPI', 'Rechargeable battery'],
                    specifications: { dpi: '800/1200/1600/2400', buttons: 6 },
                    category: 'Input Devices',
                    description: 'A premium wireless mouse with ergonomic control and long battery life.',
                    warranty: '1 Year',
                    image: 'https://source.unsplash.com/800x600/?mouse',
                    rating: 4.6,
                    reviews: 125,
                    compatibility: ['Windows', 'macOS', 'Linux'],
                    isActive: true,
                    views: 0,
                    sales: 0
                },
                {
                    name: 'Quantum Soundbar Pro',
                    type: 'Speaker',
                    brand: 'Quantum',
                    model: 'QSB-200',
                    price: 6999,
                    discountPrice: 6499,
                    stock: 50,
                    connectivity: 'Bluetooth 5.0, Aux, USB',
                    features: ['Deep bass', 'Remote control', 'Wall mountable'],
                    specifications: { outputPower: '40W', channels: '2.1' },
                    category: 'Audio',
                    description: 'A compact soundbar designed to upgrade your laptop audio experience.',
                    warranty: '1 Year',
                    image: 'https://source.unsplash.com/800x600/?speaker',
                    rating: 4.4,
                    reviews: 92,
                    compatibility: ['Windows', 'macOS', 'Android'],
                    isActive: true,
                    views: 0,
                    sales: 0
                }
            ]);
            console.log('Accessories seeded.');
        } else {
            console.log(`Accessories already exist (${accessoryCount}). Skipping accessory seed.`);
        }

        const newsletterCount = await Newsletter.countDocuments();
        if (newsletterCount === 0) {
            console.log('Seeding newsletter signups...');
            await Newsletter.create([
                { email: 'newsletter@quantera.com', source: 'homepage_premium_box', active: true },
                { email: 'offers@quantera.com', source: 'footer', active: true }
            ]);
            console.log('Newsletter documents seeded.');
        } else {
            console.log(`Newsletter signups already exist (${newsletterCount}). Skipping newsletter seed.`);
        }

        const orderCount = await Order.countDocuments();
        if (orderCount === 0) {
            console.log('Seeding orders...');
            await Order.create([
                {
                    orderId: 'ORD-1001',
                    customer: { name: 'Guest Customer', email: 'guest@quantera.com', phone: '9876543210' },
                    items: [
                        {
                            productType: 'Laptop',
                            name: 'Quantum Blade 15',
                            brand: 'Quantum',
                            model: 'QB15-2026',
                            price: 129999,
                            quantity: 1,
                            subtotal: 129999,
                            specifications: { color: 'Black', memory: '32GB', storage: '1TB' }
                        }
                    ],
                    subtotal: 129999,
                    tax: 0,
                    shipping: 499,
                    discount: 0,
                    totalAmount: 130498,
                    shippingAddress: { street: '123 Sample Street', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
                    payment: { method: 'Credit Card', status: 'Completed' },
                    status: 'Processing',
                    orderDate: new Date(),
                    lastUpdated: new Date(),
                    isGuestOrder: true
                }
            ]);
            console.log('Orders seeded.');
        } else {
            console.log(`Orders already exist (${orderCount}). Skipping order seed.`);
        }

        console.log('✅ MongoDB seeding complete.');
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    } finally {
        await database.disconnect();
    }
}

seedDb();
