/**
 * Product Service for Premium Hair Wigs & Extensions E-commerce
 * Handles product operations, filtering, search, and recommendations
 */

class ProductService {
    constructor(apiService) {
        this.api = apiService;
        this.recentlyViewed = this.loadRecentlyViewed();
        this.cachedProducts = null;
        this.cacheTimestamp = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Load recently viewed products
     */
    loadRecentlyViewed() {
        const data = localStorage.getItem('recentlyViewed');
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    /**
     * Save recently viewed products
     */
    saveRecentlyViewed() {
        localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
    }

    /**
     * Get all products (with caching)
     */
    async getAllProducts(forceRefresh = false) {
        try {
            // Check cache
            if (!forceRefresh && this.cachedProducts && this.cacheTimestamp) {
                const cacheAge = Date.now() - this.cacheTimestamp;
                if (cacheAge < this.cacheExpiry) {
                    return this.cachedProducts;
                }
            }

            // Fetch from API
            const response = await this.api.getAllProducts();
            
            if (response.success && response.products) {
                this.cachedProducts = response.products;
                this.cacheTimestamp = Date.now();
                return response.products;
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch products:', error);
            throw error;
        }
    }

    /**
     * Get product by ID
     */
    async getProductById(id) {
        try {
            const response = await this.api.getProductById(id);
            
            if (response.success && response.product) {
                // Add to recently viewed
                this.addToRecentlyViewed(response.product);
                return response.product;
            }

            throw new Error('Product not found');
        } catch (error) {
            console.error('Failed to fetch product:', error);
            throw error;
        }
    }

    /**
     * Get products by category
     */
    async getProductsByCategory(category) {
        try {
            const response = await this.api.getProductsByCategory(category);
            
            if (response.success && response.products) {
                return response.products;
            }

            return [];
        } catch (error) {
            console.error('Failed to fetch products by category:', error);
            throw error;
        }
    }

    /**
     * Search products
     */
    async searchProducts(query) {
        try {
            // Sanitize search query
            const sanitizedQuery = sanitizeSearchQuery(query);
            
            if (!sanitizedQuery || sanitizedQuery.length < 2) {
                return [];
            }

            const response = await this.api.searchProducts(sanitizedQuery);
            
            if (response.success && response.products) {
                return response.products;
            }

            return [];
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }

    /**
     * Filter products
     */
    filterProducts(products, filters) {
        let filtered = [...products];

        // Category filter
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(p => 
                p.category?.toLowerCase() === filters.category.toLowerCase()
            );
        }

        // Price range filter
        if (filters.minPrice !== undefined) {
            filtered = filtered.filter(p => {
                const price = p.salePrice || p.price;
                return price >= filters.minPrice;
            });
        }

        if (filters.maxPrice !== undefined) {
            filtered = filtered.filter(p => {
                const price = p.salePrice || p.price;
                return price <= filters.maxPrice;
            });
        }

        // Hair type filter
        if (filters.hairType && filters.hairType.length > 0) {
            filtered = filtered.filter(p => 
                filters.hairType.includes(p.hairType)
            );
        }

        // Length filter
        if (filters.length && filters.length.length > 0) {
            filtered = filtered.filter(p => 
                filters.length.includes(p.length)
            );
        }

        // Color filter
        if (filters.color && filters.color.length > 0) {
            filtered = filtered.filter(p => 
                filters.color.some(c => p.colors?.includes(c))
            );
        }

        // In stock filter
        if (filters.inStock === true) {
            filtered = filtered.filter(p => p.stock > 0);
        }

        // On sale filter
        if (filters.onSale === true) {
            filtered = filtered.filter(p => p.salePrice && p.salePrice < p.price);
        }

        // Search query filter
        if (filters.query) {
            const query = filters.query.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.sku?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    /**
     * Sort products
     */
    sortProducts(products, sortBy) {
        const sorted = [...products];

        switch (sortBy) {
            case 'price-low-high':
                return sorted.sort((a, b) => {
                    const priceA = a.salePrice || a.price;
                    const priceB = b.salePrice || b.price;
                    return priceA - priceB;
                });

            case 'price-high-low':
                return sorted.sort((a, b) => {
                    const priceA = a.salePrice || a.price;
                    const priceB = b.salePrice || b.price;
                    return priceB - priceA;
                });

            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));

            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));

            case 'newest':
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                });

            case 'popular':
                return sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

            case 'rating':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));

            default:
                return sorted;
        }
    }

    /**
     * Add product to recently viewed
     */
    addToRecentlyViewed(product) {
        // Remove if already exists
        this.recentlyViewed = this.recentlyViewed.filter(p => 
            (p.id || p._id) !== (product.id || product._id)
        );

        // Add to beginning
        this.recentlyViewed.unshift({
            id: product.id || product._id,
            productId: product.id || product._id,
            name: product.name,
            price: product.price,
            salePrice: product.salePrice,
            image: product.image || product.images?.[0],
            viewedAt: new Date().toISOString()
        });

        // Keep only last 10
        this.recentlyViewed = this.recentlyViewed.slice(0, 10);

        this.saveRecentlyViewed();
    }

    /**
     * Get recently viewed products
     */
    getRecentlyViewed(limit = 10) {
        return this.recentlyViewed.slice(0, limit);
    }

    /**
     * Get related products
     */
    async getRelatedProducts(product, limit = 6) {
        try {
            // Get all products
            const allProducts = await this.getAllProducts();

            // Filter by same category
            let related = allProducts.filter(p => 
                (p.id || p._id) !== (product.id || product._id) &&
                p.category === product.category
            );

            // If not enough, get from similar price range
            if (related.length < limit) {
                const priceRange = product.price * 0.3; // 30% range
                const additional = allProducts.filter(p => 
                    (p.id || p._id) !== (product.id || product._id) &&
                    !related.find(r => (r.id || r._id) === (p.id || p._id)) &&
                    Math.abs(p.price - product.price) <= priceRange
                );
                related = [...related, ...additional];
            }

            // Shuffle and limit
            related = related.sort(() => Math.random() - 0.5).slice(0, limit);

            return related;
        } catch (error) {
            console.error('Failed to get related products:', error);
            return [];
        }
    }

    /**
     * Get featured products
     */
    async getFeaturedProducts(limit = 8) {
        try {
            const allProducts = await this.getAllProducts();
            
            // Get products marked as featured or highest rated
            let featured = allProducts.filter(p => p.featured);

            if (featured.length < limit) {
                // Add highest rated products
                const highRated = allProducts
                    .filter(p => !p.featured)
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
                
                featured = [...featured, ...highRated].slice(0, limit);
            }

            return featured.slice(0, limit);
        } catch (error) {
            console.error('Failed to get featured products:', error);
            return [];
        }
    }

    /**
     * Get sale products
     */
    async getSaleProducts() {
        try {
            const allProducts = await this.getAllProducts();
            
            // Filter products with sale price
            const saleProducts = allProducts.filter(p => 
                p.salePrice && p.salePrice < p.price
            );

            // Sort by discount percentage
            return saleProducts.sort((a, b) => {
                const discountA = ((a.price - a.salePrice) / a.price) * 100;
                const discountB = ((b.price - b.salePrice) / b.price) * 100;
                return discountB - discountA;
            });
        } catch (error) {
            console.error('Failed to get sale products:', error);
            return [];
        }
    }

    /**
     * Get unique filter options from products
     */
    getFilterOptions(products) {
        const categories = new Set();
        const hairTypes = new Set();
        const lengths = new Set();
        const colors = new Set();
        let minPrice = Infinity;
        let maxPrice = 0;

        products.forEach(product => {
            if (product.category) categories.add(product.category);
            if (product.hairType) hairTypes.add(product.hairType);
            if (product.length) lengths.add(product.length);
            if (product.colors) product.colors.forEach(c => colors.add(c));

            const price = product.salePrice || product.price;
            if (price < minPrice) minPrice = price;
            if (price > maxPrice) maxPrice = price;
        });

        return {
            categories: Array.from(categories),
            hairTypes: Array.from(hairTypes),
            lengths: Array.from(lengths),
            colors: Array.from(colors),
            priceRange: { min: minPrice, max: maxPrice }
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cachedProducts = null;
        this.cacheTimestamp = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductService;
}
