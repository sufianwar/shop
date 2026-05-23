
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
    const { startDate, endDate, limit = 50, invoiceNo } = req.query;
    let query = { is_deleted: { $ne: true } };

    if (invoiceNo) {
      // Partial search support with regex (case insensitive)
      query.invoiceNo = { $regex: invoiceNo, $options: "i" };
    }

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

      // Permission Check: Only Admin can change item rates
      const basePrice = product.salePrice;
      const providedPrice = item.salePrice || basePrice;
      
      if (providedPrice !== basePrice && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access Denied: Only Admin can override product prices" });
      }

      item.salePrice = providedPrice;
      item.originalPrice = basePrice;
      item.adjusted_price_flag = providedPrice !== basePrice;
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
    
    let payment_status = "Pending";
    if (actualPaid === total) payment_status = "Paid";
    else if (actualPaid > 0 && actualPaid < total) payment_status = "Partial";
    else if (actualPaid === 0) payment_status = "Pending";

    const invoiceNo = await getNextInvoiceNo();

    const sale = await Sale.create({
      invoiceNo, items, subtotal, discount, tax, total,
      total_amount: total,
      paid_amount: actualPaid,
      due_amount: due,
      payment_status,
      profit: totalProfit - discount,
      paymentMethod: due > 0 ? "credit" : paymentMethod,
      amountPaid: actualPaid, change,
      customer, customerName: customerName || "Walk-in Customer",
      cashier: req.user._id,
      cashierName: req.user.name,
      notes,
    });

    if (customer) {
      const custDoc = await Customer.findById(customer);
      if (custDoc) {
        // Update customer balance (Add debt, then subtract what they paid)
        custDoc.balance += due; 
        await custDoc.save();

        // Always create a Ledger entry for the SALE (Debit)
        await Ledger.create({
          customer: custDoc._id,
          customerName: custDoc.name,
          type: "debit",
          amount: total,
          description: `Sale - ${invoiceNo}`,
          referenceType: "sale",
          referenceId: sale._id,
          balance: custDoc.balance + actualPaid, // Balance before payment
          addedBy: req.user._id,
        });

        // If they paid anything at checkout, create a Ledger entry for the PAYMENT (Credit)
        if (actualPaid > 0) {
          await Ledger.create({
            customer: custDoc._id,
            customerName: custDoc.name,
            type: "credit",
            amount: actualPaid,
            description: `Checkout Payment - ${invoiceNo}`,
            referenceType: "payment",
            referenceId: sale._id,
            balance: custDoc.balance,
            addedBy: req.user._id,
          });
        }
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
        { $match: { createdAt: { $gte: today }, status: "completed", is_deleted: { $ne: true } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }, status: "completed", is_deleted: { $ne: true } } },
        { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { status: "completed", is_deleted: { $ne: true } } },
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

export const payDue = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const sale = await Sale.findById(id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    
    if (sale.due_amount <= 0) return res.status(400).json({ message: "No due amount left" });
    if (amount > sale.due_amount) return res.status(400).json({ message: "Amount exceeds due amount" });

    sale.paid_amount += Number(amount);
    sale.amountPaid += Number(amount);
    sale.due_amount -= Number(amount);
    
    if (sale.due_amount <= 0) {
      sale.due_amount = 0;
      sale.payment_status = "Paid";
      if (sale.paymentMethod === "credit") sale.paymentMethod = "cash";
    } else if (sale.paid_amount > 0 && sale.paid_amount < sale.total_amount) {
      sale.payment_status = "Partial";
    }

    if (sale.customer) {
      const custDoc = await Customer.findById(sale.customer);
      if (custDoc) {
        custDoc.balance -= Number(amount);
        await custDoc.save();

        await Ledger.create({
          customer: custDoc._id,
          customerName: custDoc.name,
          type: "credit",
          amount: Number(amount),
          description: `Due Payment - ${sale.invoiceNo}`,
          referenceType: "payment",
          referenceId: sale._id,
          balance: custDoc.balance,
          addedBy: req.user._id,
        });
      }
    }

    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Only admin can delete receipts" });

    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    if (sale.is_deleted) return res.status(400).json({ message: "Sale already deleted" });

    // Restore stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty, totalSold: -item.qty },
      });
    }

    // Reverse customer ledger and balance
    if (sale.customer) {
      const custDoc = await Customer.findById(sale.customer);
      if (custDoc) {
        // Subtract the total amount because the sale is being cancelled.
        // This naturally turns any payments made into a credit balance.
        custDoc.balance -= sale.total_amount;
        await custDoc.save();

        // Mark ALL ledger entries related to this sale as deleted (Sale records and Payments)
        await Ledger.updateMany({ referenceId: sale._id }, { is_deleted: true });

        await Ledger.create({
          customer: custDoc._id,
          customerName: custDoc.name,
          type: "credit",
          amount: sale.total_amount,
          description: `Receipt Deleted / Reversed - ${sale.invoiceNo}`,
          referenceType: "adjustment",
          referenceId: sale._id,
          balance: custDoc.balance,
          addedBy: req.user._id,
          is_deleted: true, // Hide this from user reports
        });
      }
    }

    sale.is_deleted = true;
    sale.deleted_by = req.user._id;
    sale.deleted_at = new Date();
    sale.delete_reason = req.body.reason || "No reason provided";
    
    await sale.save();
    res.json({ message: "Receipt deleted successfully", sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDeletedSales = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    const sales = await Sale.find({ is_deleted: true }).populate("deleted_by", "name").sort("-deleted_at");
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const restoreSale = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    if (!sale.is_deleted) return res.status(400).json({ message: "Sale is not deleted" });

    // Re-deduct stock
    for (const item of sale.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty, totalSold: item.qty },
        });
      }
    }

    // Re-add to customer ledger and balance
    if (sale.due_amount > 0 && sale.customer) {
      const custDoc = await Customer.findById(sale.customer);
      if (custDoc) {
        custDoc.balance += sale.due_amount;
        await custDoc.save();

        // Restore original ledger entry
        await Ledger.updateMany({ referenceId: sale._id, referenceType: "sale" }, { is_deleted: false });

        await Ledger.create({
          customer: custDoc._id,
          customerName: custDoc.name,
          type: "debit",
          amount: sale.due_amount,
          description: `Receipt Restored - ${sale.invoiceNo}`,
          referenceType: "adjustment",
          referenceId: sale._id,
          balance: custDoc.balance,
          addedBy: req.user._id,
          is_deleted: true, // Hide the restoration adjustment too
        });
      }
    }

    sale.is_deleted = false;
    sale.deleted_by = null;
    sale.deleted_at = null;
    sale.delete_reason = null;

    await sale.save();
    res.json({ message: "Receipt restored successfully", sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
