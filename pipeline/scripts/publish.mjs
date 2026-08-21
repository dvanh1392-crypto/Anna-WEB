import fs from "node:fs";
import path from "node:path";

const configPath = "h:\\web\\pipeline\\config\\source-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const masterPath = config.publish.masterFile;
const publishedPath = config.publish.publishedFile;

const requiredFields = [
  "id",
  "name",
  "categoryKey",
  "description",
  "address",
  "phone",
  "hours",
  "rating",
  "reviewCount",
  "lat",
  "lng",
  "tags",
  "imageUrl",
  "menuImages",
  "menuHighlights",
  "directionsUrl",
  "sourceLabel",
  "sourceUrl",
];

function ensureArray(value, fieldName, venueId) {
  if (!Array.isArray(value)) {
    throw new Error(`Trường ${fieldName} của quán ${venueId} phải là mảng`);
  }
}

function validateVenue(venue) {
  for (const field of requiredFields) {
    if (!(field in venue)) {
      throw new Error(`Thiếu trường ${field} ở quán ${venue.id ?? "<chưa có id>"}`);
    }
  }

  if (typeof venue.description !== "object" || !venue.description.vi || !venue.description.en || !venue.description.zh) {
    throw new Error(`Quán ${venue.id} thiếu mô tả đa ngôn ngữ`);
  }

  if (
    typeof venue.menuHighlights !== "object" ||
    !Array.isArray(venue.menuHighlights.vi) ||
    !Array.isArray(venue.menuHighlights.en) ||
    !Array.isArray(venue.menuHighlights.zh)
  ) {
    throw new Error(`Quán ${venue.id} thiếu menuHighlights đa ngôn ngữ`);
  }

  ensureArray(venue.tags, "tags", venue.id);
  ensureArray(venue.menuImages, "menuImages", venue.id);
}

const venues = JSON.parse(fs.readFileSync(masterPath, "utf8"));

if (!Array.isArray(venues)) {
  throw new Error("File master phải là một mảng JSON");
}

venues.forEach(validateVenue);

const publishedVenues = [...venues].sort(
  (a, b) =>
    b.rating - a.rating ||
    b.reviewCount - a.reviewCount ||
    a.name.localeCompare(b.name, "vi"),
);

fs.mkdirSync(path.dirname(publishedPath), { recursive: true });
fs.writeFileSync(publishedPath, `${JSON.stringify(publishedVenues, null, 2)}\n`, "utf8");

console.log(`Đã publish ${publishedVenues.length} quán sang ${publishedPath}`);
