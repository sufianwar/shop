
import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: "MARHABA PHOTOSTATE & COMPUTER" },
    shopTagline: { type: String, default: "Stationery • Printing • POS" },
    phone1: { type: String, default: "0333-6297546" },
    phone2: { type: String, default: "0334-7791579" },
    address: { type: String, default: "Main Bazar, Lahore" },
    currency: { type: String, default: "Rs" },
    taxRate: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    receiptFooter: { type: String, default: "THANK YOU 😊\nVisit Again!" },
    logo: { type: String, default: "" },
    theme: { type: String, default: "dark" },
    invoicePrefix: { type: String, default: "INV" },
    lastInvoiceNum: { type: Number, default: 1000 },
    lastBarcodeNum: { type: Number, default: 1000000 },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
