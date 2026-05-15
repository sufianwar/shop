
import React from "react";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  if (!isOpen) return null;
  const maxW = { sm: 400, md: 540, lg: 720, xl: 900 }[size] || 540;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
