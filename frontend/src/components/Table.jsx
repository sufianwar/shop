
import React from "react";

export default function Table({ columns, data, emptyText = "No data found", loading }) {
  if (loading) return (
    <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
      <div className="spinner" style={{ margin: "0 auto 12px" }} />
      Loading...
    </div>
  );
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.style}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="table-empty">📭 {emptyText}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={row._id || i}>
                {columns.map((col) => (
                  <td key={col.key} style={col.tdStyle}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
