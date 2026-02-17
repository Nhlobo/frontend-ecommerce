/**
 * Wishlist Service for Premium Hair Wigs & Extensions E-commerce
 * Manages wishlist operations with backend synchronization
 */

class WishlistService {
    constructor(apiService) {
        this.api = apiService;
        this.wishlist = this.loadWishlist();
        this.syncInProgress = false;
    }

    /**
     * Load wishlist from localStorage
     */
    loadWishlist() {
        const wishlistData = localStorage.getItem('wishlist');
        if (wishlistData) {
            try {
                return JSON.parse(wishlistData);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    /**
     * Save wishlist to localStorage
     */
    saveWishlist() {
        localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
        this.updateWishlistBadge();
    }

    /**
     * Get all wishlist items
     */
    getWishlist() {
        return this.wishlist;
    }

    /**
     * Get wishlist count
     */
    getWishlistCount() {
        return this.wishlist.length;
    }

    /**
     * Check if product is in wishlist
     */
    isInWishlist(productId) {
        return this.wishlist.some(item => 
            item.productId === productId || item.id === productId
        );
    }

    /**
     * Add item to wishlist
     */
    async addToWishlist(product) {
        try {
            // Check if already in wishlist
            if (this.isInWishlist(product.id || product._id)) {
                showNotification('This item is already in your wishlist', 'info');
                return false;
            }

            const wishlistItem = {
                productId: product.id || product._id,
                name: product.name,
                price: product.price,
                salePrice: product.salePrice,
                image: product.image || product.images?.[0],
                stock: product.stock,
                sku: product.sku,
                addedAt: new Date().toISOString()
            };

            this.wishlist.push(wishlistItem);
            this.saveWishlist();

            // Sync with backend if user is logged in
            await this.syncWithBackend();

            showNotification(`${product.name} added to wishlist`, 'success');
            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Remove item from wishlist
     */
    async removeFromWishlist(productId) {
        try {
            const index = this.wishlist.findIndex(item => 
                item.productId === productId || item.id === productId
            );

            if (index === -1) {
                throw new Error('Item not found in wishlist');
            }

            const item = this.wishlist[index];
            this.wishlist.splice(index, 1);
            this.saveWishlist();

            // Sync with backend
            await this.syncWithBackend();

            showNotification(`${item.name} removed from wishlist`, 'success');
            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Toggle wishlist item
     */
    async toggleWishlist(product) {
        const productId = product.id || product._id;
        
        if (this.isInWishlist(productId)) {
            return await this.removeFromWishlist(productId);
        } else {
            return await this.addToWishlist(product);
        }
    }

    /**
     * Clear entire wishlist
     */
    async clearWishlist() {
        this.wishlist = [];
        this.saveWishlist();
        
        // Sync with backend
        await this.syncWithBackend();

        showNotification('Wishlist cleared', 'success');
    }

    /**
     * Move item to cart
     */
    async moveToCart(productId, cartService) {
        try {
            const item = this.wishlist.find(i => 
                i.productId === productId || i.id === productId
            );

            if (!item) {
                throw new Error('Item not found in wishlist');
            }

            // Add to cart
            const success = await cartService.addToCart(item, 1);

            if (success) {
                // Remove from wishlist
                await this.removeFromWishlist(productId);
                showNotification(`${item.name} moved to cart`, 'success');
                return true;
            }

            return false;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Move all items to cart
     */
    async moveAllToCart(cartService) {
        try {
            if (this.wishlist.length === 0) {
                throw new Error('Your wishlist is empty');
            }

            let successCount = 0;
            const items = [...this.wishlist]; // Create copy

            for (const item of items) {
                const success = await cartService.addToCart(item, 1);
                if (success) {
                    successCount++;
                }
            }

            // Clear wishlist after moving items
            if (successCount > 0) {
                await this.clearWishlist();
                showNotification(`${successCount} item(s) moved to cart`, 'success');
            }

            return successCount > 0;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Update wishlist badge count
     */
    updateWishlistBadge() {
        const badge = document.querySelector('.wishlist-count');
        if (badge) {
            const count = this.getWishlistCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    /**
     * Sync wishlist with backend (if user is logged in)
     */
    async syncWithBackend() {
        // Only sync if user is logged in
        const authToken = localStorage.getItem('authToken');
        if (!authToken || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;

        try {
            // Send wishlist to backend
            const productIds = this.wishlist.map(item => item.productId);
            
            await this.api.post(API_CONFIG.ENDPOINTS.wishlist, {
                productIds: productIds
            }, true);
        } catch (error) {
            console.error('Wishlist sync failed:', error);
            // Don't show error to user, local wishlist still works
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Load wishlist from backend (when user logs in)
     */
    async loadFromBackend() {
        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.wishlist, true);
            
            if (response.success && response.wishlist) {
                const backendWishlist = response.wishlist.items || response.wishlist;
                
                // Merge with local wishlist
                backendWishlist.forEach(backendItem => {
                    if (!this.isInWishlist(backendItem.productId || backendItem.id)) {
                        this.wishlist.push(backendItem);
                    }
                });

                this.saveWishlist();
            }
        } catch (error) {
            console.error('Failed to load wishlist from backend:', error);
        }
    }

    /**
     * Share wishlist
     */
    async shareWishlist() {
        try {
            if (this.wishlist.length === 0) {
                throw new Error('Your wishlist is empty');
            }

            // Generate shareable URL
            const productIds = this.wishlist.map(item => item.productId).join(',');
            const shareUrl = `${window.location.origin}/wishlist.html?shared=${productIds}`;

            // Copy to clipboard
            await copyToClipboard(shareUrl);
            showNotification('Wishlist link copied to clipboard', 'success');

            return shareUrl;
        } catch (error) {
            showNotification(error.message, 'error');
            return null;
        }
    }

    /**
     * Load shared wishlist from URL
     */
    async loadSharedWishlist(productIds) {
        try {
            if (!productIds || !Array.isArray(productIds)) {
                throw new Error('Invalid wishlist data');
            }

            // Fetch products from backend
            const products = [];
            for (const productId of productIds) {
                try {
                    const product = await this.api.getProductById(productId);
                    if (product) {
                        products.push(product);
                    }
                } catch (e) {
                    console.error(`Failed to load product ${productId}:`, e);
                }
            }

            return products;
        } catch (error) {
            console.error('Failed to load shared wishlist:', error);
            return [];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WishlistService;
}
