
import api from "../api";
export const productService = {
  getAll: (p) => api.get("/products", { params: p }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (bc) => api.get(`/products/barcode/${bc}`),
  add: (d) => api.post("/products", d),
  update: (id, d) => api.put(`/products/${id}`, d),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get("/products/low-stock"),
};
