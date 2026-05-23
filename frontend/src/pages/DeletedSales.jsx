import React, { useState, useEffect } from "react";
import { salesService } from "../services/salesService";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";

export default function DeletedSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    try {
      setLoading(true);
      const { data } = await salesService.getDeleted();
      setSales(data);
    } catch (err) {
      toast.error("Failed to load deleted receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id) => {
    if (!window.confirm("Are you sure you want to restore this receipt? This will re-deduct stock and update ledger.")) return;
    try {
      await salesService.restore(id);
      toast.success("Receipt restored successfully");
      fetchDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore");
    }
  };

  return (
    <div className="card">
      <div className="header mb-4">
        <div>
          <h2 style={{ margin: 0 }}>🗑️ Deleted Receipts History</h2>
          <p className="text-muted text-sm">Audit trail for cancelled/deleted transactions</p>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Deleted By</th>
                <th>Date Deleted</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>No deleted receipts found</td></tr>
              ) : (
                sales.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.invoiceNo}</td>
                    <td>{s.customerName}</td>
                    <td style={{ fontWeight: 700 }}>{fmtRs(s.total)}</td>
                    <td>{s.deleted_by?.name || "System"}</td>
                    <td>{fmtDateTime(s.deleted_at)}</td>
                    <td style={{ fontSize: 13, color: "var(--muted)" }}>{s.delete_reason}</td>
                    <td>
                      <button className="btn btn-sm btn-success" onClick={() => handleRestore(s._id)}>Restore</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
