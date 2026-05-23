
import mongoose from 'mongoose';
import Sale from './models/Sale.js';
import Ledger from './models/Ledger.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Find all deleted sales
    const deletedSales = await Sale.find({ is_deleted: true });
    console.log(`Found ${deletedSales.length} deleted sales`);

    for (const sale of deletedSales) {
      // 2. Mark all ledger entries associated with these sales as is_deleted: true
      const result = await Ledger.updateMany(
        { referenceId: sale._id },
        { is_deleted: true }
      );
      console.log(`Updated ${result.modifiedCount} ledger entries for sale ${sale.invoiceNo}`);
    }

    // 3. Also catch any adjustments by description just in case
    const result2 = await Ledger.updateMany(
      { description: { $regex: /Receipt Deleted/i } },
      { is_deleted: true }
    );
    console.log(`Updated ${result2.modifiedCount} adjustment entries by description`);

    console.log('Cleanup finished');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

cleanup();
