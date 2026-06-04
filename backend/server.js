
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import purchaseRoutes from "./routes/purchase.js";
import analyticsRoutes from "./routes/analytics.js";
import customerRoutes from "./routes/customers.js";
import supplierRoutes from "./routes/suppliers.js";
import expenseRoutes from "./routes/expenses.js";
import categoryRoutes from "./routes/categories.js";
import dashboardRoutes from "./routes/dashboard.js";
import ledgerRoutes from "./routes/ledger.js";
import manualPaymentRoutes from "./routes/manualPayments.js";
import returnRoutes from "./routes/returns.js";
import printRoutes from "./routes/print.js";

// Middleware
import { notFound } from "./middleware/notFoundMiddleware.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Security & Parsing
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// Static folders
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/manual-payments", manualPaymentRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/print", printRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK", time: new Date() }));

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 POS Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pos_final"}\n`);
});
