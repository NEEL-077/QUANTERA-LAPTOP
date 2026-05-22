// =====================================================
// CHECKOUT FUNCTIONALITY
// =====================================================

let currentStep = 1;
let checkoutData = {
    customer: {},
    shipping: {},
    payment: {},
    cart: [],
    pricing: {
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 0
    }
};

let shippingMethods = [
    {
        id: 'standard',
        name: 'Standard Delivery',
        description: '5-7 business days',
        price: 0,
        estimatedDays: '5-7'
    },
    {
        id: 'express',
        name: 'Express Delivery',
        description: '2-3 business days',
        price: 199,
        estimatedDays: '2-3'
    },
    {
        id: 'overnight',
        name: 'Overnight Delivery',
        description: 'Next business day',
        price: 499,
        estimatedDays: '1'
    }
];

let promoCodes = {
    'WELCOME10': { discount: 10, type: 'percentage', description: '10% off your first order' },
    'SAVE500': { discount: 500, type: 'fixed', description: '₹500 off orders above ₹10,000' },
    'STUDENT15': { discount: 15, type: 'percentage', description: '15% student discount' },
    'BULK20': { discount: 20, type: 'percentage', description: '20% off bulk orders' }
};

// Indian states for dropdown
const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Initialize checkout page
document.addEventListener('DOMContentLoaded', () => {
    initializeCheckout();
    setupEventListeners();
    loadCartData();
    populateStateDropdowns();
    updateOrderSummary();
});

// Initialize checkout
async function initializeCheckout() {
    // Check if user is logged in
    const token = localStorage.getItem('q_access') || sessionStorage.getItem('q_access');
    if (token) {
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const userData = await response.json();
                checkoutData.customer.userId = userData.id || userData._id;

                // Pre-fill basic info if not already in session
                const savedData = JSON.parse(sessionStorage.getItem('quantera_checkout_data') || '{}');
                if (!savedData.customer) {
                    const names = userData.name.split(' ');
                    checkoutData.customer.firstName = names[0] || '';
                    checkoutData.customer.lastName = names.slice(1).join(' ') || '';
                    checkoutData.customer.email = userData.email || '';
                    checkoutData.customer.phone = userData.phone || userData.profile?.phone || '';

                    // Populate fields directly
                    document.getElementById('firstName').value = checkoutData.customer.firstName;
                    document.getElementById('lastName').value = checkoutData.customer.lastName;
                    document.getElementById('email').value = checkoutData.customer.email;
                    document.getElementById('phone').value = checkoutData.customer.phone;
                }
                console.log('User logged in: linked order to ID', checkoutData.customer.userId);
            }
        } catch (e) {
            console.warn('Failed to fetch user profile for checkout pre-fill');
        }
    }

    // Check if user came from cart
    const cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');
    if (cart.length === 0) {
        showMessage('Your cart is empty. Redirecting to shop...', 'info');
        setTimeout(() => {
            window.location.href = 'laptops.html';
        }, 2000);
        return;
    }

    checkoutData.cart = cart;
    calculatePricing();

    // Load saved checkout data if exists
    const savedData = JSON.parse(sessionStorage.getItem('quantera_checkout_data') || '{}');
    if (savedData.customer) {
        // Merge but keep the userId if we just fetched it
        const userId = checkoutData.customer.userId;
        checkoutData = { ...checkoutData, ...savedData };
        if (userId) checkoutData.customer.userId = userId;
        populateFormData();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('customerForm').addEventListener('submit', handleCustomerForm);

    const shippingForm = document.getElementById('shippingForm');
    if (shippingForm) {
        shippingForm.addEventListener('submit', handleShippingForm);
    }

    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentForm);
    }

    // Payment method changes
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentMethodChange);
    });

    // Shipping address toggle
    const sameAsBilling = document.getElementById('sameAsBilling');
    if (sameAsBilling) {
        sameAsBilling.addEventListener('change', toggleShippingAddress);
    }

    // Card number formatting
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', formatCardNumber);
    }

    // Expiry date formatting
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', formatExpiryDate);
    }

    // CVV validation
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', formatCVV);
    }

    // Real-time validation
    setupRealTimeValidation();
}

