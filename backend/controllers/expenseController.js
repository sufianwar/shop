
import Expense from "../models/Expense.js";

export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    const expenses = await Expense.find(query).sort("-date");
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ expenses, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
