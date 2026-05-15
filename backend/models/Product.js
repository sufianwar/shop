
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    barcode: { type: String, unique: true, sparse: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryName: { type: String, default: "General" },
    purchasePrice: { type: Number, default: 0 },
    salePrice: { type: Number, required: true, default: 0 },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },
    unit: { type: String, default: "pcs" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    isActive: { type: Boolean, default: true },
    totalSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.virtual("profit").get(function () {
  return this.salePrice - this.purchasePrice;
});

productSchema.virtual("isLowStock").get(function () {
  return this.stock <= this.minStock;
});

export default mongoose.model("Product", productSchema);
