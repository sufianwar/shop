
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pos_user")); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("pos_token", data.token);
      localStorage.setItem("pos_user", JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    setUser(null);
    window.location.href = "/login";
  };

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
