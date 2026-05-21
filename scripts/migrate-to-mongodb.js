const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import database and models
const database = require('../config/database');
const User = require('../models/User');
const Laptop = require('../models/Laptop');
const Accessory = require('../models/Accessory');
const Order = require('../models/Order');

class DataMigration {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.migrationStats = {
            users: { success: 0, errors: 0 },
            laptops: { success: 0, errors: 0 },
            accessories: { success: 0, errors: 0 },
            orders: { success: 0, errors: 0 }
        };
    }

    async migrate() {
        try {
            console.log('🚀 Starting data migration to MongoDB Atlas...\n');
            
            // Connect to database
            await database.connect();
            
            // Clear existing data (optional - comment out if you want to keep existing data)
            await this.clearExistingData();
            
            // Migrate data
            await this.migrateUsers();
            await this.migrateLaptops();
            await this.migrateAccessories();
            await this.migrateOrders();
            
            // Print summary
            this.printMigrationSummary();
            
            console.log('\n✅ Migration completed successfully!');
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        } finally {
            await database.disconnect();
        }
    }

    async clearExistingData() {
        console.log('🧹 Clearing existing data...');
        
        try {
            await Promise.all([
                User.deleteMany({}),
                Laptop.deleteMany({}),
                Accessory.deleteMany({}),
                Order.deleteMany({})
            ]);
            console.log('✅ Existing data cleared\n');
        } catch (error) {
            console.warn('⚠️  Warning: Could not clear existing data:', error.message);
        }
    }

    async migrateUsers() {
        console.log('👥 Migrating users...');
        
        const usersFile = path.join(this.dataDir, 'users.json');
        
        if (!fs.existsSync(usersFile)) {
            console.log('📝 No users.json found, creating default admin user...');
            await this.createDefaultAdmin();
            return;
        }

        try {
            const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            
            for (const userData of usersData) {
                try {
                    const user = new User({
                        name: userData.name,
                        email: userData.email,
                        passwordHash: userData.passwordHash,
                        role: userData.role || 'user',
                        isActive: userData.isActive !== false,
                        lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : null,
                        resetToken: userData.resetToken || null,
                        resetTokenExpiry: userData.resetTokenExpiry ? new Date(userData.resetTokenExpiry) : null,
                        mfaEnabled: userData.mfaEnabled || false,
                        mfaSecret: userData.mfaSecret || null,
                        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                        updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date()
                    });
                    
                    await user.save();
                    this.migrationStats.users.success++;
                    
                } catch (error) {
                    console.error(`❌ Error migrating user ${userData.email}:`, error.message);
                    this.migrationStats.users.errors++;
                }
            }
            
        } catch (error) {
            console.error('❌ Error reading users.json:', error.message);
            await this.createDefaultAdmin();
        }
        
        console.log(`✅ Users migration completed: ${this.migrationStats.users.success} success, ${this.migrationStats.users.errors} errors\n`);
    }

    async createDefaultAdmin() {
        try {
            const adminUser = new User({
                name: 'Admin User',
                email: 'admin@quantera.com',
                passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // password: admin123
                role: 'admin',
                isActive: true
            });
            
            await adminUser.save();
            console.log('✅ Default admin user created (admin@quantera.com / admin123)');
            this.migrationStats.users.success++;
        } catch (error) {
            console.error('❌ Error creating default admin:', error.message);
            this.migrationStats.users.errors++;
        }
    }

    async migrateLaptops() {
        console.log('💻 Migrating laptops...');
        
        const laptopsFile = path.join(this.dataDir, 'laptops-full.json');
        
        if (!fs.existsSync(laptopsFile)) {
            console.log('⚠️  No laptops-full.json found, skipping laptop migration');
            return;
        }

        try {
            const laptopsData = JSON.parse(fs.readFileSync(laptopsFile, 'utf8'));
            
            for (const laptopData of laptopsData) {
                try {
                    const laptop = new Laptop({
                        brand: laptopData.brand,
                        series: laptopData.series,
                        modelNumber: laptopData.modelNumber || laptopData.model_name || 'Unknown',
                        sku: laptopData.sku,
                        launchYear: laptopData.launchYear || laptopData.year,
                        price: laptopData.price,
                        discountPrice: laptopData.discountPrice,
                        stock: laptopData.stock || 10,
                        category: laptopData.category || 'business',
                        
                        design: {
                            material: laptopData.material,
                            color: laptopData.color,
                            weight: laptopData.weight || laptopData.weight_kg,
                            dimensions: laptopData.dimensions,
                            hinge: laptopData.hinge,
                            milStd: laptopData.milStd || false
                        },
                        
                        display: {
                            size: laptopData.displaySize || laptopData.display_size_inch,
                            resolution: laptopData.resolution,
                            aspectRatio: laptopData.aspectRatio,
                            panelType: laptopData.panelType,
                            refreshRate: laptopData.refreshRate || laptopData.refresh_rate,
                            responseTime: laptopData.responseTime,
                            brightness: laptopData.brightness,
                            colorGamut: laptopData.colorGamut,
                            touchscreen: laptopData.touchscreen || false
                        },
                        
                        cpu: {
                            brand: laptopData.cpuBrand || laptopData.processor_brand,
                            model: laptopData.cpuModel || laptopData.processor_model,
                            cores: laptopData.cpuCores || 4,
                            pCores: laptopData.pCores || 0,
                            eCores: laptopData.eCores || 0,
                            threads: laptopData.threads || 8,
                            baseClock: laptopData.baseClock || 2.0,
                            boostClock: laptopData.boostClock || 3.0,
                            cache: laptopData.cache || 8,
                            npu: laptopData.npu || 0
                        },
                        
                        gpu: {
                            type: laptopData.gpuType || 'Integrated',
                            model: laptopData.gpuModel || laptopData.gpu || 'Integrated',
                            vram: laptopData.vram || 0,
                            tgp: laptopData.tgp || 0,
                            muxSwitch: laptopData.muxSwitch || false
                        },
                        
                        memory: {
                            capacity: laptopData.ramCapacity || laptopData.ram_gb || 8,
                            type: laptopData.ramType || 'DDR4',
                            speed: laptopData.ramSpeed || 3200,
                            speedUnit: laptopData.ramSpeedUnit || 'MHz',
                            slots: laptopData.ramSlots || '2x SO-DIMM',
                            maxSupported: laptopData.maxRam || 32
                        },
                        
                        storage: {
                            capacity: laptopData.storageCap || laptopData.storage_gb || 512,
                            type: laptopData.storageType || laptopData.storage_type || 'NVMe PCIe 4.0',
                            extraSlots: laptopData.extraSlots || 0
                        },
                        
                        connectivity: {
                            wifi: laptopData.wifi || 'Wi-Fi 6',
                            bluetooth: laptopData.bluetooth || '5.2',
                            ports: laptopData.ports || 'USB-C, USB-A, HDMI'
                        },
                        
                        multimedia: {
                            webcam: laptopData.webcam || '720p HD',
                            speakers: laptopData.speakers || '2x 2W Stereo'
                        },
                        
                        input: {
                            keyboard: laptopData.keyboard || 'Standard',
                            touchpad: laptopData.touchpad || 'Precision Touchpad'
                        },
                        
                        power: {
                            battery: laptopData.battery || laptopData.battery_wh || 50,
                            adapter: laptopData.adapter || 65
                        },
                        
                        software: {
                            os: laptopData.os || 'Windows 11 Home',
                            warranty: laptopData.warranty || '1 Year'
                        },
                        
                        images: laptopData.images || [],
                        image: laptopData.image || laptopData.image_url || 'https://source.unsplash.com/800x600/?laptop',
                        description: laptopData.description || `${laptopData.brand} ${laptopData.series} laptop`,
                        
                        isActive: true,
                        views: 0,
                        sales: 0
                    });
                    
                    await laptop.save();
                    this.migrationStats.laptops.success++;
                    
                } catch (error) {
                    console.error(`❌ Error migrating laptop ${laptopData.brand} ${laptopData.series}:`, error.message);
                    this.migrationStats.laptops.errors++;
                }
            }
            
        } catch (error) {
            console.error('❌ Error reading laptops-full.json:', error.message);
        }
        
        console.log(`✅ Laptops migration completed: ${this.migrationStats.laptops.success} success, ${this.migrationStats.laptops.errors} errors\n`);
    }

    async migrateAccessories() {
        console.log('🎧 Migrating accessories...');
        
        const accessoriesFile = path.join(this.dataDir, 'accessories.json');
        
        if (!fs.existsSync(accessoriesFile)) {
            console.log('⚠️  No accessories.json found, skipping accessories migration');
            return;
        }

        try {
            const accessoriesData = JSON.parse(fs.readFileSync(accessoriesFile, 'utf8'));
            
            for (const accessoryData of accessoriesData) {
                try {
                    const accessory = new Accessory({
                        name: accessoryData.name,
                        type: accessoryData.type,
                        brand: accessoryData.brand,
                        model: accessoryData.model,
                        price: accessoryData.price,
                        discountPrice: accessoryData.discountPrice,
                        stock: accessoryData.stock || 50,
                        connectivity: accessoryData.connectivity,
                        features: accessoryData.features || [],
                        specifications: accessoryData.specifications || {},
                        category: accessoryData.category,
                        description: accessoryData.description,
                        warranty: accessoryData.warranty || '1 Year',
                        images: accessoryData.images || [],
                        image: accessoryData.image || accessoryData.image_url || 'https://source.unsplash.com/800x600/?accessory',
                        rating: accessoryData.rating || 0,
                        reviews: accessoryData.reviews || 0,
                        isActive: true,
                        views: 0,
                        sales: 0
                    });
                    
                    await accessory.save();
                    this.migrationStats.accessories.success++;
                    
                } catch (error) {
                    console.error(`❌ Error migrating accessory ${accessoryData.name}:`, error.message);
                    this.migrationStats.accessories.errors++;
                }
            }
            
        } catch (error) {
            console.error('❌ Error reading accessories.json:', error.message);
        }
        
        console.log(`✅ Accessories migration completed: ${this.migrationStats.accessories.success} success, ${this.migrationStats.accessories.errors} errors\n`);
    }

    async migrateOrders() {
        console.log('📦 Migrating orders...');
        
        const ordersFile = path.join(this.dataDir, 'orders.json');
        
        if (!fs.existsSync(ordersFile)) {
            console.log('⚠️  No orders.json found, skipping orders migration');
            return;
        }

        try {
            const ordersData = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
            
            for (const orderData of ordersData) {
                try {
                    const order = new Order({
                        orderId: orderData.orderId,
                        customer: {
                            userId: null, // Will need to be linked manually if needed
                            name: orderData.customerName,
                            email: orderData.customerEmail,
                            phone: orderData.customerPhone
                        },
                        items: orderData.items || [],
                        subtotal: orderData.subtotal || orderData.totalAmount || 0,
                        tax: orderData.tax || 0,
                        shipping: orderData.shipping || 0,
                        discount: orderData.discount || 0,
                        totalAmount: orderData.totalAmount || 0,
                        shippingAddress: {
                            street: orderData.shippingAddress || 'Not provided',
                            city: 'Not provided',
                            state: 'Not provided',
                            zipCode: '000000',
                            country: 'India'
                        },
                        status: orderData.status || 'Pending',
                        payment: {
                            method: 'Not specified',
                            status: 'Pending'
                        },
                        orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date(),
                        lastUpdated: orderData.lastUpdated ? new Date(orderData.lastUpdated) : new Date(),
                        isGuestOrder: true
                    });
                    
                    await order.save();
                    this.migrationStats.orders.success++;
                    
                } catch (error) {
                    console.error(`❌ Error migrating order ${orderData.orderId}:`, error.message);
                    this.migrationStats.orders.errors++;
                }
            }
            
        } catch (error) {
            console.error('❌ Error reading orders.json:', error.message);
        }
        
        console.log(`✅ Orders migration completed: ${this.migrationStats.orders.success} success, ${this.migrationStats.orders.errors} errors\n`);
    }

    printMigrationSummary() {
        console.log('\n📊 Migration Summary:');
        console.log('═══════════════════════════════════════');
        console.log(`👥 Users:       ${this.migrationStats.users.success} migrated, ${this.migrationStats.users.errors} errors`);
        console.log(`💻 Laptops:     ${this.migrationStats.laptops.success} migrated, ${this.migrationStats.laptops.errors} errors`);
        console.log(`🎧 Accessories: ${this.migrationStats.accessories.success} migrated, ${this.migrationStats.accessories.errors} errors`);
        console.log(`📦 Orders:      ${this.migrationStats.orders.success} migrated, ${this.migrationStats.orders.errors} errors`);
        console.log('═══════════════════════════════════════');
        
        const totalSuccess = Object.values(this.migrationStats).reduce((sum, stat) => sum + stat.success, 0);
        const totalErrors = Object.values(this.migrationStats).reduce((sum, stat) => sum + stat.errors, 0);
        
        console.log(`📈 Total:       ${totalSuccess} migrated, ${totalErrors} errors`);
    }
}

// Run migration if called directly
if (require.main === module) {
    const migration = new DataMigration();
    migration.migrate()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = DataMigration;