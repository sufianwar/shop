
import React, { useState, useEffect, useCallback } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDate } from "../utils/dateFormat";
import toast from "react-hot-toast";
import api from "../api";

const EMPTY = { title: "", category: "General", amount: "", paymentMethod: "cash", notes: "", date: new Date().toISOString().slice(0, 10) };
const CATS = ["General", "Rent", "Salary", "Utilities", "Maintenance", "Transport", "Marketing", "Other"];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [delItem, setDelItem] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/expenses", { params: { startDate: dateFilter.start, endDate: dateFilter.end } });
      setExpenses(data.expenses);
      setTotal(data.total);
    } catch { toast.error("Failed"); }
    finally { setLoading(false); }
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/expenses", { ...form, amount: Number(form.amount) });
      toast.success("Expense added");
      setShowModal(false); setForm(EMPTY); load();
    } catch { toast.error("Error"); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/expenses/${delItem._id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const columns = [
    { key: "title", label: "Title", render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: "category", label: "Category", render: v => <span className="badge badge-amber">{v}</span> },
    { key: "amount", label: "Amount", render: v => <span style={{ fontWeight: 700, color: "var(--rose)" }}>{fmtRs(v)}</span> },
    { key: "paymentMethod", label: "Method", render: v => <span style={{ textTransform: "capitalize" }}>{v}</span> },
    { key: "date", label: "Date", render: v => fmtDate(v) },
    { key: "_id", label: "Actions", render: (_, r) => <button className="btn btn-danger btn-sm" onClick={() => setDelItem(r)}>🗑️</button> },
  ];

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">💸 Expenses</div><div className="page-subtitle">Total: <span style={{ color: "var(--rose)", fontWeight: 700 }}>{fmtRs(total)}</span></div></div>
        <div className="page-actions">
          <input type="date" className="form-input" style={{ width: 160 }} value={dateFilter.start} onChange={e => setDateFilter(p => ({ ...p, start: e.target.value }))} />
          <input type="date" className="form-input" style={{ width: 160 }} value={dateFilter.end} onChange={e => setDateFilter(p => ({ ...p, end: e.target.value }))} />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loader /> : <Table columns={columns} data={expenses} emptyText="No expenses" />}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="💸 Add Expense">
        <form onSubmit={save}>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group"><label className="form-label">Title *</label><input required className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Amount (Rs) *</label><input required type="number" min={0} className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="cash">Cash</option><option value="card">Card</option><option value="online">Online</option>
              </select>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Expense</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!delItem} onClose={() => setDelItem(null)} onConfirm={handleDelete} title="Delete Expense" message={`Delete "${delItem?.title}"?`} danger />
    </div>
  );
}
