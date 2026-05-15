import Ledger from "../models/Ledger.js";
import Customer from "../models/Customer.js";

export const getLedger = async (req, res) => {
  try {
    const { customerId } = req.params;
    const ledger = await Ledger.find({ customer: customerId }).sort("createdAt");
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
