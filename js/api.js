/**
 * API Service Layer for Premium Hair Wigs & Extensions E-commerce
 * Handles all API communication with the backend
 * Enhanced with retry logic, timeout handling, and request cancellation
 */

class APIService {
    constructor(config) {
        this.config = config;
        this.token = localStorage.getItem('authToken');
        this.requestTimeout = config.TIMEOUT || 30000;
        this.retryAttempts = config.RETRY_ATTEMPTS || 3;
        this.retryDelay = config.RETRY_DELAY || 1000;
        this.activeRequests = new Map();
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
            // If response is not JSON, check status code
            if (response.ok) {
                return { success: true };
            }
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
                    // Don't reload immediately, let auth service handle it
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
     * Create request with timeout
     */
    async fetchWithTimeout(url, options, timeout = this.requestTimeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }
            throw error;
        }
    }

    /**
     * Retry request with exponential backoff
     */
    async retryRequest(requestFn, attempts = this.retryAttempts) {
        let lastError;
        
        for (let i = 0; i < attempts; i++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                // Don't retry on 4xx errors (client errors)
                if (error.message && (
                    error.message.includes('Invalid request') ||
                    error.message.includes('Session expired') ||
                    error.message.includes('Access denied') ||
                    error.message.includes('not found')
                )) {
                    throw error;
                }
                
                // Wait before retrying (exponential backoff)
                if (i < attempts - 1) {
                    const delay = this.retryDelay * Math.pow(2, i);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Cancel active request by key
     */
    cancelRequest(requestKey) {
        const controller = this.activeRequests.get(requestKey);
        if (controller) {
            controller.abort();
            this.activeRequests.delete(requestKey);
        }
    }

    /**
     * Cancel all active requests
     */
    cancelAllRequests() {
        this.activeRequests.forEach(controller => controller.abort());
        this.activeRequests.clear();
    }

    /**
     * Generic GET request with retry and timeout
     */
    async get(url, includeAuth = false) {
        return this.retryRequest(async () => {
            const response = await this.fetchWithTimeout(url, {
                method: 'GET',
                headers: this.getHeaders(includeAuth)
            });
            return await this.handleResponse(response);
        });
    }

    /**
     * Generic POST request with retry and timeout
     */
    async post(url, data, includeAuth = false) {
        return this.retryRequest(async () => {
            const response = await this.fetchWithTimeout(url, {
                method: 'POST',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        });
    }

    /**
     * Generic PUT request with retry and timeout
     */
    async put(url, data, includeAuth = false) {
        return this.retryRequest(async () => {
            const response = await this.fetchWithTimeout(url, {
                method: 'PUT',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        });
    }

    /**
     * Generic DELETE request with retry and timeout
     */
    async delete(url, includeAuth = false) {
        return this.retryRequest(async () => {
            const response = await this.fetchWithTimeout(url, {
                method: 'DELETE',
                headers: this.getHeaders(includeAuth)
            });
            return await this.handleResponse(response);
        });
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
