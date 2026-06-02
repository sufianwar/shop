
import api from "../api";
export const purchaseService = {
  getAll: () => api.get("/purchases"),
  create: (d) => api.post("/purchases", d),
  delete: (id) => api.delete(`/purchases/${id}`),
};
