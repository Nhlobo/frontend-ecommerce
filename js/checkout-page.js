/**
 * Checkout Page
 * Handles checkout process, order creation, and payment
 */

let cart = null;
let currentUser = null;

/**
 * Initialize checkout page
 */
async function initCheckout() {
    try {
        showLoading();
        
        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await api.getCurrentUser();
                currentUser = response.user || response.data?.user || response.data;
                if (currentUser) {
                    populateUserInfo(currentUser);
                }
            } catch (error) {
                console.log('Guest checkout - user not logged in');
                // Guest checkout is allowed
            }
        }
        
        // Load cart
        const cartResponse = await api.getCart();
        cart = cartResponse.cart || cartResponse.data?.cart || cartResponse.data;
        
        if (!cart || !cart.items || cart.items.length === 0) {
            showError('Your cart is empty');
            setTimeout(() => {
                window.location.href = '/cart.html';
            }, 2000);
            return;
        }
        
        renderOrderSummary(cart);
        
    } catch (error) {
        console.error('Error initializing checkout:', error);
        showError('Failed to load checkout. Please try again.');
    } finally {
        hideLoading();
    }
}

/**
 * Populate user info if logged in
 */
function populateUserInfo(user) {
    const nameInput = document.getElementById('name') || document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (nameInput && user.name) {
        nameInput.value = user.name;
    }
    
    if (emailInput && user.email) {
        emailInput.value = user.email;
        emailInput.readOnly = true; // Don't allow changing email
    }
    
    if (phoneInput && user.phone) {
        phoneInput.value = user.phone;
    }
    
    // Populate address if available
    if (user.addresses && user.addresses.length > 0) {
        const primaryAddress = user.addresses.find(addr => addr.isPrimary) || user.addresses[0];
        
        if (primaryAddress) {
            const addressInput = document.getElementById('address') || document.getElementById('line1');
            const address2Input = document.getElementById('address2') || document.getElementById('line2');
            const cityInput = document.getElementById('city');
            const provinceInput = document.getElementById('province');
            const postalCodeInput = document.getElementById('postalCode');
            
            if (addressInput && primaryAddress.line1) addressInput.value = primaryAddress.line1;
            if (address2Input && primaryAddress.line2) address2Input.value = primaryAddress.line2;
            if (cityInput && primaryAddress.city) cityInput.value = primaryAddress.city;
            if (provinceInput && primaryAddress.province) provinceInput.value = primaryAddress.province;
            if (postalCodeInput && primaryAddress.postalCode) postalCodeInput.value = primaryAddress.postalCode;
        }
    }
}

/**
 * Render order summary
 */
