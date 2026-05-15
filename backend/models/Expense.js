
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "General" },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "cash" },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
