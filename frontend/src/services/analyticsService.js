
import api from "../api";
export const analyticsService = {
  getSales: (p) => api.get("/analytics/sales", { params: p }),
  getProfit: (p) => api.get("/analytics/profit", { params: p }),
  getDashboard: () => api.get("/dashboard"),
};
