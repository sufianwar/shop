@echo off
REM MARHABA POS - Vercel Deployment Quick Start

echo.
echo ============================================
echo  MARHABA POS - Vercel Deployment Setup
echo ============================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo [1] Installing Vercel CLI globally...
    call npm install -g vercel
    echo [✓] Vercel CLI installed
    echo.
)

echo [2] Checking environment setup...
if not exist ".env" (
    echo Warning: .env file not found!
    echo Please copy .env.example to .env and fill in your values:
    echo   - MONGO_URI: Your MongoDB Atlas connection string
    echo   - JWT_SECRET: A secure random string
    echo.
    pause
    exit /b 1
)
echo [✓] .env file exists
echo.

echo [3] Installing dependencies...
call npm install
echo [✓] Dependencies installed
echo.

echo [4] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [✗] Build failed! Check errors above.
    pause
    exit /b 1
)
echo [✓] Frontend built successfully
echo.

echo [5] Ready for Vercel deployment!
echo.
echo Next steps:
echo   1. Go to https://vercel.com/dashboard
echo   2. Click "New Project"
echo   3. Select your GitHub repository (sufianwar/shop or Marhaba-Pos)
echo   4. Set environment variables in Vercel:
echo        - MONGO_URI
echo        - JWT_SECRET
echo        - NODE_ENV=production
echo        - VITE_API_URL (add after first deployment)
echo.
echo Or use Vercel CLI:
echo   vercel --prod
echo.
echo For detailed instructions, see DEPLOYMENT.md
echo.
pause
