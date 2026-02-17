/**
 * Security Utilities for Premium Hair Wigs & Extensions E-commerce
 * Implements XSS protection, input sanitization, CSRF protection, and secure data handling
 */

// Security Configuration
const SECURITY_CONFIG = {
    TOKEN_STORAGE_KEY: 'auth_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    CSRF_TOKEN_KEY: 'csrf_token',
    SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
    PASSWORD_MIN_LENGTH: 8,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900000, // 15 minutes
    ENABLE_CSRF: true
};

/**
 * XSS Protection - Sanitize HTML to prevent cross-site scripting attacks
 */
function sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Sanitize input for safe display - removes potentially dangerous characters
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Escape HTML entities
 */
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Validate and sanitize URL to prevent XSS
 */
function sanitizeURL(url) {
    if (!url) return '';
    
    // Block javascript: and data: protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerURL = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
        if (lowerURL.startsWith(protocol)) {
            console.warn('Blocked dangerous URL:', url);
            return '#';
        }
    }
    
    return url;
}

/**
 * Generate CSRF token for forms
 */
function generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store in sessionStorage (cleared when tab closes)
    sessionStorage.setItem(SECURITY_CONFIG.CSRF_TOKEN_KEY, token);
    return token;
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem(SECURITY_CONFIG.CSRF_TOKEN_KEY);
    return storedToken && storedToken === token;
}

/**
 * Add CSRF token to form
 */
function addCSRFTokenToForm(formElement) {
    if (!SECURITY_CONFIG.ENABLE_CSRF) return;
    
    // Remove existing CSRF input if present
    const existingInput = formElement.querySelector('input[name="csrf_token"]');
    if (existingInput) {
        existingInput.remove();
    }
    
    const token = generateCSRFToken();
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = token;
    formElement.appendChild(input);
}

/**
 * Simple encryption for localStorage (not cryptographically secure, just obfuscation)
 * For production, consider using Web Crypto API with proper key management
 */
function encryptData(data) {
    try {
        const jsonString = JSON.stringify(data);
        return btoa(jsonString); // Base64 encoding
    } catch (e) {
        console.error('Encryption failed:', e);
        return null;
    }
}

/**
 * Simple decryption for localStorage
 */
function decryptData(encryptedData) {
    try {
        const jsonString = atob(encryptedData); // Base64 decoding
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Decryption failed:', e);
        return null;
    }
}

/**
 * Secure storage - Store sensitive data with encryption
 */
function secureStorage = {
    set: function(key, value) {
        try {
            const encrypted = encryptData(value);
            if (encrypted) {
                localStorage.setItem(key, encrypted);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Secure storage set failed:', e);
            return false;
        }
    },
    
    get: function(key) {
        try {
            const encrypted = localStorage.getItem(key);
            if (encrypted) {
                return decryptData(encrypted);
            }
            return null;
        } catch (e) {
            console.error('Secure storage get failed:', e);
            return null;
        }
    },
    
    remove: function(key) {
        localStorage.removeItem(key);
    },
    
    clear: function() {
        localStorage.clear();
    }
};

/**
 * Rate limiting for login attempts
 */
const rateLimiter = {
    attempts: {},
    
    /**
     * Check if action is allowed
     */
    isAllowed: function(identifier, maxAttempts = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        const now = Date.now();
        const key = `rate_limit_${identifier}`;
        
        // Get attempt data
        let data = this.attempts[key];
        
        if (!data) {
            data = { count: 0, firstAttempt: now, lockoutUntil: null };
            this.attempts[key] = data;
        }
        
        // Check if in lockout period
        if (data.lockoutUntil && now < data.lockoutUntil) {
            const remainingTime = Math.ceil((data.lockoutUntil - now) / 1000 / 60);
            throw new Error(`Too many attempts. Please try again in ${remainingTime} minutes.`);
        }
        
        // Reset if lockout period expired
        if (data.lockoutUntil && now >= data.lockoutUntil) {
            data.count = 0;
            data.firstAttempt = now;
            data.lockoutUntil = null;
        }
        
        // Reset counter if more than lockout duration has passed since first attempt
        if (now - data.firstAttempt > SECURITY_CONFIG.LOCKOUT_DURATION) {
            data.count = 0;
            data.firstAttempt = now;
        }
        
        return data.count < maxAttempts;
    },
    
    /**
     * Record an attempt
     */
    recordAttempt: function(identifier) {
        const key = `rate_limit_${identifier}`;
        const data = this.attempts[key] || { count: 0, firstAttempt: Date.now(), lockoutUntil: null };
        
        data.count++;
        
        // Trigger lockout if max attempts reached
        if (data.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            data.lockoutUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
        }
        
        this.attempts[key] = data;
        
        // Return remaining attempts
        return Math.max(0, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - data.count);
    },
    
    /**
     * Reset attempts for identifier
     */
    reset: function(identifier) {
        const key = `rate_limit_${identifier}`;
        delete this.attempts[key];
    },
    
    /**
     * Get remaining attempts
     */
    getRemainingAttempts: function(identifier) {
        const key = `rate_limit_${identifier}`;
        const data = this.attempts[key];
        
        if (!data) {
            return SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
        }
        
        return Math.max(0, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - data.count);
    }
};

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
    const minLength = SECURITY_CONFIG.PASSWORD_MIN_LENGTH;
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        strength: getPasswordStrength(password)
    };
}

/**
 * Calculate password strength score
 */
function getPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    
    // Return strength level
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
}

/**
 * Prevent SQL injection in search queries
 */
function sanitizeSearchQuery(query) {
    if (typeof query !== 'string') return '';
    
    // Remove SQL keywords and dangerous characters
    const dangerous = [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
        'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', '/*', '*/', ';', 'xp_'
    ];
    
    let sanitized = query;
    dangerous.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized.trim();
}

/**
 * Check if running on HTTPS
 */
function isSecureContext() {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
}

/**
 * Warn if not on HTTPS in production
 */
function enforceHTTPS() {
    if (!isSecureContext() && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn('SECURITY WARNING: Site is not running on HTTPS. Redirecting...');
        // In production, redirect to HTTPS
        if (window.location.hostname !== 'localhost') {
            window.location.href = 'https://' + window.location.host + window.location.pathname;
        }
    }
}

/**
 * Clear sensitive data from console in production
 */
function disableConsoleInProduction() {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Disable console methods in production
        const noop = function() {};
        console.log = noop;
        console.warn = noop;
        console.error = noop;
        console.info = noop;
        console.debug = noop;
    }
}

/**
 * Prevent clickjacking
 */
function preventClickjacking() {
    if (window.top !== window.self) {
        // Page is in an iframe
        console.warn('Clickjacking attempt detected');
        window.top.location = window.self.location;
    }
}

/**
 * Initialize security measures on page load
 */
function initializeSecurity() {
    // Enforce HTTPS
    enforceHTTPS();
    
    // Prevent clickjacking
    preventClickjacking();
    
    // Disable console in production
    disableConsoleInProduction();
    
    // Generate initial CSRF token
    if (SECURITY_CONFIG.ENABLE_CSRF) {
        generateCSRFToken();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SECURITY_CONFIG,
        sanitizeHTML,
        sanitizeInput,
        escapeHTML,
        sanitizeURL,
        generateCSRFToken,
        validateCSRFToken,
        addCSRFTokenToForm,
        encryptData,
        decryptData,
        secureStorage,
        rateLimiter,
        validatePasswordStrength,
        getPasswordStrength,
        sanitizeSearchQuery,
        isSecureContext,
        enforceHTTPS,
        preventClickjacking,
        initializeSecurity
    };
}
