
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-";

export const fmtDateTime = (d) => `${fmtDate(d)} ${fmtTime(d)}`;

export const toInputDate = (d) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";
