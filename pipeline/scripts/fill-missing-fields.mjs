/**
 * fill-missing-fields.mjs
 * --------------------
 * Scans `data/master/venues.master.json` and ensures each venue contains all required fields
 * for the publish step. Currently it fills missing `menuHighlights` with empty language arrays
 * and adds placeholder values for any other missing required keys.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MASTER_PATH = join(__dirname, "..", "..", "data", "master", "venues.master.json");
const BACKUP_PATH = join(__dirname, "..", "..", "data", "master", "venues.master.backup.missing.json");

// Define defaults for required fields
const defaults = {
  menuHighlights: { vi: [], en: [], zh: [] },
  // Add other defaults if needed
};

async function main() {
  const raw = await readFile(MASTER_PATH, "utf8");
  const venues = JSON.parse(raw);
  await writeFile(BACKUP_PATH, JSON.stringify(venues, null, 2), "utf8");
  console.log(`Backup of original data created at ${BACKUP_PATH}`);

  let updated = 0;
  for (const venue of venues) {
    for (const [field, value] of Object.entries(defaults)) {
      if (!(field in venue)) {
        venue[field] = value;
        updated++;
      }
    }
  }
  await writeFile(MASTER_PATH, JSON.stringify(venues, null, 2), "utf8");
  console.log(`Added missing fields to ${updated} venue(s).`);
}

main().catch((e) => {
  console.error("Error filling missing fields:", e);
  process.exit(1);
});
