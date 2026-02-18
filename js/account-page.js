/**
 * Account Page
 * Displays user account information
 */

/**
 * Load account information
 */
async function loadAccountInfo() {
    try {
        showLoading();
        
        const response = await api.getCurrentUser();
        const user = response.user || response.data?.user || response.data;
        
        if (!user) {
            throw new Error('User not found');
        }
        
        renderAccountInfo(user);
        
    } catch (error) {
        console.error('Error loading account info:', error);
        showError('Failed to load account information. Please login again.');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/login.html?redirect=/account.html';
        }, 2000);
    } finally {
        hideLoading();
    }
}

/**
 * Render account information
 */
function renderAccountInfo(user) {
    // User name
    const nameEl = document.getElementById('userName');
    if (nameEl) {
        nameEl.textContent = user.name || 'User';
    }
    
    // User email
    const emailEl = document.getElementById('userEmail');
    if (emailEl) {
        emailEl.textContent = user.email || '';
    }
    
    // Member since
    const memberSinceEl = document.getElementById('memberSince');
    if (memberSinceEl && user.created_at) {
        const date = new Date(user.created_at);
        memberSinceEl.textContent = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Phone
    const phoneEl = document.getElementById('userPhone');
    if (phoneEl && user.phone) {
        phoneEl.textContent = user.phone;
    }
    
    // Address
    if (user.addresses && user.addresses.length > 0) {
        const addressContainer = document.getElementById('userAddress');
        if (addressContainer) {
            const primaryAddress = user.addresses.find(addr => addr.isPrimary) || user.addresses[0];
            addressContainer.innerHTML = `
                <p>${primaryAddress.line1}</p>
                ${primaryAddress.line2 ? `<p>${primaryAddress.line2}</p>` : ''}
                <p>${primaryAddress.city}, ${primaryAddress.province} ${primaryAddress.postalCode}</p>
            `;
        }
    }
}

/**
 * Initialize account page
 */
function initAccountPage() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html?redirect=/account.html';
        return;
    }
    
    loadAccountInfo();
}

// Auto-initialize if on account page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('account.html') || document.getElementById('accountPage')) {
            initAccountPage();
        }
    });
} else {
    if (window.location.pathname.includes('account.html') || document.getElementById('accountPage')) {
        initAccountPage();
    }
}
