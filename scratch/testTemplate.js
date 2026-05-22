const { orderConfirmation, statusUpdate, adminNewOrder } = require('../services/email/templates/orderTemplates');

const fakeOrder = {
    orderId: 'QNT123456TEST',
    totalAmount: 284999,
    subtotal: 284999,
    discount: 0,
    shipping: 0,
    customer: {
        name: 'Neel Luvani',
        email: 'neel@example.com'
    },
    items: [
        {
            name: 'ASUS ROG Strix',
            brand: 'ASUS',
            quantity: 1,
            price: 284999,
            subtotal: 284999,
            image: '/images/products/asus-rog.jpg'
        }
    ],
    shippingAddress: {
        street: '49, Adarsh Society',
        city: 'Surat',
        state: 'Gujarat',
        zipCode: '395004',
        country: 'India'
    },
    payment: {
        method: 'Cash on Delivery'
    },
    tracking: {
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
};

try {
    console.log('Testing orderConfirmation...');
    const html1 = orderConfirmation(fakeOrder);
    console.log('orderConfirmation generated HTML length:', html1.length);
    
    console.log('Testing statusUpdate...');
    const html2 = statusUpdate(fakeOrder, 'Shipped', 'Your package left our facility');
    console.log('statusUpdate generated HTML length:', html2.length);

    console.log('Testing adminNewOrder...');
    const html3 = adminNewOrder(fakeOrder);
    console.log('adminNewOrder generated HTML length:', html3.length);

    console.log('All templates executed successfully!');
} catch (e) {
    console.error('Error generating templates:', e);
}
