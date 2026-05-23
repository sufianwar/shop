import api from "../api";

export const manualPaymentService = {
  getAll: (params) => api.get("/manual-payments", { params }),
  lookupInvoice: (customerId, invoiceNo) =>
    api.get("/manual-payments/lookup", { params: { customerId, invoiceNo } }),
  getPendingInvoices: (customerId) => api.get(`/manual-payments/pending/${customerId}`),
  create: (data) => api.post("/manual-payments", data),
  update: (id, data) => api.put(`/manual-payments/${id}`, data),
  remove: (id) => api.delete(`/manual-payments/${id}`),
  markInvoicePaid: (data) => api.post("/manual-payments/mark-invoice-paid", data),
};
