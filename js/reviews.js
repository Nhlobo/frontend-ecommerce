/**
 * Product Reviews Service for Premium Hair Wigs & Extensions E-commerce
 * Handles review submission, display, filtering, and helpful votes
 */

class ReviewsService {
    constructor() {
        this.api = new APIService();
        this.currentPage = 1;
        this.perPage = 10;
        this.currentFilter = 'all';
        this.currentSort = 'newest';
    }

    /**
     * Get reviews for a specific product
     */
    async getProductReviews(productId, page = 1, filter = 'all', sort = 'newest') {
        try {
            const params = new URLSearchParams({
                page,
                perPage: this.perPage,
                filter,
                sort
            });
            
            const url = `${API_CONFIG.ENDPOINTS.productReviews(productId)}?${params}`;
            const response = await this.api.get(url);
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return {
                success: false,
                message: error.message || 'Failed to load reviews'
            };
        }
    }

    /**
     * Submit a new review
     */
    async submitReview(productId, reviewData) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.submitReview, {
                productId,
                ...reviewData
            });
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('Error submitting review:', error);
            return {
                success: false,
                message: error.message || 'Failed to submit review'
            };
        }
    }

    /**
     * Mark a review as helpful
     */
    async markHelpful(reviewId) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.helpfulReview(reviewId));
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            console.error('Error marking review as helpful:', error);
            return {
                success: false,
                message: error.message || 'Failed to mark review as helpful'
            };
        }
    }

    /**
     * Render reviews section
     */
    async renderReviews(productId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Show loading state
        container.innerHTML = this.getLoadingTemplate();

        // Fetch reviews
        const result = await this.getProductReviews(productId, this.currentPage, this.currentFilter, this.currentSort);

        if (result.success) {
            const { reviews, stats, pagination } = result.data;
            container.innerHTML = this.getReviewsTemplate(reviews, stats, pagination, productId);
            this.attachEventListeners(productId, containerId);
        } else {
            container.innerHTML = this.getErrorTemplate(result.message);
        }
    }

    /**
     * Get reviews section template
     */
    getReviewsTemplate(reviews, stats, pagination, productId) {
        return `
            <div class="reviews-section">
                <div class="reviews-header">
                    <h2>Customer Reviews</h2>
                    <button class="btn btn-primary" id="writeReviewBtn">
                        <i class="fas fa-pen"></i> Write a Review
                    </button>
                </div>

                ${this.getRatingOverviewTemplate(stats)}

                <div id="reviewFormContainer" style="display: none;">
                    ${this.getReviewFormTemplate(productId)}
                </div>

                ${this.getReviewFiltersTemplate()}

                <div class="reviews-list">
                    ${reviews && reviews.length > 0 
                        ? reviews.map(review => this.getReviewItemTemplate(review)).join('') 
                        : this.getNoReviewsTemplate()
                    }
                </div>

                ${reviews && reviews.length > 0 ? this.getPaginationTemplate(pagination) : ''}
            </div>
        `;
    }

    /**
     * Get rating overview template
     */
    getRatingOverviewTemplate(stats) {
        const avgRating = stats?.averageRating || 0;
        const totalReviews = stats?.totalReviews || 0;
        const breakdown = stats?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        return `
            <div class="rating-overview">
                <div class="overall-rating">
                    <div class="rating-number">${avgRating.toFixed(1)}</div>
                    <div class="rating-stars">
                        ${this.getStarsHTML(avgRating)}
                    </div>
                    <div class="rating-count">${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}</div>
                </div>
                <div class="rating-breakdown">
                    ${[5, 4, 3, 2, 1].map(stars => {
                        const count = breakdown[stars] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews * 100) : 0;
                        return `
                            <div class="rating-bar-row">
                                <div class="stars">${stars} <i class="fas fa-star" style="color: #ffc107;"></i></div>
                                <div class="rating-bar">
                                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                                </div>
                                <div class="count">${count}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get review form template
     */
    getReviewFormTemplate(productId) {
        return `
            <div class="review-form" id="reviewForm">
                <h3>Write a Review</h3>
                <form id="submitReviewForm" data-product-id="${productId}">
                    <div class="form-group">
                        <label for="reviewRating">Rating *</label>
                        <div class="star-rating-input">
                            ${[1, 2, 3, 4, 5].reverse().map(star => `
                                <input type="radio" name="rating" value="${star}" id="star${star}" required>
                                <label for="star${star}">★</label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="reviewTitle">Review Title *</label>
                        <input type="text" id="reviewTitle" name="title" placeholder="Summarize your experience" maxlength="200" required>
                    </div>

                    <div class="form-group">
                        <label for="reviewContent">Your Review *</label>
                        <textarea id="reviewContent" name="content" placeholder="Tell us about your experience with this product" rows="5" required></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Submit Review
                        </button>
                        <button type="button" class="btn btn-secondary" id="cancelReviewBtn">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Get review filters template
     */
    getReviewFiltersTemplate() {
        return `
            <div class="review-filters">
                <div class="filter-group">
                    <label for="filterRating">Filter by:</label>
                    <select id="filterRating" class="filter-select">
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="sortReviews">Sort by:</label>
                    <select id="sortReviews" class="filter-select">
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                        <option value="helpful">Most Helpful</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Get review item template
     */
    getReviewItemTemplate(review) {
        const userName = review.userName || 'Anonymous';
        const initials = userName.charAt(0).toUpperCase();
        const isHelpful = this.isMarkedHelpful(review.id);

        return `
            <div class="review-item" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${initials}</div>
                        <div class="reviewer-details">
                            <h4>${userName}</h4>
                            <div class="review-meta">
                                ${review.verifiedPurchase ? `
                                    <span class="verified-purchase">
                                        <i class="fas fa-check-circle"></i> Verified Purchase
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="review-date">${this.formatDate(review.createdAt)}</div>
                </div>

                <div class="review-rating">
                    ${this.getStarsHTML(review.rating)}
                </div>

                ${review.title ? `<div class="review-title">${this.escapeHTML(review.title)}</div>` : ''}

                <div class="review-content">${this.escapeHTML(review.content)}</div>

                ${review.photos && review.photos.length > 0 ? `
                    <div class="review-photos">
                        ${review.photos.map(photo => `
                            <img src="${photo}" alt="Review photo" class="review-photo">
                        `).join('')}
                    </div>
                ` : ''}

                <div class="review-actions">
                    <button class="helpful-btn ${isHelpful ? 'active' : ''}" data-review-id="${review.id}">
                        <i class="fas fa-thumbs-up"></i>
                        Helpful
                        <span class="helpful-count">(${review.helpfulCount || 0})</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get no reviews template
     */
    getNoReviewsTemplate() {
        return `
            <div class="no-reviews">
                <i class="fas fa-comment-slash"></i>
                <h3>No Reviews Yet</h3>
                <p>Be the first to review this product!</p>
            </div>
        `;
    }

    /**
     * Get pagination template
     */
    getPaginationTemplate(pagination) {
        const { currentPage, totalPages } = pagination;
        if (totalPages <= 1) return '';

        return `
            <div class="reviews-pagination">
                <button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                ${this.getPageNumbers(currentPage, totalPages)}
                <button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    /**
     * Get page numbers for pagination
     */
    getPageNumbers(currentPage, totalPages) {
        const pages = [];
        const maxVisible = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return pages.join('');
    }

    /**
     * Get stars HTML
     */
    getStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return `
            ${Array(fullStars).fill('<i class="fas fa-star star"></i>').join('')}
            ${hasHalfStar ? '<i class="fas fa-star-half-alt star"></i>' : ''}
            ${Array(emptyStars).fill('<i class="far fa-star star empty"></i>').join('')}
        `;
    }

    /**
     * Get loading template
     */
    getLoadingTemplate() {
        return `
            <div class="reviews-section">
                <div class="loading-state" style="text-align: center; padding: 3rem;">
                    <div class="spinner" style="margin: 0 auto 1rem;"></div>
                    <p>Loading reviews...</p>
                </div>
            </div>
        `;
    }

    /**
     * Get error template
     */
    getErrorTemplate(message) {
        return `
            <div class="reviews-section">
                <div class="error-state" style="text-align: center; padding: 3rem; color: #d32f2f;">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Failed to Load Reviews</h3>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners(productId, containerId) {
        // Write review button
        const writeReviewBtn = document.getElementById('writeReviewBtn');
        if (writeReviewBtn) {
            writeReviewBtn.addEventListener('click', () => {
                this.showReviewForm();
            });
        }

        // Cancel review button
        const cancelReviewBtn = document.getElementById('cancelReviewBtn');
        if (cancelReviewBtn) {
            cancelReviewBtn.addEventListener('click', () => {
                this.hideReviewForm();
            });
        }

        // Submit review form
        const submitReviewForm = document.getElementById('submitReviewForm');
        if (submitReviewForm) {
            submitReviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleReviewSubmit(e, productId, containerId);
            });
        }

        // Filter and sort
        const filterRating = document.getElementById('filterRating');
        const sortReviews = document.getElementById('sortReviews');

        if (filterRating) {
            filterRating.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.currentPage = 1;
                this.renderReviews(productId, containerId);
            });
        }

        if (sortReviews) {
            sortReviews.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.renderReviews(productId, containerId);
            });
        }

        // Helpful buttons
        document.querySelectorAll('.helpful-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const reviewId = btn.dataset.reviewId;
                await this.handleHelpfulClick(reviewId, btn);
            });
        });

        // Pagination buttons
        document.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (!isNaN(page)) {
                    this.currentPage = page;
                    this.renderReviews(productId, containerId);
                    // Scroll to reviews section
                    document.getElementById(containerId).scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    /**
     * Show review form
     */
    showReviewForm() {
        // Check if user is authenticated
        const user = this.getCurrentUser();
        if (!user) {
            this.showToast('Please log in to write a review', 'warning');
            return;
        }

        const formContainer = document.getElementById('reviewFormContainer');
        if (formContainer) {
            formContainer.style.display = 'block';
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Hide review form
     */
    hideReviewForm() {
        const formContainer = document.getElementById('reviewFormContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
            // Reset form
            const form = document.getElementById('submitReviewForm');
            if (form) form.reset();
        }
    }

    /**
     * Handle review submission
     */
    async handleReviewSubmit(event, productId, containerId) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        // Get form data
        const formData = new FormData(form);
        const reviewData = {
            rating: parseInt(formData.get('rating')),
            title: formData.get('title'),
            content: formData.get('content')
        };

        // Submit review
        const result = await this.submitReview(productId, reviewData);

        if (result.success) {
            this.showToast('Review submitted successfully!', 'success');
            this.hideReviewForm();
            // Refresh reviews
            this.renderReviews(productId, containerId);
        } else {
            this.showToast(result.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        }
    }

    /**
     * Handle helpful click
     */
    async handleHelpfulClick(reviewId, button) {
        // Check if already marked
        if (this.isMarkedHelpful(reviewId)) {
            this.showToast('You already marked this review as helpful', 'info');
            return;
        }

        const result = await this.markHelpful(reviewId);

        if (result.success) {
            // Mark as helpful in localStorage
            this.saveHelpfulMark(reviewId);
            
            // Update UI
            button.classList.add('active');
            const countSpan = button.querySelector('.helpful-count');
            if (countSpan) {
                const currentCount = parseInt(countSpan.textContent.match(/\d+/)[0] || 0);
                countSpan.textContent = `(${currentCount + 1})`;
            }
            
            this.showToast('Thank you for your feedback!', 'success');
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /**
     * Check if review is marked as helpful
     */
    isMarkedHelpful(reviewId) {
        const helpful = JSON.parse(localStorage.getItem('helpfulReviews') || '[]');
        return helpful.includes(reviewId);
    }

    /**
     * Save helpful mark to localStorage
     */
    saveHelpfulMark(reviewId) {
        const helpful = JSON.parse(localStorage.getItem('helpfulReviews') || '[]');
        helpful.push(reviewId);
        localStorage.setItem('helpfulReviews', JSON.stringify(helpful));
    }

    /**
     * Get current user
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
     * Escape HTML to prevent XSS
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        
        return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReviewsService;
}
