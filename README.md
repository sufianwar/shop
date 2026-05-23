# 🛒 MARHABA POS System

A modern, full-stack Point of Sale (POS) system built with React and Express.js for retail and inventory management.

## ✨ Features

- **Sales Management** - Track sales, invoices, and receipts
- **Inventory Control** - Product management, stock levels, and low stock alerts
- **Customer Management** - Customer database and purchase history
- **Supplier Management** - Supplier information and purchase orders
- **Financial Analytics** - Profit/loss analysis, sales reports, and dashboards
- **Manual Payments** - Record and track manual payment adjustments
- **Expense Tracking** - Categorized expense management
- **Return Management** - Handle product returns and refunds
- **Barcode Scanning** - QR code and barcode generation/scanning
- **Export Options** - Export data to Excel, PDF invoices
- **Ledger System** - Detailed transaction logging
- **User Authentication** - Secure login with JWT tokens

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Local Development

```bash
# Clone the repository
git clone https://github.com/sufianwar/Marhaba-Pos.git
cd Marhaba-Pos

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env with your configuration:
# - MONGO_URI: MongoDB connection string
# - JWT_SECRET: Your secret key

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## 📦 Build & Deploy

### Build Frontend
```bash
npm run build
```

### Production Start
```bash
npm start
```

## 🌐 Vercel Deployment

This application is configured for easy deployment on Vercel!

### Quick Deploy

1. **Prepare MongoDB Atlas**
   - Create a free cluster at https://www.mongodb.com/cloud/atlas
   - Get your connection string

2. **Connect to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Select this GitHub repository

3. **Add Environment Variables**
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production
   - `VITE_API_URL`: Will be your Vercel domain + /api

4. **Deploy**
   - Click Deploy
   - Wait for the build to complete
   - Update `VITE_API_URL` with your actual Vercel URL

📖 **For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 📁 Project Structure

```
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (Auth, Cart, Theme)
│   │   ├── services/      # API service files
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # CSS files
│   └── package.json
├── backend/           # Express.js backend
│   ├── routes/        # API routes
│   ├── controllers/    # Route handlers
│   ├── models/        # MongoDB schemas
│   ├── middleware/    # Express middleware
│   ├── config/        # Database config
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── package.json
├── api/               # Vercel serverless functions
│   └── index.js       # Express app handler
├── vercel.json        # Vercel configuration
└── package.json       # Root package.json
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend in dev mode

# Build
npm run build            # Build frontend for production

# Production
npm start                # Start backend server
npm run preview          # Preview production build

# Backend only
npm run dev -w backend   # Start backend development
npm start -w backend     # Start backend production

# Frontend only
npm run dev -w frontend  # Start frontend development
npm run build -w frontend # Build frontend
```

## 🔐 Security Features

- JWT-based authentication
- Password encryption with bcryptjs
- CORS security configuration
- Helmet.js for HTTP headers
- Input validation with express-validator
- Role-based access control

## 💾 Database

- MongoDB with Mongoose ODM
- Cloud hosting: MongoDB Atlas
- Local development: MongoDB Community Server

## 🎨 Frontend Technologies

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## ⚙️ Backend Technologies

- **Express.js** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Morgan** - HTTP logging

## 📊 API Documentation

API Base URL: `/api`

### Key Endpoints
- `/api/auth` - Authentication (login, register)
- `/api/products` - Product management
- `/api/sales` - Sales transactions
- `/api/purchase` - Purchase orders
- `/api/customers` - Customer management
- `/api/analytics` - Analytics and reports
- `/api/dashboard` - Dashboard data
- `/api/ledger` - Transaction ledger
- `/api/returns` - Return management

## 🐛 Troubleshooting

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf frontend/dist` then `npm run build`

### Connection Issues
- Verify MongoDB connection string in `.env`
- Check MongoDB Atlas IP whitelist includes your IP
- For Vercel, ensure proper environment variables are set

### Frontend Not Loading
- Clear browser cache and reload
- Check browser console for API errors
- Verify `VITE_API_URL` environment variable

## 📞 Support

For issues and questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
2. Review API endpoints documentation
3. Check MongoDB Atlas documentation

## 📄 License

This project is private and proprietary.

## 👤 Author

MARHABA POS System Development Team

---

**Ready to deploy?** Follow the [Deployment Guide](./DEPLOYMENT.md)
