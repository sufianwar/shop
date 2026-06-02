import mongoose from "mongoose";

const purchasePaymentSchema = new mongoose.Schema(
  {
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
    purchaseNo: { type: String, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String, required: true },
    totalBillAmount: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "cheque", "online", "credit", "other"],
      default: "cash",
    },
    notes: { type: String, default: "" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

purchasePaymentSchema.index({ purchase: 1, paymentDate: -1 });
purchasePaymentSchema.index({ purchaseNo: 1 });
purchasePaymentSchema.index({ supplier: 1 });

export default mongoose.model("PurchasePayment", purchasePaymentSchema);
