import Return from "../models/Return.js";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Ledger from "../models/Ledger.js";
import Customer from "../models/Customer.js";

export const processReturn = async (req, res) => {
  try {
    const { saleId, returnItems, reason, refundMethod } = req.body; // returnItems: [{ productId, qty }]

    const sale = await Sale.findById(saleId).populate("customer");
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    let totalRefund = 0;
    const itemsToReturn = [];

    for (const rItem of returnItems) {
      const saleItem = sale.items.find((i) => i.productId.toString() === rItem.productId);
      if (!saleItem || saleItem.qty < rItem.qty) {
        return res.status(400).json({ message: `Invalid return quantity for ${rItem.name}` });
      }

      const subtotal = saleItem.salePrice * rItem.qty;
      totalRefund += subtotal;

      itemsToReturn.push({
        productId: saleItem.productId,
        name: saleItem.name,
        qty: rItem.qty,
        salePrice: saleItem.salePrice,
        subtotal,
      });

      // Restore stock
      await Product.findByIdAndUpdate(saleItem.productId, {
        $inc: { stock: rItem.qty, totalSold: -rItem.qty },
      });

      // Update sale item qty
      saleItem.qty -= rItem.qty;
      saleItem.subtotal = saleItem.qty * saleItem.salePrice;
    }

    // Update sale total and status
    sale.total -= totalRefund;
    sale.subtotal -= totalRefund;
    if (sale.items.every(i => i.qty === 0)) {
      sale.status = "refunded";
    }
    await sale.save();

    const returnDoc = await Return.create({
      returnNo: `RET-${Date.now()}`,
      originalSale: sale._id,
      originalInvoice: sale.invoiceNo,
      items: itemsToReturn,
      totalRefund,
      reason,
      refundMethod,
      customer: sale.customer,
      customerName: sale.customerName,
      processedBy: req.user._id,
      processedByName: req.user.name,
    });

    // If refund is added to customer balance (store credit)
    if (refundMethod === "credit" && sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.balance -= totalRefund; // balance goes down (they owe less or have store credit)
        await customer.save();

        await Ledger.create({
          customer: customer._id,
          customerName: customer.name,
          type: "credit",
          amount: totalRefund,
          description: `Refund for Return ${returnDoc.returnNo}`,
          referenceType: "return",
          referenceId: returnDoc._id,
          balance: customer.balance,
          addedBy: req.user._id,
        });
      }
    }

    res.status(201).json(returnDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getReturns = async (req, res) => {
  try {
    const returns = await Return.find().sort("-createdAt").populate("originalSale");
    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
