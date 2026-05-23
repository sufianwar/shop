
import api from "../api";

export const returnsService = {
  process: (data) => api.post("/returns", data),
  getAll: (params) => api.get("/returns", { params }),
};
