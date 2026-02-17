/**
 * Main Application Logic for Premium Hair Wigs & Extensions E-commerce
 * Handles UI interactions, state management, and business logic
 */

// ========== Global State ==========
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    user: JSON.parse(localStorage.getItem('user')) || null,
    wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
    currentPage: 'home',
    currentFilter: 'all',
    currentProduct: null,
    searchQuery: '',
    isLoading: false
};

// Initialize API Service
let apiService = null;

// Session timeout configuration - 30 minutes based on industry standard for e-commerce security
// This balances user convenience with security best practices
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// ========== Network Monitoring ==========
function handleOffline() {
    showNotification('You are offline. Please check your internet connection.', 'error', NOTIFICATION_PERSISTENT);
    document.body.classList.add('offline-mode');
}

function handleOnline() {
    showNotification('Connection restored!', 'success');
    document.body.classList.remove('offline-mode');
    // Retry failed requests
    loadProducts();
}

// ========== Session Timeout Handler ==========
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (state.user) {
        inactivityTimer = setTimeout(() => {
            showNotification('Your session has expired due to inactivity. Please login again.', 'warning', 5000);
            handleLogout();
        }, INACTIVITY_TIMEOUT);
    }
}

// Throttle function to limit how often a function can be called
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== Skeleton Loader Helper ==========
function createSkeletonLoader(count = 6) {
    return Array(count).fill(0).map(() => `
        <div class="skeleton-product-card">
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-button"></div>
        </div>
    `).join('');
}

// ========== Error Recovery UI ==========
function showErrorWithRetry(message, retryFunctionName) {
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <div class="error-actions">
                <button class="btn btn-primary" data-retry="${retryFunctionName}">Try Again</button>
                <button class="btn btn-outline" data-navigate="home">Go Home</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const retryBtn = container.querySelector('[data-retry]');
    const homeBtn = container.querySelector('[data-navigate]');
    
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (typeof window[retryFunctionName] === 'function') {
                window[retryFunctionName]();
            }
        });
    }
    
    if (homeBtn) {
        homeBtn.addEventListener('click', () => navigateTo('home'));
    }
    
    return container.innerHTML;
}

// ========== Initialization ==========
function init() {
    try {
        // Initialize API service
        apiService = new APIService({ API_CONFIG, APP_CONFIG, BUSINESS_INFO });
        
        // Monitor network status
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Monitor user activity for session timeout
        // Throttle mousemove to prevent performance issues (max once per 5 seconds)
        document.addEventListener('mousemove', throttle(resetInactivityTimer, 5000));
        document.addEventListener('keypress', resetInactivityTimer);
        document.addEventListener('click', resetInactivityTimer);
        
        // Load initial data
        loadProducts();
        
        // Setup event listeners
        setupEventListeners();
        
        // Render initial UI
        renderAuth();
        updateCartBadge();
        updateWishlistBadge();
        startCountdown();
        
        // Show home page by default
        navigateTo('home');
        
        // Hide page loader after initialization
        setTimeout(() => {
            const pageLoader = document.getElementById('pageLoader');
            if (pageLoader) {
                pageLoader.classList.add('hidden');
                setTimeout(() => pageLoader.remove(), 600);
            }
        }, 2000);
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize app', 'error');
    }
}

