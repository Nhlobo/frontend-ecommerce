/**
 * Authentication Service for Premium Hair Wigs & Extensions E-commerce
 * Manages user authentication, token handling, session management, and auto-logout
 */

class AuthService {
    constructor(apiService, securityConfig) {
        this.api = apiService;
        this.config = securityConfig;
        this.sessionCheckInterval = null;
        this.tokenRefreshInterval = null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        return !!token && !this.isTokenExpired(token);
    }

    /**
     * Get authentication token
     */
    getToken() {
        return localStorage.getItem(this.config.TOKEN_STORAGE_KEY);
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        localStorage.setItem(this.config.TOKEN_STORAGE_KEY, token);
        this.scheduleTokenRefresh();
    }

    /**
     * Get refresh token
     */
    getRefreshToken() {
        return localStorage.getItem(this.config.REFRESH_TOKEN_KEY);
    }

    /**
     * Set refresh token
     */
    setRefreshToken(token) {
        localStorage.setItem(this.config.REFRESH_TOKEN_KEY, token);
    }

    /**
     * Remove tokens
     */
    clearTokens() {
        localStorage.removeItem(this.config.TOKEN_STORAGE_KEY);
        localStorage.removeItem(this.config.REFRESH_TOKEN_KEY);
        localStorage.removeItem('user');
    }

    /**
     * Parse JWT token
     */
    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        const payload = this.parseJWT(token);
        if (!payload || !payload.exp) {
            return true;
        }
        
        // Check if token expires in less than 5 minutes
        const expiryTime = payload.exp * 1000;
        const currentTime = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        return currentTime >= (expiryTime - fiveMinutes);
    }

    /**
     * Get current user from localStorage
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Set current user in localStorage
     */
    setCurrentUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Login user
     */
    async login(credentials) {
        try {
            // Check rate limiting
            const identifier = credentials.email || credentials.username;
            if (!rateLimiter.isAllowed(identifier)) {
                const remaining = rateLimiter.getRemainingAttempts(identifier);
                throw new Error(`Too many login attempts. ${remaining} attempts remaining.`);
            }

            // Attempt login
            const response = await this.api.login(credentials);
            
            if (response.success && response.token) {
                // Store token and user data
                this.setToken(response.token);
                if (response.refreshToken) {
                    this.setRefreshToken(response.refreshToken);
                }
                if (response.user) {
                    this.setCurrentUser(response.user);
                }
                
                // Reset rate limiter on successful login
                rateLimiter.reset(identifier);
                
                // Start session monitoring
                this.startSessionMonitoring();
                
                return response;
            } else {
                // Record failed attempt
                rateLimiter.recordAttempt(identifier);
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            // Validate password strength
            const passwordValidation = validatePasswordStrength(userData.password);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            const response = await this.api.register(userData);
            
            if (response.success && response.token) {
                this.setToken(response.token);
                if (response.refreshToken) {
                    this.setRefreshToken(response.refreshToken);
                }
                if (response.user) {
                    this.setCurrentUser(response.user);
                }
                
                this.startSessionMonitoring();
                
                return response;
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout API if available
            if (this.isAuthenticated()) {
                try {
                    await this.api.logout();
                } catch (e) {
                    // Continue with logout even if API call fails
                    console.error('Logout API call failed:', e);
                }
            }
            
            // Clear session
            this.clearSession();
            
            // Redirect to home
            if (typeof navigateTo === 'function') {
                navigateTo('home');
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            // Even if logout fails, clear local session
            this.clearSession();
            throw error;
        }
    }

    /**
     * Clear session
     */
    clearSession() {
        this.clearTokens();
        this.stopSessionMonitoring();
        
        // Clear cart and wishlist if desired (optional)
        // localStorage.removeItem('cart');
        // localStorage.removeItem('wishlist');
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(API_CONFIG.ENDPOINTS.refreshToken, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (data.success && data.token) {
                this.setToken(data.token);
                if (data.refreshToken) {
                    this.setRefreshToken(data.refreshToken);
                }
                return true;
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            // If refresh fails, logout user
            this.clearSession();
            showNotification('Your session has expired. Please login again.', 'warning');
            return false;
        }
    }

    /**
     * Schedule automatic token refresh
     */
    scheduleTokenRefresh() {
        // Clear existing interval
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
        }

        // Refresh token every 50 minutes (before 1 hour expiry)
        this.tokenRefreshInterval = setInterval(() => {
            this.refreshToken();
        }, 50 * 60 * 1000);
    }

    /**
     * Start session monitoring
     */
    startSessionMonitoring() {
        // Check session every minute
        this.sessionCheckInterval = setInterval(() => {
            const token = this.getToken();
            
            if (!token) {
                this.handleSessionExpired();
                return;
            }

            if (this.isTokenExpired(token)) {
                this.handleSessionExpired();
            }
        }, 60 * 1000);
    }

    /**
     * Stop session monitoring
     */
    stopSessionMonitoring() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }
    }

    /**
     * Handle session expiration
     */
    handleSessionExpired() {
        this.clearSession();
        showNotification('Your session has expired. Please login again.', 'warning', 5000);
        
        // Redirect to login page
        if (typeof navigateTo === 'function') {
            navigateTo('login');
        } else {
            window.location.href = '/login.html';
        }
    }

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user || !user.permissions) {
            return false;
        }
        
        return user.permissions.includes(permission);
    }

    /**
     * Check if user has role
     */
    hasRole(role) {
        const user = this.getCurrentUser();
        if (!user || !user.role) {
            return false;
        }
        
        return user.role === role;
    }

    /**
     * Forgot password - request reset
     */
    async forgotPassword(email) {
        try {
            const response = await fetch(API_CONFIG.ENDPOINTS.forgotPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    message: data.message || 'Password reset instructions sent to your email'
                };
            } else {
                throw new Error(data.message || 'Password reset request failed');
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        try {
            // Validate new password
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            const response = await fetch(API_CONFIG.ENDPOINTS.resetPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    message: data.message || 'Password reset successful'
                };
            } else {
                throw new Error(data.message || 'Password reset failed');
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Change password for authenticated user
     */
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('You must be logged in to change password');
            }

            // Validate new password
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.errors.join('. '));
            }

            const response = await fetch(API_CONFIG.ENDPOINTS.changePassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    message: data.message || 'Password changed successfully'
                };
            } else {
                throw new Error(data.message || 'Password change failed');
            }
        } catch (error) {
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}