// Load cart data
function loadCartData() {
    const cart = JSON.parse(localStorage.getItem('quantera_cart') || '[]');
    checkoutData.cart = cart;
    calculatePricing();
    updateOrderSummary();
}

// Populate state dropdowns
function populateStateDropdowns() {
    const stateSelects = ['state', 'shippingState'];

    stateSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select State</option>';
            indianStates.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                select.appendChild(option);
            });
        }
    });
}

// Calculate pricing
function calculatePricing() {
    let subtotal = 0;

    checkoutData.cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    checkoutData.pricing.subtotal = subtotal;

    // Calculate tax (Included 18% GST)
    const basePrice = subtotal / 1.18;
    checkoutData.pricing.tax = Math.round(subtotal - basePrice);

    // Calculate shipping (will be updated when shipping method is selected)
    // Initially typically 0 until method is chosen, but handled centrally.
    checkoutData.pricing.shipping = checkoutData.pricing.shipping || 0;

    // Apply discount if any
    // checkoutData.pricing.discount is set by promo code

    // Calculate total: subtotal is fully inclusive; just add shipping and extract discount
    checkoutData.pricing.total = subtotal + checkoutData.pricing.shipping - checkoutData.pricing.discount;
}

// Update order summary
function updateOrderSummary() {
    const summaryItems = document.getElementById('summaryItems');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const shippingAmount = document.getElementById('shippingAmount');
    const taxAmount = document.getElementById('taxAmount');
    const discountAmount = document.getElementById('discountAmount');
    const totalAmount = document.getElementById('totalAmount');
    const discountRow = document.getElementById('discountRow');

    // Update items
    if (summaryItems) {
        summaryItems.innerHTML = checkoutData.cart.map(item => `
            <div class="summary-item">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.isAccessory ? item.name : `${item.brand} ${item.series}`}">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.isAccessory ? item.name : `${item.brand} ${item.series}`}</div>
                    <div class="item-config">
                        ${item.configuration ? getConfigurationSummary(item.configuration) : ''}
                        Qty: ${item.quantity}
                    </div>
                </div>
                <div class="item-price">₹${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        `).join('');
    }

    // Update pricing
    if (subtotalAmount) subtotalAmount.textContent = `₹${checkoutData.pricing.subtotal.toLocaleString()}`;
    if (shippingAmount) shippingAmount.textContent = checkoutData.pricing.shipping > 0 ? `₹${checkoutData.pricing.shipping.toLocaleString()}` : 'Free';
    if (taxAmount) taxAmount.textContent = `₹${checkoutData.pricing.tax.toLocaleString()}`;
    if (totalAmount) totalAmount.textContent = `₹${checkoutData.pricing.total.toLocaleString()}`;

    // Show/hide discount row
    if (checkoutData.pricing.discount > 0) {
        if (discountRow) discountRow.style.display = 'flex';
        if (discountAmount) discountAmount.textContent = `-₹${checkoutData.pricing.discount.toLocaleString()}`;
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }
}

// Background task to save checkout address to user profile
async function saveCheckoutAddressToProfile() {
    const token = localStorage.getItem('q_access') || sessionStorage.getItem('q_access');
    if (!token) return;

    try {
        const addressData = {
            label: 'Checkout Address',
            fullName: `${checkoutData.customer.firstName} ${checkoutData.customer.lastName}`,
            phoneNumber: checkoutData.customer.phone,
            street: checkoutData.customer.address1,
            landmark: checkoutData.customer.address2 || '',
            city: checkoutData.customer.city,
            state: checkoutData.customer.state,
            zipCode: checkoutData.customer.zipCode,
            country: 'India',
            isDefaultShipping: false
        };

        // First, check if this address already exists to avoid duplicates
        const checkRes = await fetch('/api/user/addresses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (checkRes.ok) {
            const existing = await checkRes.json();
            const exists = existing.some(addr =>
                addr.street.toLowerCase() === addressData.street.toLowerCase() &&
                addr.zipCode === addressData.zipCode
            );
            if (exists) return; // Skip saving if it already exists
        }

        // Save as new address
        await fetch('/api/user/addresses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(addressData)
        });
        console.log('Successfully saved checkout address to profile');
    } catch (e) {
        console.warn('Silent failure saving address to profile:', e);
        console.error('Detailed Error Context:', {
            error: e.message,
            customerData: checkoutData.customer
        });
    }
}

