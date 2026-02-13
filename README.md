# Premium Hair Wigs & Extensions - Customer Frontend

This is the standalone customer-facing storefront for Premium Hair Wigs & Extensions e-commerce platform. This repository has been migrated from the monorepo and contains only the frontend application.

## 🚀 Features

- **Product Catalog**: Browse all products with search and category filters
- **Shopping Cart**: Add/remove products, update quantities with persistent cart (localStorage)
- **User Authentication**: Register, login, and manage user profiles
- **Wishlist Management**: Save favorite products for later
- **Responsive Design**: Mobile-friendly interface for all devices
- **Order Management**: Place orders and track order status
- **Newsletter Signup**: Subscribe to updates and promotions
- **Contact Forms**: Get in touch with support

## 📁 Project Structure

```
frontend-ecommerce/
├── index.html          # Main storefront page
├── styles.css          # All CSS styles
├── package.json        # Project dependencies
├── .gitignore          # Git ignore rules
├── .nojekyll           # GitHub Pages configuration
├── vercel.json         # Vercel deployment config
├── netlify.toml        # Netlify deployment config
├── assets/             # Images and static assets
│   └── images/         # Product images, logos
└── js/
    ├── config.js       # API configuration
    ├── api.js          # API service layer
    └── app.js          # Main application logic
```

## 🔧 Configuration

The API configuration is in `js/config.js` and automatically detects the environment:

- **Local Development**: `http://localhost:3000`
- **Production**: `https://backend-ecommerce-3-2jsk.onrender.com`

The configuration includes all API endpoints for products, authentication, orders, wishlist, and more.

## 🌐 Deployment Options

This frontend can be deployed to multiple platforms. Choose the one that best fits your needs.

### Option 1: GitHub Pages (Recommended for Static Sites)

**Advantages**: Free hosting, automatic HTTPS, custom domain support

**Steps**:

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Source", select "main" branch and "/" (root) folder
   - Click "Save"
   - Your site will be available at: `https://nhlobo.github.io/frontend-ecommerce/`

2. **The `.nojekyll` file** is already included to ensure proper deployment

3. **Update Backend CORS**: Make sure your backend allows requests from your GitHub Pages domain

**GitHub Actions Automatic Deployment** (Optional):

The repository can be configured with GitHub Actions for automatic deployment. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v2
```

### Option 2: Vercel

**Advantages**: Fast deployment, automatic HTTPS, preview deployments for PRs

**Steps**:

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework Preset**: Other
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `.` (root)
   - **Install Command**: `npm install` (optional, for dependencies)

3. **Deploy**: Click "Deploy" and Vercel will build and deploy your site

The `vercel.json` file is already configured for proper routing.

### Option 3: Netlify

**Advantages**: Continuous deployment, form handling, serverless functions support

**Steps**:

1. **Connect Repository**:
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**:
   - **Build command**: Leave empty
   - **Publish directory**: `.` (root)
   - **Branch to deploy**: `main`

3. **Deploy**: Netlify will automatically deploy your site

The `netlify.toml` file is already configured for proper routing.

### Option 4: Render (Static Site)

**Advantages**: Free tier, automatic SSL, custom domains

**Steps**:

1. **Create Static Site**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure**:
   - **Name**: `premium-hair-frontend`
   - **Build Command**: Leave empty
   - **Publish Directory**: `.` (root)

3. **Deploy**: Click "Create Static Site"

## 🔗 Backend API Connection

The frontend connects to the backend API deployed at:
**`https://backend-ecommerce-3-2jsk.onrender.com`**

### API Configuration

The API automatically switches between development and production:

```javascript
// Development (localhost)
http://localhost:3000

// Production (GitHub Pages, Vercel, Netlify, etc.)
https://backend-ecommerce-3-2jsk.onrender.com
```

### CORS Configuration

Ensure your backend CORS settings allow requests from your deployed frontend domain:

```javascript
// Backend CORS origins should include:
[
  'https://nhlobo.github.io',                    // GitHub Pages
  'https://premium-hair-frontend.vercel.app',     // Vercel
  'https://premium-hair-frontend.netlify.app',    // Netlify
  'http://localhost:8000',                        // Local development
  'http://127.0.0.1:8000'                         // Local development
]
```

### Available API Endpoints

The frontend uses these API endpoints (configured in `js/config.js`):

- **Products**: `/api/products`, `/api/products/:id`, `/api/products/search`
- **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/user`
- **Orders**: `/api/orders`, `/api/orders/:id`, `/api/orders/track/:orderNumber`
- **Wishlist**: `/api/wishlist`, `/api/wishlist/:id`
- **Contact**: `/api/contact`, `/api/newsletter`

## 🧪 Local Development

### Prerequisites

- Node.js 14+ (for `npx http-server`)
- Python 3 (alternative)
- Or any local web server

### Running Locally

**Option 1: Using npm http-server (Recommended)**

```bash
# Install dependencies (only needed once)
npm install

