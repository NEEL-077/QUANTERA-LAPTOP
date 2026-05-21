// =====================================================
// ORDER TRACKING FUNCTIONALITY
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeOrderTracking();
    loadRecentOrders();
});

// Initialize order tracking
function initializeOrderTracking() {
    const trackingForm = document.getElementById('trackingForm');
    if (trackingForm) {
        trackingForm.addEventListener('submit', handleTrackingSubmit);
    }
    
    // Auto-fill order ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId) {
        const orderIdInput = document.getElementById('orderIdInput');
        if (orderIdInput) {
            orderIdInput.value = orderId;
            trackOrder(orderId);
        }
    }
}

// Handle tracking form submission
function handleTrackingSubmit(e) {
    e.preventDefault();
    const orderIdInput = document.getElementById('orderIdInput');
    const orderId = orderIdInput.value.trim();
    
    if (!orderId) {
        showError('Please enter an order ID');
        return;
    }
    
    trackOrder(orderId);
}

// Track order function
async function trackOrder(orderId) {
    const orderDetails = document.getElementById('orderDetails');
    const noOrderFound = document.getElementById('noOrderFound');
    
    // Hide previous results
    orderDetails.style.display = 'none';
    noOrderFound.style.display = 'none';
    
    try {
        // First try to get order from localStorage (for orders placed in this session)
        const localOrders = JSON.parse(localStorage.getItem('quantera_orders') || '[]');
        const localOrder = localOrders.find(order => order.orderId === orderId);
        
        if (localOrder) {
            displayOrderDetails(localOrder);
            return;
        }
        
        // If not found locally, try API call
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (response.ok) {
            const order = await response.json();
            displayOrderDetails(order);
        } else if (response.status === 404) {
            showNoOrderFound();
        } else {
            throw new Error('Server error');
        }
        
    } catch (error) {
        console.error('Error tracking order:', error);
        // For demo purposes, show sample order if API fails
        showSampleOrder(orderId);
    }
}

