import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getManualPayments,
  lookupInvoice,
  createManualPayment,
  updateManualPayment,
  deleteManualPayment,
  markInvoicePaid,
  getCustomerPendingInvoices,
} from "../controllers/manualPaymentController.js";

const router = express.Router();

router.use(protect);

router.get("/", getManualPayments);
router.get("/lookup", lookupInvoice);
router.get("/pending/:customerId", getCustomerPendingInvoices);
router.post("/", createManualPayment);
router.put("/:id", updateManualPayment);
router.delete("/:id", deleteManualPayment);
router.post("/mark-invoice-paid", markInvoicePaid);

export default router;
