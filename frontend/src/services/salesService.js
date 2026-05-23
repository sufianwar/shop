
import api from "../api";
export const salesService = {
  getAll: (p) => api.get("/sales", { params: p }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (d) => api.post("/sales", d),
  getSummary: () => api.get("/sales/summary"),
  refund: (id) => api.post(`/sales/${id}/refund`),
  payDue: (id, amount) => api.post(`/sales/${id}/pay-due`, { amount }),
  delete: (id, reason) => api.delete(`/sales/${id}`, { data: { reason } }),
  getDeleted: () => api.get("/sales/deleted"),
  restore: (id) => api.post(`/sales/${id}/restore`),
};
