
import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  qty: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  subtotal: Number,
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNo: { type: String, unique: true },
    items: [purchaseItemSchema],
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String, default: "Direct Purchase" },
    total: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["paid", "partial", "unpaid"], default: "paid" },
    paymentMethod: { type: String, default: "cash" },
    notes: { type: String, default: "" },
    purchaseDate: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
