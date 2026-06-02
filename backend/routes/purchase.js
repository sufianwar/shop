
import express from "express";
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  getPurchaseStats,
  deletePurchase,
} from "../controllers/purchaseController.js";
import {
  getPurchasePayments,
  getPurchasePaymentsByPO,
  recordPayment,
  updatePayment,
  deletePayment,
} from "../controllers/purchasePaymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// Purchase routes
router.get("/stats", getPurchaseStats);
router.get("/payments/list", getPurchasePayments);
router.get("/:id", getPurchaseById);
router.get("/:id/payments", getPurchasePaymentsByPO);
router.get("/", getPurchases);
router.post("/", createPurchase);
router.post("/:id/payments", recordPayment);
router.patch("/payments/:paymentId", updatePayment);
router.delete("/payments/:paymentId", authorize("admin"), deletePayment);
router.delete("/:id", authorize("admin"), deletePurchase);

export default router;
