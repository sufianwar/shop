import Sale from "../models/Sale.js";

/**
 * FIFO Invoice Settlement Service
 * Automatically distributes customer payments to unpaid invoices (oldest first)
 */

/**
 * Apply payment to customer's unpaid invoices using FIFO method
 * @param {string} customerId - The customer ID
 * @param {number} paymentAmount - Amount being paid
 * @param {string} userId - User ID making the payment
 * @returns {object} Settlement result with affected invoices
 */
export const applyFIFOSettlement = async (customerId, paymentAmount, userId) => {
  if (!customerId || paymentAmount <= 0) {
    throw new Error("Invalid customer ID or payment amount");
  }

  let remainingPayment = paymentAmount;
  const affectedInvoices = [];

  // Get all unpaid/partial invoices for this customer, sorted by date (oldest first)
  const unpaidInvoices = await Sale.find({
    customer: customerId,
    paymentStatus: { $in: ["Unpaid", "Partial"] },
    is_deleted: { $ne: true },
    status: { $ne: "refunded" },
  }).sort({ createdAt: 1 });

  // Apply payment to each invoice sequentially (FIFO)
  for (const invoice of unpaidInvoices) {
    if (remainingPayment <= 0) break;

    const invoiceRemaining = invoice.remainingAmount || 0;
    const amountToApply = Math.min(remainingPayment, invoiceRemaining);

    if (amountToApply > 0) {
      // Update invoice payment fields
      invoice.paidAmount = (invoice.paidAmount || 0) + amountToApply;
      invoice.remainingAmount = Math.max(0, invoiceRemaining - amountToApply);

      // Auto-update payment status
      if (invoice.remainingAmount === 0) {
        invoice.paymentStatus = "Paid";
      } else if (invoice.paidAmount > 0) {
        invoice.paymentStatus = "Partial";
      }

      // Keep legacy fields in sync
      invoice.paid_amount = invoice.paidAmount;
      invoice.due_amount = invoice.remainingAmount;

      await invoice.save();

      affectedInvoices.push({
        invoiceNo: invoice.invoiceNo,
        invoiceId: invoice._id,
        amountApplied: amountToApply,
        newStatus: invoice.paymentStatus,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.remainingAmount,
      });

      remainingPayment -= amountToApply;
    }
  }

  return {
    customerId,
    totalPaymentApplied: paymentAmount - remainingPayment,
    remainingPayment,
    affectedInvoices,
  };
};

/**
 * Get customer's unpaid invoices in FIFO order
 * @param {string} customerId - Customer ID
 * @returns {object} List of unpaid invoices
 */
export const getCustomerUnpaidInvoices = async (customerId) => {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const unpaidInvoices = await Sale.find({
    customer: customerId,
    paymentStatus: { $in: ["Unpaid", "Partial"] },
    is_deleted: { $ne: true },
    status: { $ne: "refunded" },
  })
    .sort({ createdAt: 1 })
    .lean();

  const totalDue = unpaidInvoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

  return {
    customerId,
    totalDue,
    invoiceCount: unpaidInvoices.length,
    invoices: unpaidInvoices.map((inv) => ({
      invoiceNo: inv.invoiceNo,
      invoiceId: inv._id,
      total: inv.total_amount || inv.total || 0,
      paidAmount: inv.paidAmount || 0,
      remainingAmount: inv.remainingAmount || 0,
      status: inv.paymentStatus || "Unpaid",
      createdAt: inv.createdAt,
    })),
  };
};

/**
 * Calculate customer's total outstanding balance
 * @param {string} customerId - Customer ID
 * @returns {number} Total outstanding amount
 */
export const getCustomerOutstandingBalance = async (customerId) => {
  if (!customerId) {
    return 0;
  }

  const result = await Sale.aggregate([
    {
      $match: {
        customer: { $oid: customerId },
        paymentStatus: { $in: ["Unpaid", "Partial"] },
        is_deleted: { $ne: true },
        status: { $ne: "refunded" },
      },
    },
    {
      $group: {
        _id: null,
        totalDue: { $sum: "$remainingAmount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalDue : 0;
};

/**
 * Get detailed customer balance summary
 * @param {string} customerId - Customer ID
 * @returns {object} Balance breakdown
 */
export const getCustomerBalanceSummary = async (customerId) => {
  if (!customerId) {
    return null;
  }

  const invoices = await Sale.find({
    customer: customerId,
    is_deleted: { $ne: true },
    status: { $ne: "refunded" },
  })
    .sort({ createdAt: 1 })
    .lean();

  const breakdown = {
    totalInvoices: invoices.length,
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    invoices: [],
  };

  invoices.forEach((inv) => {
    const status = inv.paymentStatus || "Unpaid";
    const total = inv.total_amount || inv.total || 0;
    const paid = inv.paidAmount || 0;
    const remaining = inv.remainingAmount || 0;

    breakdown.totalAmount += total;
    breakdown.totalPaid += paid;
    breakdown.totalDue += remaining;

    if (status === "Paid") breakdown.paidCount++;
    else if (status === "Partial") breakdown.partialCount++;
    else breakdown.unpaidCount++;

    breakdown.invoices.push({
      invoiceNo: inv.invoiceNo,
      invoiceId: inv._id,
      total,
      paidAmount: paid,
      remainingAmount: remaining,
      status,
      createdAt: inv.createdAt,
    });
  });

  return breakdown;
};
