import api from "../api";

export const ledgerService = {
  getAll: (params) => api.get("/ledger", { params }),
  addEntry: (customerId, data) => api.post(`/ledger/${customerId}`, data),
  getBalance: (customerId) => api.get(`/ledger/${customerId}/balance`),
  getStatement: (customerId, month) => api.get(`/ledger/${customerId}/statement`, { params: { month } }),
};
