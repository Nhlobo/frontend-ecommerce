/**
 * Cart Page
 * Handles shopping cart display and management
 */

let cart = null;

/**
 * Load cart from API
 */
async function loadCart() {
    try {
        showLoading();
        const response = await api.getCart();
        
        if (response.success || response.data || response.cart) {
            cart = response.cart || response.data?.cart || response.data;
            
            renderCart(cart);
            updateCartTotals(cart);
        } else {
            throw new Error('Failed to load cart');
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showError('Failed to load cart');
        const container = document.getElementById('cartItems');
        if (container) {
            container.innerHTML = '<p class="error-message">Failed to load cart. Please refresh the page.</p>';
        }
    } finally {
        hideLoading();
    }
}

/**
 * Render cart items
 */
function renderCart(cart) {
    const container = document.getElementById('cartItems');
    
    if (!container) {
        console.error('Cart items container not found');
        return;
    }
    
    if (!cart || !cart.items || cart.items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart empty-cart-icon"></i>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet</p>
                <a href="/shop.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        
        // Hide cart summary
        const summary = document.getElementById('cartSummary');
        if (summary) summary.style.display = 'none';
        
        return;
    }
    
    // Show cart summary
    const summary = document.getElementById('cartSummary');
    if (summary) summary.style.display = 'block';
    
    container.innerHTML = cart.items.map(item => {
        const variant = item.variant || {};
        const product = item.product || {};
        const price = variant.price || 0;
        const quantity = item.quantity || 1;
        const subtotal = price * quantity;
        
        const imageUrl = variant.image_url || product.image_url || product.image || '/assets/placeholder.jpg';
        const productName = product.name || 'Unknown Product';
        
        // Build variant info string
        let variantInfo = [];
        if (variant.texture) variantInfo.push(variant.texture);
        if (variant.length) variantInfo.push(variant.length);
        if (variant.color) variantInfo.push(variant.color);
        const variantText = variantInfo.join(' | ');
        
        return `
            <div class="cart-item" data-item-id="${item.id || item._id}">
                <div class="cart-item-image">
                    <img src="${imageUrl}" 
                         alt="${productName}"
                         onerror="this.src='/assets/placeholder.jpg'">
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${productName}</h3>
                    ${variantText ? `<p class="cart-item-variant">${variantText}</p>` : ''}
                    <p class="cart-item-price">${formatPrice(price)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn qty-minus" onclick="updateQuantity('${item.id || item._id}', ${quantity - 1})" ${quantity <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" 
                           class="qty-input" 
                           value="${quantity}" 
                           min="1" 
                           max="${variant.stock || 999}"
                           onchange="updateQuantity('${item.id || item._id}', this.value)">
                    <button class="qty-btn qty-plus" onclick="updateQuantity('${item.id || item._id}', ${quantity + 1})" ${quantity >= (variant.stock || 999) ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-subtotal">
                    <p class="item-subtotal-label">Subtotal:</p>
                    <p class="item-subtotal-price">${formatPrice(subtotal)}</p>
                </div>
                <button class="cart-item-remove" onclick="removeItem('${item.id || item._id}')" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Update cart totals
 */
function updateCartTotals(cart) {
    if (!cart || !cart.items) return;
    
    // Calculate subtotal (for display only - never trust client calculation for checkout)
    const subtotal = cart.items.reduce((sum, item) => {
        const price = item.variant?.price || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
    }, 0);
    
    // Display subtotal
    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) {
        subtotalEl.textContent = formatPrice(subtotal);
    }
    
    // For now, display subtotal as total (shipping and tax calculated at checkout)
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) {
        totalEl.textContent = formatPrice(subtotal);
    }
    
    // Update item count
    const itemCount = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const countEl = document.getElementById('cartItemCount');
    if (countEl) {
        countEl.textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
    }
}

/**
 * Update item quantity
 */
async function updateQuantity(itemId, newQuantity) {
    newQuantity = parseInt(newQuantity);
    
    if (newQuantity < 1) {
        showError('Quantity must be at least 1');
        return;
    }
    
    try {
        showLoading();
        const response = await api.updateCartItem(itemId, newQuantity);
        
        if (response.success || response.data) {
            showSuccess('Cart updated');
            await loadCart(); // Refresh cart
            updateCartCount(); // Update badge
        } else {
            throw new Error(response.message || 'Failed to update cart');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showError(error.message || 'Failed to update cart');
        await loadCart(); // Refresh to show correct state
    } finally {
        hideLoading();
    }
}

/**
 * Remove item from cart
 */
async function removeItem(itemId) {
    if (!confirm('Remove this item from your cart?')) {
        return;
    }
    
    try {
        showLoading();
        const response = await api.removeCartItem(itemId);
        
        if (response.success || response.data) {
            showSuccess('Item removed from cart');
            await loadCart(); // Refresh cart
            updateCartCount(); // Update badge
        } else {
            throw new Error(response.message || 'Failed to remove item');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showError(error.message || 'Failed to remove item');
    } finally {
        hideLoading();
    }
}

/**
 * Clear entire cart
 */
async function clearCart() {
    if (!confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading();
        const response = await api.clearCart();
        
        if (response.success || response.data) {
            showSuccess('Cart cleared');
            await loadCart(); // Refresh cart
            updateCartCount(); // Update badge
        } else {
            throw new Error(response.message || 'Failed to clear cart');
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        showError(error.message || 'Failed to clear cart');
    } finally {
        hideLoading();
    }
}

/**
 * Proceed to checkout
 */
function proceedToCheckout() {
    if (!cart || !cart.items || cart.items.length === 0) {
        showError('Your cart is empty');
        return;
    }
    
    window.location.href = '/checkout.html';
}

/**
 * Setup event listeners
 */
function setupCartEventListeners() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }
    
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
}

/**
 * Initialize cart page
 */
function initCartPage() {
    setupCartEventListeners();
    loadCart();
}

// Auto-initialize if on cart page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('cart.html') || document.getElementById('cartItems')) {
            initCartPage();
        }
    });
} else {
    if (window.location.pathname.includes('cart.html') || document.getElementById('cartItems')) {
        initCartPage();
    }
}

// Export functions for use in other scripts
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.clearCart = clearCart;