// ========== Event Listeners Setup ==========
function setupEventListeners() {
    // Make logo clickable
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => navigateTo('home'));
    }
    
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
    
    // Newsletter subscription
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Checkout form
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    // Track order form
    const trackOrderForm = document.getElementById('trackOrderForm');
    if (trackOrderForm) {
        trackOrderForm.addEventListener('submit', handleTrackOrder);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// ========== Data Loading ==========
async function loadProducts() {
    try {
        state.isLoading = true;
        // Show skeleton loaders immediately
        renderFeaturedProducts();
        renderAllProducts();
        renderSaleProducts();
        
        const products = await apiService.getAllProducts();
        state.products = products;
    } catch (error) {
        console.error('Failed to load products:', error);
        // Use fallback products if API fails
        state.products = getFallbackProducts();
    } finally {
        state.isLoading = false;
        renderFeaturedProducts();
        renderAllProducts();
        renderSaleProducts();
    }
}

// ========== Navigation ==========
function navigateTo(page) {
    // Close mobile menu
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.remove('active');
    }
    
    // Check authentication for protected pages
    if (['checkout', 'orders', 'wishlist'].includes(page) && !state.user) {
        openModal('loginModal');
        showNotification('Please login to continue', 'info');
        return;
    }
    
    // Check cart for checkout
    if (page === 'checkout' && state.cart.length === 0) {
        showNotification('Your cart is empty!', 'warning');
        return;
    }
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Page mapping
    const pageMap = {
        'home': 'homePage',
        'shop': 'shopPage',
        'about': 'aboutPage',
        'shipping': 'shippingPage',
        'returns': 'returnsPage',
        'privacy': 'privacyPage',
        'terms': 'termsPage',
        'faq': 'faqPage',
        'cart': 'cartPage',
        'checkout': 'checkoutPage',
        'orders': 'ordersPage',
        'track': 'trackPage',
        'wishlist': 'wishlistPage',
        'contact': 'contactPage',
        'sale': 'salePage',
        'product-detail': 'productDetailPage'
    };
    
    const pageId = pageMap[page];
    if (!pageId) {
        showNotification('Page not found. Redirecting to home.', 'warning');
        navigateTo('home');
        return;
    }

    const pageElement = document.getElementById(pageId);
    if (!pageElement) {
        showNotification('Requested page is unavailable right now.', 'error');
        navigateTo('home');
        return;
    }

    pageElement.classList.add('active');
    state.currentPage = page;
    
    // Render page-specific content
    if (page === 'cart') renderCart();
    if (page === 'checkout') renderCheckout();
    if (page === 'orders') renderOrders();
    if (page === 'wishlist') renderWishlist();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== Authentication ==========
function renderAuth() {
    const authArea = document.getElementById('authArea');
    
    if (!authArea) return;
    
    if (state.user) {
        // Show user info with dropdown
        authArea.innerHTML = `
            <div class="user-info" style="display: flex;">
                <div class="user-menu">
                    <button class="nav-icon-btn" title="Account" style="font-size:1.1rem;">
                        <i class="fas fa-user-circle"></i>
                    </button>
                    <div class="user-dropdown">
                        <div class="user-dropdown-header">
                            <span>${state.user.name || state.user.email}</span>
                        </div>
                        <a href="#" onclick="navigateTo('orders'); return false;"><i class="fas fa-box"></i> My Orders</a>
                        <a href="#" onclick="navigateTo('wishlist'); return false;"><i class="fas fa-heart"></i> Wishlist</a>
                        <a href="#" onclick="navigateTo('cart'); return false;"><i class="fas fa-shopping-bag"></i> Cart</a>
                        <button onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Show compact login/signup buttons
        authArea.innerHTML = `
            <div class="auth-buttons">
                <button class="btn btn-outline" onclick="openModal('loginModal')"><i class="fas fa-sign-in-alt"></i> Login</button>
                <button class="btn btn-primary" onclick="openModal('registerModal')">Sign Up</button>
            </div>
        `;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await apiService.login({ email, password });
        state.user = response.user;
        localStorage.setItem('user', JSON.stringify(response.user));
        
        closeModal('loginModal');
        renderAuth();
        showNotification('Login successful!', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reset inactivity timer
        resetInactivityTimer();
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        return;
    }
    
    try {
        const response = await apiService.register({ name, email, password });
        state.user = response.user;
        localStorage.setItem('user', JSON.stringify(response.user));
        
        closeModal('registerModal');
        renderAuth();
        showNotification('Registration successful!', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reset inactivity timer
        resetInactivityTimer();
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message || 'Registration failed', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    apiService.logout();
    state.user = null;
    state.wishlist = [];
    localStorage.removeItem('wishlist');
    renderAuth();
    showNotification('Logged out successfully', 'success');
    navigateTo('home');
}

// ========== Product Rendering ==========
function renderFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    // Show skeleton loader if loading
    if (state.isLoading) {
        container.innerHTML = createSkeletonLoader(4);
        return;
    }
    
    const featured = state.products.slice(0, 4);
    container.innerHTML = featured.map(product => createProductCard(product)).join('');
}

function renderAllProducts() {
    const container = document.getElementById('allProducts');
    if (!container) return;
    
    // Show skeleton loader if loading
    if (state.isLoading) {
        container.innerHTML = createSkeletonLoader(6);
        return;
    }
    
    let filtered = state.products;
    
    // Apply category filter
    if (state.currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === state.currentFilter);
    }
    
    // Apply search filter
    if (state.searchQuery) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(state.searchQuery.toLowerCase())
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No products found</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(product => createProductCard(product)).join('');
}

function renderSaleProducts() {
    const container = document.getElementById('saleProducts');
    if (!container) return;
    
    // Show skeleton loader if loading
    if (state.isLoading) {
        container.innerHTML = createSkeletonLoader(6);
        return;
    }
    
    // Products on sale (assuming products with 'onSale' flag or discount)
    const saleProducts = state.products.filter(p => p.onSale || p.discount > 0).slice(0, 6);
    
    if (saleProducts.length === 0) {
        // Show some products as sale items
        const products = state.products.slice(0, 6);
        container.innerHTML = products.map(product => createProductCard(product, true)).join('');
    } else {
        container.innerHTML = saleProducts.map(product => createProductCard(product, true)).join('');
    }
}

function createProductCard(product, showDiscount = false) {
    const discount = showDiscount ? 20 : (product.discount || 0);
    const originalPrice = product.price;
    const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
    
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=Product+Image'">
            ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
            <h3>${product.name}</h3>
            <p class="price">
                ${discount > 0 ? `<span class="original-price">${APP_CONFIG.currency}${originalPrice.toFixed(2)}</span>` : ''}
                ${APP_CONFIG.currency}${discountedPrice.toFixed(2)}
            </p>
            <button class="btn btn-primary" onclick="viewProduct(${product.id})">View Details</button>
            <button class="btn btn-secondary" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
    `;
}

function viewProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    state.currentProduct = product;
    
    // Populate product detail page
    const detailPage = document.getElementById('productDetailPage');
    if (detailPage) {
        document.getElementById('productDetailImage').src = product.image;
        document.getElementById('productDetailImage').alt = product.name;
        document.getElementById('productDetailName').textContent = product.name;
        document.getElementById('productDetailPrice').textContent = `${APP_CONFIG.currency}${product.price.toFixed(2)}`;
        document.getElementById('productDetailDescription').textContent = product.description || 'No description available';
        document.getElementById('productDetailCategory').textContent = product.category || 'Uncategorized';
        
        // Reset quantity
        const qtyInput = document.getElementById('detailQty');
        if (qtyInput) qtyInput.value = '1';
        
        // Show/hide color and size options based on category
        const colorGroup = document.getElementById('colorOptionGroup');
        const sizeGroup = document.getElementById('sizeOptionGroup');
        const isAccessory = product.category === 'accessories';
        if (colorGroup) colorGroup.style.display = isAccessory ? 'none' : 'block';
        if (sizeGroup) sizeGroup.style.display = isAccessory ? 'none' : 'block';
    }
    
    navigateTo('product-detail');
}

function addProductToCart() {
    if (state.currentProduct) {
        const qty = parseInt(document.getElementById('detailQty').value) || 1;
        const product = state.currentProduct;
        const existingItem = state.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            state.cart.push({ ...product, quantity: qty });
        }
        
        saveCart();
        updateCartBadge();
        showNotification(`${product.name} (x${qty}) added to cart`, 'success');
    }
}