// Display order details
function displayOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');
    
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const estimatedDelivery = new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const statusColor = getStatusColor(order.status);
    const progressPercentage = getProgressPercentage(order.status);
    
    orderDetails.innerHTML = `
        <div class="order-card">
            <div class="order-header">
                <div class="order-id">${order.orderId}</div>
                <div class="status-badge" style="background: ${statusColor};">${order.status}</div>
            </div>
            
            <div class="order-info">
                <div class="info-item">
                    <strong>Order Date:</strong> ${orderDate}
                </div>
                <div class="info-item">
                    <strong>Estimated Delivery:</strong> ${estimatedDelivery}
                </div>
                <div class="info-item">
                    <strong>Total Amount:</strong> ₹${order.pricing.total.toLocaleString()}
                </div>
            </div>
            
            <!-- Progress Tracker -->
            <div class="progress-tracker">
                <div class="progress-line">
                    <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
                </div>
                ${generateProgressSteps(order.status)}
            </div>
            
            <!-- Order Details -->
            <div class="order-sections">
                <div class="order-section">
                    <h3>📦 Order Items</h3>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <div class="item-image">
                                    <img src="${item.image}" alt="${item.isAccessory ? item.name : `${item.brand} ${item.series}`}">
                                </div>
                                <div class="item-details">
                                    <div class="item-name">${item.isAccessory ? item.name : `${item.brand} ${item.series}`}</div>
                                    <div class="item-config">
                                        ${getItemConfiguration(item)}
                                        Quantity: ${item.quantity}
                                    </div>
                                    <div class="item-price">₹${(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="order-section">
                    <h3>👤 Customer Information</h3>
                    <div class="section-content">
                        <p><strong>Name:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
                        <p><strong>Email:</strong> ${order.customer.email}</p>
                        <p><strong>Phone:</strong> ${order.customer.phone}</p>
                    </div>
                </div>
                
                <div class="order-section">
                    <h3>📍 Shipping Address</h3>
                    <div class="section-content">
                        <p>${order.customer.address1}</p>
                        ${order.customer.address2 ? `<p>${order.customer.address2}</p>` : ''}
                        <p>${order.customer.city}, ${order.customer.state} ${order.customer.zipCode}</p>
                    </div>
                </div>
                
                <div class="order-section">
                    <h3>💳 Payment Information</h3>
                    <div class="section-content">
                        <p><strong>Method:</strong> ${getPaymentMethodName(order.payment.method)}</p>
                        <p><strong>Status:</strong> <span class="payment-status confirmed">Confirmed</span></p>
                    </div>
                </div>
                
                <div class="order-section">
                    <h3>🚚 Shipping Information</h3>
                    <div class="section-content">
                        <p><strong>Method:</strong> ${order.shipping.method.name}</p>
                        <p><strong>Delivery Time:</strong> ${order.shipping.method.description}</p>
                        <p><strong>Shipping Cost:</strong> ${order.shipping.method.price === 0 ? 'Free' : `₹${order.shipping.method.price}`}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    orderDetails.style.display = 'block';
}

// Get item configuration display
function getItemConfiguration(item) {
    if (!item.configuration) return '';
    
    const configItems = [];
    
    if (item.configuration.ram) {
        configItems.push(`RAM: ${item.configuration.ram.title}`);
    }
    
    if (item.configuration.storage) {
        configItems.push(`Storage: ${item.configuration.storage.title}`);
    }
    
    if (item.configuration.software && item.configuration.software.length > 0) {
        configItems.push(`Software: ${item.configuration.software.length} items`);
    }
    
    if (item.configuration.warranty) {
        configItems.push(`Warranty: ${item.configuration.warranty.title}`);
    }
    
    return configItems.length > 0 ? configItems.join(', ') + '<br>' : '';
}

// Generate progress steps
function generateProgressSteps(currentStatus) {
    const steps = [
        { name: 'Confirmed', icon: '✅' },
        { name: 'Processing', icon: '⚙️' },
        { name: 'Shipped', icon: '🚚' },
        { name: 'Delivered', icon: '📦' }
    ];
    
    const statusOrder = ['confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus.toLowerCase());
    
    return steps.map((step, index) => {
        let circleClass = '';
        let labelClass = '';
        
        if (currentStatus.toLowerCase() === 'cancelled') {
            // If cancelled, only show the first step as active
            if (index === 0) {
                circleClass = 'active';
                labelClass = 'active';
            }
        } else {
            if (index < currentIndex) {
                circleClass = 'completed';
            } else if (index === currentIndex) {
                circleClass = 'active';
                labelClass = 'active';
            }
        }
        
        return `
            <div class="progress-step">
                <div class="step-circle ${circleClass}">${step.icon}</div>
                <div class="step-label ${labelClass}">${step.name}</div>
            </div>
        `;
    }).join('');
}

// Get progress percentage
function getProgressPercentage(status) {
    const percentages = {
        'confirmed': 25,
        'processing': 50,
        'shipped': 75,
        'delivered': 100,
        'cancelled': 0
    };
    return percentages[status.toLowerCase()] || 0;
}

// Get status color
function getStatusColor(status) {
    const colors = {
        'confirmed': '#00d4ff',
        'processing': '#ffa500',
        'shipped': '#9370db',
        'delivered': '#2ed573',
        'cancelled': '#ff4757'
    };
    return colors[status.toLowerCase()] || '#aaa';
}

// Get payment method name
function getPaymentMethodName(method) {
    const methods = {
        'card': 'Credit/Debit Card',
        'upi': 'UPI Payment',
        'netbanking': 'Net Banking',
        'cod': 'Cash on Delivery'
    };
    return methods[method] || method;
}

// Show no order found
function showNoOrderFound() {
    const noOrderFound = document.getElementById('noOrderFound');
    noOrderFound.style.display = 'block';
}

// Show sample order for demo
function showSampleOrder(orderId) {
    const sampleOrder = {
        orderId: orderId,
        status: 'processing',
        orderDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        customer: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+91 9876543210',
            address1: '123 Sample Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001'
        },
        items: [
            {
                id: 1,
                brand: 'ASUS',
                series: 'ROG STRIX G16',
                image: 'images/ASUS ROG STRIX G16.webp',
                price: 89999,
                quantity: 1,
                configuration: {
                    ram: { title: '16GB DDR4' },
                    storage: { title: '1TB SSD' }
                }
            }
        ],
        pricing: {
            subtotal: 89999,
            shipping: 0,
            tax: 16199,
            discount: 0,
            total: 106198
        },
        payment: {
            method: 'card'
        },
        shipping: {
            method: {
                name: 'Standard Delivery',
                description: '5-7 business days',
                price: 0
            }
        }
    };
    
    displayOrderDetails(sampleOrder);
}

// Load recent orders
function loadRecentOrders() {
    const recentOrdersContainer = document.getElementById('recentOrders');
    if (!recentOrdersContainer) return;
    
    const orders = JSON.parse(localStorage.getItem('quantera_orders') || '[]');
    const recentOrders = orders.slice(0, 3); // Show last 3 orders
    
    if (recentOrders.length === 0) {
        recentOrdersContainer.innerHTML = '<p style="color: rgba(255, 255, 255, 0.6);">No recent orders found</p>';
        return;
    }
    
    recentOrdersContainer.innerHTML = recentOrders.map(order => `
        <button class="recent-order-btn" onclick="trackOrder('${order.orderId}')">
            <div class="recent-order-id">${order.orderId}</div>
            <div class="recent-order-date">${new Date(order.orderDate).toLocaleDateString()}</div>
            <div class="recent-order-status" style="color: ${getStatusColor(order.status)}">${order.status}</div>
        </button>
    `).join('');
}

// Reset tracking
function resetTracking() {
    const orderDetails = document.getElementById('orderDetails');
    const noOrderFound = document.getElementById('noOrderFound');
    const orderIdInput = document.getElementById('orderIdInput');
    
    orderDetails.style.display = 'none';
    noOrderFound.style.display = 'none';
    
    if (orderIdInput) {
        orderIdInput.value = '';
        orderIdInput.focus();
    }
}

// Show error message
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10001;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
