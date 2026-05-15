import Setting from "../models/Setting.js";

// Generate sequential 7-digit barcode
export const generateBarcode = async () => {
  const setting = await Setting.findOneAndUpdate(
    {},
    { $inc: { lastBarcodeNum: 1 } },
    { new: true, upsert: true }
  );
  return String(setting.lastBarcodeNum || 1000000);
};
