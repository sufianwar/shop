
import React, { useRef } from "react";

export default function BarcodeScanner({ onResult }) {
  const [manual, setManual] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    onResult(manual.trim());
    setManual("");
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          className="form-input"
          placeholder="Scan barcode or type 7-digit code..."
          value={manual}
          onChange={(e) => {
            setManual(e.target.value);
            if (e.target.value.length === 7 && /^\d{7}$/.test(e.target.value)) {
              onResult(e.target.value);
              setManual("");
            }
          }}
          style={{ fontFamily: "monospace" }}
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-sm">🔍</button>
      </form>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>
        💡 USB scanners work automatically
      </div>
    </div>
  );
}
