/**
 * Newsletter Subscription Service for Premium Hair Wigs & Extensions E-commerce
 * Handles newsletter subscriptions, verification, and unsubscribe functionality
 */

class NewsletterService {
    constructor() {
        this.api = new APIService();
    }

    /**
     * Subscribe to newsletter
     */
    async subscribe(email) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.newsletterSubscribe, { email });
            return {
                success: true,
                message: response.message || 'Successfully subscribed to our newsletter!'
            };
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            return {
                success: false,
                message: error.message || 'Failed to subscribe. Please try again later.'
            };
        }
    }

    /**
     * Verify newsletter subscription
     */
    async verify(token) {
        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.newsletterVerify(token));
            return {
                success: true,
                message: response.message || 'Email verified successfully!'
            };
        } catch (error) {
            console.error('Newsletter verification error:', error);
            return {
                success: false,
                message: error.message || 'Failed to verify subscription. The link may be expired or invalid.'
            };
        }
    }

    /**
     * Unsubscribe from newsletter
     */
    async unsubscribe(email) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.newsletterUnsubscribe, { email });
            return {
                success: true,
                message: response.message || 'Successfully unsubscribed from our newsletter.'
            };
        } catch (error) {
            console.error('Newsletter unsubscribe error:', error);
            return {
                success: false,
                message: error.message || 'Failed to unsubscribe. Please try again later.'
            };
        }
    }

    /**
     * Initialize newsletter form
     */
    initializeNewsletterForm(formId = 'newsletterForm') {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleNewsletterSubmit(form);
        });
    }

    /**
     * Handle newsletter form submission
     */
    async handleNewsletterSubmit(form) {
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!emailInput || !emailInput.value) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Disable form
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Subscribing...';

        // Subscribe
        const result = await this.subscribe(emailInput.value);

        if (result.success) {
            this.showToast(result.message, 'success');
            form.reset();
            
            // Close modal if it's in a modal
            const modal = form.closest('.newsletter-modal');
            if (modal) {
                this.closeNewsletterModal();
            }
        } else {
            this.showToast(result.message, 'error');
        }

        // Re-enable form
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }

    /**
     * Show newsletter modal popup
     */
    showNewsletterModal() {
        // Check if already subscribed or dismissed
        if (this.isSubscribed() || this.isModalDismissed()) {
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'newsletter-modal';
        modal.id = 'newsletterModal';
        modal.innerHTML = this.getNewsletterModalTemplate();

        document.body.appendChild(modal);

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 100);

        // Attach event listeners
        this.attachModalEventListeners(modal);
    }

    /**
     * Get newsletter modal template
     */
    getNewsletterModalTemplate() {
        return `
            <div class="newsletter-modal-overlay" onclick="newsletterService.closeNewsletterModal()"></div>
            <div class="newsletter-modal-content">
                <button class="modal-close" onclick="newsletterService.closeNewsletterModal()">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="modal-body">
                    <div class="modal-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    
                    <h2>Stay Updated!</h2>
                    <p>Get exclusive offers, new product updates, and styling tips delivered to your inbox.</p>
                    
                    <form id="newsletterModalForm" class="newsletter-modal-form">
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Enter your email address" 
                            required
                            class="newsletter-input">
                        <button type="submit" class="btn btn-primary">
                            Subscribe Now
                        </button>
                    </form>
                    
                    <p class="privacy-note">
                        <i class="fas fa-lock"></i>
                        We respect your privacy. Unsubscribe anytime.
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Attach modal event listeners
     */
    attachModalEventListeners(modal) {
        const form = modal.querySelector('#newsletterModalForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleNewsletterSubmit(form);
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeNewsletterModal();
            }
        });
    }

    /**
     * Close newsletter modal
     */
    closeNewsletterModal() {
        const modal = document.getElementById('newsletterModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }

        // Mark as dismissed
        this.markModalDismissed();
    }

    /**
     * Show modal on first visit or exit intent
     */
    initializeModalTriggers() {
        // Check if already subscribed
        if (this.isSubscribed()) {
            return;
        }

        // Show after 10 seconds on first visit
        if (!this.isModalDismissed()) {
            setTimeout(() => {
                this.showNewsletterModal();
            }, 10000);
        }

        // Show on exit intent (mouse leaves viewport at top)
        let exitIntentShown = false;
        document.addEventListener('mouseleave', (e) => {
            if (!exitIntentShown && e.clientY < 0 && !this.isModalDismissed()) {
                exitIntentShown = true;
                this.showNewsletterModal();
            }
        });
    }

    /**
     * Check if user is subscribed
     */
    isSubscribed() {
        return localStorage.getItem('newsletter_subscribed') === 'true';
    }

    /**
     * Mark user as subscribed
     */
    markAsSubscribed() {
        localStorage.setItem('newsletter_subscribed', 'true');
    }

    /**
     * Check if modal was dismissed
     */
    isModalDismissed() {
        const dismissedAt = localStorage.getItem('newsletter_modal_dismissed');
        if (!dismissedAt) return false;

        // Show again after 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return parseInt(dismissedAt) > sevenDaysAgo;
    }

    /**
     * Mark modal as dismissed
     */
    markModalDismissed() {
        localStorage.setItem('newsletter_modal_dismissed', Date.now().toString());
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(type, message);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize newsletter service globally
const newsletterService = new NewsletterService();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        newsletterService.initializeNewsletterForm();
        
        // Only show modal on home page (handle various path formats)
        const path = window.location.pathname;
        if (path === '/' || path.endsWith('index.html') || path === '/index.html') {
            newsletterService.initializeModalTriggers();
        }
    });
} else {
    newsletterService.initializeNewsletterForm();
    
    // Only show modal on home page (handle various path formats)
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('index.html') || path === '/index.html') {
        newsletterService.initializeModalTriggers();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsletterService;
}