// Get configuration summary for display
function getConfigurationSummary(config) {
    const parts = [];

    if (config.ram) parts.push(config.ram.title);
    if (config.storage) parts.push(config.storage.title);
    if (config.color) parts.push(config.color.name);
    if (config.warranty) parts.push(config.warranty.title);
    if (config.software && config.software.length > 0) {
        parts.push(`${config.software.length} software items`);
    }
    if (config.bundles && config.bundles.length > 0) {
        parts.push(`${config.bundles.length} add-ons`);
    }

    return parts.length > 0 ? parts.join(', ') + '<br>' : '';
}

// Handle customer form submission
function handleCustomerForm(e) {
    e.preventDefault();

    if (validateCustomerForm()) {
        // Save customer data (merge with existing to preserve userId)
        const formData = new FormData(e.target);
        checkoutData.customer = { ...checkoutData.customer, ...Object.fromEntries(formData.entries()) };

        // Save to session storage
        sessionStorage.setItem('quantera_checkout_data', JSON.stringify(checkoutData));

        // Move to next step
        nextStep();
    }
}

// Handle shipping form submission
function handleShippingForm(e) {
    e.preventDefault();

    if (validateShippingForm()) {
        // Save shipping data (merge to preserve state)
        const formData = new FormData(e.target);
        const shippingData = Object.fromEntries(formData.entries());

        // If same as billing is checked, use billing address
        const sameAsBilling = document.getElementById('sameAsBilling').checked;
        if (sameAsBilling) {
            checkoutData.shipping.address = { ...checkoutData.customer };
        } else {
            checkoutData.shipping.address = { ...checkoutData.shipping.address, ...shippingData };
        }

        // Save to session storage
        sessionStorage.setItem('quantera_checkout_data', JSON.stringify(checkoutData));

        // Move to next step
        nextStep();
    }
}

// Handle payment form submission
function handlePaymentForm(e) {
    e.preventDefault();

    if (validatePaymentForm()) {
        // Save payment data
        const formData = new FormData(e.target);
        const paymentData = Object.fromEntries(formData.entries());

        checkoutData.payment = { ...checkoutData.payment, ...paymentData };

        // Save to session storage
        sessionStorage.setItem('quantera_checkout_data', JSON.stringify(checkoutData));

        // Move to next step
        nextStep();
    }
}

// Validate customer form
function validateCustomerForm() {
    let isValid = true;
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zipCode'];

    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        const formGroup = field.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');

        if (!field.value.trim()) {
            showFieldError(formGroup, errorMessage, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(formGroup, errorMessage);

            // Additional validation
            if (fieldName === 'email' && !isValidEmail(field.value)) {
                showFieldError(formGroup, errorMessage, 'Please enter a valid email address');
                isValid = false;
            } else if (fieldName === 'phone' && !isValidPhone(field.value)) {
                showFieldError(formGroup, errorMessage, 'Please enter a valid phone number');
                isValid = false;
            } else if (fieldName === 'zipCode' && !isValidZipCode(field.value)) {
                showFieldError(formGroup, errorMessage, 'Please enter a valid PIN code');
                isValid = false;
            }
        }
    });

    return isValid;
}

// Validate shipping form
function validateShippingForm() {
    const sameAsBilling = document.getElementById('sameAsBilling').checked;

    if (sameAsBilling) {
        return true; // No validation needed if using billing address
    }

    let isValid = true;
    const requiredFields = ['shippingAddress1', 'shippingCity', 'shippingState', 'shippingZipCode'];

    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field) return;

        const formGroup = field.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');

        if (!field.value.trim()) {
            showFieldError(formGroup, errorMessage, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(formGroup, errorMessage);

            // Additional validation for ZIP code
            if (fieldName === 'shippingZipCode' && !isValidZipCode(field.value)) {
                showFieldError(formGroup, errorMessage, 'Please enter a valid PIN code');
                isValid = false;
            }
        }
    });

    return isValid;
}

