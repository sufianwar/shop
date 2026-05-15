
import cron from "node-cron";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const backupDatabase = async () => {
  const backupDir = path.join(__dirname, "../backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
  const output = fs.createWriteStream(path.join(backupDir, filename));
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(output);
  console.log(`✅ Backup created: ${filename}`);
  return filename;
};

// Schedule daily backup at 2 AM
export const scheduleBackup = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("🔄 Running scheduled backup...");
    await backupDatabase();
  });
  console.log("⏰ Backup scheduler started (daily at 2 AM)");
};
