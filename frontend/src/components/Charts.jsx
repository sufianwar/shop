
import React from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "#f1f5f9",
  fontSize: 13,
};

export function SalesAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="_id" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SalesBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="_id" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
        <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

export function PaymentPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="total" nameKey="_id" paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend formatter={(v) => <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
