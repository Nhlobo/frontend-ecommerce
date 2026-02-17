/**
 * User Service for Premium Hair Wigs & Extensions E-commerce
 * Manages user profile, addresses, and account operations
 */

class UserService {
    constructor(apiService, authService) {
        this.api = apiService;
        this.auth = authService;
    }

    /**
     * Get current user profile
     */
    async getProfile() {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            const response = await this.api.get(API_CONFIG.ENDPOINTS.profile, true);
            
            if (response.success && response.user) {
                // Update local storage
                this.auth.setCurrentUser(response.user);
                return response.user;
            }

            throw new Error('Failed to fetch profile');
        } catch (error) {
            console.error('Failed to get profile:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            // Validate profile data
            const errors = [];

            if (profileData.name) {
                const nameValidation = validateName(profileData.name, 'Full name');
                if (!nameValidation.isValid) {
                    errors.push(nameValidation.message);
                }
            }

            if (profileData.email) {
                const emailValidation = validateEmail(profileData.email);
                if (!emailValidation.isValid) {
                    errors.push(emailValidation.message);
                }
            }

            if (profileData.phone) {
                const phoneValidation = validatePhone(profileData.phone);
                if (!phoneValidation.isValid) {
                    errors.push(phoneValidation.message);
                }
            }

            if (errors.length > 0) {
                throw new Error(errors.join('. '));
            }

            const response = await this.api.put(
                API_CONFIG.ENDPOINTS.updateProfile,
                profileData,
                true
            );

            if (response.success) {
                // Update local storage
                if (response.user) {
                    this.auth.setCurrentUser(response.user);
                }
                showNotification('Profile updated successfully', 'success');
                return response.user;
            }

            throw new Error(response.message || 'Failed to update profile');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Get user addresses
     */
    async getAddresses() {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            const response = await this.api.get(API_CONFIG.ENDPOINTS.addresses, true);
            
            if (response.success && response.addresses) {
                return response.addresses;
            }

            return [];
        } catch (error) {
            console.error('Failed to get addresses:', error);
            throw error;
        }
    }

    /**
     * Add new address
     */
    async addAddress(addressData) {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            // Validate address
            const validation = validateAddress(addressData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('. '));
            }

            const response = await this.api.post(
                API_CONFIG.ENDPOINTS.addresses,
                addressData,
                true
            );

            if (response.success) {
                showNotification('Address added successfully', 'success');
                return response.address;
            }

            throw new Error(response.message || 'Failed to add address');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Update address
     */
    async updateAddress(addressId, addressData) {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            // Validate address
            const validation = validateAddress(addressData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('. '));
            }

            const response = await this.api.put(
                `${API_CONFIG.ENDPOINTS.addresses}/${addressId}`,
                addressData,
                true
            );

            if (response.success) {
                showNotification('Address updated successfully', 'success');
                return response.address;
            }

            throw new Error(response.message || 'Failed to update address');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Delete address
     */
    async deleteAddress(addressId) {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            const response = await this.api.delete(
                `${API_CONFIG.ENDPOINTS.addresses}/${addressId}`,
                true
            );

            if (response.success) {
                showNotification('Address deleted successfully', 'success');
                return true;
            }

            throw new Error(response.message || 'Failed to delete address');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Set default address
     */
    async setDefaultAddress(addressId, type = 'shipping') {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            const response = await this.api.put(
                `${API_CONFIG.ENDPOINTS.addresses}/${addressId}/default`,
                { type },
                true
            );

            if (response.success) {
                showNotification(`Default ${type} address set`, 'success');
                return true;
            }

            throw new Error(response.message || 'Failed to set default address');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Get user orders
     */
    async getOrders() {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            const response = await this.api.get(API_CONFIG.ENDPOINTS.orders, true);
            
            if (response.success && response.orders) {
                return response.orders;
            }

            return [];
        } catch (error) {
            console.error('Failed to get orders:', error);
            throw error;
        }
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId) {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            const response = await this.api.get(
                API_CONFIG.ENDPOINTS.orderById(orderId),
                true
            );
            
            if (response.success && response.order) {
                return response.order;
            }

            throw new Error('Order not found');
        } catch (error) {
            console.error('Failed to get order:', error);
            throw error;
        }
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId, reason = '') {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            const response = await this.api.put(
                `${API_CONFIG.ENDPOINTS.orders}/${orderId}/cancel`,
                { reason },
                true
            );

            if (response.success) {
                showNotification('Order cancelled successfully', 'success');
                return true;
            }

            throw new Error(response.message || 'Failed to cancel order');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Track order
     */
    async trackOrder(orderNumber) {
        try {
            const response = await this.api.get(
                API_CONFIG.ENDPOINTS.trackOrder(orderNumber)
            );
            
            if (response.success && response.tracking) {
                return response.tracking;
            }

            throw new Error('Order not found');
        } catch (error) {
            console.error('Failed to track order:', error);
            throw error;
        }
    }

    /**
     * Submit product review
     */
    async submitReview(productId, reviewData) {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in to write a review');
            }

            // Validate review
            const errors = [];

            if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
                errors.push('Please provide a rating between 1 and 5 stars');
            }

            if (!reviewData.title || reviewData.title.trim().length < 5) {
                errors.push('Review title must be at least 5 characters');
            }

            if (!reviewData.comment || reviewData.comment.trim().length < 20) {
                errors.push('Review comment must be at least 20 characters');
            }

            if (errors.length > 0) {
                throw new Error(errors.join('. '));
            }

            // Sanitize input
            reviewData.title = sanitizeInput(reviewData.title);
            reviewData.comment = sanitizeInput(reviewData.comment);

            const response = await this.api.post(
                API_CONFIG.ENDPOINTS.addReview,
                {
                    productId,
                    ...reviewData
                },
                true
            );

            if (response.success) {
                showNotification('Review submitted successfully', 'success');
                return response.review;
            }

            throw new Error(response.message || 'Failed to submit review');
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Get account statistics
     */
    async getAccountStats() {
        try {
            if (!this.auth.isAuthenticated()) {
                return {
                    totalOrders: 0,
                    totalSpent: 0,
                    wishlistItems: 0,
                    reviewsWritten: 0
                };
            }

            const [orders, profile] = await Promise.all([
                this.getOrders().catch(() => []),
                this.getProfile().catch(() => null)
            ]);

            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            const wishlistItems = profile?.wishlistCount || 0;
            const reviewsWritten = profile?.reviewsCount || 0;

            return {
                totalOrders,
                totalSpent,
                wishlistItems,
                reviewsWritten
            };
        } catch (error) {
            console.error('Failed to get account stats:', error);
            return {
                totalOrders: 0,
                totalSpent: 0,
                wishlistItems: 0,
                reviewsWritten: 0
            };
        }
    }

    /**
     * Delete account
     */
    async deleteAccount(password) {
        try {
            if (!this.auth.isAuthenticated()) {
                throw new Error('You must be logged in');
            }

            if (!password) {
                throw new Error('Password is required to delete account');
            }

            // Show confirmation
            return new Promise((resolve, reject) => {
                showConfirmDialog(
                    'Are you sure you want to delete your account? This action cannot be undone.',
                    async () => {
                        try {
                            const response = await this.api.delete(
                                `${API_CONFIG.ENDPOINTS.profile}?password=${encodeURIComponent(password)}`,
                                true
                            );

                            if (response.success) {
                                showNotification('Account deleted successfully', 'success');
                                // Logout user
                                await this.auth.logout();
                                resolve(true);
                            } else {
                                throw new Error(response.message || 'Failed to delete account');
                            }
                        } catch (error) {
                            showNotification(error.message, 'error');
                            reject(error);
                        }
                    },
                    () => {
                        resolve(false);
                    }
                );
            });
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserService;
}