// Product detail controls
function changeDetailQty(delta) {
    const input = document.getElementById('detailQty');
    if (!input) return;
    let val = parseInt(input.value) || 1;
    val = Math.max(1, val + delta);
    input.value = val;
}

function selectColor(el) {
    document.querySelectorAll('#productColors .color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    const label = document.getElementById('selectedColorLabel');
    if (label) label.textContent = el.getAttribute('data-color');
}

function selectSize(el) {
    document.querySelectorAll('#productSizes .size-btn').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

// Password strength checker for registration
function checkPasswordStrength(password) {
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');
    if (!fill || !text) return;
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const levels = [
        { width: '0%', color: '#eee', label: '' },
        { width: '20%', color: '#dc3545', label: 'Very Weak' },
        { width: '40%', color: '#fd7e14', label: 'Weak' },
        { width: '60%', color: '#ffc107', label: 'Fair' },
        { width: '80%', color: '#28a745', label: 'Strong' },
        { width: '100%', color: '#20c997', label: 'Very Strong' }
    ];
    
    fill.style.width = levels[score].width;
    fill.style.background = levels[score].color;
    text.textContent = levels[score].label;
    text.style.color = levels[score].color;
}

function filterProducts(category) {
    state.currentFilter = category;
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    renderAllProducts();
}

function searchProducts(query) {
    state.searchQuery = query;
    renderAllProducts();
}

// ========== Cart Management ==========
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = state.cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartBadge();
    showNotification(`${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    renderCart();
    showNotification('Item removed from cart', 'success');
}

function updateCartQuantity(productId, quantity) {
    const qty = parseInt(quantity);
    if (qty < 1) {
        removeFromCart(productId);
        return;
    }
    const item = state.cart.find(item => item.id === productId);
    if (item) {
        item.quantity = qty;
        saveCart();
        updateCartBadge();
        renderCart();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    const subtotalElement = document.getElementById('cartSubtotal');
    const vatElement = document.getElementById('cartVat');
    const shippingElement = document.getElementById('cartShipping');
    
    if (!container) return;
    
    if (state.cart.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Your cart is empty</p><button class="btn btn-primary" onclick="navigateTo(\'shop\')">Continue Shopping</button></div>';
        if (totalElement) totalElement.textContent = `${APP_CONFIG.currency}0.00`;
        return;
    }
    
    // Calculate totals
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * APP_CONFIG.VAT_RATE;
    const shipping = subtotal >= APP_CONFIG.SHIPPING.FREE_THRESHOLD ? 0 : APP_CONFIG.SHIPPING.STANDARD_COST;
    const total = subtotal + vat + shipping;
    
    // Render cart items
    container.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=Product'">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="price">${APP_CONFIG.currency}${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button type="button" class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">−</button>
                    <input type="text" class="qty-value" value="${item.quantity}" readonly>
                    <button type="button" class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="btn btn-danger" onclick="removeFromCart(${item.id})" title="Remove"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
    
    // Update totals
    if (subtotalElement) subtotalElement.textContent = `${APP_CONFIG.currency}${subtotal.toFixed(2)}`;
    if (vatElement) vatElement.textContent = `${APP_CONFIG.currency}${vat.toFixed(2)}`;
    if (shippingElement) shippingElement.textContent = shipping === 0 ? 'FREE' : `${APP_CONFIG.currency}${shipping.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `${APP_CONFIG.currency}${total.toFixed(2)}`;
}

function clearCart() {
    state.cart = [];
    saveCart();
    updateCartBadge();
    renderCart();
    showNotification('Cart cleared', 'success');
}

// ========== Checkout ==========
function renderCheckout() {
    renderCart(); // Show cart summary in checkout
}

async function handleCheckout(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    if (!state.user) {
        showNotification('Please login to checkout', 'error');
        openModal('loginModal');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        return;
    }
    
    if (state.cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        return;
    }
    
    // Get form data
    const formData = new FormData(e.target);
    const orderData = {
        items: state.cart,
        shipping: {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            province: formData.get('province'),
            postalCode: formData.get('postalCode')
        },
        payment: {
            method: formData.get('paymentMethod')
        }
    };
    
    try {
        const order = await apiService.createOrder(orderData);
        
        // Clear cart
        state.cart = [];
        saveCart();
        updateCartBadge();
        
        // Show success
        showNotification('Order placed successfully!', 'success');
        openModal('successModal');
        
        // Reset form
        e.target.reset();
        
        // Navigate to orders page after delay
        setTimeout(() => {
            closeModal('successModal');
            navigateTo('orders');
        }, 3000);
        
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification(error.message || 'Failed to place order', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

// ========== Orders ==========
async function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    try {
        const orders = await apiService.getMyOrders();
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>You have no orders yet</p><button class="btn btn-primary" onclick="navigateTo(\'shop\')">Start Shopping</button></div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h3>Order #${order.orderNumber}</h3>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ${APP_CONFIG.currency}${order.total.toFixed(2)}</p>
                    <p><strong>Items:</strong> ${order.items.length}</p>
                </div>
                <button class="btn btn-secondary" onclick="viewOrder('${order.id}')">View Details</button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        container.innerHTML = '<div class="empty-state"><p>Failed to load orders</p></div>';
    }
}

async function handleTrackOrder(e) {
    e.preventDefault();
    
    const orderNumber = document.getElementById('trackOrderNumber').value;
    const resultsContainer = document.getElementById('trackingResults');
    
    if (!resultsContainer) return;
    
    try {
        const tracking = await apiService.trackOrder(orderNumber);
        
        resultsContainer.innerHTML = `
            <div class="tracking-info">
                <h3>Order #${tracking.orderNumber}</h3>
                <div class="tracking-status">
                    <p><strong>Status:</strong> <span class="${tracking.status}">${tracking.status}</span></p>
                    <p><strong>Estimated Delivery:</strong> ${tracking.estimatedDelivery || 'N/A'}</p>
                </div>
                <div class="tracking-timeline">
                    ${tracking.timeline ? tracking.timeline.map(event => `
                        <div class="timeline-item">
                            <span class="timeline-date">${new Date(event.date).toLocaleString()}</span>
                            <p>${event.description}</p>
                        </div>
                    `).join('') : '<p>No tracking information available</p>'}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Tracking error:', error);
        resultsContainer.innerHTML = '<div class="error-state"><p>Order not found or tracking information unavailable</p></div>';
    }
}

// ========== Wishlist ==========
function updateWishlistBadge() {
    const badge = document.getElementById('wishlistBadge');
    if (badge) {
        badge.textContent = state.wishlist.length;
        badge.style.display = state.wishlist.length > 0 ? 'flex' : 'none';
    }
}

async function addToWishlist(productId) {
    if (!state.user) {
        showNotification('Please login to add to wishlist', 'info');
        openModal('loginModal');
        return;
    }
    
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    try {
        await apiService.addToWishlist(productId);
        state.wishlist.push(product);
        localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
        updateWishlistBadge();
        showNotification(`${product.name} added to wishlist`, 'success');
    } catch (error) {
        console.error('Failed to add to wishlist:', error);
        // Add locally even if API fails
        if (!state.wishlist.find(p => p.id === productId)) {
            state.wishlist.push(product);
            localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
            updateWishlistBadge();
            showNotification(`${product.name} added to wishlist`, 'success');
        }
    }
}

async function removeFromWishlist(productId) {
    try {
        await apiService.removeFromWishlist(productId);
        state.wishlist = state.wishlist.filter(p => p.id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
        updateWishlistBadge();
        renderWishlist();
        showNotification('Removed from wishlist', 'success');
    } catch (error) {
        console.error('Failed to remove from wishlist:', error);
        // Remove locally even if API fails
        state.wishlist = state.wishlist.filter(p => p.id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
        updateWishlistBadge();
        renderWishlist();
        showNotification('Removed from wishlist', 'success');
    }
}

function renderWishlist() {
    const container = document.getElementById('wishlistItems');
    if (!container) return;
    
    if (state.wishlist.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Your wishlist is empty</p><button class="btn btn-primary" onclick="navigateTo(\'shop\')">Browse Products</button></div>';
        return;
    }
    
    container.innerHTML = state.wishlist.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=Product+Image'">
            <h3>${product.name}</h3>
            <p class="price">${APP_CONFIG.currency}${product.price.toFixed(2)}</p>
            <button class="btn btn-primary" onclick="viewProduct(${product.id})">View Details</button>
            <button class="btn btn-secondary" onclick="addToCart(${product.id})">Add to Cart</button>
            <button class="btn btn-danger" onclick="removeFromWishlist(${product.id})">Remove</button>
        </div>
    `).join('');
}

// ========== Contact & Newsletter ==========
async function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };
    
    try {
        await apiService.submitContactForm(data);
        showNotification('Thank you for contacting us! We will get back to you soon.', 'success');
        e.target.reset();
    } catch (error) {
        console.error('Contact form error:', error);
        showNotification(error.message || 'Failed to send message. Please try again.', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

async function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    const email = document.getElementById('newsletterEmail').value;
    
    try {
        await apiService.subscribeNewsletter(email);
        showNotification('Successfully subscribed to newsletter!', 'success');
        e.target.reset();
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        showNotification(error.message || 'Failed to subscribe. Please try again.', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

// ========== Modal Functions ==========
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function switchModal(closeId, openId) {
    closeModal(closeId);
    openModal(openId);
}

// ========== Notification System ==========
// ========== Notification System ==========
// Constants for notification behavior
const NOTIFICATION_PERSISTENT = 0;

function showNotification(message, type = 'info', duration = 5000, action = null) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    // Create notification content
    const content = document.createElement('div');
    content.className = 'notification-content';
    
    // Add icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'notification-icon';
    iconSpan.textContent = icons[type];
    content.appendChild(iconSpan);
    
    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    messageSpan.textContent = message;
    content.appendChild(messageSpan);
    
    // Add action button if provided
    if (action && action.callback && action.text) {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'notification-action';
        actionBtn.textContent = action.text;
        actionBtn.addEventListener('click', action.callback);
        content.appendChild(actionBtn);
    }
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => notification.remove());
    content.appendChild(closeBtn);
    
    notification.appendChild(content);
    
    // Add progress bar for auto-dismiss
    if (duration > 0) {
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress';
        progressBar.innerHTML = `<div class="notification-progress-bar" style="animation-duration:${duration}ms;"></div>`;
        notification.appendChild(progressBar);
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        min-width: 300px;
        max-width: 420px;
        background: ${colors[type]};
        color: white;
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.4s ease;
        overflow: hidden;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss if duration > 0 (use NOTIFICATION_PERSISTENT for persistent notifications)
    if (duration > 0) {
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, duration);
    }
}

// ========== Countdown Timer ==========
function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    
    let hours = 23;
    let minutes = 59;
    let seconds = 59;
    
    setInterval(() => {
        seconds--;
        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }
        if (minutes < 0) {
            minutes = 59;
            hours--;
        }
        if (hours < 0) {
            hours = 23;
        }
        
        countdownElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// ========== Fallback Products Data ==========
function getFallbackProducts() {
    return [
        { id: 1, name: "Luxury Straight Wig", price: 1500, category: "wigs", image: "https://images.unsplash.com/photo-1600180758895-7f0a6b7f83e5?w=500", description: "Premium quality straight wig with natural look and comfortable fit. Made from 100% human hair.", onSale: false },
        { id: 2, name: "Silk Extensions", price: 850, category: "extensions", image: "https://images.unsplash.com/photo-1616628188931-91c8aa62f5a2?w=500", description: "Luxurious silk extensions for added length and volume. Blend seamlessly with your natural hair.", onSale: true, discount: 15 },
        { id: 3, name: "Curly Bob Wig", price: 1200, category: "wigs", image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500", description: "Beautiful curly bob style wig. Perfect for a fresh, modern look.", onSale: false },
        { id: 4, name: "Wave Extensions", price: 950, category: "extensions", image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500", description: "Gorgeous wavy extensions for a beachy, natural look.", onSale: true, discount: 20 },
        { id: 5, name: "Long Straight Wig", price: 1800, category: "wigs", image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500", description: "Extra long straight wig with natural movement. Premium quality construction.", onSale: false },
        { id: 6, name: "Clip-In Extensions", price: 650, category: "extensions", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=500", description: "Easy-to-use clip-in extensions. Add volume and length in minutes.", onSale: true, discount: 10 },
        { id: 7, name: "Lace Front Wig", price: 2200, category: "wigs", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500", description: "Premium lace front wig with realistic hairline. Natural-looking and breathable.", onSale: false },
        { id: 8, name: "Tape-In Extensions", price: 1100, category: "extensions", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500", description: "Professional tape-in extensions. Long-lasting and comfortable.", onSale: false },
        { id: 9, name: "Wig Cap", price: 120, category: "accessories", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500", description: "Comfortable wig cap for secure fit. Breathable material.", onSale: true, discount: 25 },
        { id: 10, name: "Wig Stand", price: 180, category: "accessories", image: "https://images.unsplash.com/photo-1610652492300-baba14fff5b8?w=500", description: "Elegant wig stand for proper storage and display.", onSale: false },
        { id: 11, name: "Wig Brush", price: 95, category: "accessories", image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500", description: "Specialized wig brush for gentle detangling.", onSale: false },
        { id: 12, name: "Curly Afro Wig", price: 1350, category: "wigs", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500", description: "Beautiful natural curly afro wig. Voluminous and stylish.", onSale: true, discount: 18 }
    ];
}

// ========== Initialize App on Page Load ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
