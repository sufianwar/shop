import express from "express";
import { getLedger, addLedgerEntry, getCustomerBalance, getMonthlyStatement } from "../controllers/ledgerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getLedger);
router.post("/:customerId", addLedgerEntry);
router.get("/:customerId/balance", getCustomerBalance);
router.get("/:customerId/statement", getMonthlyStatement);

export default router;
