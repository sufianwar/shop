
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, weekSales, monthSales, totalProducts, allProducts, totalCustomers, recentSales, topProducts, monthExpenses] = await Promise.all([
      Sale.aggregate([{ $match: { createdAt: { $gte: today }, status: "completed", is_deleted: { $ne: true } } }, { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } }]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: weekAgo }, status: "completed", is_deleted: { $ne: true } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Sale.aggregate([{ $match: { createdAt: { $gte: monthStart }, status: "completed", is_deleted: { $ne: true } } }, { $group: { _id: null, revenue: { $sum: "$total" }, profit: { $sum: "$profit" }, count: { $sum: 1 } } }]),
      Product.countDocuments({ isActive: true }),
      Product.find({ isActive: true }, { stock: 1, minStock: 1 }),
      Customer.countDocuments(),
      Sale.find({ status: { $ne: "refunded" }, is_deleted: { $ne: true } }).sort("-createdAt").limit(8).select("invoiceNo customerName total createdAt paymentMethod status payment_status total_amount paid_amount due_amount"),
      Sale.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: "completed", is_deleted: { $ne: true } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.name", totalQty: { $sum: "$items.qty" }, totalRev: { $sum: "$items.subtotal" } } },
        { $sort: { totalRev: -1 } },
        { $limit: 5 },
      ]),
      Expense.aggregate([{ $match: { date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);

    const lowStockProducts = allProducts.filter(p => p.stock <= (p.minStock || 5)).length;

    res.json({
      today: todaySales[0] || { revenue: 0, profit: 0, count: 0 },
      month: monthSales[0] || { revenue: 0, profit: 0, count: 0 },
      weekChart: weekSales,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      recentSales,
      topProducts,
      monthExpenses: monthExpenses[0]?.total || 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
