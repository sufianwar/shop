
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Expense from "../models/Expense.js";
import Purchase from "../models/Purchase.js";

export const getSalesAnalytics = async (req, res) => {
  try {
    const { period = "30", startDate, endDate } = req.query;
    let from, to;
    if (startDate && endDate) {
      from = new Date(startDate);
      to = new Date(endDate);
      to.setHours(23, 59, 59, 999);
    } else {
      const days = parseInt(period);
      from = new Date();
      from.setDate(from.getDate() - days);
      from.setHours(0, 0, 0, 0);
      to = new Date();
    }
    const matchQuery = { createdAt: { $gte: from, $lte: to }, status: "completed" };

    // Daily sales for chart
    const dailySales = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          profit: { $sum: "$profit" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top products
    const topProducts = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalQty: { $sum: "$items.qty" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    // Payment methods breakdown
    const paymentMethods = await Sale.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$total" } } },
    ]);

    // Total Expenses
    const expenses = await Expense.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = expenses[0]?.total || 0;

    res.json({ dailySales, topProducts, paymentMethods, totalExpenses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(new Date(endDate).setHours(23, 59, 59));

    const [sales, expenses, purchases] = await Promise.all([
      Sale.aggregate([
        { $match: { ...(Object.keys(dateQuery).length ? { createdAt: dateQuery } : {}), status: "completed" } },
        { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" } } },
      ]),
      Expense.aggregate([
        { $match: Object.keys(dateQuery).length ? { date: dateQuery } : {} },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Purchase.aggregate([
        { $match: Object.keys(dateQuery).length ? { createdAt: dateQuery } : {} },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const revenue = sales[0]?.revenue || 0;
    const grossProfit = sales[0]?.profit || 0;
    const totalExpenses = expenses[0]?.total || 0;
    const netProfit = grossProfit - totalExpenses;

    res.json({ revenue, grossProfit, totalExpenses, netProfit, purchaseCost: purchases[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
