import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ledgerService } from "../services/ledgerService";
import api from "../api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { fmtRs } from "../utils/currencyFormat";
import Modal from "../components/Modal";
import { salesService } from "../services/salesService";
import MonthlyStatement from "../components/MonthlyStatement";
import ManualPaymentPanel from "../components/ManualPaymentPanel";

export default function Ledger() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  const [filter, setFilter] = useState({
    type: "customer",
    entityId: "",
    startDate: "",
    endDate: ""
  });

  const [showDueModal, setShowDueModal] = useState(false);
  const [dueAmount, setDueAmount] = useState("");
  const [dueSaleId, setDueSaleId] = useState("");
  const [salesWithDue, setSalesWithDue] = useState([]);
  
  const [statementMonth, setStatementMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statementData, setStatementData] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);

  useEffect(() => {
    api.get("/customers").then(({ data }) => setCustomers(data));
    api.get("/suppliers").then(({ data }) => setSuppliers(data));
  }, []);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.type === "customer" && filter.entityId) params.customerId = filter.entityId;
      if (filter.type === "supplier" && filter.entityId) params.supplierId = filter.entityId;
      if (filter.startDate) params.startDate = filter.startDate;
      if (filter.endDate) params.endDate = filter.endDate;
      
      const { data } = await ledgerService.getAll(params);
      setLedgers(data);
    } catch (err) {
      toast.error("Failed to load ledgers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
    if (filter.type === "customer" && filter.entityId) {
       salesService.getAll({ customer: filter.entityId }).then(({data}) => {
         const due = data.filter(s => s.due_amount > 0);
         setSalesWithDue(due);
       });
    } else {
       setSalesWithDue([]);
    }
  }, [filter]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Ledger Report - ${filter.type.toUpperCase()}`, 14, 15);
    
    const tableData = ledgers.map(l => [
      new Date(l.createdAt).toLocaleDateString(),
      l.customerName || l.entityName,
      l.description,
      l.type === "debit" ? fmtRs(l.amount) : "-",
      l.type === "credit" ? fmtRs(l.amount) : "-",
      fmtRs(l.balance)
    ]);

    doc.autoTable({
      startY: 20,
      head: [["Date", "Entity", "Description", "Debit (Owes)", "Credit (Paid)", "Balance"]],
      body: tableData,
    });
    doc.save("Ledger_Report.pdf");
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ledgers.map(l => ({
      Date: new Date(l.createdAt).toLocaleDateString(),
      Entity: l.customerName || l.entityName,
      Description: l.description,
      Type: l.type,
      Amount: l.amount,
      Balance: l.balance,
      Reference: l.referenceType
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, "Ledger_Report.xlsx");
  };

  const handleGenerateStatement = async () => {
    if (!filter.entityId || filter.type !== "customer") {
      return toast.error("Please select a customer first");
    }
    if (!statementMonth) {
      return toast.error("Please select a billing month");
    }
    try {
      setLoading(true);
      const { data } = await ledgerService.getStatement(filter.entityId, statementMonth);
      setStatementData(data);
      setShowStatementModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate statement");
    } finally {
      setLoading(false);
    }
  };

  const handlePayDue = async () => {
    try {
       await salesService.payDue(dueSaleId, dueAmount);
       toast.success("Payment recorded successfully!");
       setShowDueModal(false);
       setDueAmount("");
       fetchLedgers();
       salesService.getAll({ customer: filter.entityId }).then(({ data }) => {
         const due = data.filter((s) => s.due_amount > 0);
         setSalesWithDue(due);
       });
       window.dispatchEvent(new CustomEvent("manual-payments-refresh"));
    } catch (err) {
       toast.error(err.response?.data?.message || "Failed to process payment");
    }
  };

  return (
    <div className="card">
      <div className="header mb-4">
        <div>
          <h2 style={{ margin: 0 }}>📓 Ledger System</h2>
          <p className="text-muted text-sm" style={{ margin: 0 }}>View customer and supplier transactions</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF}>📄 Export PDF</button>
          <button className="btn btn-success" onClick={handleExportExcel}>📊 Export Excel</button>
        </div>
      </div>

      <div className="grid-4 mb-4" style={{ background: "var(--bg)", padding: 16, borderRadius: "var(--radius-sm)" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Type</label>
          <select className="form-select" value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value, entityId: "" })}>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{filter.type === "customer" ? "Customer" : "Supplier"}</label>
          <select className="form-select" value={filter.entityId} onChange={e => setFilter({ ...filter, entityId: e.target.value })}>
            <option value="">All</option>
            {(filter.type === "customer" ? customers : suppliers).map(e => (
              <option key={e._id} value={e._id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Start Date</label>
          <input type="date" className="form-input" value={filter.startDate} onChange={e => setFilter({ ...filter, startDate: e.target.value })} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">End Date</label>
          <input type="date" className="form-input" value={filter.endDate} onChange={e => setFilter({ ...filter, endDate: e.target.value })} />
        </div>
      </div>

      {filter.type === "customer" && (
        <ManualPaymentPanel
          customers={customers}
          selectedCustomerId={filter.entityId}
          pendingSales={salesWithDue}
          onCollectDue={(sale) => {
            setDueSaleId(sale._id);
            setDueAmount(sale.due_amount);
            setShowDueModal(true);
          }}
          onPaymentSaved={() => {
            fetchLedgers();
            if (filter.entityId) {
              salesService.getAll({ customer: filter.entityId }).then(({ data }) => {
                setSalesWithDue(data.filter((s) => s.due_amount > 0));
              });
            }
          }}
        />
      )}

      {filter.type === "customer" && filter.entityId && (
         <div className="mb-4" style={{ padding: 16, background: "var(--indigo-3)", borderRadius: "var(--radius-sm)", display: "flex", gap: 16, alignItems: "flex-end" }}>
           <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
             <label className="form-label" style={{ color: "var(--indigo-2)" }}>Billing Month for Statement</label>
             <input type="month" className="form-input" value={statementMonth} onChange={e => setStatementMonth(e.target.value)} />
           </div>
           <button className="btn btn-primary" onClick={handleGenerateStatement}>
             📄 Generate Monthly Statement
           </button>
         </div>
      )}

      {loading && <Loader />}
      <div className="table-container" style={{ opacity: loading ? 0.5 : 1 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Entity</th>
                <th>Description</th>
                <th>Debit (Owes)</th>
                <th>Credit (Paid)</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--muted)" }}>No ledger entries found</td></tr>
              ) : (
                ledgers.map(l => (
                  <tr key={l._id}>
                    <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{l.customerName || l.entityName || "-"}</td>
                    <td>{l.description}</td>
                    <td style={{ color: "var(--danger)", fontWeight: 600 }}>{l.type === "debit" ? fmtRs(l.amount) : "-"}</td>
                    <td style={{ color: "var(--success)", fontWeight: 600 }}>{l.type === "credit" ? fmtRs(l.amount) : "-"}</td>
                    <td style={{ fontWeight: 700 }}>{fmtRs(l.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      <Modal isOpen={showDueModal} onClose={() => setShowDueModal(false)} title="💰 Collect Due Payment">
         <div className="form-group">
            <label className="form-label">Payment Amount</label>
            <input type="number" className="form-input" value={dueAmount} onChange={e => setDueAmount(e.target.value)} />
         </div>
         <div className="flex gap-2" style={{ justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={() => setShowDueModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePayDue}>Confirm Payment</button>
         </div>
      </Modal>

      {showStatementModal &&
        createPortal(
          <div
            id="statement-print-root"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.5)",
              padding: "40px 20px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 12,
                width: "100%",
                maxWidth: "148mm",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              }}
            >
              <MonthlyStatement
                statement={statementData}
                onClose={() => setShowStatementModal(false)}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
