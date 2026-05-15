
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Setting from "../models/Setting.js";
import { calculateProfit } from "../utils/calculateProfit.js";
import Ledger from "../models/Ledger.js";
import Customer from "../models/Customer.js";

const getNextInvoiceNo = async () => {
  const setting = await Setting.findOneAndUpdate(
    {},
    { $inc: { lastInvoiceNum: 1 } },
    { new: true, upsert: true }
  );
  const prefix = setting.invoicePrefix || "INV";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${date}-${setting.lastInvoiceNum}`;
};

export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    const sales = await Sale.find(query).sort("-createdAt").limit(parseInt(limit));
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate("customer cashier");
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createSale = async (req, res) => {
  try {
    const { items, discount = 0, tax = 0, paymentMethod = "cash",
      amountPaid, customer, customerName, notes } = req.body;

    let subtotal = 0;
    let totalProfit = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });
      if (product.stock < item.qty)
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      item.salePrice = item.salePrice || product.salePrice;
      item.purchasePrice = product.purchasePrice;
      item.subtotal = item.salePrice * item.qty;
      subtotal += item.subtotal;
      totalProfit += (item.salePrice - item.purchasePrice) * item.qty;

      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.qty, totalSold: item.qty },
      });
    }

    const total = subtotal - discount + tax;
    const change = (amountPaid >= total) ? amountPaid - total : 0;
    const actualPaid = amountPaid >= total ? total : amountPaid;
    const due = total - actualPaid;
    
    const invoiceNo = await getNextInvoiceNo();

    const sale = await Sale.create({
      invoiceNo, items, subtotal, discount, tax, total,
      profit: totalProfit - discount,
      paymentMethod: due > 0 ? "credit" : paymentMethod,
      amountPaid: actualPaid, change,
      customer, customerName: customerName || "Walk-in Customer",
      cashier: req.user._id,
      cashierName: req.user.name,
      notes,
    });

    if (due > 0 && customer) {
      const custDoc = await Customer.findById(customer);
      if (custDoc) {
        custDoc.balance += due;
        await custDoc.save();

        await Ledger.create({
          customer: custDoc._id,
          customerName: custDoc.name,
          type: "debit",
          amount: due,
          description: `Credit Sale - ${invoiceNo}`,
          referenceType: "sale",
          referenceId: sale._id,
          balance: custDoc.balance,
          addedBy: req.user._id,
        });
      }
    }

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSalesSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats, monthStats, totalStats] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: today }, status: "completed" } },
        { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }, status: "completed" } },
        { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      today: todayStats[0] || { revenue: 0, profit: 0, count: 0 },
      month: monthStats[0] || { revenue: 0, profit: 0, count: 0 },
      total: totalStats[0] || { revenue: 0, profit: 0, count: 0 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refundSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    if (sale.status === "refunded") return res.status(400).json({ message: "Already refunded" });
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
    }
    sale.status = "refunded";
    await sale.save();
    res.json({ message: "Sale refunded", sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
