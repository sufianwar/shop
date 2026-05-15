
import api from "../api";
export const authService = {
  login: (d) => api.post("/auth/login", d),
  register: (d) => api.post("/auth/register", d),
  getProfile: () => api.get("/auth/profile"),
  getUsers: () => api.get("/auth/users"),
  updateUser: (id, d) => api.put(`/auth/users/${id}`, d),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};
