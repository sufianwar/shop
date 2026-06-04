
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

// Check if a barcode is already in use (for duplicate validation)
export const checkBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const { excludeId } = req.query; // exclude current product when editing
    const query = { barcode, isActive: true };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Product.findOne(query);
    res.json({ exists: !!existing, product: existing ? { _id: existing._id, name: existing.name } : null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const data = req.body;
    // Validate barcode uniqueness if provided
    if (data.barcode) {
      const existing = await Product.findOne({ barcode: data.barcode, isActive: true });
      if (existing) {
        return res.status(409).json({
          message: `Barcode "${data.barcode}" is already assigned to "${existing.name}"`,
          duplicateBarcode: true,
          existingProduct: { _id: existing._id, name: existing.name },
        });
      }
    } else {
      data.barcode = await generateBarcode();
    }
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    // Handle MongoDB unique index violation as a fallback
    if (err.code === 11000 && err.keyPattern?.barcode) {
      return res.status(409).json({ message: "This barcode is already in use", duplicateBarcode: true });
    }
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // Validate barcode uniqueness if being changed
    if (data.barcode) {
      const existing = await Product.findOne({ barcode: data.barcode, isActive: true, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({
          message: `Barcode "${data.barcode}" is already assigned to "${existing.name}"`,
          duplicateBarcode: true,
          existingProduct: { _id: existing._id, name: existing.name },
        });
      }
    }
    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.barcode) {
      return res.status(409).json({ message: "This barcode is already in use", duplicateBarcode: true });
    }
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
