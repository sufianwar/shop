
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
    totalItems: { type: Number, default: 0 }, // Count of unique items
    totalQuantity: { type: Number, default: 0 }, // Total quantity across all items
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["Pending", "Partial", "Paid"], default: "Pending" },
    paymentMethod: { type: String, default: "cash" },
    notes: { type: String, default: "" },
    purchaseDate: { type: Date, default: Date.now },
    discount: { type: Number, default: 0 }, // Discount amount
    tax: { type: Number, default: 0 }, // Tax amount
    taxRate: { type: Number, default: 0 }, // Tax percentage
    discountRate: { type: Number, default: 0 }, // Discount percentage
    subtotal: { type: Number, default: 0 }, // Amount before discount and tax
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

purchaseSchema.index({ purchaseNo: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ purchaseDate: -1 });

export default mongoose.model("Purchase", purchaseSchema);
