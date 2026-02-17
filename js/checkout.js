/**
 * Checkout Service for Premium Hair Wigs & Extensions E-commerce
 * Manages checkout process, validation, and order creation
 */

class CheckoutService {
    constructor(apiService, authService, cartService) {
        this.api = apiService;
        this.auth = authService;
        this.cart = cartService;
        this.checkoutData = this.loadCheckoutData();
    }

    /**
     * Load checkout data from sessionStorage
     */
    loadCheckoutData() {
        const data = sessionStorage.getItem('checkoutData');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                return this.getDefaultCheckoutData();
            }
        }
        return this.getDefaultCheckoutData();
    }

    /**
     * Get default checkout data structure
     */
    getDefaultCheckoutData() {
        return {
            step: 1,
            shippingInfo: {
                fullName: '',
                email: '',
                phone: '',
                street: '',
                city: '',
                province: '',
                postalCode: '',
                country: 'South Africa'
            },
            shippingMethod: 'standard',
            paymentMethod: '',
            orderNotes: '',
            couponCode: '',
            discount: 0,
            agreeToTerms: false
        };
    }

    /**
     * Save checkout data to sessionStorage
     */
    saveCheckoutData() {
        sessionStorage.setItem('checkoutData', JSON.stringify(this.checkoutData));
    }

    /**
     * Clear checkout data
     */
    clearCheckoutData() {
        this.checkoutData = this.getDefaultCheckoutData();
        sessionStorage.removeItem('checkoutData');
    }

    /**
     * Get current checkout step
     */
    getCurrentStep() {
        return this.checkoutData.step;
    }

    /**
     * Set current checkout step
     */
    setCurrentStep(step) {
        this.checkoutData.step = step;
        this.saveCheckoutData();
    }

    /**
     * Validate shipping information
     */
    validateShippingInfo(shippingInfo) {
        const errors = [];

        // Validate full name
        const nameValidation = validateName(shippingInfo.fullName, 'Full name');
        if (!nameValidation.isValid) {
            errors.push(nameValidation.message);
        }

        // Validate email
        const emailValidation = validateEmail(shippingInfo.email);
        if (!emailValidation.isValid) {
            errors.push(emailValidation.message);
        }

        // Validate phone
        const phoneValidation = validatePhone(shippingInfo.phone);
        if (!phoneValidation.isValid) {
            errors.push(phoneValidation.message);
        }

        // Validate address
        const addressValidation = validateAddress({
            street: shippingInfo.street,
            city: shippingInfo.city,
            province: shippingInfo.province,
            postalCode: shippingInfo.postalCode
        });

        if (!addressValidation.isValid) {
            errors.push(...addressValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Save shipping information
     */
    saveShippingInfo(shippingInfo) {
        // Validate
        const validation = this.validateShippingInfo(shippingInfo);
        if (!validation.isValid) {
            throw new Error(validation.errors.join('. '));
        }

        this.checkoutData.shippingInfo = shippingInfo;
        this.saveCheckoutData();

        return true;
    }

    /**
     * Save shipping method
     */
    saveShippingMethod(method) {
        const validMethods = ['standard', 'express', 'pickup'];
        
        if (!validMethods.includes(method)) {
            throw new Error('Invalid shipping method');
        }

        this.checkoutData.shippingMethod = method;
        this.saveCheckoutData();

        return true;
    }

    /**
     * Save payment method
     */
    savePaymentMethod(method) {
        const validMethods = ['payfast', 'credit-card', 'eft', 'bank-transfer'];
        
        if (!validMethods.includes(method)) {
            throw new Error('Invalid payment method');
        }

        this.checkoutData.paymentMethod = method;
        this.saveCheckoutData();

        return true;
    }

    /**
     * Apply coupon code
     */
    async applyCoupon(couponCode) {
        try {
            const result = await this.cart.applyCoupon(couponCode);
            
            if (result.success) {
                this.checkoutData.couponCode = couponCode;
                this.checkoutData.discount = result.discount;
                this.saveCheckoutData();
                return result;
            }

            throw new Error(result.error || 'Invalid coupon code');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Remove coupon
     */
    removeCoupon() {
        this.checkoutData.couponCode = '';
        this.checkoutData.discount = 0;
        this.saveCheckoutData();
        showNotification('Coupon removed', 'info');
    }

    /**
     * Calculate shipping cost
     */
    async calculateShipping(method = this.checkoutData.shippingMethod) {
        try {
            const cartSubtotal = this.cart.getCartSubtotal();

            // Free shipping threshold
            if (cartSubtotal >= APP_CONFIG.SHIPPING.FREE_THRESHOLD) {
                return 0;
            }

            // Standard and Express costs
            switch (method) {
                case 'standard':
                    return APP_CONFIG.SHIPPING.STANDARD_COST;
                case 'express':
                    return APP_CONFIG.SHIPPING.EXPRESS_COST;
                case 'pickup':
                    return 0;
                default:
                    return APP_CONFIG.SHIPPING.STANDARD_COST;
            }
        } catch (error) {
            console.error('Failed to calculate shipping:', error);
            return APP_CONFIG.SHIPPING.STANDARD_COST;
        }
    }

    /**
     * Calculate order totals
     */
    async calculateTotals() {
        const cartSubtotal = this.cart.getCartSubtotal();
        const discount = this.checkoutData.discount || 0;
        const subtotalAfterDiscount = cartSubtotal - discount;
        const vat = subtotalAfterDiscount * APP_CONFIG.VAT_RATE;
        const shipping = await this.calculateShipping();
        const total = subtotalAfterDiscount + vat + shipping;

        return {
            subtotal: cartSubtotal,
            discount,
            subtotalAfterDiscount,
            vat,
            shipping,
            total,
            currency: APP_CONFIG.currencySymbol
        };
    }

    /**
     * Validate checkout before order creation
     */
    async validateCheckout() {
        const errors = [];

        // Validate cart
        const cartValidation = await this.cart.validateCart();
        if (!cartValidation.isValid) {
            errors.push(...cartValidation.errors);
        }

        // Validate shipping info
        const shippingValidation = this.validateShippingInfo(this.checkoutData.shippingInfo);
        if (!shippingValidation.isValid) {
            errors.push(...shippingValidation.errors);
        }

        // Validate shipping method
        if (!this.checkoutData.shippingMethod) {
            errors.push('Please select a shipping method');
        }

        // Validate payment method
        if (!this.checkoutData.paymentMethod) {
            errors.push('Please select a payment method');
        }

        // Validate terms agreement
        if (!this.checkoutData.agreeToTerms) {
            errors.push('Please agree to the terms and conditions');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Create order
     */
    async createOrder() {
        try {
            // Validate checkout
            const validation = await this.validateCheckout();
            if (!validation.isValid) {
                throw new Error(validation.errors.join('. '));
            }

            // Calculate totals
            const totals = await this.calculateTotals();

            // Prepare order data
            const orderData = {
                items: this.cart.getCart(),
                shippingInfo: this.checkoutData.shippingInfo,
                shippingMethod: this.checkoutData.shippingMethod,
                paymentMethod: this.checkoutData.paymentMethod,
                orderNotes: this.checkoutData.orderNotes,
                couponCode: this.checkoutData.couponCode,
                discount: this.checkoutData.discount,
                totals: totals,
                timestamp: new Date().toISOString()
            };

            // Send to backend
            const response = await this.api.post(
                API_CONFIG.ENDPOINTS.orders,
                orderData,
                true
            );

            if (response.success && response.order) {
                // Clear cart and checkout data
                await this.cart.clearCart();
                this.clearCheckoutData();

                showNotification('Order placed successfully!', 'success');

                return response.order;
            }

            throw new Error(response.message || 'Failed to create order');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Get order summary for review
     */
    async getOrderSummary() {
        const cart = this.cart.getCart();
        const totals = await this.calculateTotals();
        const shippingInfo = this.checkoutData.shippingInfo;
        const shippingMethod = this.checkoutData.shippingMethod;
        const paymentMethod = this.checkoutData.paymentMethod;

        return {
            items: cart,
            itemCount: this.cart.getCartCount(),
            shippingInfo,
            shippingMethod,
            paymentMethod,
            totals,
            couponCode: this.checkoutData.couponCode,
            orderNotes: this.checkoutData.orderNotes
        };
    }

    /**
     * Save order notes
     */
    saveOrderNotes(notes) {
        this.checkoutData.orderNotes = sanitizeInput(notes);
        this.saveCheckoutData();
    }

    /**
     * Set terms agreement
     */
    setTermsAgreement(agree) {
        this.checkoutData.agreeToTerms = agree;
        this.saveCheckoutData();
    }

    /**
     * Get shipping method details
     */
    getShippingMethodDetails(method) {
        const methods = {
            standard: {
                name: 'Standard Shipping',
                duration: APP_CONFIG.DELIVERY_DAYS.STANDARD,
                cost: APP_CONFIG.SHIPPING.STANDARD_COST,
                description: 'Delivered to your doorstep'
            },
            express: {
                name: 'Express Shipping',
                duration: APP_CONFIG.DELIVERY_DAYS.EXPRESS,
                cost: APP_CONFIG.SHIPPING.EXPRESS_COST,
                description: 'Fast delivery for urgent orders'
            },
            pickup: {
                name: 'Store Pickup',
                duration: 'Same day',
                cost: 0,
                description: 'Collect from our store in Protea Glen, Soweto'
            }
        };

        return methods[method] || methods.standard;
    }

    /**
     * Get payment method details
     */
    getPaymentMethodDetails(method) {
        const methods = {
            'payfast': {
                name: 'PayFast',
                description: 'Pay securely with PayFast',
                icon: 'credit-card'
            },
            'credit-card': {
                name: 'Credit/Debit Card',
                description: 'Pay with your credit or debit card',
                icon: 'credit-card'
            },
            'eft': {
                name: 'EFT',
                description: 'Electronic Funds Transfer',
                icon: 'university'
            },
            'bank-transfer': {
                name: 'Bank Transfer',
                description: 'Direct bank transfer',
                icon: 'university'
            }
        };

        return methods[method] || methods['payfast'];
    }

    /**
     * Process guest checkout (non-authenticated users)
     */
    async processGuestCheckout(email) {
        try {
            // Validate email
            const emailValidation = validateEmail(email);
            if (!emailValidation.isValid) {
                throw new Error(emailValidation.message);
            }

            // Create guest token
            this.checkoutData.guestEmail = email;
            this.checkoutData.isGuest = true;
            this.saveCheckoutData();

            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Validate cart stock before checkout
     */
    async validateCartStock() {
        const cartItems = this.cart.getItems();
        
        if (!cartItems || cartItems.length === 0) {
            return {
                success: false,
                message: 'Your cart is empty'
            };
        }

        const stockIssues = [];
        
        for (const item of cartItems) {
            // In a real app, this would make an API call to check stock
            // For demo purposes, we'll simulate stock checking
            const availableStock = Math.floor(Math.random() * 20); // Simulated stock
            
            if (availableStock === 0) {
                stockIssues.push({
                    item,
                    issue: 'out-of-stock',
                    message: `${item.name} is currently out of stock`
                });
            } else if (item.quantity > availableStock) {
                stockIssues.push({
                    item,
                    issue: 'insufficient-stock',
                    availableStock,
                    message: `Only ${availableStock} units of ${item.name} available (you have ${item.quantity} in cart)`
                });
            }
        }

        if (stockIssues.length > 0) {
            return {
                success: false,
                issues: stockIssues,
                message: 'Some items in your cart are no longer available or have insufficient stock'
            };
        }

        return {
            success: true,
            message: 'All items are available'
        };
    }

    /**
     * Update cart based on stock validation results
     */
    updateCartForStockIssues(issues) {
        issues.forEach(({ item, issue, availableStock }) => {
            if (issue === 'out-of-stock') {
                // Remove item from cart
                this.cart.removeItem(item.id);
            } else if (issue === 'insufficient-stock') {
                // Update quantity to available stock
                this.cart.updateQuantity(item.id, availableStock);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckoutService;
}
