import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/api';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await getProduct(id);
      if (response.success) {
        setProduct(response.data);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load product details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // Add to cart logic (localStorage or state management)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price_incl_vat,
        quantity: quantity,
        image_url: product.image_url
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch custom event to update cart count in header
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Navigate to cart
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i> Loading product...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error || 'Product not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-back">
          <i className="fas fa-arrow-left"></i> Back
        </button>

        <div className="product-detail">
          <div className="product-detail-image">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} />
            ) : (
              <div className="product-image-placeholder large">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <h1>{product.name}</h1>
            <p className="product-category">
              <i className="fas fa-tag"></i> {product.category}
            </p>
            {product.sku && (
              <p className="product-sku">SKU: {product.sku}</p>
            )}

            <div className="product-price-section">
              <p className="product-price">R{product.price_incl_vat.toFixed(2)}</p>
              <p className="product-price-excl">
                (R{product.price_excl_vat.toFixed(2)} excl. VAT)
              </p>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description || 'No description available.'}</p>
            </div>

            <div className="product-stock">
              {product.stock_quantity > 0 ? (
                <span className="stock-badge in-stock">
                  <i className="fas fa-check-circle"></i> In Stock ({product.stock_quantity} available)
                </span>
              ) : (
                <span className="stock-badge out-of-stock">
                  <i className="fas fa-times-circle"></i> Out of Stock
                </span>
              )}
            </div>

            {product.stock_quantity > 0 && (
              <div className="product-actions">
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.stock_quantity}
                    className="quantity-input"
                  />
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="quantity-btn"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-add-to-cart"
                >
                  <i className="fas fa-shopping-cart"></i> Add to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
