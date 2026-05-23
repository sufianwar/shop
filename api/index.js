import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

// Import routes
import authRoutes from "../backend/routes/auth.js";
import productRoutes from "../backend/routes/products.js";
import salesRoutes from "../backend/routes/sales.js";
import purchaseRoutes from "../backend/routes/purchase.js";
import analyticsRoutes from "../backend/routes/analytics.js";
import customerRoutes from "../backend/routes/customers.js";
import supplierRoutes from "../backend/routes/suppliers.js";
import expenseRoutes from "../backend/routes/expenses.js";
import categoryRoutes from "../backend/routes/categories.js";
import dashboardRoutes from "../backend/routes/dashboard.js";
import ledgerRoutes from "../backend/routes/ledger.js";
import manualPaymentRoutes from "../backend/routes/manualPayments.js";
import returnRoutes from "../backend/routes/returns.js";

// Import middleware
import { notFound } from "../backend/middleware/notFoundMiddleware.js";
import { errorHandler } from "../backend/middleware/errorMiddleware.js";
import connectDB from "../backend/config/db.js";

const app = express();

// Connect to MongoDB
connectDB();

// Security & Parsing
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/manual-payments", manualPaymentRoutes);
app.use("/api/returns", returnRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK", time: new Date() }));

// Error Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
