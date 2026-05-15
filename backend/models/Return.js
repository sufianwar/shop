
import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  qty: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  subtotal: Number,
});

const returnSchema = new mongoose.Schema(
  {
    returnNo: { type: String, unique: true },
    originalSale: { type: mongoose.Schema.Types.ObjectId, ref: "Sale", required: true },
    originalInvoice: { type: String },
    items: [returnItemSchema],
    totalRefund: { type: Number, required: true },
    reason: { type: String, default: "" },
    refundMethod: { type: String, enum: ["cash", "credit", "exchange"], default: "cash" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, default: "" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedByName: { type: String },
    status: { type: String, enum: ["processed", "pending"], default: "processed" },
  },
  { timestamps: true }
);

export default mongoose.model("Return", returnSchema);