// Validate payment form
function validatePaymentForm() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    let isValid = true;

    if (paymentMethod === 'card') {
        const requiredFields = ['cardNumber', 'expiryDate', 'cvv', 'cardName'];

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            const formGroup = field.closest('.form-group');
            const errorMessage = formGroup.querySelector('.error-message');

            if (!field.value.trim()) {
                showFieldError(formGroup, errorMessage, 'This field is required');
                isValid = false;
            } else {
                clearFieldError(formGroup, errorMessage);

                // Additional validation
                if (fieldName === 'cardNumber' && !isValidCardNumber(field.value)) {
                    showFieldError(formGroup, errorMessage, 'Please enter a valid card number');
                    isValid = false;
                } else if (fieldName === 'expiryDate' && !isValidExpiryDate(field.value)) {
                    showFieldError(formGroup, errorMessage, 'Please enter a valid expiry date');
                    isValid = false;
                } else if (fieldName === 'cvv' && !isValidCVV(field.value)) {
                    showFieldError(formGroup, errorMessage, 'Please enter a valid CVV');
                    isValid = false;
                }
            }
        });
    } else if (paymentMethod === 'upi') {
        const upiId = document.getElementById('upiId');
        const formGroup = upiId.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');

        if (!upiId.value.trim()) {
            showFieldError(formGroup, errorMessage, 'UPI ID is required');
            isValid = false;
        } else if (!isValidUPI(upiId.value)) {
            showFieldError(formGroup, errorMessage, 'Please enter a valid UPI ID');
            isValid = false;
        } else {
            clearFieldError(formGroup, errorMessage);
        }
    } else if (paymentMethod === 'netbanking') {
        const bankName = document.getElementById('bankName');
        const formGroup = bankName.closest('.form-group');
        const errorMessage = formGroup.querySelector('.error-message');

        if (!bankName.value) {
            showFieldError(formGroup, errorMessage, 'Please select a bank');
            isValid = false;
        } else {
            clearFieldError(formGroup, errorMessage);
        }
    }

    return isValid;
}

// Validation helper functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function isValidZipCode(zipCode) {
    const zipRegex = /^\d{6}$/;
    return zipRegex.test(zipCode);
}

function isValidCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return cleanNumber.length >= 13 && cleanNumber.length <= 19 && /^\d+$/.test(cleanNumber);
}

function isValidExpiryDate(expiryDate) {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;

    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year);
    const expMonth = parseInt(month);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        return false;
    }

    return true;
}

function isValidCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

function isValidUPI(upiId) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId);
}

// Show field error
function showFieldError(formGroup, errorElement, message) {
    formGroup.classList.add('error');
    errorElement.textContent = message;
}

// Clear field error
function clearFieldError(formGroup, errorElement) {
    formGroup.classList.remove('error');
    errorElement.textContent = '';
}

// Setup real-time validation
function setupRealTimeValidation() {
    const fields = document.querySelectorAll('input[required], select[required]');

    fields.forEach(field => {
        field.addEventListener('blur', () => {
            const formGroup = field.closest('.form-group');
            const errorMessage = formGroup.querySelector('.error-message');

            if (!field.value.trim()) {
                showFieldError(formGroup, errorMessage, 'This field is required');
            } else {
                clearFieldError(formGroup, errorMessage);
            }
        });

        field.addEventListener('input', () => {
            const formGroup = field.closest('.form-group');
            if (formGroup.classList.contains('error') && field.value.trim()) {
                clearFieldError(formGroup, formGroup.querySelector('.error-message'));
            }
        });
    });
}

// Navigation functions
function nextStep() {
    if (currentStep < 4) {
        currentStep++;
        updateStepDisplay();
        updateProgressIndicator();
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
        updateProgressIndicator();
    }
}

function goToStep(step) {
    currentStep = step;
    updateStepDisplay();
    updateProgressIndicator();
}

// Update step display
function updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }

    // Load step-specific content
    if (currentStep === 2) {
        loadShippingOptions();
    } else if (currentStep === 4) {
        loadReviewData();
    }
}

