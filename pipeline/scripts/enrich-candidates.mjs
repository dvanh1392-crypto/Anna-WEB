// enrich-candidates.mjs
/**
 * enrich-candidates.mjs
 * --------------------
 * Reads `data/review/pending-candidates.json` (output of build‑review‑queue)
 * and fills any missing required fields with defaults / placeholders.
 * The `id` field is always generated as a slug from the venue name, ensuring
 * uniqueness against existing master venues and other candidates.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// -------------------- Helpers ---------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REVIEW_PATH = path.resolve(__dirname, '../../data/review/pending-candidates.json');
const MASTER_PATH = path.resolve(__dirname, '../../data/master/venues.master.json');
const PLACEHOLDER_IMG = './assets/restaurant-placeholder.svg';

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
}

function ensureTranslations(value) {
  if (typeof value === 'object' && value !== null) return value;
  const text = typeof value === 'string' ? value : '';
  return { vi: text, en: text, zh: text };
}

// Ensure an id is unique across master venues and current candidates
function generateUniqueId(base, existingIds) {
  let id = base;
  let suffix = 1;
  while (existingIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix++;
  }
  existingIds.add(id);
  return id;
}

async function main() {
  const [rawReview, rawMaster] = await Promise.all([
    fs.readFile(REVIEW_PATH, 'utf8'),
    fs.readFile(MASTER_PATH, 'utf8').catch(() => '[]'), // master may be empty on first run
  ]);
  const reviewItems = JSON.parse(rawReview);
  const masterVenues = JSON.parse(rawMaster);

  // Collect all existing ids (master + candidates) to avoid collisions
  const existingIds = new Set();
  masterVenues.forEach((v) => v.id && existingIds.add(v.id));
  reviewItems.forEach((it) => it.candidate.id && existingIds.add(it.candidate.id));

  const enriched = reviewItems.map((item) => {
    const cand = { ...item.candidate };

    // 1. ID – slug from name (always) with uniqueness handling
    if (!cand.id) {
      const base = slugify(cand.name || 'unknown');
      cand.id = generateUniqueId(base, existingIds);
    } else {
      // ensure existing id is also unique (just in case)
      if (existingIds.has(cand.id)) {
        const base = slugify(cand.name || 'unknown');
        cand.id = generateUniqueId(base, existingIds);
      } else {
        existingIds.add(cand.id);
      }
    }

    // 2. Category inference (simple)
    if (!cand.categoryKey) {
      const tags = cand.tags || {};
      if (tags.cuisine?.includes('seafood')) cand.categoryKey = 'seafood';
      else if (tags.cuisine?.includes('goat')) cand.categoryKey = 'goat-pub';
      else cand.categoryKey = 'generic-pub';
    }

    // 3. Description translations
    cand.description = ensureTranslations(cand.description);

    // 4. Menu highlights – ensure array with translations
    if (!Array.isArray(cand.menuHighlights) || cand.menuHighlights.length === 0) {
      cand.menuHighlights = [{ vi: 'Món đặc trưng', en: 'Signature dish', zh: '特色菜' }];
    } else {
      cand.menuHighlights = cand.menuHighlights.map((h) => ensureTranslations(h));
    }

    // 5. Image URL placeholder
    if (!cand.imageUrl) cand.imageUrl = PLACEHOLDER_IMG;

    // 6. Menu images array default
    if (!Array.isArray(cand.menuImages)) cand.menuImages = [];

    // 7. Tags array default
    if (!Array.isArray(cand.tags)) cand.tags = [];

    // 8. Rating & review count defaults
    if (typeof cand.rating !== 'number') cand.rating = 0;
  // 9. Phone placeholder if missing
  if (!cand.phone) cand.phone = 'Chưa có';
  // 10. Opening hours placeholder and translations
  if (!cand.openingHours) {
    const placeholder = 'Không có dữ liệu';
    cand.openingHours = { vi: placeholder, en: placeholder, zh: placeholder };
  } else if (typeof cand.openingHours === 'string') {
    // convert string to translation object
    const text = cand.openingHours;
    cand.openingHours = { vi: text, en: text, zh: text };
  }
    if (typeof cand.reviewCount !== 'number') cand.reviewCount = 0;

    // 9. Directions URL – use lat/lng if missing
    if (!cand.directionsUrl && cand.lat != null && cand.lng != null) {
      cand.directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${cand.lat},${cand.lng}&hl=vi`;
    }

    // 10. Source metadata defaults for OSM
    cand.sourceLabel = cand.sourceLabel || 'OpenStreetMap';
    if (!cand.sourceUrl && cand.osmId) {
      cand.sourceUrl = `https://www.openstreetmap.org/node/${cand.osmId}`;
    }

    return { ...item, candidate: cand };
  });

  // Backup original file
  const backupPath = `${REVIEW_PATH}.backup.json`;
  await fs.writeFile(backupPath, JSON.stringify(reviewItems, null, 2), 'utf8');
  await fs.writeFile(REVIEW_PATH, JSON.stringify(enriched, null, 2), 'utf8');
  console.log(`Enriched ${enriched.length} candidates. Backup saved to ${backupPath}`);
}

main().catch((e) => {
  console.error('Error enriching candidates:', e);
  process.exit(1);
});
