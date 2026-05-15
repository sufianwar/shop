
import api from "../api";
export const purchaseService = {
  getAll: () => api.get("/purchase"),
  create: (d) => api.post("/purchase", d),
  delete: (id) => api.delete(`/purchase/${id}`),
};