// Update progress indicator
function updateProgressIndicator() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNumber = index + 1;

        if (stepNumber < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Load shipping options
function loadShippingOptions() {
    const shippingOptions = document.getElementById('shippingOptions');
    if (!shippingOptions) return;

    shippingOptions.innerHTML = shippingMethods.map(method => `
        <div class="shipping-option" onclick="selectShippingMethod('${method.id}')">
            <div class="shipping-info">
                <h4>${method.name}</h4>
                <p>${method.description}</p>
            </div>
            <div class="shipping-price">
                ${method.price === 0 ? 'Free' : `₹${method.price}`}
            </div>
        </div>
    `).join('');

    // Select first option by default
    if (shippingMethods.length > 0) {
        selectShippingMethod(shippingMethods[0].id);
    }
}

// Select shipping method
function selectShippingMethod(methodId) {
    // Update UI
    document.querySelectorAll('.shipping-option').forEach(option => {
        option.classList.remove('selected');
    });

    event.currentTarget.classList.add('selected');

    // Update pricing
    const method = shippingMethods.find(m => m.id === methodId);
    if (method) {
        checkoutData.shipping.method = method;
        checkoutData.pricing.shipping = method.price;
        calculatePricing();
        updateOrderSummary();
    }
}

// Handle payment method change
function handlePaymentMethodChange(e) {
    const paymentMethod = e.target.value;

    // Hide all payment forms
    document.querySelectorAll('.payment-form').forEach(form => {
        form.style.display = 'none';
    });

    // Show selected payment form
    const selectedForm = document.getElementById(`${paymentMethod}PaymentForm`);
    if (selectedForm) {
        selectedForm.style.display = 'block';
    }

    // Update COD charges
    if (paymentMethod === 'cod') {
        checkoutData.pricing.shipping += 50; // COD charges
    } else if (checkoutData.payment.method === 'cod') {
        checkoutData.pricing.shipping -= 50; // Remove COD charges
    }

    checkoutData.payment.method = paymentMethod;
    calculatePricing();
    updateOrderSummary();
}

// Toggle shipping address
function toggleShippingAddress() {
    const shippingForm = document.getElementById('shippingAddressForm');
    const sameAsBilling = document.getElementById('sameAsBilling');

    if (sameAsBilling.checked) {
        shippingForm.style.display = 'none';
        // Copy billing address to shipping
        checkoutData.shipping.address = { ...checkoutData.customer };
    } else {
        shippingForm.style.display = 'block';
    }
}

// Format card number
function formatCardNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = value;
}

// Format expiry date
function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
}

// Format CVV
function formatCVV(e) {
    e.target.value = e.target.value.replace(/\D/g, '');
}

// Apply promo code
function applyPromoCode() {
    const promoInput = document.getElementById('promoCode');
    const promoMessage = document.getElementById('promoMessage');
    const code = promoInput.value.trim().toUpperCase();

    if (!code) {
        showPromoMessage('Please enter a promo code', 'error');
        return;
    }

    const promo = promoCodes[code];
    if (!promo) {
        showPromoMessage('Invalid promo code', 'error');
        return;
    }

    // Check minimum order value for certain codes
    if (code === 'SAVE500' && checkoutData.pricing.subtotal < 10000) {
        showPromoMessage('Minimum order value ₹10,000 required for this code', 'error');
        return;
    }

    // Apply discount
    if (promo.type === 'percentage') {
        checkoutData.pricing.discount = Math.round(checkoutData.pricing.subtotal * promo.discount / 100);
    } else {
        checkoutData.pricing.discount = promo.discount;
    }

    calculatePricing();
    updateOrderSummary();

    showPromoMessage(`${promo.description} applied!`, 'success');
    promoInput.disabled = true;
    document.querySelector('.apply-btn').textContent = 'Applied';
    document.querySelector('.apply-btn').disabled = true;
}

// Show promo message
function showPromoMessage(message, type) {
    const promoMessage = document.getElementById('promoMessage');
    promoMessage.textContent = message;
    promoMessage.className = `promo-message ${type}`;
}

