// =====================================================
// SHOPPING CART FUNCTIONALITY
// =====================================================

let cart = [];
let allLaptops = [];

// Initialize cart page
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadRecommendations();
    setupEventListeners();
});

// Load cart from localStorage
function loadCart() {
    cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');
    renderCart();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('checkoutBtn').addEventListener('click', proceedToCheckout);
}

// Render cart
function renderCart() {
    const cartContent = document.getElementById('cartContent');
    const cartSummary = document.getElementById('cartSummary');
    const emptyCart = document.getElementById('emptyCart');

    if (cart.length === 0) {
        cartContent.innerHTML = '';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'flex';
        return;
    }

    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';

    // Render cart items
    const cartItemsHTML = `
        <div class="cart-items">
            ${cart.map(item => createCartItemHTML(item)).join('')}
        </div>
    `;

    cartContent.innerHTML = cartItemsHTML;

    // Update summary
    updateCartSummary();
}

// Create cart item HTML
function createCartItemHTML(item) {
    const savings = item.originalPrice > item.price ? item.originalPrice - item.price : 0;
    const totalPrice = item.price * item.quantity;

    // Build configuration display
    let configurationHTML = '';
    if (item.configuration) {
        const configItems = [];

        if (item.configuration.ram) {
            configItems.push(`RAM: ${item.configuration.ram.title}`);
        }

        if (item.configuration.storage) {
            configItems.push(`Storage: ${item.configuration.storage.title}`);
        }

        if (item.configuration.software && item.configuration.software.length > 0) {
            configItems.push(`Software: ${item.configuration.software.map(s => s.title).join(', ')}`);
        }

        if (item.configuration.warranty) {
            configItems.push(`Warranty: ${item.configuration.warranty.title}`);
        }

        if (configItems.length > 0) {
            configurationHTML = `
                <div class="item-configuration">
                    <strong>Configuration:</strong>
                    <ul class="config-list">
                        ${configItems.map(config => `<li>${config}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    // Build pricing display
    let pricingHTML = `<span class="current-price">₹${item.price.toLocaleString()}</span>`;

    if (item.upgrades && item.upgrades > 0) {
        pricingHTML = `
            <span class="base-price">Base: ₹${item.originalPrice.toLocaleString()}</span>
            <span class="upgrades-price">Upgrades: +₹${item.upgrades.toLocaleString()}</span>
            <span class="current-price">Total: ₹${item.price.toLocaleString()}</span>
        `;
    } else if (item.originalPrice > item.price) {
        pricingHTML += `
            <span class="original-price">₹${item.originalPrice.toLocaleString()}</span>
            <span class="savings">Save ₹${savings.toLocaleString()}</span>
        `;
    }

    return `
        <div class="cart-item" data-item-id="${item.id}">
            <div class="item-image">
                <img src="${item.image}" alt="${item.isAccessory ? item.name : `${item.brand} ${item.series}`}">
            </div>
            <div class="item-details">
                <div class="item-title">${item.isAccessory ? item.name : `${item.brand} ${item.series}`}</div>
                <div class="item-specs">
                    ${item.isAccessory ?
            `${item.type} by ${item.brand}` :
            (item.specs || 'High-performance laptop with premium features')
        }
                </div>
                ${configurationHTML}
                <div class="item-price">
                    ${pricingHTML}
                </div>
            </div>
            <div class="item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" onchange="updateQuantity('${item.id}', this.value)">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})" ${item.quantity >= 10 ? 'disabled' : ''}>+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        </div>
    `;
}

// Update quantity
function updateQuantity(itemId, newQuantity) {
    newQuantity = parseInt(newQuantity);

    if (newQuantity < 1 || newQuantity > 10) {
        showMessage('Quantity must be between 1 and 10', 'error');
        return;
    }

    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity;
        saveCart();
        renderCart();
        showMessage('Quantity updated', 'success');
    }
}

// Remove from cart
function removeFromCart(itemId) {
    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);

    if (itemElement) {
        itemElement.classList.add('removing');

        setTimeout(() => {
            cart = cart.filter(item => item.id !== itemId);
            saveCart();
            renderCart();
            showMessage('Item removed from cart', 'success');
        }, 300);
    }
}

