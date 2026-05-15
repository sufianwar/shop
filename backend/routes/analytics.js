
import express from "express";
import { getSalesAnalytics, getProfitReport } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/sales", getSalesAnalytics);
router.get("/profit", getProfitReport);
export default router;