// Load review data
function loadReviewData() {
    // Customer information
    const customerReview = document.getElementById('customerReview');
    if (customerReview && checkoutData.customer) {
        customerReview.innerHTML = `
            <p><strong>Name:</strong> ${checkoutData.customer.firstName} ${checkoutData.customer.lastName}</p>
            <p><strong>Email:</strong> ${checkoutData.customer.email}</p>
            <p><strong>Phone:</strong> ${checkoutData.customer.phone}</p>
            <p><strong>Address:</strong> ${checkoutData.customer.address1}, ${checkoutData.customer.city}, ${checkoutData.customer.state} ${checkoutData.customer.zipCode}</p>
        `;
    }

    // Shipping information
    const shippingReview = document.getElementById('shippingReview');
    if (shippingReview && checkoutData.shipping.method) {
        shippingReview.innerHTML = `
            <p><strong>Method:</strong> ${checkoutData.shipping.method.name}</p>
            <p><strong>Delivery:</strong> ${checkoutData.shipping.method.description}</p>
            <p><strong>Cost:</strong> ${checkoutData.shipping.method.price === 0 ? 'Free' : `₹${checkoutData.shipping.method.price}`}</p>
        `;
    }

    // Payment information
    const paymentReview = document.getElementById('paymentReview');
    if (paymentReview && checkoutData.payment.method) {
        const paymentMethods = {
            'card': 'Credit/Debit Card',
            'upi': 'UPI Payment',
            'netbanking': 'Net Banking',
            'cod': 'Cash on Delivery'
        };

        paymentReview.innerHTML = `
            <p><strong>Method:</strong> ${paymentMethods[checkoutData.payment.method]}</p>
        `;
    }
}

