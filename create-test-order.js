require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

async function createTestOrder() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const dummyOrder = new Order({
            orderId: 'ORD-ERR-TEST',
            customer: {
                name: 'Test Customer',
                email: 'test@quantera.com',
                phone: '+1234567890'
            },
            items: [{
                productType: 'Laptop',
                name: 'Quantéra Xtreme Pro',
                price: 120000,
                quantity: 1,
                subtotal: 120000
            }],
            subtotal: 120000,
            tax: 12000,
            shipping: 500,
            totalAmount: 132500,
            shippingAddress: {
                street: '123 Fake',
                city: 'Testville',
                state: 'State',
                zipCode: '10001',
                country: 'India'
            },
            payment: {
                method: 'Credit Card',
                status: 'Completed'
            },
            status: 'Pending'
        });

        await dummyOrder.save();
        console.log('Saved');
        process.exit(0);
    } catch (error) {
        console.error('ERROR TRACE:');
        console.error(error.stack);
        process.exit(1);
    }
}
createTestOrder();
