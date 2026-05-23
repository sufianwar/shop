import Ledger from "../models/Ledger.js";
import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import mongoose from "mongoose";

export const getLedger = async (req, res) => {
  try {
    const { customerId, supplierId, startDate, endDate } = req.query;
    let query = {};
    if (customerId) query.customer = customerId;
    if (supplierId) query.supplier = supplierId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    const ledger = await Ledger.find({ ...query, is_deleted: { $ne: true } }).sort("-createdAt");
    res.json(ledger);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addLedgerEntry = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { type, amount, description, paymentMethod } = req.body; // type: credit (payment) or debit (charge)
    
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // debit adds to balance (they owe more), credit subtracts from balance (they paid)
    const newBalance = type === "debit" ? customer.balance + Number(amount) : customer.balance - Number(amount);
    
    const entry = await Ledger.create({
      customer: customerId,
      customerName: customer.name,
      type,
      amount: Number(amount),
      description: description || (type === "credit" ? `Payment Received - ${paymentMethod}` : "Manual Charge"),
      referenceType: type === "credit" ? "payment" : "adjustment",
      balance: newBalance,
      addedBy: req.user._id,
    });

    customer.balance = newBalance;
    await customer.save();

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerBalance = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ balance: customer.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMonthlyStatement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { month } = req.query; // format: "YYYY-MM"
    
    if (!month) return res.status(400).json({ message: "Month is required (YYYY-MM)" });

    const [year, m] = month.split("-").map(Number);
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 0, 23, 59, 59, 999);

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Opening Balance (Last non-deleted ledger entry before startDate)
    let openingBalance = 0;
    const prevEntry = await Ledger.findOne({ 
      customer: customerId, 
      createdAt: { $lt: startDate },
      is_deleted: { $ne: true }
    }).sort("-createdAt");

    if (prevEntry) {
      openingBalance = prevEntry.balance;
    } else {
      // If no entry before this month, check the first entry of this month to see the starting point
      const firstEntryThisMonth = await Ledger.findOne({ 
        customer: customerId, 
        createdAt: { $gte: startDate },
        is_deleted: { $ne: true }
      }).sort("createdAt");

      if (firstEntryThisMonth) {
        // Reverse engineer the balance before the first entry
        openingBalance = firstEntryThisMonth.type === "debit" 
          ? firstEntryThisMonth.balance - firstEntryThisMonth.amount 
          : firstEntryThisMonth.balance + firstEntryThisMonth.amount;
      }
    }

    // Sales in this month
    const sales = await Sale.find({ customer: customerId, createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: "refunded" }, is_deleted: { $ne: true } }).sort("createdAt");
    
    // Payments (Credits) in this month directly from Ledger
    const payments = await Ledger.find({ customer: customerId, type: "credit", createdAt: { $gte: startDate, $lte: endDate }, is_deleted: { $ne: true } }).sort("createdAt");

    // Calculate totals for the month
    const totalPurchases = sales.reduce((sum, s) => sum + s.total, 0);
    
    // All payments (checkout + separate) are now in the Ledger as credits
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    // Closing Balance (Calculated based on opening and this month's transactions)
    const closingBalance = openingBalance + totalPurchases - totalPaid;

    // Group items for the monthly statement
    const groupedItems = await Sale.aggregate([
      { $match: { 
          customer: new mongoose.Types.ObjectId(customerId), 
          createdAt: { $gte: startDate, $lte: endDate }, 
          status: { $ne: "refunded" }, 
          is_deleted: { $ne: true } 
      }},
      { $unwind: "$items" },
      { $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalQty: { $sum: "$items.qty" },
          latestPrice: { $last: "$items.salePrice" },
          totalAmount: { $sum: { $multiply: ["$items.qty", "$items.salePrice"] } },
          is_adjusted: { $max: "$items.adjusted_price_flag" }
      }},
      { $sort: { name: 1 } }
    ]);

    res.json({
      customer,
      month,
      startDate,
      endDate,
      openingBalance,
      closingBalance,
      totalPurchases,
      totalPaid,
      sales,
      payments,
      groupedItems
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
