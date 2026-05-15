
import Supplier from "../models/Supplier.js";

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort("-createdAt");
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
