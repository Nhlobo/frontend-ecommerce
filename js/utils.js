/**
 * General Utility Functions for Premium Hair Wigs & Extensions E-commerce
 * Toast notifications, loading states, formatting, debouncing, and more
 */

/**
 * Format price in South African Rand
 */
function formatPrice(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price);
    }
    
    if (isNaN(price)) {
        return 'R0.00';
    }
    
    return 'R' + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date in a readable format
 */
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-ZA', options);
}

/**
 * Format date and time
 */
function formatDateTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    return date.toLocaleDateString('en-ZA', dateOptions) + ' at ' + 
           date.toLocaleTimeString('en-ZA', timeOptions);
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
function getRelativeTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return formatDate(date);
}

/**
 * Debounce function - delays execution until after wait time
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - limits execution to once per wait time
 */
function throttle(func, wait = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    };
}

/**
 * Toast notification system
 */
const NOTIFICATION_DURATION = 3000;
const NOTIFICATION_PERSISTENT = -1;

let notificationContainer = null;

function initializeNotificationContainer() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
}

function showNotification(message, type = 'info', duration = NOTIFICATION_DURATION) {
    initializeNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">&times;</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto-close (if not persistent)
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }
    
    return notification;
}

function closeNotification(notification) {
    notification.classList.remove('notification-show');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };
    
    return icons[type] || icons.info;
}

/**
 * Show loading state
 */
function showLoading(container, message = 'Loading...') {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-message">${message}</p>
        </div>
    `;
    
    container.style.position = 'relative';
    container.appendChild(loader);
    
    return loader;
}

/**
 * Hide loading state
 */
function hideLoading(container) {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    const loader = container.querySelector('.loading-overlay');
    if (loader) {
        loader.remove();
    }
}

/**
 * Show skeleton loader
 */
function showSkeletonLoader(container, count = 6) {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    if (!container) return;
    
    const skeletons = Array(count).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-button"></div>
        </div>
    `).join('');
    
    container.innerHTML = skeletons;
}

/**
 * Generate unique ID
 */
function generateUniqueId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard', 'success');
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showNotification('Copied to clipboard', 'success');
                return true;
            } catch (err) {
                showNotification('Failed to copy', 'error');
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    } catch (err) {
        showNotification('Failed to copy', 'error');
        return false;
    }
}

/**
 * Get URL parameters
 */
function getURLParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    
    return params;
}

/**
 * Update URL parameter without reload
 */
function updateURLParam(key, value) {
    const url = new URL(window.location);
    
    if (value) {
        url.searchParams.set(key, value);
    } else {
        url.searchParams.delete(key);
    }
    
    window.history.pushState({}, '', url);
}

/**
 * Scroll to element smoothly
 */
function scrollToElement(element, offset = 0) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

/**
 * Scroll to top of page
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Lazy load images
 */
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Calculate discount percentage
 */
function calculateDiscount(originalPrice, salePrice) {
    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
    return Math.round(discount);
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating, maxRating = 5) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '';
    
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star"></i>';
    }
    
    return html;
}

/**
 * Confirm dialog
 */
function showConfirmDialog(message, onConfirm, onCancel = null) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog-overlay';
    dialog.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-content">
                <p>${message}</p>
            </div>
            <div class="confirm-dialog-actions">
                <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button class="btn btn-primary" data-action="confirm">Confirm</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    const closeDialog = () => {
        dialog.remove();
    };
    
    dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        closeDialog();
        if (onConfirm) onConfirm();
    });
    
    dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        closeDialog();
        if (onCancel) onCancel();
    });
    
    // Close on overlay click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeDialog();
            if (onCancel) onCancel();
        }
    });
}

/**
 * Show modal
 */
function showModal(content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const modalContent = `
        <div class="modal" style="max-width: ${options.maxWidth || '600px'}">
            <div class="modal-header">
                <h3>${options.title || ''}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
        </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
        if (options.onClose) options.onClose();
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    return modal;
}

/**
 * Local storage with expiry
 */
const storage = {
    set: function(key, value, expiryMinutes = null) {
        const item = {
            value: value,
            expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : null
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    get: function(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            
            // Check if expired
            if (item.expiry && Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (e) {
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPrice,
        formatDate,
        formatDateTime,
        getRelativeTime,
        debounce,
        throttle,
        showNotification,
        closeNotification,
        showLoading,
        hideLoading,
        showSkeletonLoader,
        generateUniqueId,
        copyToClipboard,
        getURLParams,
        updateURLParam,
        scrollToElement,
        scrollToTop,
        isInViewport,
        lazyLoadImages,
        truncateText,
        calculateDiscount,
        generateStarRating,
        showConfirmDialog,
        showModal,
        storage
    };
}
