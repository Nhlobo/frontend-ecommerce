/**
 * Product Details Page
 * Handles product display, variant selection, and add to cart
 */

let currentProduct = null;
let selectedVariant = null;
let variants = [];

/**
 * Get product ID from URL
 */
function getProductId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Load product details from API
 */
async function loadProductDetails() {
    const productId = getProductId();
    
    if (!productId) {
        showError('Product not found');
        window.location.href = '/shop.html';
        return;
    }
    
    try {
        showLoading();
        const response = await api.getProductById(productId);
        
        if (response.success || response.data) {
            currentProduct = response.product || response.data?.product || response.data;
            variants = currentProduct.variants || [];
            
            renderProductDetails(currentProduct);
            setupVariantSelectors(variants);
            
            // Select first variant by default
            if (variants.length > 0) {
                selectFirstVariant();
            }
        } else {
            throw new Error('Product not found');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showError('Failed to load product details');
        setTimeout(() => {
            window.location.href = '/shop.html';
        }, 2000);
    } finally {
        hideLoading();
    }
}

/**
 * Render product details
 */
function renderProductDetails(product) {
    // Update page title
    document.title = `${product.name} - Premium Hair Wigs & Extensions`;
    
    // Product name
    const nameEl = document.getElementById('productName');
    if (nameEl) nameEl.textContent = product.name;
    
    // Product description
    const descEl = document.getElementById('productDescription');
    if (descEl) descEl.innerHTML = product.description || 'No description available';
    
    // Product category
    const categoryEl = document.getElementById('productCategory');
    if (categoryEl && product.category) {
        categoryEl.textContent = product.category.name || product.category;
    }
    
    // Product gallery
    renderImageGallery(product);
}

/**
 * Render image gallery
 */
function renderImageGallery(product) {
    const gallery = document.getElementById('productGallery');
    if (!gallery) return;
    
    const images = [];
    
    // Collect images from variants
    if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
            if (variant.image_url) {
                images.push({
                    url: variant.image_url,
                    alt: `${product.name} - ${variant.texture || ''} ${variant.length || ''} ${variant.color || ''}`
                });
            }
        });
    }
    
    // Fallback to product images if no variant images
    if (images.length === 0) {
        if (product.images && product.images.length > 0) {
            product.images.forEach(img => images.push({ url: img, alt: product.name }));
        } else if (product.image_url || product.image) {
            images.push({ url: product.image_url || product.image, alt: product.name });
        }
    }
    
    if (images.length === 0) {
        gallery.innerHTML = '<img src="/assets/placeholder.jpg" alt="Product image not available">';
        return;
    }
    
    gallery.innerHTML = images.map((img, index) => `
        <img src="${img.url}" 
             alt="${img.alt}"
             class="${index === 0 ? 'active' : ''}"
             onclick="selectImage(this)"
             onerror="this.src='/assets/placeholder.jpg'">
    `).join('');
}

/**
 * Select image in gallery
 */
function selectImage(imgElement) {
    const gallery = document.getElementById('productGallery');
    if (!gallery) return;
    
    gallery.querySelectorAll('img').forEach(img => img.classList.remove('active'));
    imgElement.classList.add('active');
}

/**
 * Setup variant selectors
 */
function setupVariantSelectors(variants) {
    if (!variants || variants.length === 0) return;
    
    // Get unique values for each attribute
    const textures = [...new Set(variants.map(v => v.texture).filter(Boolean))];
    const lengths = [...new Set(variants.map(v => v.length).filter(Boolean))];
    const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
    
    // Populate selectors
    populateSelect('textureSelect', textures);
    populateSelect('lengthSelect', lengths);
    populateSelect('colorSelect', colors);
    
    // Add change listeners
    const selectors = document.querySelectorAll('.variant-selector');
    selectors.forEach(select => {
        select.addEventListener('change', updateSelectedVariant);
    });
}

/**
 * Populate select dropdown
 */
function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select || options.length === 0) return;
    
    // Clear existing options except the first one (placeholder)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
    
    // Show the select if it has options
    if (select.parentElement) {
        select.parentElement.style.display = 'block';
    }
}

/**
 * Select first variant by default
 */
