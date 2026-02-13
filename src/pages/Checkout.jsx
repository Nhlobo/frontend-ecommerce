import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/api';

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    billing_address: '',
    payment_method: 'credit_card'
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (savedCart.length === 0) {
      navigate('/cart');
    }
    setCart(savedCart);
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        ...formData,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      const response = await createOrder(orderData);
      
      if (response.success) {
        // Clear cart
        localStorage.removeItem('cart');
        
        // Dispatch custom event to update cart count
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Set success state
        setSuccess(true);
        setOrderNumber(response.data.order_number);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to place order. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show success message
  if (success) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <h1>Order Placed Successfully!</h1>
            <p>Your order number is: <strong>{orderNumber}</strong></p>
            <p>We'll send you an email confirmation shortly.</p>
            <Link to="/" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <h2>Contact Information</h2>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <h2>Shipping Address</h2>
            <div className="form-group">
              <label>Full Address *</label>
              <textarea
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleInputChange}
                required
                rows="3"
                className="form-input"
                placeholder="Street address, city, postal code"
              />
            </div>

            <h2>Billing Address</h2>
            <div className="form-group">
              <label>Full Address *</label>
              <textarea
                name="billing_address"
                value={formData.billing_address}
                onChange={handleInputChange}
                required
                rows="3"
                className="form-input"
                placeholder="Street address, city, postal code"
              />
            </div>

            <h2>Payment Method</h2>
            <div className="form-group">
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="eft">Bank Transfer (EFT)</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
              </select>
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i> Place Order
                </>
              )}
            </button>
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.map((item, index) => (
                <div key={index} className="summary-item">
                  <span>{item.name} x {item.quantity}</span>
                  <span>R{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total:</span>
              <span>R{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
