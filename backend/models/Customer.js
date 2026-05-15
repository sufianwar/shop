
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
