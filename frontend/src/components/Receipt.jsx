
import React from "react";
import "../styles/receipt.css";
import { fmtRs } from "../utils/currencyFormat";
import { fmtDate, fmtTime } from "../utils/dateFormat";

export default function Receipt({ sale, settings, onClose, onPrint }) {
  const shop = settings || { shopName: "MARHABA PHOTOSTATE & COMPUTER", tagline: "Stationery • Printing • POS", phone1: "0333-6297546", phone2: "0334-7791579", currency: "Rs" };

  const handlePrint = () => {
    window.print();
    onPrint?.();
  };

  return (
    <div>
      <div className="receipt-preview" id="receipt-content">
        <div className="receipt-shop-name">{shop.shopName}</div>
        <div className="receipt-tagline">{shop.tagline}</div>
        <div className="receipt-divider" />
        <div className="receipt-row"><span>Invoice:</span><span>{sale.invoiceNo}</span></div>
        <div className="receipt-row"><span>Date:</span><span>{fmtDate(sale.createdAt)}</span></div>
        <div className="receipt-row"><span>Time:</span><span>{fmtTime(sale.createdAt)}</span></div>
        <div className="receipt-row"><span>Cashier:</span><span>{sale.cashierName}</span></div>
        <div className="receipt-divider" />
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: "uppercase" }}>Items</div>
        {sale.items?.map((item, i) => (
          <div key={i} className="receipt-item">
            <span>{item.name} x{item.qty}</span>
            <span>{fmtRs(item.subtotal)}</span>
          </div>
        ))}
        <div className="receipt-divider" />
        <div className="receipt-row"><span>Subtotal</span><span>{fmtRs(sale.subtotal)}</span></div>
        {sale.discount > 0 && <div className="receipt-row"><span>Discount</span><span>-{fmtRs(sale.discount)}</span></div>}
        <div className="receipt-divider" />
        <div className="receipt-row receipt-total"><span>TOTAL</span><span>{fmtRs(sale.total)}</span></div>
        <div className="receipt-divider" />
        <div className="receipt-row"><span>Payment</span><span style={{ textTransform: "capitalize" }}>{sale.paymentMethod}</span></div>
        <div className="receipt-row"><span>Received</span><span>{fmtRs(sale.amountPaid)}</span></div>
        <div className="receipt-row"><span>Change</span><span>{fmtRs(sale.change || 0)}</span></div>
        <div className="receipt-divider" />
        <div className="receipt-row"><span>Customer</span><span>{sale.customerName}</span></div>
        <div className="receipt-divider" />
        <div className="receipt-footer">THANK YOU 😊<br />Visit Again!<br /><br />{shop.shopName}<br />Ph: {shop.phone1}<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{shop.phone2}</div>
      </div>
      <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨️ Print</button>
      </div>
    </div>
  );
}
