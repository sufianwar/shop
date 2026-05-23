
import * as XLSX from "xlsx";

export const exportToExcel = (data, filename = "export", sheetName = "Sheet1") => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`);
};

export const exportSalesExcel = (sales) => {
  const data = sales.map(s => ({
    "Invoice No": s.invoiceNo,
    "Customer": s.customerName,
    "Date": new Date(s.createdAt).toLocaleDateString(),
    "Time": new Date(s.createdAt).toLocaleTimeString(),
    "Subtotal (Rs)": s.subtotal,
    "Discount (Rs)": s.discount,
    "Total (Rs)": s.total,
    "Paid Amount (Rs)": s.paid_amount || s.amountPaid,
    "Due Amount (Rs)": s.due_amount || 0,
    "Profit (Rs)": s.profit,
    "Payment": s.paymentMethod,
    "Cashier": s.cashierName,
    "Status": s.payment_status || s.status,
  }));
  exportToExcel(data, "sales_report", "Sales");
};

export const exportProductsExcel = (products) => {
  const data = products.map(p => ({
    "Name": p.name,
    "Barcode": p.barcode,
    "Category": p.categoryName,
    "Purchase Price (Rs)": p.purchasePrice,
    "Sale Price (Rs)": p.salePrice,
    "Stock": p.stock,
    "Unit": p.unit,
    "Total Sold": p.totalSold,
  }));
  exportToExcel(data, "products_report", "Products");
};
