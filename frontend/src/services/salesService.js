
import api from "../api";
export const salesService = {
  getAll: (p) => api.get("/sales", { params: p }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (d) => api.post("/sales", d),
  getSummary: () => api.get("/sales/summary"),
  refund: (id) => api.post(`/sales/${id}/refund`),
};
