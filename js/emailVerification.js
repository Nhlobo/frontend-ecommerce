/**
 * Email Verification Service for Premium Hair Wigs & Extensions E-commerce
 * Handles email verification tokens and resending verification emails
 */

class EmailVerificationService {
    constructor() {
        this.api = new APIService();
    }

    /**
     * Verify email with token from URL
     */
    async verifyEmail(token) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.verifyEmail, { token });
            return { success: true, data: response };
        } catch (error) {
            console.error('Email verification error:', error);
            return { 
                success: false, 
                message: error.message || 'Failed to verify email. The link may be expired or invalid.' 
            };
        }
    }

    /**
     * Resend verification email
     */
    async resendVerification(email) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.resendVerification, { email });
            return { success: true, message: response.message || 'Verification email sent successfully!' };
        } catch (error) {
            console.error('Resend verification error:', error);
            return { 
                success: false, 
                message: error.message || 'Failed to resend verification email. Please try again later.' 
            };
        }
    }

    /**
     * Check if user's email is verified
     */
    isEmailVerified() {
        const user = this.getCurrentUser();
        return user && user.emailVerified === true;
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
     * Show verification banner for unverified users
     */
    showVerificationBanner() {
        if (this.isEmailVerified()) {
            return;
        }

        const user = this.getCurrentUser();
        if (!user) {
            return;
        }

        const banner = document.createElement('div');
        banner.className = 'verification-banner';
        banner.innerHTML = `
            <div class="container">
                <div class="banner-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Please verify your email address to complete your registration and enable checkout.</span>
                    <button class="btn btn-small btn-light" id="resendVerificationBtn">
                        Resend Email
                    </button>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .verification-banner {
                background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                color: white;
                padding: 1rem 0;
                position: sticky;
                top: 0;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .verification-banner .banner-content {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex-wrap: wrap;
            }
            .verification-banner i {
                font-size: 1.5rem;
            }
            .verification-banner span {
                flex: 1;
                min-width: 200px;
            }
            .verification-banner .btn-small {
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                white-space: nowrap;
            }
            .verification-banner .btn-light {
                background: white;
                color: var(--primary);
            }
            .verification-banner .btn-light:hover {
                background: rgba(255,255,255,0.9);
            }
        `;
        document.head.appendChild(style);

        // Insert banner at the top of body
        document.body.insertBefore(banner, document.body.firstChild);

        // Add event listener for resend button
        document.getElementById('resendVerificationBtn').addEventListener('click', async () => {
            const btn = document.getElementById('resendVerificationBtn');
            btn.disabled = true;
            btn.textContent = 'Sending...';

            const result = await this.resendVerification(user.email);
            
            if (result.success) {
                this.showToast('Verification email sent! Please check your inbox.', 'success');
            } else {
                this.showToast(result.message, 'error');
            }

            btn.disabled = false;
            btn.textContent = 'Resend Email';
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Check if toast utility exists
        if (typeof showToast === 'function') {
            showToast(type, message); // Fixed: correct parameter order
        } else {
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize on verify-email.html page
if (window.location.pathname.includes('verify-email.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const verificationService = new EmailVerificationService();
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        const content = document.getElementById('verificationContent');

        if (!token) {
            content.innerHTML = `
                <div class="verification-icon error">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h1>Invalid Verification Link</h1>
                <p>The verification link is invalid or missing. Please check your email and try again.</p>
                <div class="verification-actions">
                    <a href="index.html" class="btn btn-primary">Go to Home</a>
                </div>
            `;
            return;
        }

        // Verify the email
        const result = await verificationService.verifyEmail(token);

        if (result.success) {
            // Update user in localStorage
            const user = verificationService.getCurrentUser();
            if (user) {
                user.emailVerified = true;
                localStorage.setItem('user', JSON.stringify(user));
            }

            content.innerHTML = `
                <div class="verification-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h1>Email Verified Successfully!</h1>
                <p>Your email has been verified. You can now enjoy full access to all features, including checkout.</p>
                <div class="verification-actions">
                    <a href="shop.html" class="btn btn-primary">Start Shopping</a>
                    <a href="account.html" class="btn btn-secondary">Go to Account</a>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="verification-icon error">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h1>Verification Failed</h1>
                <p>${result.message}</p>
                <div class="verification-actions">
                    <button class="btn btn-primary" id="resendBtn">Resend Verification Email</button>
                    <a href="index.html" class="btn btn-secondary">Go to Home</a>
                </div>
            `;

            // Add resend functionality
            document.getElementById('resendBtn').addEventListener('click', async () => {
                const btn = document.getElementById('resendBtn');
                btn.disabled = true;
                btn.textContent = 'Sending...';

                const user = verificationService.getCurrentUser();
                if (user && user.email) {
                    const resendResult = await verificationService.resendVerification(user.email);
                    if (resendResult.success) {
                        content.innerHTML = `
                            <div class="verification-icon success">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <h1>Email Sent!</h1>
                            <p>A new verification email has been sent. Please check your inbox and click the verification link.</p>
                            <div class="verification-actions">
                                <a href="index.html" class="btn btn-primary">Go to Home</a>
                            </div>
                        `;
                    } else {
                        verificationService.showToast(resendResult.message, 'error');
                        btn.disabled = false;
                        btn.textContent = 'Resend Verification Email';
                    }
                } else {
                    verificationService.showToast('Unable to find user email. Please log in and try again.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Resend Verification Email';
                }
            });
        }
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailVerificationService;
}
