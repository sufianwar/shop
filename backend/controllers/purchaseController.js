
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";

const getPurchaseNo = () => `PO-${Date.now()}`;

export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort("-createdAt").limit(100);
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPurchase = async (req, res) => {
  try {
    const { items, supplier, supplierName, paymentMethod = "cash", notes, paidAmount } = req.body;

    let total = 0;
    for (const item of items) {
      item.subtotal = item.qty * item.purchasePrice;
      total += item.subtotal;
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty },
        $set: { purchasePrice: item.purchasePrice },
      });
    }

    const paid = paidAmount ?? total;
    const purchase = await Purchase.create({
      purchaseNo: getPurchaseNo(),
      items, supplier, supplierName, total,
      paidAmount: paid, dueAmount: total - paid,
      paymentStatus: paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid",
      paymentMethod, notes, addedBy: req.user._id,
    });

    if (supplier) {
      await Supplier.findByIdAndUpdate(supplier, { $inc: { totalPurchased: total } });
    }

    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