function renderOrderSummary(cart) {
    const container = document.getElementById('orderSummary');
    
    if (!container) {
        console.error('Order summary container not found');
        return;
    }
    
    if (!cart || !cart.items || cart.items.length === 0) {
        container.innerHTML = '<p>No items in cart</p>';
        return;
    }
    
    // Calculate totals (for display only)
    const subtotal = cart.items.reduce((sum, item) => {
        const price = item.variant?.price || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
    }, 0);
    
    container.innerHTML = `
        <div class="order-summary-items">
            ${cart.items.map(item => {
                const variant = item.variant || {};
                const product = item.product || {};
                const price = variant.price || 0;
                const quantity = item.quantity || 1;
                const subtotal = price * quantity;
                
                // Build variant info
                let variantInfo = [];
                if (variant.texture) variantInfo.push(variant.texture);
                if (variant.length) variantInfo.push(variant.length);
                if (variant.color) variantInfo.push(variant.color);
                const variantText = variantInfo.length > 0 ? ` (${variantInfo.join(', ')})` : '';
                
                return `
                    <div class="summary-item">
                        <div class="summary-item-details">
                            <span class="summary-item-name">${product.name}${variantText}</span>
                            <span class="summary-item-qty">x${quantity}</span>
                        </div>
                        <span class="summary-item-price">${formatPrice(subtotal)}</span>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="order-summary-totals">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>Calculated at next step</span>
            </div>
            <div class="summary-row summary-total">
                <strong>Total:</strong>
                <strong>${formatPrice(subtotal)}</strong>
            </div>
        </div>
        <p class="summary-note">Final total including shipping and tax will be calculated on the backend</p>
    `;
}

/**
 * Handle checkout form submission
 */
async function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        shipping: {
            name: document.getElementById('name')?.value || document.getElementById('fullName')?.value,
            phone: document.getElementById('phone')?.value,
            line1: document.getElementById('address')?.value || document.getElementById('line1')?.value,
            line2: document.getElementById('address2')?.value || document.getElementById('line2')?.value || '',
            city: document.getElementById('city')?.value,
            province: document.getElementById('province')?.value,
            postalCode: document.getElementById('postalCode')?.value
        },
        guestEmail: document.getElementById('email')?.value,
        notes: document.getElementById('notes')?.value || ''
    };
    
    // Validation
    if (!formData.shipping.name) {
        showError('Please enter your full name');
        return;
    }
    
    if (!formData.shipping.phone) {
        showError('Please enter your phone number');
        return;
    }
    
    if (!formData.shipping.line1) {
        showError('Please enter your street address');
        return;
    }
    
    if (!formData.shipping.city) {
        showError('Please enter your city');
        return;
    }
    
    if (!formData.shipping.province) {
        showError('Please select your province');
        return;
    }
    
    if (!formData.shipping.postalCode) {
        showError('Please enter your postal code');
        return;
    }
    
    if (!currentUser && !formData.guestEmail) {
        showError('Please enter your email address');
        return;
    }
    
    // Email validation for guest checkout
    if (!currentUser && formData.guestEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.guestEmail)) {
            showError('Please enter a valid email address');
            return;
        }
    }
    
    // Terms checkbox
    const termsCheckbox = document.getElementById('agreeToTerms');
    if (termsCheckbox && !termsCheckbox.checked) {
        showError('Please agree to the terms and conditions');
        return;
    }
    
    try {
        showLoading();
        
        // Create order - backend will calculate totals and handle payment
        const response = await api.createOrder(formData);
        
        if (response.success || response.data) {
            const order = response.order || response.data?.order || response.data;
            const paymentData = response.paymentData || response.data?.paymentData;
            
            if (paymentData) {
                // Redirect to PayFast
                showSuccess('Order created! Redirecting to payment...');
                setTimeout(() => {
                    redirectToPayFast(paymentData);
                }, 1000);
            } else {
                // Order created successfully but no payment data (might be COD or other payment method)
                showSuccess('Order created successfully!');
                setTimeout(() => {
                    window.location.href = `/order-details.html?id=${order.id || order._id}`;
                }, 1500);
            }
        } else {
            throw new Error(response.message || 'Failed to create order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        showError(error.message || 'Failed to create order. Please try again.');
    } finally {
        hideLoading();
    }
}

/**
 * Redirect to PayFast payment gateway
 */
function redirectToPayFast(paymentData) {
    // Create form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.sandbox 
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process';
    
    // Add all payment data as hidden inputs
    Object.keys(paymentData).forEach(key => {
        if (key !== 'sandbox') {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = paymentData[key];
            form.appendChild(input);
        }
    });
    
    // Append form to body and submit
    document.body.appendChild(form);
    form.submit();
}

/**
 * Setup event listeners
 */
function setupCheckoutEventListeners() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

/**
 * Initialize checkout page
 */
function initCheckoutPage() {
    setupCheckoutEventListeners();
    initCheckout();
}

// Auto-initialize if on checkout page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('checkout.html') || document.getElementById('checkoutForm')) {
            initCheckoutPage();
        }
    });
} else {
    if (window.location.pathname.includes('checkout.html') || document.getElementById('checkoutForm')) {
        initCheckoutPage();
    }
}
