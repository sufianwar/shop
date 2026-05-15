
import Setting from "../models/Setting.js";

export const generateReceiptText = async (sale) => {
  const setting = await Setting.findOne({});
  const shopName = setting?.shopName || "MARHABA PHOTOSTATE & COMPUTER";
  const shopTagline = setting?.shopTagline || "Stationery • Printing • POS";
  const phone1 = setting?.phone1 || "0333-6297546";
  const phone2 = setting?.phone2 || "0334-7791579";
  const currency = setting?.currency || "Rs";
  const footer = setting?.receiptFooter || "THANK YOU 😊\nVisit Again!";
  const line = "─".repeat(44);

  const itemLines = sale.items.map(
    (item) =>
      `${item.name.padEnd(20).slice(0, 20)} x${String(item.qty).padStart(2)} ${(currency + " " + item.subtotal).padStart(10)}`
  ).join("\n");

  const date = new Date(sale.createdAt);
  const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return `
┌${"─".repeat(44)}┐
│ ${shopName.padEnd(43)}│
│ ${shopTagline.padEnd(43)}│
├${line}┤
│ Invoice No : ${sale.invoiceNo?.padEnd(30) || "N/A".padEnd(30)}│
│ Date       : ${dateStr.padEnd(30)}│
│ Time       : ${timeStr.padEnd(30)}│
│ Cashier    : ${(sale.cashierName || "").padEnd(30)}│
├${line}┤
│ ITEMS                                      │
├${line}┤
${itemLines}
├${line}┤
│ Subtotal${(" " + currency + " " + sale.subtotal).padStart(36)}│
│ Discount${(" -" + currency + " " + sale.discount).padStart(36)}│
│ Tax${(" " + currency + " " + (sale.tax || 0)).padStart(40)}│
├${line}┤
│ GRAND TOTAL${(" " + currency + " " + sale.total).padStart(32)}│
├${line}┤
│ Payment Method : ${(sale.paymentMethod || "cash").padEnd(26)}│
│ Received Amount: ${(currency + " " + sale.amountPaid).padEnd(26)}│
│ Change Return  : ${(currency + " " + (sale.change || 0)).padEnd(26)}│
├${line}┤
│ Customer : ${(sale.customerName || "Walk-in Customer").padEnd(33)}│
├${line}┤
│ ${footer.split("\n").join("\n│ ").padEnd(43)}│
├${line}┤
│ ${shopName.padEnd(43)}│
│ Ph: ${phone1.padEnd(39)}│
│     ${phone2.padEnd(39)}│
└${"─".repeat(44)}┘`;
};
