
// Stock service - reusable stock operations
import Product from "../models/Product.js";

export const deductStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.qty, totalSold: item.qty },
    });
  }
};

export const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.qty },
    });
  }
};

export const addStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.qty },
      $set: { purchasePrice: item.purchasePrice },
    });
  }
};
