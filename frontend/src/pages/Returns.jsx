
import React, { useState, useEffect } from "react";
import { returnsService } from "../services/returnsService";
import { salesService } from "../services/salesService";
import Table from "../components/Table";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import toast from "react-hot-toast";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDateTime } from "../utils/dateFormat";

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Search and Process
  const [searchInvoice, setSearchInvoice] = useState("");
  const [foundSale, setFoundSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]); // [{ productId, qty, name, maxQty, price }]
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await returnsService.getAll();
      setReturns(data);
    } catch { toast.error("Failed to load returns history"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReturns(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInvoice.trim()) return;
    try {
      const { data } = await salesService.getAll({ invoiceNo: searchInvoice });
      if (data.length === 0) return toast.error("No sale found with this invoice number");
      
      const sale = data[0];
      if (sale.is_deleted) return toast.error("This sale was deleted/cancelled");
      
      setFoundSale(sale);
      setReturnItems(sale.items.filter(i => i.qty > 0).map(i => ({
        productId: i.productId,
        name: i.name,
        qty: 0,
        maxQty: i.qty,
        price: i.salePrice
      })));
    } catch { toast.error("Search failed"); }
  };

  const handleQtyChange = (productId, val) => {
    setReturnItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const qty = Math.min(Math.max(0, parseInt(val) || 0), item.maxQty);
        return { ...item, qty };
      }
      return item;
    }));
  };

  const calculateTotalRefund = () => {
    return returnItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  };

  const handleSubmitReturn = async () => {
    const total = calculateTotalRefund();
    if (total <= 0) return toast.error("Please select at least one item to return");
    
    setSubmitting(true);
    try {
      await returnsService.process({
        saleId: foundSale._id,
        returnItems: returnItems.filter(i => i.qty > 0),
        reason,
        refundMethod
      });
      toast.success("Return processed successfully");
      setShowModal(false);
      resetForm();
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Return failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSearchInvoice("");
    setFoundSale(null);
    setReturnItems([]);
    setReason("");
    setRefundMethod("cash");
  };

  const columns = [
    { key: "returnNo", label: "Return No", render: v => <span className="font-mono font-bold text-indigo">{v}</span> },
    { key: "originalInvoice", label: "Orig. Invoice" },
    { key: "customerName", label: "Customer" },
    { key: "items", label: "Items Returned", render: v => `${v?.length || 0} items` },
    { key: "totalRefund", label: "Refunded", render: v => <span className="text-rose font-bold">{fmtRs(v)}</span> },
    { key: "refundMethod", label: "Method", render: v => <span className="badge badge-muted text-capitalize">{v}</span> },
    { key: "processedByName", label: "Staff" },
    { key: "createdAt", label: "Date", render: v => fmtDateTime(v) },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🔄 Product Returns</div>
          <div className="page-subtitle">Handle customer returns and refunds</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Return</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <Loader /> : <Table columns={columns} data={returns} emptyText="No returns processed yet" />}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="🔄 Process New Return" size="lg">
        <div style={{ minHeight: 400 }}>
          {!foundSale ? (
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Search Invoice Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. INV-20260516-1" 
                  value={searchInvoice} 
                  onChange={e => setSearchInvoice(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-indigo" style={{ alignSelf: "flex-end" }}>Search</button>
            </form>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4 p-3" style={{ background: "var(--bg-3)", borderRadius: 8 }}>
                <div>
                  <div className="text-xs text-muted">Original Invoice</div>
                  <div className="font-bold">{foundSale.invoiceNo}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Customer</div>
                  <div className="font-bold">{foundSale.customerName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Total Paid</div>
                  <div className="font-bold">{fmtRs(foundSale.total)}</div>
                </div>
                <button className="btn btn-xs btn-ghost" onClick={() => setFoundSale(null)}>Change</button>
              </div>

              <div className="table-container mb-4" style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
                <table className="table" style={{ minWidth: "auto" }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Purchased</th>
                      <th style={{ width: 120 }}>Return Qty</th>
                      <th style={{ textAlign: "right" }}>Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map(item => (
                      <tr key={item.productId}>
                        <td className="font-bold">{item.name}</td>
                        <td>{item.maxQty} units</td>
                        <td>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ padding: "4px 8px" }}
                            value={item.qty} 
                            onChange={e => handleQtyChange(item.productId, e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>{fmtRs(item.qty * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--bg-2)" }}>
                      <td colSpan="3" className="font-bold">Total Refund Amount</td>
                      <td style={{ textAlign: "right", fontSize: 18, fontWeight: 800, color: "var(--rose)" }}>
                        {fmtRs(calculateTotalRefund())}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Refund Method</label>
                  <select className="form-select" value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                    <option value="cash">💵 Cash Refund</option>
                    <option value="credit">💳 Add to Customer Balance (Credit)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Return</label>
                  <input type="text" className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Damaged, Wrong item" />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSubmitReturn}
                  disabled={submitting || calculateTotalRefund() <= 0}
                >
                  {submitting ? "Processing..." : "Confirm Return"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
