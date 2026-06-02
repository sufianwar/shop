import mongoose from "mongoose";

const manualPaymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String, required: true },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
    invoiceNo: { type: String, default: "" },
    totalBillAmount: { type: Number, required: true },
    receivedAmount: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    // For payments that are applied across multiple invoices (FIFO),
    // store details of affected invoices for auditing and reversal.
    appliedInvoices: [
      {
        sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
        invoiceNo: { type: String },
        amountApplied: { type: Number },
      },
    ],
    paymentDate: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "credit", "other"],
      default: "cash",
    },
    status: { type: String, enum: ["Paid", "Partial", "Pending"], default: "Pending" },
    notes: { type: String, default: "" },
    ledgerEntry: { type: mongoose.Schema.Types.ObjectId, ref: "Ledger" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

manualPaymentSchema.index({ customer: 1, paymentDate: -1 });
manualPaymentSchema.index({ invoiceNo: 1 });
manualPaymentSchema.index({ status: 1 });

export default mongoose.model("ManualPayment", manualPaymentSchema);