# Start development server
npm run dev

# Or manually
npx http-server -p 8000 -c-1 -o
```

The server will start at `http://localhost:8000` and automatically open in your browser.

**Option 2: Using Python**

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then visit `http://localhost:8000` in your browser.

**Option 3: Using VS Code Live Server**

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Testing with Local Backend

If you want to test with a local backend:

1. Start your backend server on `http://localhost:3000`
2. Open the frontend on `http://localhost:8000`
3. The config automatically detects localhost and uses the local backend

## 📝 Important Notes

- **Static Frontend**: This is a pure HTML/CSS/JavaScript frontend with no build step required
- **No Dependencies**: The frontend works directly in the browser
- **localStorage**: User data (cart, auth tokens) is stored in browser localStorage
- **API Integration**: All API calls use the native Fetch API
- **CORS**: Backend must allow requests from your frontend domain
- **HTTPS**: Always use HTTPS in production for security

## 🎨 Customization

### Updating Styles

All styles are in `styles.css`. The site uses:
- **Fonts**: Poppins (body) and Cormorant Garamond (headings) from Google Fonts
- **Icons**: Font Awesome 6.4.0
- **Colors**: Defined in CSS variables for easy theming
- **Responsive**: Mobile-first design with breakpoints

### Adding Images

Place images in the `assets/images/` directory and reference them:

```html
<img src="assets/images/your-image.jpg" alt="Description">
```

### Modifying API Configuration

Edit `js/config.js` to:
- Change backend URL
- Update business information
- Modify shipping costs
- Change payment methods

## 🔐 Security Notes

- Never commit sensitive API keys or credentials
- Authentication tokens are stored in localStorage (consider HttpOnly cookies for enhanced security)
- HTTPS is automatically enabled on GitHub Pages
- Always validate user inputs before sending to backend
- The backend handles all sensitive operations (payments, order processing)

## 🧪 Testing Features

After deployment, test these features:

- ✅ Product catalog loads from backend API
- ✅ Search and filter products
- ✅ Add products to cart
- ✅ Cart persists across page refreshes
- ✅ User registration and login
- ✅ User profile management
- ✅ Wishlist functionality
- ✅ Order creation and tracking
- ✅ Contact form submission
- ✅ Newsletter signup
- ✅ Responsive design on mobile/tablet/desktop
- ✅ All images and assets load correctly

## 🐛 Troubleshooting

### CORS Errors

**Problem**: "Access-Control-Allow-Origin" errors in browser console

**Solution**: Update backend CORS configuration to include your frontend domain

### API Connection Failed

**Problem**: Cannot connect to backend API

**Solutions**:
- Check that backend is running and accessible
- Verify the backend URL in `js/config.js`
- Check browser console for specific error messages
- Ensure backend is deployed and not sleeping (Render free tier)

### Images Not Loading

**Problem**: Broken image links

**Solutions**:
- Verify images exist in `assets/images/`
- Check image paths are relative from root
- Ensure image filenames match (case-sensitive on Linux)
- Check browser console for 404 errors

### Cart/Auth Not Persisting

**Problem**: Cart or login state is lost

**Solutions**:
- Check if localStorage is enabled in browser
- Verify browser is not in private/incognito mode
- Check for localStorage quota issues
- Clear browser cache and try again

## 📦 Package.json Scripts

The `package.json` includes these scripts:

```json
{
  "scripts": {
    "serve": "npx http-server -p 8000 -c-1",
    "dev": "npx http-server -p 8000 -c-1 -o"
  }
}
```

- `npm run serve`: Start server without opening browser
- `npm run dev`: Start server and open in browser

## 🔄 Migration from Monorepo

This repository was migrated from the `frontend-ecommerce` directory of the [Nhlobo/ecommerce](https://github.com/Nhlobo/ecommerce) monorepo. All files have been moved to the root level for standalone deployment.

### Changes Made During Migration

- ✅ All files moved to repository root
- ✅ API configuration updated with production backend URL
- ✅ Deployment configuration files created (.nojekyll, vercel.json, netlify.toml)
- ✅ README updated with standalone deployment instructions
- ✅ Package.json updated with correct scripts and dependencies

## 📄 License

**PROPRIETARY** - Premium Hair Wigs & Extensions Pty (Ltd)

All rights reserved. This software is proprietary and confidential.

## 📞 Support

For issues or questions, contact: support@premiumhairsa.co.za
