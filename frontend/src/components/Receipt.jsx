
import React, { useRef, useState } from "react";
import "../styles/receipt.css";
import { fmtNum } from "../utils/currencyFormat";
import { fmtDate, fmtTime } from "../utils/dateFormat";
import toast from "react-hot-toast";
import api from "../api";

const SHOP_DEFAULTS = {
  shopName: "MARHABA PHOTOSTATE",
  tagline: "STATIONERY SHOP",
  subTagline: "All Kinds of Stationery, Printing & Computer Needs.",
  phone1: "0333-6297546",
  phone2: "0334-7791579",
  address: "Vehari bazar Burewala",
  currency: "Rs",
  receiptFooter: "Visit Again.\nReturns Accepted With receipt\nTHANK YOU FOR SHOPPING WITH US!",
};

export default function Receipt({ sale, settings, onClose, onPrint }) {
  const shop = { ...SHOP_DEFAULTS, ...settings };
  const receiptRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    try {
      await api.post("/print/receipt", { sale });
      toast.success("Receipt sent directly to thermal printer!");
      onPrint?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to print directly");
    } finally {
      setIsPrinting(false);
    }
  };

  // Calculate values
  const subtotal = sale.subtotal || sale.items?.reduce((s, i) => s + (i.subtotal || i.salePrice * i.qty), 0) || 0;
  const discount = sale.discount || 0;
  const total = sale.total || 0;
  const paid = sale.paid_amount || sale.amountPaid || 0;
  const footerLines = (shop.receiptFooter || "THANK YOU FOR SHOPPING WITH US!").split("\n");

  return (
    <div>
      {/* ─── Receipt Content (visible on screen + print) ─── */}
      <div
        className="receipt-preview"
        id="thermal-receipt-print"
        ref={receiptRef}
      >
        {/* ── Header ── */}
        <div className="receipt-header-area">
          <h1 className="receipt-title">{shop.shopName.toUpperCase()}</h1>
          <div className="receipt-subtitle">— {shop.tagline.toUpperCase()} —</div>
          <div className="receipt-sub-tagline">{shop.subTagline}</div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-contact-info">
          <div>📍 {shop.address}</div>
          <div>
             📞 {shop.phone1} {shop.phone2 && ` | 📞 ${shop.phone2}`}
          </div>
        </div>

        <div className="receipt-divider" />

        {/* ── Meta Info ── */}
        <div style={{ marginBottom: 4 }}>
          <div className="receipt-meta-row">
            <span><span className="meta-label">BILL NO.</span> : {sale.invoiceNo}</span>
            <span><span className="meta-label">CASHIER</span> : {(sale.cashierName || "ADMIN").toUpperCase()}</span>
          </div>
          <div className="receipt-meta-row">
            <span><span className="meta-label">DATE</span> : {fmtDate(sale.createdAt)}</span>
            <span><span className="meta-label">TIME</span> : {fmtTime(sale.createdAt)}</span>
          </div>
        </div>

        <div className="receipt-divider" />

        {/* ── Cancelled Stamp ── */}
        {sale.is_deleted && (
          <div className="receipt-cancelled-stamp">
            ✕ CANCELLED / DELETED ✕
          </div>
        )}

        {/* ── Items Header ── */}
        <div className="receipt-items-header">
          <div className="col-item">ITEM</div>
          <div className="col-qty">QTY</div>
          <div className="col-rate">RATE</div>
          <div className="col-amount">AMOUNT</div>
        </div>

        {/* ── Item Lines ── */}
        <div className="receipt-items-body">
          {sale.items?.map((item, i) => (
            <div className="receipt-item-row" key={i}>
              <div className="col-item">{item.name}</div>
              <div className="col-qty">{item.qty}</div>
              <div className="col-rate">{fmtNum(item.salePrice)}</div>
              <div className="col-amount">{fmtNum(item.subtotal || item.salePrice * item.qty)}</div>
            </div>
          ))}
        </div>

        <div className="receipt-divider" />

        {/* ── Subtotal & Discount ── */}
        <div className="receipt-summary-row">
          <span>SUBTOTAL</span>
          <span>{fmtNum(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="receipt-summary-row">
            <span>DISCOUNT</span>
            <span>{fmtNum(discount)}</span>
          </div>
        )}

        <div className="receipt-divider" />

        {/* ── Total ── */}
        <div className="receipt-grand-total">
          <span>TOTAL</span>
          <span>{shop.currency} {fmtNum(total)}</span>
        </div>

        <div className="receipt-divider" />

        {/* ── Payment Info ── */}
        <div className="receipt-payment-row">
          <span>PAYMENT MODE : {(sale.paymentMethod || "CASH").toUpperCase()}</span>
          <span>PAID AMOUNT : {shop.currency} {fmtNum(paid)}</span>
        </div>

        <div className="receipt-divider" />

        {/* ── Footer ── */}
        <div className="receipt-footer">
          <div className="footer-thank-you">⋟ THANK YOU! ⋞</div>
          <div className="footer-msg">{footerLines[0]}</div>
          <div className="receipt-divider" style={{ margin: "8px 0" }} />
          {footerLines.slice(1).map((line, i) => (
            <div key={i} className="footer-terms">{line}</div>
          ))}
        </div>
      </div>

      {/* ─── Action Buttons (hidden on print) ─── */}
      <div className="receipt-actions no-print">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Close
        </button>
        <button className="btn btn-indigo btn-sm" onClick={handleDirectPrint} disabled={isPrinting}>
          {isPrinting ? "Printing..." : "🚀 Direct Print"}
        </button>
        <button className="btn btn-primary btn-sm" onClick={handlePrint}>
          🖨️ Browser Print
        </button>
      </div>
    </div>
  );
}
