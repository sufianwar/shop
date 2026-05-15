
import express from "express";
import { getPurchases, createPurchase, deletePurchase } from "../controllers/purchaseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", getPurchases);
router.post("/", createPurchase);
router.delete("/:id", authorize("admin"), deletePurchase);
export default router;
