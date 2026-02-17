/**
 * Shopping Cart Service for Premium Hair Wigs & Extensions E-commerce
 * Manages cart operations with backend synchronization
 */

class CartService {
    constructor(apiService) {
        this.api = apiService;
        this.cart = this.loadCart();
        this.syncInProgress = false;
    }

    /**
     * Load cart from localStorage
     */
    loadCart() {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            try {
                return JSON.parse(cartData);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    }

    /**
     * Get all cart items
     */
    getCart() {
        return this.cart;
    }

    /**
     * Get cart count
     */
    getCartCount() {
        return this.cart.reduce((total, item) => total + (item.quantity || 1), 0);
    }

    /**
     * Get cart subtotal
     */
    getCartSubtotal() {
        return this.cart.reduce((total, item) => {
            const price = item.salePrice || item.price;
            return total + (price * (item.quantity || 1));
        }, 0);
    }

    /**
     * Find cart item by product ID
     */
    findCartItem(productId) {
        return this.cart.find(item => item.productId === productId || item.id === productId);
    }

    /**
     * Add item to cart
     */
    async addToCart(product, quantity = 1) {
        try {
            // Validate quantity
            if (quantity < 1) {
                throw new Error('Quantity must be at least 1');
            }

            // Check if product has stock
            if (product.stock !== undefined && product.stock < quantity) {
                throw new Error(`Only ${product.stock} items available in stock`);
            }

            // Check if item already in cart
            const existingItem = this.findCartItem(product.id || product._id);

            if (existingItem) {
                // Update quantity
                const newQuantity = existingItem.quantity + quantity;
                
                // Check stock limit
                if (product.stock !== undefined && product.stock < newQuantity) {
                    throw new Error(`Cannot add more. Only ${product.stock} items available in stock`);
                }

                return await this.updateQuantity(existingItem.productId || existingItem.id, newQuantity);
            } else {
                // Add new item
                const cartItem = {
                    productId: product.id || product._id,
                    name: product.name,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.image || product.images?.[0],
                    quantity: quantity,
                    stock: product.stock,
                    sku: product.sku
                };

                this.cart.push(cartItem);
                this.saveCart();

                // Sync with backend if user is logged in
                await this.syncWithBackend();

                showNotification(`${product.name} added to cart`, 'success');
                return true;
            }
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Update item quantity
     */
    async updateQuantity(productId, quantity) {
        try {
            if (quantity < 1) {
                return await this.removeFromCart(productId);
            }

            const item = this.findCartItem(productId);
            if (!item) {
                throw new Error('Item not found in cart');
            }

            // Check stock limit
            if (item.stock !== undefined && item.stock < quantity) {
                throw new Error(`Only ${item.stock} items available in stock`);
            }

            item.quantity = quantity;
            this.saveCart();

            // Sync with backend
            await this.syncWithBackend();

            showNotification('Cart updated', 'success');
            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(productId) {
        try {
            const index = this.cart.findIndex(item => 
                item.productId === productId || item.id === productId
            );

            if (index === -1) {
                throw new Error('Item not found in cart');
            }

            const item = this.cart[index];
            this.cart.splice(index, 1);
            this.saveCart();

            // Sync with backend
            await this.syncWithBackend();

            showNotification(`${item.name} removed from cart`, 'success');
            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Clear entire cart
     */
    async clearCart() {
        this.cart = [];
        this.saveCart();
        
        // Sync with backend
        await this.syncWithBackend();

        showNotification('Cart cleared', 'success');
    }

    /**
     * Check if product is in cart
     */
    isInCart(productId) {
        return !!this.findCartItem(productId);
    }

    /**
     * Update cart badge count
     */
    updateCartBadge() {
        const badge = document.querySelector('.cart-count');
        if (badge) {
            const count = this.getCartCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    /**
     * Sync cart with backend (if user is logged in)
     */
    async syncWithBackend() {
        // Only sync if user is logged in
        const authToken = localStorage.getItem('authToken');
        if (!authToken || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;

        try {
            // Send cart to backend
            await this.api.post(API_CONFIG.ENDPOINTS.cart, {
                items: this.cart
            }, true);
        } catch (error) {
            console.error('Cart sync failed:', error);
            // Don't show error to user, local cart still works
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Load cart from backend (when user logs in)
     */
    async loadFromBackend() {
        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.cart, true);
            
            if (response.success && response.cart) {
                // Merge with local cart
                const backendCart = response.cart.items || [];
                
                // Combine carts (prefer backend quantities)
                backendCart.forEach(backendItem => {
                    const localItem = this.findCartItem(backendItem.productId);
                    if (localItem) {
                        localItem.quantity = backendItem.quantity;
                    } else {
                        this.cart.push(backendItem);
                    }
                });

                this.saveCart();
            }
        } catch (error) {
            console.error('Failed to load cart from backend:', error);
        }
    }

    /**
     * Validate cart before checkout
     */
    async validateCart() {
        const errors = [];

        if (this.cart.length === 0) {
            errors.push('Your cart is empty');
            return { isValid: false, errors };
        }

        // Check each item
        for (const item of this.cart) {
            // Validate quantity
            if (item.quantity < 1) {
                errors.push(`Invalid quantity for ${item.name}`);
            }

            // Check stock (would need to fetch latest from backend)
            if (item.stock !== undefined && item.stock < item.quantity) {
                errors.push(`${item.name} - Only ${item.stock} items available`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate cart totals
     */
    calculateTotals() {
        const subtotal = this.getCartSubtotal();
        const vat = subtotal * APP_CONFIG.VAT_RATE;
        
        // Calculate shipping
        let shipping = 0;
        if (subtotal < APP_CONFIG.SHIPPING.FREE_THRESHOLD) {
            shipping = APP_CONFIG.SHIPPING.STANDARD_COST;
        }

        const total = subtotal + vat + shipping;

        return {
            subtotal,
            vat,
            shipping,
            total,
            currency: APP_CONFIG.currencySymbol
        };
    }

    /**
     * Apply coupon code
     */
    async applyCoupon(couponCode) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.applyCoupon, {
                couponCode,
                cartTotal: this.getCartSubtotal()
            }, true);

            if (response.success) {
                showNotification(`Coupon applied! You saved ${formatPrice(response.discount)}`, 'success');
                return {
                    success: true,
                    discount: response.discount,
                    couponCode: couponCode
                };
            } else {
                throw new Error(response.message || 'Invalid coupon code');
            }
        } catch (error) {
            showNotification(error.message, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartService;
}
