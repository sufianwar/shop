
import React from "react";

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="loading-center">
      <div className="spinner" />
      <span style={{ fontSize: 14, color: "var(--muted)" }}>{text}</span>
    </div>
  );
}
