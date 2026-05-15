
import express from "express";
import Category from "../models/Category.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/", async (req, res) => {
  const cats = await Category.find({ isActive: true }).sort("name");
  res.json(cats);
});
router.post("/", async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json(cat);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put("/:id", async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(cat);
});
router.delete("/:id", async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: "Category deleted" });
});
export default router;
