
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sw = collapsed ? 72 : 260;

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="main-content" style={{ marginLeft: sw }}>
        <Navbar sidebarWidth={sw} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
