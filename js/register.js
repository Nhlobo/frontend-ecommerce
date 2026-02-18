/**
 * Register Page
 * Handles user registration
 */

/**
 * Handle registration form submission
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('name') || document.getElementById('registerName');
    const emailInput = document.getElementById('email') || document.getElementById('registerEmail');
    const passwordInput = document.getElementById('password') || document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (!nameInput || !emailInput || !passwordInput) {
        showError('Form elements not found');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput?.value;
    
    // Validation
    if (!name) {
        showError('Please enter your name');
        nameInput.focus();
        return;
    }
    
    if (name.length < 2) {
        showError('Name must be at least 2 characters');
        nameInput.focus();
        return;
    }
    
    if (!email) {
        showError('Please enter your email');
        emailInput.focus();
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        emailInput.focus();
        return;
    }
    
    if (!password) {
        showError('Please enter a password');
        passwordInput.focus();
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        passwordInput.focus();
        return;
    }
    
    if (confirmPasswordInput && password !== confirmPassword) {
        showError('Passwords do not match');
        confirmPasswordInput.focus();
        return;
    }
    
    try {
        showLoading();
        
        // Call register API
        const response = await api.register({ name, email, password });
        
        if (response.success || response.data || response.token) {
            // Merge guest cart with user cart
            await api.mergeCart();
            
            showSuccess('Account created successfully! Redirecting...');
            
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } else {
            throw new Error(response.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        hideLoading();
    }
}

/**
 * Setup event listeners
 */
function setupRegisterEventListeners() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Show/hide password toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password') || document.getElementById('registerPassword');
    
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
    
    // Show/hide confirm password toggle
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', () => {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            
            // Toggle icon
            const icon = toggleConfirmPassword.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
    
    // Real-time password confirmation check
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
                confirmPasswordInput.setCustomValidity('Passwords do not match');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
    }
}

/**
 * Initialize register page
 */
function initRegisterPage() {
    // Check if already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // User is already logged in, redirect to home
        window.location.href = '/index.html';
        return;
    }
    
    setupRegisterEventListeners();
}

// Auto-initialize if on register page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('register.html') || document.getElementById('registerForm')) {
            initRegisterPage();
        }
    });
} else {
    if (window.location.pathname.includes('register.html') || document.getElementById('registerForm')) {
        initRegisterPage();
    }
}
