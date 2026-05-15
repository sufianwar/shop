
export const fmtRs = (amount) => `Rs ${Number(amount || 0).toLocaleString("en-PK")}`;
export const fmtNum = (n) => Number(n || 0).toLocaleString("en-PK");
