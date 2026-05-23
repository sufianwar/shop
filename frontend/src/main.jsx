
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
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          fontSize: "14px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
        success: { iconTheme: { primary: "#10b981", secondary: "#f1f5f9" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#f1f5f9" } },
      }}
    />
  </React.StrictMode>
);