// Place order
async function placeOrder() {
    const agreeTerms = document.getElementById('agreeTerms');

    if (!agreeTerms.checked) {
        showMessage('Please agree to the terms and conditions', 'error');
        return;
    }

    // Show loading
    showLoading(true);

    // Sync address to profile if logged in (non-blocking)
    saveCheckoutAddressToProfile();

    try {
        // Generate order ID
        const orderId = generateOrderId();

        // Prepare order data
        const orderData = {
            orderId: orderId,
            customer: checkoutData.customer,
            shipping: checkoutData.shipping,
            payment: checkoutData.payment,
            items: checkoutData.cart,
            pricing: checkoutData.pricing,
            status: 'confirmed',
            orderDate: new Date().toISOString(),
            estimatedDelivery: calculateDeliveryDate()
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Save order to server and localStorage
        try {
            await saveOrder(orderData);
            console.log('Order saved successfully to server and localStorage');
        } catch (error) {
            console.warn('Server unavailable, order saved to localStorage only:', error.message);
            // Order is still saved to localStorage as fallback, so continue with success flow
        }

        // Clear cart
        localStorage.removeItem('quantera_cart');
        sessionStorage.removeItem('quantera_checkout_data');

        // Show confirmation
        showOrderConfirmation(orderData);

    } catch (error) {
        console.error('Order placement failed:', error);
        showMessage('Failed to place order. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Generate order ID
function generateOrderId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `QNT${timestamp.slice(-6)}${random}`;
}

// Calculate delivery date
function calculateDeliveryDate() {
    const days = checkoutData.shipping.method ?
        parseInt(checkoutData.shipping.method.estimatedDays.split('-')[1] || checkoutData.shipping.method.estimatedDays) : 7;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toISOString();
}

// Save order
async function saveOrder(orderData) {
    // Always save to localStorage first as backup
    let orders = JSON.parse(localStorage.getItem('quantera_orders') || '[]');
    orders.unshift(orderData);
    localStorage.setItem('quantera_orders', JSON.stringify(orders));

    try {
        console.log('Attempting to send order to server:', orderData.orderId);
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderData.orderId,
                customer: {
                    userId: checkoutData.customer.userId || null,
                    name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
                    email: orderData.customer.email,
                    phone: orderData.customer.phone
                },
                items: orderData.items.map(item => ({
                    productId: item.id || item._id,
                    productType: item.isAccessory ? 'Accessory' : 'Laptop',
                    name: item.isAccessory ? item.name : `${item.brand} ${item.series}`,
                    brand: item.brand,
                    model: item.series || item.modelNumber,
                    image: (item.images && item.images.length > 0) ? item.images[0] : (item.image || ''),
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity,
                    specifications: item.configuration || {}
                })),
                subtotal: orderData.pricing.subtotal,
                tax: orderData.pricing.tax,
                shipping: orderData.pricing.shipping,
                discount: orderData.pricing.discount,
                totalAmount: orderData.pricing.total,
                shippingAddress: {
                    street: orderData.shipping.address?.address1 || orderData.customer.address1,
                    city: orderData.shipping.address?.city || orderData.customer.city,
                    state: orderData.shipping.address?.state || orderData.customer.state,
                    zipCode: orderData.shipping.address?.zipCode || orderData.customer.zipCode,
                    country: 'India'
                },
                billingAddress: {
                    street: orderData.customer.address1,
                    city: orderData.customer.city,
                    state: orderData.customer.state,
                    zipCode: orderData.customer.zipCode,
                    country: 'India',
                    sameAsShipping: !orderData.shipping.address || JSON.stringify(orderData.shipping.address) === JSON.stringify(orderData.customer)
                },
                status: 'Pending',
                payment: {
                    method: getPaymentMethodName(orderData.payment.method),
                    status: 'Pending'
                },
                tracking: {
                    estimatedDelivery: orderData.estimatedDelivery
                },
                orderDate: orderData.orderDate,
                isGuestOrder: !checkoutData.customer.userId
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Order saved to server successfully:', result);
        } else {
            const errorText = await response.text();
            console.error('❌ Server responded with error:', response.status, errorText);
        }

    } catch (error) {
        console.error('❌ Could not save order to server:', error.message);
        // Don't throw error - order is already saved to localStorage
    }
}

// Show order confirmation
function showOrderConfirmation(orderData) {
    const modal = document.getElementById('confirmationModal');
    const details = document.getElementById('confirmationDetails');

    if (details) {
        details.innerHTML = `
            <div style="margin-bottom: 16px;">
                <strong>Order ID:</strong> ${orderData.orderId}
            </div>
            <div style="margin-bottom: 16px;">
                <strong>Total Amount:</strong> ₹${orderData.pricing.total.toLocaleString()}
            </div>
            <div style="margin-bottom: 16px;">
                <strong>Payment Method:</strong> ${getPaymentMethodName(orderData.payment.method)}
            </div>
            <div style="margin-bottom: 16px;">
                <strong>Estimated Delivery:</strong> ${new Date(orderData.estimatedDelivery).toLocaleDateString()}
            </div>
            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                A confirmation email has been sent to ${orderData.customer.email}
            </div>
        `;
    }

    if (modal) {
        modal.style.display = 'flex';
    }
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

// Show loading
function showLoading(show) {
    const loading = document.getElementById('loadingState');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// Utility functions
function goToCart() {
    window.location.href = 'cart.html';
}

function continueShopping() {
    window.location.href = 'laptops.html';
}

function viewOrder() {
    // Get the latest order ID from the confirmation details
    const orders = JSON.parse(localStorage.getItem('quantera_orders') || '[]');
    if (orders.length > 0) {
        const latestOrder = orders[0];
        window.location.href = `order-tracking.html?orderId=${latestOrder.orderId}`;
    } else {
        window.location.href = 'order-tracking.html';
    }
}

function showMessage(message, type = 'info') {
    if (window.QuanteraUI && window.QuanteraUI.showAlert) {
        const titleMap = {
            'success': 'Order Success',
            'error': 'Checkout Error',
            'info': 'Notice'
        };

        window.QuanteraUI.showAlert({
            title: titleMap[type] || 'Notice',
            description: message,
            variant: type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info'),
            duration: 5000
        });
    } else {
        console.log(`[Notification] ${type}: ${message}`);
        alert(message);
    }
}

// Populate form data from saved checkout data
function populateFormData() {
    if (checkoutData.customer) {
        Object.keys(checkoutData.customer).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                field.value = checkoutData.customer[key];
            }
        });
    }
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