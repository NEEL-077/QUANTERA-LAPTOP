const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('../models/Order');
const Address = require('../models/Address');
const User = require('../models/User');

async function fixOrphanOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Based on session logs, Neel Luvani is logged in as sachaparaom15@gmail.com
        const targetUserId = '69de22dff15dd726d3b54d75'; 
        const emailsToMigrate = ['neel.luvani11@gmail.com', 'sachaparaom15@gmail.com'];
        
        // 1. Verify user exists
        const user = await User.findById(targetUserId);
        if (!user) {
            console.error(`Target User ID ${targetUserId} not found.`);
            process.exit(1);
        }
        console.log(`Found Target User: ${user.name} (${user.email})`);

        // 2. Find orphan orders for these emails
        const orphanOrders = await Order.find({ 
            'customer.email': { $in: emailsToMigrate },
            'customer.userId': null 
        });

        console.log(`Found ${orphanOrders.length} orphan orders.`);

        for (const order of orphanOrders) {
            order.customer.userId = targetUserId;
            await order.save();
            console.log(`Linked Order ${order.orderId} (Email: ${order.customer.email}) to User Account`);

            // 3. Save the address to profile if it's the Neel address
            if (order.customer.email === 'neel.luvani11@gmail.com') {
                const addr = order.shippingAddress;
                // Double check if address exists
                const existingAddress = await Address.findOne({
                    userId: targetUserId,
                    street: addr.street,
                    zipCode: addr.zipCode
                });

                if (!existingAddress) {
                    const newAddress = new Address({
                        userId: targetUserId,
                        label: 'Checkout (Restored)',
                        fullName: 'NEEL LUVANI',
                        phoneNumber: order.customer.phone,
                        street: addr.street,
                        city: addr.city,
                        state: addr.state,
                        zipCode: addr.zipCode,
                        country: addr.country || 'India',
                        isDefaultShipping: false
                    });
                    await newAddress.save();
                    console.log(`Saved address from order ${order.orderId} to user profile.`);
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

fixOrphanOrders();
