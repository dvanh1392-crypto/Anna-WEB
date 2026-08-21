import fs from "node:fs";
import path from "node:path";

const configPath = "h:\\web\\pipeline\\config\\source-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const masterPath = config.publish.masterFile;
const discoveryPath = config.publish.discoveryFile;
const reviewQueuePath = config.publish.reviewQueueFile;

function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(quan|nha hang|restaurant|pub|bar|beer|bia|nhau)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value = "") {
  return value.replace(/[^\d+]/g, "").trim();
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((value) => typeof value !== "number")) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function compareCandidate(candidate, venue) {
  let score = 0;
  const reasons = [];

  const candidatePhone = normalizePhone(candidate.phone || "");
  const venuePhone = normalizePhone(venue.phone || "");

  if (candidatePhone && venuePhone && candidatePhone === venuePhone) {
    score += 60;
    reasons.push("trùng số điện thoại");
  }

  const candidateName = normalizeText(candidate.name || "");
  const venueName = normalizeText(venue.name || "");

  if (candidateName && venueName) {
    if (candidateName === venueName) {
      score += 35;
      reasons.push("trùng tên sau chuẩn hoá");
    } else if (candidateName.includes(venueName) || venueName.includes(candidateName)) {
      score += 22;
      reasons.push("tên gần giống");
    }
  }

  const candidateAddress = normalizeText(candidate.address || "");
  const venueAddress = normalizeText(venue.address || "");

  if (candidateAddress && venueAddress && (candidateAddress.includes(venueAddress) || venueAddress.includes(candidateAddress))) {
    score += 10;
    reasons.push("địa chỉ gần giống");
  }

  const distanceKm = haversineDistanceKm(candidate.lat, candidate.lng, venue.lat, venue.lng);
  if (distanceKm != null) {
    if (distanceKm < 0.15) {
      score += 25;
      reasons.push("vị trí rất gần");
    } else if (distanceKm < 0.5) {
      score += 12;
      reasons.push("vị trí tương đối gần");
    }
  }

  if (candidate.categoryKey && venue.categoryKey && candidate.categoryKey === venue.categoryKey) {
    score += 6;
    reasons.push("cùng loại quán");
  }

  return {
    venueId: venue.id,
    venueName: venue.name,
    score,
    distanceKm,
    reasons,
  };
}

const masterVenues = JSON.parse(fs.readFileSync(masterPath, "utf8"));
const discoveredCandidates = JSON.parse(fs.readFileSync(discoveryPath, "utf8"));

const reviewItems = discoveredCandidates.map((candidate) => {
  const bestMatch = masterVenues
    .map((venue) => compareCandidate(candidate, venue))
    .sort((a, b) => b.score - a.score)[0];

  let decision = "new_candidate";
  if (bestMatch && bestMatch.score >= 80) {
    decision = "likely_duplicate";
  } else if (bestMatch && bestMatch.score >= 45) {
    decision = "review_duplicate";
  }

  return {
    decision,
    candidate,
    bestMatch,
  };
});

const filteredReviewItems = reviewItems.filter((item) => item.decision !== "likely_duplicate");

fs.mkdirSync(path.dirname(reviewQueuePath), { recursive: true });
fs.writeFileSync(reviewQueuePath, `${JSON.stringify(filteredReviewItems, null, 2)}\n`, "utf8");

console.log(
  `Đã tạo hàng chờ duyệt ${filteredReviewItems.length} mục tại ${reviewQueuePath} từ ${discoveredCandidates.length} ứng viên.`,
);
