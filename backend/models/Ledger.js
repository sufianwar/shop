
import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, default: "" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    entityName: { type: String, default: "" },
    type: { type: String, enum: ["debit", "credit"], required: true },
    // debit = customer owes money (sale on credit)
    // credit = customer paid money (payment received)
    amount: { type: Number, required: true },
    description: { type: String, default: "" },
    reference: { type: String, default: "" }, // invoice no or payment ref
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceType: { type: String, enum: ["sale", "payment", "return", "adjustment"], default: "sale" },
    balance: { type: Number, default: 0 }, // running balance after this entry
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Ledger", ledgerSchema);
