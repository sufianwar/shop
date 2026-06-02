
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import PurchasePayment from "../models/PurchasePayment.js";

const getPurchaseNo = () => `PO-${Date.now()}`;

export const getPurchases = async (req, res) => {
  try {
    const { supplier, status, startDate, endDate } = req.query;
    const query = { is_deleted: { $ne: true } };

    if (supplier) query.supplier = supplier;
    if (status) query.paymentStatus = status;
    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const purchases = await Purchase.find(query)
      .populate("supplier", "name")
      .populate("addedBy", "name username")
      .sort("-purchaseDate")
      .limit(100)
      .lean();

    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id)
      .populate("supplier", "name email phone address")
      .populate("addedBy", "name username")
      .lean();

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Get all payments for this purchase
    const payments = await PurchasePayment.find({
      purchase: id,
      is_deleted: { $ne: true },
    })
      .populate("addedBy", "name username")
      .sort("-paymentDate")
      .lean();

    res.json({ purchase, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createPurchase = async (req, res) => {
  try {
    const {
      items,
      supplier,
      supplierName,
      paymentMethod = "cash",
      notes,
      paidAmount,
      discount = 0,
      tax = 0,
      discountRate = 0,
      taxRate = 0,
    } = req.body;

    let subtotal = 0;
    let totalQuantity = 0;

    // Process items and update product stock
    for (const item of items) {
      item.subtotal = item.qty * item.purchasePrice;
      subtotal += item.subtotal;
      totalQuantity += item.qty;

      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty },
        $set: { purchasePrice: item.purchasePrice },
      });
    }

    // Calculate totals
    let discountAmount = discount;
    if (discountRate > 0) {
      discountAmount = (subtotal * discountRate) / 100;
    }

    let taxAmount = tax;
    if (taxRate > 0) {
      taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
    }

    const total = subtotal - discountAmount + taxAmount;
    const paid = paidAmount ?? total;

    // Determine payment status
    let paymentStatus = "Pending";
    if (paid > 0 && paid < total) paymentStatus = "Partial";
    if (paid >= total) paymentStatus = "Paid";

    const purchase = await Purchase.create({
      purchaseNo: getPurchaseNo(),
      items,
      supplier,
      supplierName,
      total,
      subtotal,
      discount: discountAmount,
      discountRate,
      tax: taxAmount,
      taxRate,
      totalItems: items.length,
      totalQuantity,
      paidAmount: paid,
      dueAmount: total - paid,
      paymentStatus,
      paymentMethod,
      notes,
      addedBy: req.user._id,
    });

    // If full payment made during purchase creation, create payment record
    if (paid > 0) {
      await PurchasePayment.create({
        purchase: purchase._id,
        purchaseNo: purchase.purchaseNo,
        supplier,
        supplierName,
        totalBillAmount: total,
        amountPaid: paid,
        paymentDate: new Date(),
        paymentMethod,
        notes: "Initial payment on purchase creation",
        addedBy: req.user._id,
      });
    }

    if (supplier) {
      await Supplier.findByIdAndUpdate(supplier, { $inc: { totalPurchased: total } });
    }

    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPurchaseStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { is_deleted: { $ne: true } };

    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const purchases = await Purchase.find(query).lean();

    const stats = {
      totalPurchaseOrders: purchases.length,
      totalPurchaseAmount: purchases.reduce((sum, p) => sum + p.total, 0),
      totalPaidAmount: purchases.reduce((sum, p) => sum + p.paidAmount, 0),
      totalOutstandingDue: purchases.reduce((sum, p) => sum + p.dueAmount, 0),
      totalPendingOrders: purchases.filter((p) => p.paymentStatus === "Pending").length,
      totalPartialOrders: purchases.filter((p) => p.paymentStatus === "Partial").length,
      totalPaidOrders: purchases.filter((p) => p.paymentStatus === "Paid").length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Soft delete
    await Purchase.findByIdAndUpdate(id, { is_deleted: true });

    // Also soft delete associated payments
    await PurchasePayment.updateMany(
      { purchase: id },
      { is_deleted: true }
    );

    // Revert stock updates
    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.qty },
      });
    }

    res.json({ message: "Purchase deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
