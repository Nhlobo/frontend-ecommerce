import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>Premium Hair Wigs & Extensions</h1>
          <p>Transform your look with our high-quality hair products</p>
          <Link to="/products" className="btn btn-primary">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <i className="fas fa-star"></i>
              <h3>Premium Quality</h3>
              <p>100% human hair and premium synthetic options</p>
            </div>
            <div className="feature">
              <i className="fas fa-shipping-fast"></i>
              <h3>Fast Shipping</h3>
              <p>Quick delivery to your doorstep</p>
            </div>
            <div className="feature">
              <i className="fas fa-shield-alt"></i>
              <h3>Secure Payment</h3>
              <p>Safe and secure checkout process</p>
            </div>
            <div className="feature">
              <i className="fas fa-headset"></i>
              <h3>24/7 Support</h3>
              <p>Always here to help you</p>
            </div>
          </div>
        </div>
      </section>

      <section className="categories">
        <div className="container">
          <h2>Shop by Category</h2>
          <div className="categories-grid">
            <Link to="/products?category=Wigs" className="category-card">
              <i className="fas fa-female"></i>
              <h3>Wigs</h3>
            </Link>
            <Link to="/products?category=Extensions" className="category-card">
              <i className="fas fa-magic"></i>
              <h3>Extensions</h3>
            </Link>
            <Link to="/products?category=Accessories" className="category-card">
              <i className="fas fa-brush"></i>
              <h3>Accessories</h3>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
