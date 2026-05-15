
import express from "express";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", getCustomers);
router.post("/", addCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
export default router;
