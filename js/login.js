/**
 * Login Page
 * Handles user login and authentication
 */

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('email') || document.getElementById('loginEmail');
    const passwordInput = document.getElementById('password') || document.getElementById('loginPassword');
    
    if (!emailInput || !passwordInput) {
        showError('Form elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Basic validation
    if (!email) {
        showError('Please enter your email');
        emailInput.focus();
        return;
    }
    
    if (!password) {
        showError('Please enter your password');
        passwordInput.focus();
        return;
    }
    
    try {
        showLoading();
        
        // Call login API
        const response = await api.login({ email, password });
        
        if (response.success || response.data || response.token) {
            // Merge guest cart with user cart
            await api.mergeCart();
            
            showSuccess('Login successful! Redirecting...');
            
            // Redirect to intended page or home
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || '/index.html';
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            throw new Error(response.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
        hideLoading();
    }
}

/**
 * Setup event listeners
 */
function setupLoginEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Show/hide password toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password') || document.getElementById('loginPassword');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
}

/**
 * Initialize login page
 */
function initLoginPage() {
    // Check if already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // User is already logged in, redirect to home or intended page
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || '/index.html';
        window.location.href = redirectUrl;
        return;
    }
    
    setupLoginEventListeners();
}

// Auto-initialize if on login page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('login.html') || document.getElementById('loginForm')) {
            initLoginPage();
        }
    });
} else {
    if (window.location.pathname.includes('login.html') || document.getElementById('loginForm')) {
        initLoginPage();
    }
}
