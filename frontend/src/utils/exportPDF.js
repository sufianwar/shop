
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportSalesPDF = (sales, title = "Sales Report") => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [["Invoice", "Customer", "Date", "Method", "Total", "Paid", "Due", "Status"]],
    body: sales.map(s => [
      s.invoiceNo, s.customerName,
      new Date(s.createdAt).toLocaleDateString(),
      s.paymentMethod, `Rs ${s.total}`, `Rs ${s.paid_amount || s.amountPaid}`, `Rs ${s.due_amount || 0}`, s.payment_status || s.status,
    ]),
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
  });

  doc.save(`${title.replace(/\s/g, "_")}_${Date.now()}.pdf`);
};

export const exportProductsPDF = (products, title = "Products Report") => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 24,
    head: [["Name", "Barcode", "Category", "Purchase Price", "Sale Price", "Stock"]],
    body: products.map(p => [p.name, p.barcode || "-", p.categoryName, `Rs ${p.purchasePrice}`, `Rs ${p.salePrice}`, p.stock]),
    theme: "striped",
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save(`${title.replace(/\s/g, "_")}_${Date.now()}.pdf`);
};
