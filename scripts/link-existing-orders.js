require('dotenv').config();
const mongoose = require('mongoose');
const database = require('../config/database');
const User = require('../models/User');
const Order = require('../models/Order');

async function migrateOrders() {
    try {
        console.log('Connecting to database...');
        await database.connect();
        
        const users = await User.find({});
        console.log(`Found ${users.length} users. Starting migration...`);
        
        let totalLinked = 0;

        for (const user of users) {
            console.log(`Checking orders for: ${user.email} (${user.name})`);
            
            // Find orders with this email that are currently "Guest Orders" (no userId)
            const result = await Order.updateMany(
                { 
                    'customer.email': user.email.toLowerCase(),
                    'customer.userId': null 
                },
                { 
                    $set: { 
                        'customer.userId': user._id,
                        isGuestOrder: false 
                    } 
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`Successfully linked ${result.modifiedCount} orders to ${user.name}`);
                totalLinked += result.modifiedCount;
            }
        }

        console.log('===================================');
        console.log(`Migration Complete! Total orders linked: ${totalLinked}`);
        console.log('===================================');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await database.disconnect();
        process.exit(0);
    }
}

migrateOrders();
