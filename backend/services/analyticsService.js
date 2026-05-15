
// Analytics service
import Sale from "../models/Sale.js";
import Expense from "../models/Expense.js";

export const getRevenueByPeriod = async (from, to) => {
  return Sale.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, status: "completed" } },
    { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } },
  ]);
};

export const getExpensesByPeriod = async (from, to) => {
  return Expense.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
};
