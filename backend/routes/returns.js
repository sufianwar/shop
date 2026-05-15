import express from "express";
import { processReturn, getReturns } from "../controllers/returnController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", processReturn);
router.get("/", getReturns);

export default router;
