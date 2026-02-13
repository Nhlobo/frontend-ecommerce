# Premium Hair Wigs & Extensions - Customer Frontend

This is the customer-facing e-commerce frontend for Premium Hair Wigs & Extensions. Built with React and Vite for a fast, modern shopping experience.

## 🚀 Features

- **Product Catalog**
  - Browse all products
  - Filter by category
  - Search functionality
  - Product detail pages
  
- **Shopping Cart**
  - Add/remove products
  - Update quantities
  - Persistent cart (localStorage)
  
- **Checkout Process**
  - Customer information form
  - Shipping and billing address
  - Multiple payment methods
  - Order creation
  
- **Responsive Design**
  - Mobile-friendly
  - Touch-optimized
  - Modern UI

## 📋 Prerequisites

- Node.js >= 14.0.0
- npm or yarn

## 🔧 Installation

1. **Clone or copy this frontend directory**

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment (optional):**

Create a `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

Or it will auto-detect based on hostname.

## 🎮 Usage

### Development
```bash
npm run dev
```

The app will run on http://localhost:3001

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📡 API Integration

The frontend connects to the backend API. The API URL is automatically configured:

- **Development (localhost):** `http://localhost:3000`
- **Production:** `https://backend-ecommerce-1-xp4b.onrender.com`

You can override this by setting the `VITE_API_URL` environment variable.

## 🌐 Deployment to Render

### Step 1: Push to GitHub

1. Create a new repository named `frontend-ecommerce`
2. Copy all files from this `frontend` directory to the repository
3. Push to GitHub

### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name:** premium-hair-frontend
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

### Step 3: Configure Environment Variables (Optional)

Add environment variable if you need to override the API URL:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 4: Note Your Frontend URL

After deployment, Render will provide a URL like:
```
https://premium-hair-frontend.onrender.com
```

Update the backend CORS configuration to include this URL.

## 📁 Project Structure

```
frontend/
├── index.html                 # Main HTML file
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Main app component
│   ├── config.js              # API configuration
│   ├── components/
│   │   ├── Header.jsx         # Header component
│   │   └── Footer.jsx         # Footer component
│   ├── pages/
│   │   ├── Home.jsx           # Home page
│   │   ├── Products.jsx       # Products listing
│   │   ├── ProductDetail.jsx  # Product detail
│   │   ├── Cart.jsx           # Shopping cart
│   │   └── Checkout.jsx       # Checkout page
│   ├── services/
│   │   └── api.js             # API client
│   └── styles/
│       ├── index.css          # Global styles
│       └── App.css            # Component styles
└── public/                    # Static assets
```

## 🛠️ Development

### Adding New Features

1. Create new components in `src/components/`
2. Create new pages in `src/pages/`
3. Add routes in `src/App.jsx`
4. Update API services in `src/services/api.js`

### Styling

The app uses plain CSS with modern features. All styles are in `src/styles/`.

## 🔗 Connecting to Backend

Make sure your backend is running and accessible. Update the `CORS` configuration in the backend to include your frontend URL.

## 📱 Features to Add

- User authentication
- Order history
- Product reviews
- Wishlist
- Payment gateway integration
- Email notifications

## 🐛 Troubleshooting

### CORS Errors
Make sure the backend CORS configuration includes your frontend URL.

### API Connection Issues
Check that the backend is running and the API URL is correct in `src/config.js`.

### Build Errors
Make sure all dependencies are installed with `npm install`.

## 📄 License

PROPRIETARY - Premium Hair Wigs & Extensions Pty (Ltd)
