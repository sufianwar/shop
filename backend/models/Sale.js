
import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  barcode: String,
  qty: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  purchasePrice: { type: Number, default: 0 },
  subtotal: Number,
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true },
    items: [saleItemSchema],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    profit: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["cash", "card", "online", "credit"], default: "cash" },
    amountPaid: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, default: "Walk-in Customer" },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cashierName: { type: String },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["completed", "refunded", "pending"], default: "completed" },
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
