
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#10b981", secondary: "#f1f5f9" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#f1f5f9" } },
      }}
    />
  </React.StrictMode>
);
