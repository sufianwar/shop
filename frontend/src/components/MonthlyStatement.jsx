import React, { useCallback } from "react";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDate } from "../utils/dateFormat";
import statementPageCss from "../styles/statement-page.css?inline";
import "../styles/statement-print.css";

export default function MonthlyStatement({ statement, onClose }) {
  if (!statement) return null;

  const {
    customer,
    month,
    openingBalance,
    closingBalance,
    totalPurchases,
    totalPaid,
    sales,
    payments,
    groupedItems = []
  } = statement;

  const printInPage = useCallback(() => {
    document.body.classList.add("print-statement-active");
    const cleanup = () => {
      document.body.classList.remove("print-statement-active");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }, []);

  const handlePrint = useCallback(() => {
    const page = document.getElementById("monthly-statement");
    if (!page) return;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Monthly statement print");
    Object.assign(iframe.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "0",
      height: "0",
      border: "0",
      visibility: "hidden",
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      printInPage();
      return;
    }

    const safeName = String(customer.name).replace(/[<>&]/g, "");
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Monthly Statement — ${safeName}</title>
  <style>${statementPageCss}</style>
</head>
<body>
  ${page.outerHTML}
</body>
</html>`);
    doc.close();

    const win = iframe.contentWindow;
    if (!win) {
      iframe.remove();
      printInPage();
      return;
    }

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 300);
    };

    const triggerPrint = () => {
      win.focus();
      win.print();
      win.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(cleanup, 3000);
    };

    setTimeout(triggerPrint, 400);
  }, [customer.name, printInPage]);

  return (
    <div className="statement-container">
      <div id="monthly-statement" className="statement-page">
        <div className="statement-header">
          <div className="shop-brand">
            <h1 className="shop-name">MARHABA PHOTOSTATE & COMPUTER</h1>
            <p className="shop-tagline">Stationery • Printing • POS System</p>
            <p className="shop-contact">Ph: 0333-6297546 / 0334-7791579</p>
          </div>
          <div className="statement-title-box">
            <h2 className="statement-title">Monthly Account Statement</h2>
          </div>
        </div>

        <div className="customer-info-row">
          <div className="info-block">
            <div className="info-label">Customer Details</div>
            <div className="info-value"><strong>{customer.name}</strong></div>
            <div className="info-subtext">Ph: {customer.phone || "-"}</div>
            <div className="info-subtext">{customer.address || "-"}</div>
          </div>
          <div className="info-block text-right">
            <div className="info-label">Billing Period</div>
            <div className="info-value"><strong>{month}</strong></div>
            <div className="info-subtext">Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div className="balance-summary-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="balance-card">
            <span className="balance-label">{openingBalance < 0 ? "Opening Credit" : "Opening Balance"}</span>
            <span className={`balance-amount ${openingBalance < 0 ? "text-emerald" : ""}`}>{fmtRs(Math.abs(openingBalance))}</span>
          </div>
          <div className="balance-card highlight">
            <span className="balance-label">{closingBalance < 0 ? "Net Advance (Credit)" : "Net Closing (Due)"}</span>
            <span className={`balance-amount ${closingBalance < 0 ? "text-emerald" : "text-rose"}`}>{fmtRs(Math.abs(closingBalance))}</span>
          </div>
        </div>

        {/* Section 1: Grouped Purchased Items */}
        <div className="section-title">Purchased Items Summary</div>
        <div className="table-section">
          <table className="statement-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th className="text-center">Total Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {groupedItems.length === 0 ? (
                <tr><td colSpan="4" className="table-empty-msg">No items purchased this month.</td></tr>
              ) : groupedItems.map((item, i) => (
                <tr key={i}>
                  <td className="item-details">
                    {item.name}
                    {item.is_adjusted && <span className="adjusted-badge">Admin Adjusted</span>}
                  </td>
                  <td className="text-center font-bold">{item.totalQty}</td>
                  <td className="text-right">{fmtRs(item.latestPrice)}</td>
                  <td className="text-right font-bold">{fmtRs(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="statement-totals">
          <div className="totals-row">
            <span className="totals-label">Total Purchases</span>
            <span className="totals-value">{fmtRs(totalPurchases)}</span>
          </div>
          <div className="totals-row">
            <span className="totals-label">Paid This Month</span>
            <span className="totals-value text-emerald">{fmtRs(totalPaid)}</span>
          </div>
          <div className="totals-row totals-row-final">
            <span className="totals-label">Remaining Amount</span>
            <span className={`totals-value ${closingBalance < 0 ? "text-emerald" : "text-rose"}`}>
              {fmtRs(Math.abs(closingBalance))} {closingBalance < 0 ? "(Advance)" : "(Due)"}
            </span>
          </div>
        </div>

        <div className="section-title">Payment History</div>
        <div className="table-section">
          <table className="statement-table payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="2" className="table-empty-msg">No payments recorded this month.</td></tr>
              ) : payments.map((p, i) => (
                <tr key={i}>
                  <td className="w-datetime">{fmtDate(p.createdAt)}</td>
                  <td className="text-right text-emerald font-bold">{fmtRs(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="signature-section">
          <div className="sig-box">
            <div className="sig-line"></div>
            <span>Customer Signature</span>
          </div>
          <div className="sig-box">
            <div className="sig-line"></div>
            <span>Authorized Signature</span>
          </div>
        </div>
      </div>

      <div className="no-print footer-actions">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print Statement</button>
      </div>
      <p className="no-print statement-print-hint">
        Click Print Statement, then in the dialog choose <strong>More settings</strong> → Paper size <strong>A5</strong> if needed.
      </p>
    </div>
  );
}
