/**
 * Orders Page
 * Displays user's order history
 */

/**
 * Load user orders
 */
async function loadOrders() {
    try {
        showLoading();
        
        const response = await api.getMyOrders();
        const orders = response.orders || response.data?.orders || response.data || [];
        
        renderOrders(orders);
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Failed to load orders');
        
        const container = document.getElementById('ordersList');
        if (container) {
            container.innerHTML = '<p class="error-message">Failed to load orders. Please try again.</p>';
        }
    } finally {
        hideLoading();
    }
}

/**
 * Render orders list
 */
function renderOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (!container) {
        console.error('Orders list container not found');
        return;
    }
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-box-open empty-icon"></i>
                <h2>No orders yet</h2>
                <p>You haven't placed any orders yet</p>
                <a href="/shop.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const orderDate = new Date(order.created_at || order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Get status class
        let statusClass = 'status-pending';
        const status = order.status?.toLowerCase() || 'pending';
        
        if (status === 'completed' || status === 'delivered') {
            statusClass = 'status-completed';
        } else if (status === 'processing' || status === 'shipped') {
            statusClass = 'status-processing';
        } else if (status === 'cancelled' || status === 'failed') {
            statusClass = 'status-cancelled';
        }
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3 class="order-number">Order #${order.order_number || order.orderNumber || order.id}</h3>
                        <p class="order-date">${formattedDate}</p>
                    </div>
                    <span class="order-status ${statusClass}">${order.status || 'Pending'}</span>
                </div>
                <div class="order-body">
                    <div class="order-items">
                        ${order.items && order.items.length > 0 ? `
                            <p class="order-items-count">${order.items.length} item${order.items.length !== 1 ? 's' : ''}</p>
                        ` : ''}
                    </div>
                    <div class="order-total">
                        <span class="total-label">Total:</span>
                        <span class="total-amount">${formatPrice(order.total || 0)}</span>
                    </div>
                </div>
                <div class="order-footer">
                    <a href="/order-details.html?id=${order.id || order._id}" class="btn btn-sm btn-outline">
                        View Details
                    </a>
                    ${(status === 'pending' || status === 'processing') ? `
                        <button class="btn btn-sm btn-outline" onclick="trackOrder('${order.order_number || order.orderNumber || order.id}')">
                            Track Order
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Track order
 */
async function trackOrder(orderNumber) {
    try {
        showLoading();
        const response = await api.trackOrder(orderNumber);
        
        if (response.success || response.data) {
            const tracking = response.tracking || response.data?.tracking || response.data;
            showTrackingInfo(tracking);
        } else {
            throw new Error('Tracking information not available');
        }
    } catch (error) {
        console.error('Error tracking order:', error);
        showError(error.message || 'Failed to get tracking information');
    } finally {
        hideLoading();
    }
}

/**
 * Show tracking information in modal
 */
function showTrackingInfo(tracking) {
    if (typeof showModal === 'function') {
        const content = `
            <div class="tracking-info">
                <h3>Order Tracking</h3>
                <p><strong>Status:</strong> ${tracking.status || 'Unknown'}</p>
                ${tracking.trackingNumber ? `<p><strong>Tracking Number:</strong> ${tracking.trackingNumber}</p>` : ''}
                ${tracking.carrier ? `<p><strong>Carrier:</strong> ${tracking.carrier}</p>` : ''}
                ${tracking.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(tracking.estimatedDelivery).toLocaleDateString()}</p>` : ''}
            </div>
        `;
        showModal(content, { title: 'Order Tracking' });
    } else {
        alert(`Order Status: ${tracking.status || 'Unknown'}`);
    }
}

/**
 * Initialize orders page
 */
function initOrdersPage() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html?redirect=/orders.html';
        return;
    }
    
    loadOrders();
}

// Auto-initialize if on orders page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('orders.html') || document.getElementById('ordersList')) {
            initOrdersPage();
        }
    });
} else {
    if (window.location.pathname.includes('orders.html') || document.getElementById('ordersList')) {
        initOrdersPage();
    }
}

// Export functions for use in other scripts
window.trackOrder = trackOrder;
