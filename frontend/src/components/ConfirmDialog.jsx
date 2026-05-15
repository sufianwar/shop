
import React from "react";
import Modal from "./Modal";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = "Confirm", message, danger }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6 }}>{message}</p>
      <div className="modal-footer">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={() => { onConfirm(); onClose(); }}>
          {danger ? "Delete" : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
