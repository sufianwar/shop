
import express from "express";
import { getSales, getSaleById, createSale, getSalesSummary, refundSale, payDue, deleteSale, getDeletedSales, restoreSale } from "../controllers/salesController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", getSales);
router.get("/summary", getSalesSummary);
router.get("/deleted", authorize("admin"), getDeletedSales);
router.get("/:id", getSaleById);
router.post("/", createSale);
router.delete("/:id", authorize("admin"), deleteSale);
router.post("/:id/restore", authorize("admin"), restoreSale);
router.post("/:id/refund", authorize("admin", "manager"), refundSale);
router.post("/:id/pay-due", payDue);
export default router;
