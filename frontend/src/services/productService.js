
import api from "../api";
export const productService = {
  getAll: (p) => api.get("/products", { params: p }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (bc) => api.get(`/products/barcode/${bc}`),
  checkBarcode: (bc, excludeId) => api.get(`/products/barcode/check/${bc}`, { params: excludeId ? { excludeId } : {} }),
  add: (d) => api.post("/products", d),
  update: (id, d) => api.put(`/products/${id}`, d),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get("/products/low-stock"),
};
