
import { calculateProfit } from "../utils/calculateProfit.js";
import Sale from "../models/Sale.js";
import Expense from "../models/Expense.js";

export const getProfitSummary = async (from, to) => {
  const [salesData, expensesData] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: "completed" } },
      { $group: { _id: null, revenue: { $sum: "$total" }, grossProfit: { $sum: "$profit" } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  const revenue = salesData[0]?.revenue || 0;
  const grossProfit = salesData[0]?.grossProfit || 0;
  const expenses = expensesData[0]?.total || 0;
  const netProfit = grossProfit - expenses;
  return { revenue, grossProfit, expenses, netProfit };
};
