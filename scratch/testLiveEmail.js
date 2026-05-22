require('dotenv').config();
const emailService = require('../services/email/emailService');
const { statusUpdate } = require('../services/email/templates/orderTemplates');

const fakeOrder = {
    orderId: 'QNT-LIVETEST-002',
    totalAmount: 284999,
    subtotal: 299999,
    discount: 15000,
    shipping: 0,
    customer: { name: 'Neel Luvani', email: 'the.quantera@gmail.com' },
    items: [
        {
            name: 'ASUS ROG Strix G16 Gaming Laptop',
            brand: 'ASUS',
            quantity: 1,
            price: 284999,
            subtotal: 284999,
            image: 'images/ASUS ROG STRIX G16.webp'  // real local image path
        }
    ],
    shippingAddress: {
        street: '49, Adarsh Society Near Akhand Anand Society',
        city: 'Surat',
        state: 'Gujarat',
        zipCode: '395004',
        country: 'India'
    },
    payment: { method: 'Cash on Delivery' },
    tracking: {
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    }
};

async function run() {
    // Test Order Confirmation
    console.log('Sending Order Confirmation email...');
    await emailService.sendOrderConfirmation(fakeOrder);
    console.log('Order Confirmation sent!');

    // Test Status Update
    console.log('Sending Status Update email (Processing)...');
    const html = statusUpdate(fakeOrder, 'Processing', 'Your order is being prepared by our team.');
    await emailService.sendEmail('the.quantera@gmail.com', 'Order Status Update: Processing', html, 'StatusUpdate', { orderId: fakeOrder.orderId });
    console.log('Status Update sent!');
}

run().catch(console.error);
