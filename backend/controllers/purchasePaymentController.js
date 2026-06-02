import PurchasePayment from "../models/PurchasePayment.js";
import Purchase from "../models/Purchase.js";
import Supplier from "../models/Supplier.js";

export const getPurchasePayments = async (req, res) => {
  try {
    const { purchaseId, purchaseNo, supplier, startDate, endDate } = req.query;
    const query = { is_deleted: { $ne: true } };

    if (purchaseId) query.purchase = purchaseId;
    if (purchaseNo) query.purchaseNo = { $regex: purchaseNo, $options: "i" };
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const payments = await PurchasePayment.find(query)
      .populate("addedBy", "name username")
      .sort("-paymentDate")
      .lean();

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPurchasePaymentsByPO = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const payments = await PurchasePayment.find({
      purchase: purchaseId,
      is_deleted: { $ne: true },
    })
      .populate("addedBy", "name username")
      .sort("-paymentDate")
      .lean();

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { id: purchaseId } = req.params;
    const { amountPaid, paymentDate, paymentMethod = "cash", notes } = req.body;

    if (!purchaseId) return res.status(400).json({ message: "Purchase ID is required" });
    if (!amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ message: "Amount paid must be greater than 0" });
    }

    const purchase = await Purchase.findById(purchaseId).populate("supplier", "name");
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    // Get supplier name - use purchase.supplierName, or fallback to supplier.name or default
    const supplierName = purchase.supplierName || (purchase.supplier?.name) || "Direct Purchase";

    // Create payment record
    const payment = await PurchasePayment.create({
      purchase: purchaseId,
      purchaseNo: purchase.purchaseNo,
      supplier: purchase.supplier,
      supplierName: supplierName,
      totalBillAmount: purchase.total,
      amountPaid: Number(amountPaid),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      notes: notes || "",
      addedBy: req.user._id,
    });

    // Update purchase with new payment info
    const totalPaidAmount = (purchase.paidAmount || 0) + Number(amountPaid);
    const remainingDue = Math.max(0, purchase.total - totalPaidAmount);
    let paymentStatus = "Pending";
    if (totalPaidAmount > 0 && totalPaidAmount < purchase.total) paymentStatus = "Partial";
    if (totalPaidAmount >= purchase.total) paymentStatus = "Paid";

    await Purchase.findByIdAndUpdate(purchaseId, {
      paidAmount: totalPaidAmount,
      dueAmount: remainingDue,
      paymentStatus,
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amountPaid, paymentDate, paymentMethod, notes } = req.body;

    const payment = await PurchasePayment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const oldAmount = payment.amountPaid;
    const purchase = await Purchase.findById(payment.purchase);

    // Calculate difference in payment amount
    const amountDifference = Number(amountPaid) - oldAmount;
    const totalPaidAmount = Math.max(0, (purchase.paidAmount || 0) + amountDifference);
    const remainingDue = Math.max(0, purchase.total - totalPaidAmount);

    let paymentStatus = "Pending";
    if (totalPaidAmount > 0 && totalPaidAmount < purchase.total) paymentStatus = "Partial";
    if (totalPaidAmount >= purchase.total) paymentStatus = "Paid";

    // Update payment record
    const updatedPayment = await PurchasePayment.findByIdAndUpdate(
      paymentId,
      {
        amountPaid: Number(amountPaid),
        paymentDate: paymentDate ? new Date(paymentDate) : payment.paymentDate,
        paymentMethod: paymentMethod || payment.paymentMethod,
        notes: notes !== undefined ? notes : payment.notes,
      },
      { new: true }
    );

    // Update purchase
    await Purchase.findByIdAndUpdate(payment.purchase, {
      paidAmount: totalPaidAmount,
      dueAmount: remainingDue,
      paymentStatus,
    });

    res.json(updatedPayment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await PurchasePayment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const purchase = await Purchase.findById(payment.purchase);

    // Recalculate purchase totals
    const totalPaidAmount = Math.max(0, (purchase.paidAmount || 0) - payment.amountPaid);
    const remainingDue = Math.max(0, purchase.total - totalPaidAmount);

    let paymentStatus = "Pending";
    if (totalPaidAmount > 0 && totalPaidAmount < purchase.total) paymentStatus = "Partial";
    if (totalPaidAmount >= purchase.total) paymentStatus = "Paid";

    // Soft delete payment
    await PurchasePayment.findByIdAndUpdate(paymentId, { is_deleted: true });

    // Update purchase
    await Purchase.findByIdAndUpdate(payment.purchase, {
      paidAmount: totalPaidAmount,
      dueAmount: remainingDue,
      paymentStatus,
    });

    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
