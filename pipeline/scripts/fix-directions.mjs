/**
 * fix-directions.mjs
 * -----------------
 * Scans `data/master/venues.master.json` and ensures each venue has a `directionsUrl`
 * that includes `origin=current+location`. If missing or malformed, it reconstructs
 * the URL using the venue's stored `lat` and `lng`.
 *
 * Usage: `node fix-directions.mjs`
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MASTER_PATH = join(__dirname, "..", "..", "data", "master", "venues.master.json");
const BACKUP_PATH = join(__dirname, "..", "..", "data", "master", "venues.master.backup.json");

async function main() {
  const raw = await readFile(MASTER_PATH, "utf8");
  const venues = JSON.parse(raw);

  // Create a backup before modifying
  await writeFile(BACKUP_PATH, JSON.stringify(venues, null, 2), "utf8");
  console.log(`Backup created at ${BACKUP_PATH}`);

  let updated = 0;
  for (const venue of venues) {
    const { lat, lng } = venue;
    if (lat == null || lng == null) continue; // skip if coordinates missing
    const expected = `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${lat},${lng}`;
    if (venue.directionsUrl !== expected) {
      venue.directionsUrl = expected;
      updated++;
    }
  }

  await writeFile(MASTER_PATH, JSON.stringify(venues, null, 2), "utf8");
  console.log(`Updated ${updated} venue(s) in ${MASTER_PATH}`);
}

main().catch((e) => {
  console.error("Error fixing directions URLs:", e);
  process.exit(1);
});
