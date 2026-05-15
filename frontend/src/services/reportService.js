
import api from "../api";
import { exportSalesPDF, exportProductsPDF } from "../utils/exportPDF";
import { exportSalesExcel, exportProductsExcel } from "../utils/exportExcel";

export const reportService = {
  getSalesReport: (p) => api.get("/sales", { params: { ...p, limit: 1000 } }),
  getProductsReport: () => api.get("/products"),
  exportSalesPDF,
  exportProductsPDF,
  exportSalesExcel,
  exportProductsExcel,
};
