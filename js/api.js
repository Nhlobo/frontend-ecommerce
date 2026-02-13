/**
 * API Service Layer for Premium Hair Wigs & Extensions E-commerce
 * Handles all API communication with the backend
 */

class APIService {
    constructor(config) {
        this.config = config;
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Get headers for API requests
     */
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        // Handle network errors
        if (!response) {
            throw new Error('Network error. Please check your internet connection.');
        }
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Server response error. Please try again later.');
        }
        
        if (!response.ok) {
            // Handle specific HTTP errors
            switch (response.status) {
                case 400:
                    throw new Error(data.message || 'Invalid request. Please check your input.');
                case 401:
                    // Session expired
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    window.location.reload();
                    throw new Error('Session expired. Please login again.');
                case 403:
                    throw new Error('Access denied. You do not have permission.');
                case 404:
                    throw new Error(data.message || 'Resource not found.');
                case 500:
                    throw new Error('Server error. Please try again later.');
                case 503:
                    throw new Error('Service temporarily unavailable. Please try again later.');
                default:
                    throw new Error(data.message || 'Something went wrong. Please try again.');
            }
        }
        
        return data;
    }

    /**
     * Generic GET request
     */
    async get(url, includeAuth = false) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(includeAuth)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    }

    /**
     * Generic POST request
     */
    async post(url, data, includeAuth = false) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    }

    /**
     * Generic PUT request
     */
    async put(url, data, includeAuth = false) {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('PUT request failed:', error);
            throw error;
        }
    }

    /**
     * Generic DELETE request
     */
    async delete(url, includeAuth = false) {
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(includeAuth)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('DELETE request failed:', error);
            throw error;
        }
    }

    // ========== Product APIs ==========

    /**
     * Get all products
     */
    async getAllProducts() {
        return this.get(this.config.API_CONFIG.ENDPOINTS.products);
    }

    /**
     * Get product by ID
     */
    async getProductById(id) {
        return this.get(`${this.config.API_CONFIG.ENDPOINTS.products}/${id}`);
    }

    /**
     * Get products by category
     */
    async getProductsByCategory(category) {
        return this.get(`${this.config.API_CONFIG.ENDPOINTS.products}?category=${category}`);
    }

    /**
     * Search products
     */
    async searchProducts(query) {
        return this.get(`${this.config.API_CONFIG.ENDPOINTS.products}/search?q=${encodeURIComponent(query)}`);
    }

    // ========== Authentication APIs ==========

    /**
     * Register new user
     */
    async register(userData) {
        const response = await this.post(this.config.API_CONFIG.ENDPOINTS.register, userData);
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    /**
     * Login user
     */
    async login(credentials) {
        const response = await this.post(this.config.API_CONFIG.ENDPOINTS.login, credentials);
        if (response.token) {
            this.setToken(response.token);
        }
        return response;
    }

    /**
     * Logout user
     */
    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        return this.get(this.config.API_CONFIG.ENDPOINTS.user, true);
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // ========== Order APIs ==========

    /**
     * Create new order
     */
    async createOrder(orderData) {
        return this.post(this.config.API_CONFIG.ENDPOINTS.orders, orderData, true);
    }

    /**
     * Get user's orders
     */
    async getMyOrders() {
        return this.get(this.config.API_CONFIG.ENDPOINTS.orders, true);
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId) {
        return this.get(`${this.config.API_CONFIG.ENDPOINTS.orders}/${orderId}`, true);
    }

    /**
     * Track order
     */
    async trackOrder(orderNumber) {
        return this.get(`${this.config.API_CONFIG.ENDPOINTS.orders}/track/${orderNumber}`);
    }

    // ========== Wishlist APIs ==========

    /**
     * Get user's wishlist
     */
    async getWishlist() {
        return this.get(this.config.API_CONFIG.ENDPOINTS.wishlist, true);
    }

    /**
     * Add product to wishlist
     */
    async addToWishlist(productId) {
        return this.post(this.config.API_CONFIG.ENDPOINTS.wishlist, { productId }, true);
    }

    /**
     * Remove product from wishlist
     */
    async removeFromWishlist(productId) {
        return this.delete(`${this.config.API_CONFIG.ENDPOINTS.wishlist}/${productId}`, true);
    }

    // ========== Contact & Newsletter APIs ==========

    /**
     * Submit contact form
     */
    async submitContactForm(formData) {
        return this.post(this.config.API_CONFIG.ENDPOINTS.contact, formData);
    }

    /**
     * Subscribe to newsletter
     */
    async subscribeNewsletter(email) {
        return this.post(this.config.API_CONFIG.ENDPOINTS.newsletter, { email });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}
