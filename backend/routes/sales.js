
import express from "express";
import { getSales, getSaleById, createSale, getSalesSummary, refundSale } from "../controllers/salesController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", getSales);
router.get("/summary", getSalesSummary);
router.get("/:id", getSaleById);
router.post("/", createSale);
router.post("/:id/refund", authorize("admin", "manager"), refundSale);
export default router;
