/**
 * Configuration for Premium Hair Wigs & Extensions E-commerce Platform
 */

// Determine the backend URL based on environment
// For development: http://localhost:3000
// For production: https://your-backend-url.onrender.com
const getBackendUrl = () => {
    const hostname = window.location.hostname;
    
    // If running locally, use local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // For production (GitHub Pages), use your deployed backend URL
    // UPDATE THIS with your actual backend URL!
    return 'https://backend-ecommerce-ps2d.onrender.com';
};

const BACKEND_URL = getBackendUrl();

// API Configuration
const API_CONFIG = {
    BASE_URL: BACKEND_URL,
    ENDPOINTS: {
        // Products
        products: `${BACKEND_URL}/api/products`,
        productById: (id) => `${BACKEND_URL}/api/products/${id}`,
        productsByCategory: (category) => `${BACKEND_URL}/api/products?category=${category}`,
        searchProducts: (query) => `${BACKEND_URL}/api/products/search?q=${query}`,
        
        // Authentication
        register: `${BACKEND_URL}/api/auth/register`,
        login: `${BACKEND_URL}/api/auth/login`,
        logout: `${BACKEND_URL}/api/auth/logout`,
        user: `${BACKEND_URL}/api/auth/user`,
        
        // Orders
        orders: `${BACKEND_URL}/api/orders`,
        orderById: (id) => `${BACKEND_URL}/api/orders/${id}`,
        trackOrder: (orderNumber) => `${BACKEND_URL}/api/orders/track/${orderNumber}`,
        
        // Wishlist
        wishlist: `${BACKEND_URL}/api/wishlist`,
        wishlistItem: (id) => `${BACKEND_URL}/api/wishlist/${id}`,
        
        // Contact & Newsletter
        contact: `${BACKEND_URL}/api/contact`,
        newsletter: `${BACKEND_URL}/api/newsletter`
    }
};

// Application Configuration
const APP_CONFIG = {
    currency: 'R',
    currencySymbol: 'R',
    VAT_RATE: 0.15, // 15% VAT
    SHIPPING: {
        FREE_THRESHOLD: 1500, // Free shipping on orders above R1,500
        STANDARD_COST: 150,
        EXPRESS_COST: 250
    },
    DELIVERY_DAYS: {
        STANDARD: '2-5 business days',
        EXPRESS: '1-2 business days'
    },
    RETURN_POLICY_DAYS: 7,
    PAYMENT_METHODS: ['PayFast', 'Credit Card', 'Debit Card', 'EFT']
};

// Business Information
const BUSINESS_INFO = {
    companyName: 'Premium Hair Wigs & Extensions Pty (Ltd)',
    tradingName: 'Premium Hair Wigs & Extensions',
    registrationNumber: 'CIPC Registered',
    vatNumber: 'VAT Registered',
    address: {
        street: '123 Luxury Lane',
        suburb: 'Protea Glen',
        city: 'Soweto',
        province: 'Johannesburg, Gauteng',
        postalCode: '1818',
        country: 'South Africa',
        full: '123 Luxury Lane, Protea Glen, Soweto, Johannesburg, Gauteng, 1818'
    },
    contact: {
        phone: '+27 71 555 1234',
        email: 'info@premiumhairsa.co.za',
        supportEmail: 'support@premiumhairsa.co.za',
        salesEmail: 'sales@premiumhairsa.co.za'
    },
    hours: {
        weekdays: 'Monday - Friday: 09:00 - 18:00',
        saturday: 'Saturday: 09:00 - 14:00',
        sunday: 'Sunday: Closed',
        publicHolidays: 'Public Holidays: Closed'
    },
    social: {
        facebook: 'https://facebook.com/premiumhairsa',
        instagram: 'https://instagram.com/premiumhairsa',
        twitter: 'https://twitter.com/premiumhairsa',
        whatsapp: 'https://wa.me/27715551234'
    },
    legal: {
        popiaCompliant: true,
        terms: '/terms-and-conditions',
        privacy: '/privacy-policy',
        returns: '/returns-policy'
    }
};

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, APP_CONFIG, BUSINESS_INFO };
}
