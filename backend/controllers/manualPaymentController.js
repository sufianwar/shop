import ManualPayment from "../models/ManualPayment.js";
import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import Ledger from "../models/Ledger.js";

const PAYMENT_METHODS = ["cash", "card", "online", "credit", "other"];

function computeStatus(totalBill, totalReceived) {
  if (totalReceived <= 0) return "Pending";
  if (totalReceived >= totalBill) return "Paid";
  return "Partial";
}

function normalizePaymentStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "completed") return "Paid";
  if (s === "partial") return "Partial";
  return "Pending";
}

async function createLedgerCredit(customer, amount, description, reference, referenceId, userId) {
  customer.balance -= amount;
  await customer.save();

  const entry = await Ledger.create({
    customer: customer._id,
    customerName: customer.name,
    type: "credit",
    amount,
    description,
    reference,
    referenceId,
    referenceType: "payment",
    balance: customer.balance,
    addedBy: userId,
  });

  return entry;
}

async function reverseLedgerCredit(ledgerEntryId, customer, amount) {
  if (ledgerEntryId) {
    await Ledger.findByIdAndUpdate(ledgerEntryId, { is_deleted: true });
  }
  customer.balance += amount;
  await customer.save();
}

export const getManualPayments = async (req, res) => {
  try {
    const { customerId, customerName, invoiceNo, status, startDate, endDate } = req.query;
    const query = { is_deleted: { $ne: true } };

    if (customerId) query.customer = customerId;
    if (customerName) query.customerName = { $regex: customerName, $options: "i" };
    if (invoiceNo) query.invoiceNo = { $regex: invoiceNo, $options: "i" };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const payments = await ManualPayment.find(query)
      .populate("addedBy", "name username")
      .sort("-paymentDate")
      .lean();

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const lookupInvoice = async (req, res) => {
  try {
    const { customerId, invoiceNo } = req.query;
    if (!customerId || !invoiceNo) {
      return res.status(400).json({ message: "Customer and invoice number are required" });
    }

    const sale = await Sale.findOne({
      invoiceNo: String(invoiceNo).trim(),
      customer: customerId,
      is_deleted: { $ne: true },
      status: { $ne: "refunded" },
    });

    if (!sale) {
      return res.json({ found: false });
    }

    const payments = await ManualPayment.find({
      sale: sale._id,
      is_deleted: { $ne: true },
    })
      .sort("-paymentDate")
      .lean();

    const totalBill = sale.total_amount || sale.total || 0;

    res.json({
      found: true,
      sale: {
        _id: sale._id,
        invoiceNo: sale.invoiceNo,
        customerName: sale.customerName,
        totalBillAmount: totalBill,
        paidAmount: sale.paid_amount || 0,
        dueAmount: sale.due_amount ?? Math.max(0, totalBill - (sale.paid_amount || 0)),
        paymentStatus: normalizePaymentStatus(sale.payment_status),
      },
      payments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createManualPayment = async (req, res) => {
  try {
    const {
      customerId,
      saleId,
      invoiceNo,
      totalBillAmount,
      receivedAmount,
      paymentDate,
      paymentMethod,
      notes,
    } = req.body;

    if (!customerId) return res.status(400).json({ message: "Customer is required" });
    if (!receivedAmount || Number(receivedAmount) <= 0) {
      return res.status(400).json({ message: "Received amount must be greater than 0" });
    }
    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    let sale = null;
    if (saleId) {
      sale = await Sale.findById(saleId);
    } else if (invoiceNo) {
      sale = await Sale.findOne({
        invoiceNo: String(invoiceNo).trim(),
        customer: customerId,
        is_deleted: { $ne: true },
      });
    }

    const received = Number(receivedAmount);
    const totalBill = sale
      ? sale.total_amount || sale.total
      : Number(totalBillAmount);

    if (!totalBill || totalBill <= 0) {
      return res.status(400).json({ message: "Total bill amount is required" });
    }

    const alreadyPaid = sale ? sale.paid_amount || 0 : 0;
    const dueBefore = sale ? sale.due_amount ?? Math.max(0, totalBill - alreadyPaid) : totalBill;

    if (sale && received > dueBefore) {
      return res.status(400).json({
        message: `Received amount cannot exceed remaining due (${dueBefore})`,
      });
    }

    const newPaid = alreadyPaid + received;
    const remaining = Math.max(0, totalBill - newPaid);
    const status = computeStatus(totalBill, newPaid);

    const payment = await ManualPayment.create({
      customer: customerId,
      customerName: customer.name,
      sale: sale?._id,
      invoiceNo: sale?.invoiceNo || String(invoiceNo || "").trim(),
      totalBillAmount: totalBill,
      receivedAmount: received,
      remainingBalance: remaining,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || "cash",
      status,
      notes: notes || "",
      addedBy: req.user._id,
    });

    const ledgerEntry = await createLedgerCredit(
      customer,
      received,
      `Manual Payment - ${payment.invoiceNo || "General"} (${payment.paymentMethod})`,
      payment.invoiceNo,
      sale?._id,
      req.user._id
    );

    payment.ledgerEntry = ledgerEntry._id;
    await payment.save();

    if (sale) {
      sale.paid_amount = newPaid;
      sale.amountPaid = newPaid;
      sale.due_amount = remaining;
      sale.payment_status = status;
      await sale.save();
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateManualPayment = async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only admin or manager can edit payments" });
  }

  try {
    const payment = await ManualPayment.findById(req.params.id);
    if (!payment || payment.is_deleted) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const oldReceived = payment.receivedAmount;
    const {
      receivedAmount,
      paymentDate,
      paymentMethod,
      notes,
      totalBillAmount,
    } = req.body;

    const received = receivedAmount !== undefined ? Number(receivedAmount) : payment.receivedAmount;
    if (received <= 0) return res.status(400).json({ message: "Received amount must be greater than 0" });

    const customer = await Customer.findById(payment.customer);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    await reverseLedgerCredit(payment.ledgerEntry, customer, oldReceived);

    let sale = null;
    if (payment.sale) {
      sale = await Sale.findById(payment.sale);
      if (sale) {
        sale.paid_amount = Math.max(0, (sale.paid_amount || 0) - oldReceived);
        sale.amountPaid = sale.paid_amount;
        sale.due_amount = Math.max(0, (sale.total_amount || sale.total) - sale.paid_amount);
        sale.payment_status = computeStatus(sale.total_amount || sale.total, sale.paid_amount);
        await sale.save();
      }
    }

    const totalBill = sale
      ? sale.total_amount || sale.total
      : totalBillAmount !== undefined
        ? Number(totalBillAmount)
        : payment.totalBillAmount;

    const alreadyPaid = sale ? sale.paid_amount || 0 : 0;
    const dueBefore = sale ? sale.due_amount ?? Math.max(0, totalBill - alreadyPaid) : totalBill;

    if (sale && received > dueBefore) {
      return res.status(400).json({ message: `Received amount cannot exceed remaining due (${dueBefore})` });
    }

    const newPaid = alreadyPaid + received;
    const remaining = Math.max(0, totalBill - newPaid);
    const status = computeStatus(totalBill, newPaid);

    payment.receivedAmount = received;
    payment.totalBillAmount = totalBill;
    payment.remainingBalance = remaining;
    payment.status = status;
    if (paymentDate) payment.paymentDate = new Date(paymentDate);
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (notes !== undefined) payment.notes = notes;
    payment.updatedBy = req.user._id;

    const ledgerEntry = await createLedgerCredit(
      customer,
      received,
      `Manual Payment (Updated) - ${payment.invoiceNo || "General"} (${payment.paymentMethod})`,
      payment.invoiceNo,
      sale?._id,
      req.user._id
    );
    payment.ledgerEntry = ledgerEntry._id;

    if (sale) {
      sale.paid_amount = newPaid;
      sale.amountPaid = newPaid;
      sale.due_amount = remaining;
      sale.payment_status = status;
      await sale.save();
    }

    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteManualPayment = async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only admin or manager can delete payments" });
  }

  try {
    const payment = await ManualPayment.findById(req.params.id);
    if (!payment || payment.is_deleted) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const customer = await Customer.findById(payment.customer);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    await reverseLedgerCredit(payment.ledgerEntry, customer, payment.receivedAmount);

    if (payment.sale) {
      const sale = await Sale.findById(payment.sale);
      if (sale) {
        sale.paid_amount = Math.max(0, (sale.paid_amount || 0) - payment.receivedAmount);
        sale.amountPaid = sale.paid_amount;
        const totalBill = sale.total_amount || sale.total;
        sale.due_amount = Math.max(0, totalBill - sale.paid_amount);
        sale.payment_status = computeStatus(totalBill, sale.paid_amount);
        await sale.save();
      }
    }

    payment.is_deleted = true;
    payment.updatedBy = req.user._id;
    await payment.save();

    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markInvoicePaid = async (req, res) => {
  try {
    const { saleId, customerId, paymentMethod, paymentDate } = req.body;
    if (!saleId) return res.status(400).json({ message: "Invoice is required" });

    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const due = sale.due_amount || 0;
    if (due <= 0) {
      return res.status(400).json({ message: "Invoice is already fully paid" });
    }

    req.body = {
      customerId: customerId || sale.customer,
      saleId: sale._id,
      invoiceNo: sale.invoiceNo,
      receivedAmount: due,
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      paymentMethod: paymentMethod || "cash",
      notes: "Marked as paid",
    };

    return createManualPayment(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerPendingInvoices = async (req, res) => {
  try {
    const { customerId } = req.params;
    const sales = await Sale.find({
      customer: customerId,
      is_deleted: { $ne: true },
      status: { $ne: "refunded" },
      due_amount: { $gt: 0 },
    })
      .select("invoiceNo total_amount total paid_amount due_amount payment_status customerName createdAt")
      .sort("-createdAt")
      .lean();

    res.json(
      sales.map((s) => ({
        _id: s._id,
        invoiceNo: s.invoiceNo,
        customerName: s.customerName,
        totalBillAmount: s.total_amount || s.total,
        paidAmount: s.paid_amount || 0,
        dueAmount: s.due_amount || 0,
        paymentStatus: normalizePaymentStatus(s.payment_status),
        createdAt: s.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
