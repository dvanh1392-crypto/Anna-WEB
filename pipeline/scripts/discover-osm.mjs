import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const configPath = "h:\\web\\pipeline\\config\\source-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const source = config.sources.find((item) => item.id === "osm-overpass" && item.enabled);

if (!source) {
  throw new Error("Chưa bật nguồn osm-overpass trong source-config.json");
}

const outputPath = config.publish.discoveryFile;
const { south, west, north, east } = config.region.bbox;

function postText(url, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Length": Buffer.byteLength(body, "utf8"),
          "User-Agent": "vinh-yen-venue-pipeline/1.0",
        },
      },
      (response) => {
        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Overpass trả về mã ${response.statusCode}: ${data.slice(0, 200)}`));
            return;
          }
          resolve(data);
        });
      },
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function buildQuery() {
  const amenityPart = source.amenityTags
    .map((tag) => `node["amenity"="${tag}"](${south},${west},${north},${east});way["amenity"="${tag}"](${south},${west},${north},${east});relation["amenity"="${tag}"](${south},${west},${north},${east});`)
    .join("\n");

  return `
[out:json][timeout:25];
(
${amenityPart}
);
out tags center;
`;
}

function elementUrl(element) {
  return `https://www.openstreetmap.org/${element.type}/${element.id}`;
}

function formatAddress(tags = {}) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:province"],
  ].filter(Boolean);

  return parts.join(", ");
}

function guessCategory(tags = {}) {
  const amenity = tags.amenity;
  const cuisine = (tags.cuisine || "").toLowerCase();

  if (cuisine.includes("seafood")) return "seafood";
  if (cuisine.includes("goat")) return "goat-pub";
  if (cuisine.includes("snail")) return "snail-pub";
  if (amenity === "pub" || amenity === "biergarten" || amenity === "bar") return "garden-pub";
  return "family-pub";
}

function normalizePhone(phone = "") {
  return phone.replace(/[^\d+]/g, "").trim();
}

function toCandidate(element) {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat ?? null;
  const lng = element.lon ?? element.center?.lon ?? null;

  return {
    id: `osm-${element.type}-${element.id}`,
    sourceType: "osm-overpass",
    sourceUrl: elementUrl(element),
    sourceId: String(element.id),
    name: tags.name || null,
    categoryKey: guessCategory(tags),
    address: formatAddress(tags),
    phone: normalizePhone(tags.phone || tags["contact:phone"] || ""),
    openingHours: tags.opening_hours || "",
    lat,
    lng,
    osmTags: {
      amenity: tags.amenity || "",
      cuisine: tags.cuisine || "",
      website: tags.website || "",
    },
    discoveredAt: new Date().toISOString(),
  };
}

  const tags = element.tags || {};

}

const rawText = await postText(source.endpoint, buildQuery());
const parsed = JSON.parse(rawText);

const candidates = (parsed.elements || [])
  .map(toCandidate)
  .filter((item) => item.name && item.lat != null && item.lng != null);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");

console.log(`Đã ghi ${candidates.length} ứng viên từ OSM sang ${outputPath}`);
