
import { generateReceiptText } from "../utils/generateInvoice.js";
import Setting from "../models/Setting.js";

export const buildInvoiceData = async (sale) => {
  const setting = await Setting.findOne({});
  return {
    shop: {
      name: setting?.shopName || "MARHABA PHOTOSTATE & COMPUTER",
      tagline: setting?.shopTagline || "Stationery • Printing • POS",
      phone1: setting?.phone1 || "0333-6297546",
      phone2: setting?.phone2 || "0334-7791579",
      address: setting?.address || "",
      currency: setting?.currency || "Rs",
    },
    sale,
    receiptText: await generateReceiptText(sale),
  };
};