function selectFirstVariant() {
    if (variants.length === 0) return;
    
    const firstVariant = variants[0];
    
    // Set select values
    if (firstVariant.texture) {
        const textureSelect = document.getElementById('textureSelect');
        if (textureSelect) textureSelect.value = firstVariant.texture;
    }
    
    if (firstVariant.length) {
        const lengthSelect = document.getElementById('lengthSelect');
        if (lengthSelect) lengthSelect.value = firstVariant.length;
    }
    
    if (firstVariant.color) {
        const colorSelect = document.getElementById('colorSelect');
        if (colorSelect) colorSelect.value = firstVariant.color;
    }
    
    updateSelectedVariant();
}

/**
 * Update selected variant based on selections
 */
function updateSelectedVariant() {
    const texture = document.getElementById('textureSelect')?.value;
    const length = document.getElementById('lengthSelect')?.value;
    const color = document.getElementById('colorSelect')?.value;
    
    // Find matching variant
    selectedVariant = variants.find(v => {
        const textureMatch = !texture || v.texture === texture;
        const lengthMatch = !length || v.length === length;
        const colorMatch = !color || v.color === color;
        return textureMatch && lengthMatch && colorMatch;
    });
    
    if (!selectedVariant && variants.length > 0) {
        selectedVariant = variants[0];
    }
    
    if (selectedVariant) {
        updateProductPrice();
        updateStockStatus();
    }
}

/**
 * Update product price display
 */
function updateProductPrice() {
    const priceEl = document.getElementById('productPrice');
    if (priceEl && selectedVariant) {
        priceEl.textContent = formatPrice(selectedVariant.price);
    }
}

/**
 * Update stock status
 */
function updateStockStatus() {
    const stockEl = document.getElementById('stockStatus');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const quantityInput = document.getElementById('quantityInput');
    
    if (!selectedVariant) return;
    
    const stock = selectedVariant.stock || 0;
    const lowThreshold = selectedVariant.low_stock_threshold || 5;
    
    if (stock === 0) {
        if (stockEl) {
            stockEl.textContent = 'Out of Stock';
            stockEl.className = 'stock-status out-of-stock';
        }
        if (addToCartBtn) addToCartBtn.disabled = true;
    } else if (stock <= lowThreshold) {
        if (stockEl) {
            stockEl.textContent = `Only ${stock} left!`;
            stockEl.className = 'stock-status low-stock';
        }
        if (addToCartBtn) addToCartBtn.disabled = false;
    } else {
        if (stockEl) {
            stockEl.textContent = 'In Stock';
            stockEl.className = 'stock-status in-stock';
        }
        if (addToCartBtn) addToCartBtn.disabled = false;
    }
    
    // Update max quantity
    if (quantityInput) {
        quantityInput.max = stock;
        if (parseInt(quantityInput.value) > stock) {
            quantityInput.value = stock;
        }
    }
}

/**
 * Add to cart
 */
async function addToCart() {
    if (!selectedVariant) {
        showError('Please select all product options');
        return;
    }
    
    const quantityInput = document.getElementById('quantityInput');
    const quantity = parseInt(quantityInput?.value || 1);
    
    if (quantity > selectedVariant.stock) {
        showError(`Only ${selectedVariant.stock} available`);
        return;
    }
    
    if (quantity < 1) {
        showError('Quantity must be at least 1');
        return;
    }
    
    try {
        showLoading();
        const response = await api.addToCart(selectedVariant.id || selectedVariant._id, quantity);
        
        if (response.success || response.data) {
            showSuccess('Added to cart!');
            
            // Update cart count badge
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            } else if (typeof updateCartBadge === 'function') {
                updateCartBadge();
            }
        } else {
            throw new Error(response.message || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showError(error.message || 'Failed to add to cart');
    } finally {
        hideLoading();
    }
}

/**
 * Setup event listeners
 */
function setupProductEventListeners() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    }
    
    // Quantity input validation
    const quantityInput = document.getElementById('quantityInput');
    if (quantityInput) {
        quantityInput.addEventListener('change', () => {
            const max = parseInt(quantityInput.max);
            const value = parseInt(quantityInput.value);
            
            if (value < 1) {
                quantityInput.value = 1;
            } else if (value > max) {
                quantityInput.value = max;
                showError(`Only ${max} available in stock`);
            }
        });
    }
}

/**
 * Initialize product details page
 */
function initProductPage() {
    setupProductEventListeners();
    loadProductDetails();
}

// Auto-initialize if on product page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('product.html') || document.getElementById('productDetails')) {
            initProductPage();
        }
    });
} else {
    if (window.location.pathname.includes('product.html') || document.getElementById('productDetails')) {
        initProductPage();
    }
}
