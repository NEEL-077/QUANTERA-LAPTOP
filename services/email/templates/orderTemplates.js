const baseLayout = require('./baseLayout');

/**
 * Order Confirmation Template
 * Shows full order details including a product list.
 */
const orderConfirmation = (order) => {
    const { orderId, totalAmount, customer, items, shippingAddress, payment } = order;
    
    // Generate order item HTML
    const itemsHtml = items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 16px; color: #1a1a1a;">${item.name}</h4>
                <p style="margin: 5px 0; font-size: 13px; color: #888;">Qty: ${item.quantity} x ₹${item.price.toLocaleString()}</p>
            </div>
            <div style="font-weight: 700; color: #1a1a1a;">
                ₹${item.subtotal.toLocaleString()}
            </div>
        </div>
    `).join('');

    const content = `
        <p>Hi ${customer.name},</p>
        <p>Thank you for choosing <strong>Quantéra</strong>. We've received your order and are getting it ready for shipment. You'll receive another email with tracking details once it's on the way.</p>
        
        <div style="background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <h3 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 15px;">Order Summary</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Payment Method:</strong> ${payment.method}</p>
            
            <div style="height: 1px; background: #eee; margin: 20px 0;"></div>
            
            ${itemsHtml}
            
            <div style="text-align: right; margin-top: 20px;">
                <p style="font-size: 14px; color: #888; margin-bottom: 5px;">Total Amount</p>
                <h2 style="margin: 0; color: #000; font-size: 28px;">₹${totalAmount.toLocaleString()}</h2>
            </div>
        </div>

        <div style="margin-top: 30px;">
            <h3 style="font-size: 18px; margin-bottom: 15px;">Shipping Address</h3>
            <p style="color: #666; line-height: 1.6;">
                ${shippingAddress.street}<br>
                ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                ${shippingAddress.country}
            </p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 15px; margin-top: 30px; text-align: center;">
            <p style="color: #166534; font-size: 14px; margin: 0;">🎉 We'll notify you as soon as your order has been processed.</p>
        </div>
    `;

    return baseLayout('Order Confirmed', content, 'Track Order', `/order-tracking?id=${orderId}`);
};

/**
 * Order Status Update Template
 * Notifies the customer of status changes (Processing, Shipped, etc.)
 */
const statusUpdate = (order, status, note = '') => {
    const { orderId, customer } = order;
    
    let title = 'Order Update';
    let heroMessage = `Your order status is now: ${status}`;
    let icon = '🔄';

    if (status === 'Shipped') {
        title = 'Order Shipped';
        heroMessage = 'Your order is on the way!';
        icon = '🚚';
    } else if (status === 'Delivered') {
        title = 'Order Delivered';
        heroMessage = 'Your package has arrived!';
        icon = '📦';
    }

    const content = `
        <p>Hi ${customer.name},</p>
        <p>This is a quick update regarding your order <strong style="color: #000;">${orderId}</strong>.</p>
        
        <!-- Premium Visual Status Tracker -->
        <div style="margin: 40px 0; padding: 20px; background: #fdfdfd; border: 1px solid #eee; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; position: relative; margin-bottom: 10px;">
                <!-- Connector Line -->
                <div style="position: absolute; top: 15px; left: 10%; right: 10%; height: 2px; background: #eee; z-index: 1;"></div>
                <div style="position: absolute; top: 15px; left: 10%; width: ${status === 'Placed' ? '0%' : status === 'Processing' ? '33%' : status === 'Shipped' ? '66%' : '80%'}; height: 2px; background: #00e5ff; z-index: 2; transition: all 0.5s;"></div>

                <!-- Steps -->
                <div style="z-index: 3; text-align: center; width: 20%;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: #00e5ff; color: #000; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 14px; font-weight: bold;">✓</div>
                    <span style="font-size: 11px; font-weight: 600; color: #000;">Placed</span>
                </div>
                <div style="z-index: 3; text-align: center; width: 20%;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: ${['Processing', 'Shipped', 'Delivered'].includes(status) ? '#00e5ff' : '#eee'}; color: ${['Processing', 'Shipped', 'Delivered'].includes(status) ? '#000' : '#888'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 14px; font-weight: bold;">${['Shipped', 'Delivered'].includes(status) ? '✓' : '2'}</div>
                    <span style="font-size: 11px; font-weight: ${status === 'Processing' ? '800' : '600'}; color: ${['Processing', 'Shipped', 'Delivered'].includes(status) ? '#000' : '#888'};">Processing</span>
                </div>
                <div style="z-index: 3; text-align: center; width: 20%;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: ${['Shipped', 'Delivered'].includes(status) ? '#00e5ff' : '#eee'}; color: ${['Shipped', 'Delivered'].includes(status) ? '#000' : '#888'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 14px; font-weight: bold;">${status === 'Delivered' ? '✓' : '3'}</div>
                    <span style="font-size: 11px; font-weight: ${status === 'Shipped' ? '800' : '600'}; color: ${['Shipped', 'Delivered'].includes(status) ? '#000' : '#888'};">Shipped</span>
                </div>
                <div style="z-index: 3; text-align: center; width: 20%;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: ${status === 'Delivered' ? '#28a745' : '#eee'}; color: ${status === 'Delivered' ? '#fff' : '#888'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-size: 14px; font-weight: bold;">${status === 'Delivered' ? '✓' : '4'}</div>
                    <span style="font-size: 11px; font-weight: ${status === 'Delivered' ? '800' : '600'}; color: ${status === 'Delivered' ? '#28a745' : '#888'};">Delivered</span>
                </div>
            </div>
        </div>

        <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 50px; margin-bottom: 15px;">${icon}</div>
            <h2 style="margin: 0; font-size: 24px; color: #1a1a1a;">${status}</h2>
            ${note ? `<p style="color: #666; margin-top: 10px; font-style: italic;">"${note}"</p>` : ''}
        </div>

        <div class="divider"></div>
        
        <p>You can track the progress of your shipment anytime by clicking the button below. Thank you for your patience and for shopping with us.</p>
    `;

    return baseLayout(title, content, 'View Tracking Details', `/order-tracking?id=${orderId}`);
};

/**
 * Admin Notification Template
 * Alerts administrators of a new order.
 */
const adminNewOrder = (order) => {
    const { orderId, totalAmount, customer } = order;
    
    const content = `
        <h3 style="color: #1a1a1a;">🚨 New Order Received</h3>
        <p>A new order has been successfully placed on the Quantéra Store.</p>
        
        <div style="background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer:</strong> ${customer.name} (${customer.email})</p>
            <p><strong>Amount:</strong> ₹${totalAmount.toLocaleString()}</p>
        </div>

        <p>Please log in to the admin panel to process this order and ensure prompt shipment.</p>
    `;

    return baseLayout('New Admin Alert', content, 'Go to Dashboard', '/admin?tab=orders');
};

module.exports = {
    orderConfirmation,
    statusUpdate,
    adminNewOrder
};
