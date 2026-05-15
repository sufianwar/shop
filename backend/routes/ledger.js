import express from "express";
import { getLedger, addLedgerEntry, getCustomerBalance } from "../controllers/ledgerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/:customerId", getLedger);
router.post("/:customerId", addLedgerEntry);
router.get("/:customerId/balance", getCustomerBalance);

export default router;
