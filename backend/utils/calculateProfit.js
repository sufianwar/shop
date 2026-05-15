
export const calculateProfit = (items, discount = 0) => {
  let gross = 0;
  for (const item of items) {
    gross += (item.salePrice - item.purchasePrice) * item.qty;
  }
  return gross - discount;
};