// Update cart summary
function updateCartSummary() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const grossTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingThreshold = 50000;
    const shipping = grossTotal > shippingThreshold || grossTotal === 0 ? 0 : 500;
    const taxRate = 0.18; // 18% GST

    // Standard Inclusive Tax Extraction:
    // Base (Net) = Total_Inclusive / (1 + Rate)
    // Tax_Component = Total_Inclusive - Base
    const subtotalBase = grossTotal / (1 + taxRate);
    const taxAmount = Math.round(grossTotal - subtotalBase);
    
    // Final Total customer pays
    const finalTotal = grossTotal + shipping;

    document.getElementById('itemCount').textContent = itemCount;
    document.getElementById('subtotal').textContent = `₹${Math.round(subtotalBase).toLocaleString()}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'Free' : `₹${shipping.toLocaleString()}`;
    document.getElementById('tax').textContent = `₹${taxAmount.toLocaleString()}`;
    document.getElementById('total').textContent = `₹${finalTotal.toLocaleString()}`;

    // Update checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = cart.length === 0;
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('quantera_cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count in navbar
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update cart count in navbar if exists
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }

    // Dispatch event for navbar to update
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

// Load recommendations
async function loadRecommendations() {
    try {
        const response = await fetch('/api/laptops/featured');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        allLaptops = await response.json();
        renderRecommendations();

    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// Render recommendations
function renderRecommendations() {
    if (!allLaptops.length) return;

    const recommendationsSection = document.getElementById('recommendations');
    const recommendedProducts = document.getElementById('recommendedProducts');

    // Get random recommendations (exclude items already in cart)
    const cartItemIds = cart.map(item => item.id);
    const availableProducts = allLaptops.filter(laptop => !cartItemIds.includes(laptop.id));
    const recommendations = getRandomItems(availableProducts, 4);

    if (recommendations.length === 0) {
        recommendationsSection.style.display = 'none';
        return;
    }

    recommendationsSection.style.display = 'block';

    const brandImageMap = {
        'ASUS': 'images/ASUS ROG STRIX G16.webp',
        'Dell': 'images/DELL ALIEANWARE.webp',
        'HP': 'images/HP ENVY.webp',
        'Lenovo': 'images/MACBOOK PRO.jpg',
        'Acer': 'images/ACER HELIOS.jpg',
        'MSI': 'images/MSI RAIDER.jpg',
        'Apple': 'images/MACBOOK PRO.jpg',
        'Razer': 'images/ASUS ROG ZEPHYRUS.webp'
    };

    recommendedProducts.innerHTML = recommendations.map(product => {
        const image = brandImageMap[product.brand] || 'images/ASUS ROG STRIX G16.webp';
        const price = product.discountPrice || product.price;

        return `
            <div class="recommended-item" onclick="goToProduct(${product.id})">
                <div class="recommended-image">
                    <img src="${image}" alt="${product.brand} ${product.series}">
                </div>
                <div class="recommended-info">
                    <h4>${product.brand} ${product.series || product.modelNumber}</h4>
                    <div class="recommended-price">₹${price.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Get random items from array
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Navigate to product
function goToProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showMessage('Your cart is empty', 'error');
        return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('q_access') || sessionStorage.getItem('q_access');

    if (!token) {
        // Redirect to login with return URL
        sessionStorage.setItem('q_returnTo', 'cart.html');
        window.location.href = 'auth.html';
        return;
    }

    // Redirect to checkout page
    showMessage('Redirecting to checkout...', 'success');

    setTimeout(() => {
        window.location.href = 'checkout.html';
    }, 1000);
}

// Show message
function showMessage(message, type = 'info') {
    if (window.QuanteraUI && window.QuanteraUI.showAlert) {
        const titleMap = {
            'success': 'Cart Updated',
            'error': 'Cart Error',
            'info': 'Notice'
        };
        
        window.QuanteraUI.showAlert({
            title: titleMap[type] || 'Notice',
            description: message,
            variant: type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info'),
            duration: 3500
        });
    } else {
        // Fallback if script not loaded
        console.log(`[Notification] ${type}: ${message}`);
        alert(message);
    }
}

// Initialize cart count on page load
updateCartCount();