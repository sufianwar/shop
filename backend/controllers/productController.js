
import Product from "../models/Product.js";
import { generateBarcode } from "../utils/barcodeGenerator.js";

export const getProducts = async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = { isActive: true };
    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.categoryName = category;
    if (lowStock === "true") query.$expr = { $lte: ["$stock", "$minStock"] };
    const products = await Product.find(query).sort("-createdAt");
    console.log("00000000000000000 produ  ", products);  
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode, isActive: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const data = req.body;
    if (!data.barcode) data.barcode = await generateBarcode();
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || 5);
    const products = await Product.find({ stock: { $lte: threshold }, isActive: true }).sort("stock");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
