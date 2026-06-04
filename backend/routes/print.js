import express from "express";
import { printReceipt } from "../controllers/printController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/receipt", printReceipt);

export default router;
