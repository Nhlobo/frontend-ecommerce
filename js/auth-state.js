/**
 * Auth State Management
 * Updates navigation based on authentication status
 */

/**
 * Update navigation auth state
 */
async function updateNavAuth() {
    const authArea = document.getElementById('authArea');
    
    if (!authArea) {
        console.warn('Auth area element not found');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // User is not logged in
        authArea.innerHTML = `
            <a href="/login.html" class="btn-auth">Login</a>
            <a href="/register.html" class="btn-auth btn-register">Sign Up</a>
        `;
        return;
    }
    
    // User is logged in, try to get user info
    try {
        const response = await api.getCurrentUser();
        const user = response.user || response.data?.user || response.data;
        
        if (user) {
            // Store user info
            localStorage.setItem('user', JSON.stringify(user));
            
            authArea.innerHTML = `
                <div class="user-menu">
                    <button class="user-menu-trigger" id="userMenuTrigger">
                        <i class="fas fa-user-circle"></i>
                        <span class="user-name">${user.name || 'Account'}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown" style="display: none;">
                        <a href="/account.html" class="dropdown-item">
                            <i class="fas fa-user"></i> My Account
                        </a>
                        <a href="/orders.html" class="dropdown-item">
                            <i class="fas fa-shopping-bag"></i> My Orders
                        </a>
                        <a href="/wishlist.html" class="dropdown-item">
                            <i class="fas fa-heart"></i> Wishlist
                        </a>
                        <hr class="dropdown-divider">
                        <button class="dropdown-item logout-btn" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            `;
            
            // Setup dropdown toggle
            const menuTrigger = document.getElementById('userMenuTrigger');
            const dropdown = document.getElementById('userDropdown');
            
            if (menuTrigger && dropdown) {
                menuTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                });
            }
            
            // Setup logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
        }
    } catch (error) {
        console.error('Failed to get current user:', error);
        // Token might be invalid, clear it
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        authArea.innerHTML = `
            <a href="/login.html" class="btn-auth">Login</a>
            <a href="/register.html" class="btn-auth btn-register">Sign Up</a>
        `;
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        api.logout();
    }
}

/**
 * Update cart count badge
 */
async function updateCartCount() {
    try {
        const response = await api.getCart();
        const cart = response.cart || response.data?.cart || response.data;
        
        if (cart && cart.items) {
            const count = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            
            const cartBadge = document.getElementById('cartBadge');
            if (cartBadge) {
                cartBadge.textContent = count;
                cartBadge.style.display = count > 0 ? 'inline-flex' : 'none';
            }
        }
    } catch (error) {
        // Silent fail - cart count is not critical
        console.debug('Failed to update cart count:', error);
    }
}

/**
 * Update wishlist count badge
 */
async function updateWishlistCount() {
    const token = localStorage.getItem('authToken');
    if (!token) return; // Only update if logged in
    
    try {
        const response = await api.getWishlist();
        const wishlist = response.wishlist || response.data?.wishlist || response.data;
        
        if (wishlist && Array.isArray(wishlist)) {
            const count = wishlist.length;
            
            const wishlistBadge = document.getElementById('wishlistBadge');
            if (wishlistBadge) {
                wishlistBadge.textContent = count;
                wishlistBadge.style.display = count > 0 ? 'inline-flex' : 'none';
            }
        }
    } catch (error) {
        // Silent fail - wishlist count is not critical
        console.debug('Failed to update wishlist count:', error);
    }
}

/**
 * Initialize auth state
 */
function initAuthState() {
    updateNavAuth();
    updateCartCount();
    
    // Update cart count periodically (every 30 seconds)
    setInterval(updateCartCount, 30000);
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthState);
} else {
    initAuthState();
}

// Export functions for use in other scripts
window.updateNavAuth = updateNavAuth;
window.updateCartCount = updateCartCount;
window.updateWishlistCount = updateWishlistCount;
window.handleLogout = handleLogout;
