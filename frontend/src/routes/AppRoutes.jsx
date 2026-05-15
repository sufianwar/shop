
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Sales from "../pages/Sales";
import Purchase from "../pages/Purchase";
import Products from "../pages/Products";
import Categories from "../pages/Categories";
import Customers from "../pages/Customers";
import Suppliers from "../pages/Suppliers";
import Expenses from "../pages/Expenses";
import Analytics from "../pages/Analytics";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected App */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<ProtectedRoute roles={["admin", "manager"]}><Categories /></ProtectedRoute>} />
        <Route path="/purchase" element={<ProtectedRoute roles={["admin", "manager"]}><Purchase /></ProtectedRoute>} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/suppliers" element={<ProtectedRoute roles={["admin", "manager"]}><Suppliers /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute roles={["admin", "manager"]}><Expenses /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={["admin", "manager"]}><Analytics /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={["admin", "manager"]}><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={
          <ProtectedRoute roles={["admin", "manager"]}><Settings /></ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
