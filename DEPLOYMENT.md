# Deployment Guide - MARHABA POS System

## Vercel Deployment Instructions

This is a full-stack application with React frontend and Express backend. Follow these steps to deploy on Vercel.

### Prerequisites

1. **GitHub Account** - Code must be pushed to GitHub
2. **Vercel Account** - Create account at https://vercel.com
3. **MongoDB Atlas** - Cloud database at https://www.mongodb.com/cloud/atlas
4. **Environment Variables** - Have your secrets ready

---

## Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database user and get your connection string
4. Copy the connection string in this format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/pos_final
   ```

---

## Step 2: Prepare Local Environment

### Create `.env` file in root directory:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pos_final
JWT_SECRET=your_super_secret_jwt_key_here_change_this_to_something_secure
NODE_ENV=production
```

### Install Dependencies

```bash
cd c:\Users\BEST BUY COMPUTERS\Documents\GitHub\shop
npm install
```

---

## Step 3: Push Code to GitHub

```bash
git add .
git commit -m "Setup for Vercel deployment"
git push origin main
```

---

## Step 4: Deploy on Vercel

### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts to:
- Login to your Vercel account
- Select the GitHub repository
- Configure project settings
- Add environment variables (MONGO_URI, JWT_SECRET)

### Option B: Using Vercel Web Dashboard

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Configure:
   - **Project Name**: marhaba-pos
   - **Framework**: Other (since it's a monorepo)
   - **Root Directory**: ./
5. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production
   - `VITE_API_URL`: https://your-domain.vercel.app/api (add this after deployment)

---

## Step 5: Configure Environment Variables

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add the following:
   - **MONGO_URI** = `mongodb+srv://...`
   - **JWT_SECRET** = Generate a secure random key
   - **NODE_ENV** = production

3. After deployment is complete:
   - Get your Vercel deployment URL (e.g., `https://shop-xyz.vercel.app`)
   - Add another env var: **VITE_API_URL** = `https://shop-xyz.vercel.app/api`
   - Redeploy the project

---

## Step 6: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the health check: `https://your-domain.vercel.app/api/health`
3. Try logging in and testing features

---

## Troubleshooting

### "Cannot find module" errors
- Ensure `api/index.js` can find all route files
- Check that all imports use correct relative paths

### Database connection errors
- Verify MongoDB Atlas connection string
- Check IP whitelist allows Vercel IPs
- Ensure environment variables are set in Vercel

### Frontend not loading
- Verify `VITE_API_URL` environment variable is set
- Check browser console for API errors
- Ensure backend routes are accessible

### Build failures
- Run `npm run build` locally to test
- Check that all dependencies are listed in package.json
- Review Vercel build logs for specific errors

---

## Project Structure for Vercel

```
shop/
├── api/                    # Serverless functions
│   └── index.js           # Express app handler
├── backend/               # Express backend code
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   ├── services/
│   ├── utils/
│   └── package.json
├── frontend/              # React frontend
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
├── vercel.json           # Vercel configuration
├── package.json          # Root package.json
└── .env                  # Environment variables
```

---

## Post-Deployment

### Enable Analytics
1. In Vercel Dashboard, go to Analytics
2. Monitor performance and errors

### Set Up Monitoring
1. Implement error logging
2. Set up database backup schedule
3. Monitor MongoDB usage

### Custom Domain
1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## Useful Commands

```bash
# Local development
npm run dev

# Build frontend only
npm run build

# Start backend locally
npm run start -w backend

# Check deployment logs
vercel logs

# Redeploy without code changes
vercel --prod
```

---

## Performance Tips

1. **Database Indexing**: Create indexes on frequently queried fields
2. **API Response Caching**: Implement caching for analytics data
3. **Image Optimization**: Compress product images before upload
4. **Lazy Loading**: Implement lazy loading for large lists

---

## Security Checklist

- [ ] JWT_SECRET is complex and random
- [ ] MongoDB user has limited permissions
- [ ] CORS is configured correctly
- [ ] Helmet security headers are enabled
- [ ] Environment variables are not in version control
- [ ] Regular backups of MongoDB are scheduled

---

For more help, visit:
- Vercel Docs: https://vercel.com/docs
- Express.js Guide: https://expressjs.com
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas/
