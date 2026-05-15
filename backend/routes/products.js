
import express from "express";
import {
  getProducts, getProductById, getProductByBarcode,
  addProduct, updateProduct, deleteProduct, getLowStockProducts,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", getProducts);
router.get("/low-stock", getLowStockProducts);
router.get("/barcode/:barcode", getProductByBarcode);
router.get("/:id", getProductById);
router.post("/", addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", authorize("admin", "manager"), deleteProduct);
export default router;
