/**
 * Shop Page - Product Listing with Filters
 * Handles product browsing, filtering, sorting, and pagination
 */

let currentFilters = {
    category: '',
    texture: '',
    length: '',
    color: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    page: 1,
    limit: 12
};

/**
 * Load products from API with current filters
 */
async function loadProducts() {
    try {
        showLoading();
        const response = await api.getAllProducts(currentFilters);
        
        if (response.success || response.data) {
            const products = response.products || response.data?.products || response.data || [];
            const pagination = response.pagination || response.data?.pagination;
            
            renderProducts(products);
            if (pagination) {
                renderPagination(pagination);
            }
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products. Please try again.');
        const container = document.getElementById('productsGrid');
        if (container) {
            container.innerHTML = '<p class="error-message">Failed to load products. Please try again later.</p>';
        }
    } finally {
        hideLoading();
    }
}

/**
 * Render products grid
 */
function renderProducts(products) {
    const container = document.getElementById('productsGrid');
    
    if (!container) {
        console.error('Products grid container not found');
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="no-results"><p>No products found</p><p>Try adjusting your filters</p></div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const variants = product.variants || [];
        const firstVariant = variants[0] || {};
        const minPrice = variants.length > 0 
            ? Math.min(...variants.map(v => v.price || 0)) 
            : product.price || 0;
        
        const imageUrl = firstVariant.image_url || product.image_url || product.image || '/assets/placeholder.jpg';
        const hasLowStock = variants.some(v => v.stock > 0 && v.stock <= (v.low_stock_threshold || 5));
        const isOutOfStock = variants.every(v => v.stock === 0);
        
        return `
            <div class="product-card" data-product-id="${product.id || product._id}">
                <a href="/product.html?id=${product.id || product._id}">
                    <div class="product-image">
                        <img src="${imageUrl}" 
                             alt="${product.name}"
                             loading="lazy"
                             onerror="this.src='/assets/placeholder.jpg'">
                        ${isOutOfStock ? '<span class="badge out-of-stock">Out of Stock</span>' : ''}
                        ${hasLowStock && !isOutOfStock ? '<span class="badge low-stock">Low Stock</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">From ${formatPrice(minPrice)}</p>
                    </div>
                </a>
                <button class="btn-quick-view" data-id="${product.id || product._id}" onclick="quickView('${product.id || product._id}')">
                    Quick View
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Render pagination controls
 */
function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    if (hasPrevPage) {
        paginationHTML += `<button class="btn-page" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="btn-page active">${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<button class="btn-page" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Next button
    if (hasNextPage) {
        paginationHTML += `<button class="btn-page" onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

/**
 * Change page
 */
function changePage(page) {
    currentFilters.page = page;
    loadProducts();
    scrollToTop();
}

/**
 * Apply filter
 */
function applyFilter(filterType, value) {
    currentFilters[filterType] = value;
    currentFilters.page = 1; // Reset to first page
    loadProducts();
}

/**
 * Apply sort
 */
function applySort(sortValue) {
    currentFilters.sort = sortValue;
    loadProducts();
}

/**
 * Clear all filters
 */
function clearFilters() {
    currentFilters = {
        category: '',
        texture: '',
        length: '',
        color: '',
        minPrice: '',
        maxPrice: '',
        sort: 'newest',
        page: 1,
        limit: 12
    };
    
    // Reset all filter inputs
    document.querySelectorAll('.filter-option').forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    
    loadProducts();
}

/**
 * Quick view product modal
 */
function quickView(productId) {
    // TODO: Implement quick view modal
    showNotification('Quick view coming soon!', 'info');
}

/**
 * Setup event listeners
 */
function setupShopEventListeners() {
    // Filter options
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('change', (e) => {
            const filterType = e.target.dataset.filter;
            const value = e.target.value;
            applyFilter(filterType, value);
        });
    });
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            applySort(e.target.value);
        });
    }
    
    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
}

/**
 * Initialize shop page
 */
function initShopPage() {
    setupShopEventListeners();
    loadProducts();
}

// Auto-initialize if on shop page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('shop.html') || document.getElementById('productsGrid')) {
            initShopPage();
        }
    });
} else {
    if (window.location.pathname.includes('shop.html') || document.getElementById('productsGrid')) {
        initShopPage();
    }
}
