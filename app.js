import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REVIEWS_FILE_PATH = path.join(__dirname, "data", "published", "user-reviews.json");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI?.trim() || "";

let isDatabaseReady = false;
let databaseErrorMessage = "";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const reviewSchema = new mongoose.Schema(
  {
    venueId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
    date: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
  },
);

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

// Helper đọc/ghi File JSON fallback
async function readFallbackReviews() {
  try {
    const data = await fs.readFile(REVIEWS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeFallbackReviews(reviews) {
  try {
    const dir = path.dirname(REVIEWS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(REVIEWS_FILE_PATH, JSON.stringify(reviews, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Lỗi ghi file fallback review:", err);
  }
}

async function connectDatabase() {
  if (!MONGODB_URI) {
    databaseErrorMessage =
      "Chưa cấu hình MONGODB_URI. Đang chạy chế độ lưu trữ File JSON (Fallback).";
    console.warn(`⚠️ ${databaseErrorMessage}`);
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isDatabaseReady = true;
    databaseErrorMessage = "";
    console.log("✅ Đã kết nối MongoDB thành công.");
  } catch (error) {
    isDatabaseReady = false;
    databaseErrorMessage = error.message || "Không thể kết nối MongoDB. Đang chuyển sang File JSON.";
    console.error("❌ Lỗi kết nối MongoDB:", databaseErrorMessage);
  }
}

function normalizeReviewPayload(payload = {}) {
  const venueId = String(payload.venueId || "").trim();
  const name = String(payload.name || "").trim();
  const comment = String(payload.comment || "").trim();
  const parsedRating = Number(payload.rating);
  const rating = Number.isFinite(parsedRating)
    ? Math.min(5, Math.max(1, Math.round(parsedRating)))
    : 5;

  return { venueId, name, rating, comment };
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    databaseReady: isDatabaseReady,
    storageMode: isDatabaseReady ? "MongoDB" : "JSON_File_Fallback",
    databaseErrorMessage,
  });
});

app.get("/api/reviews", async (req, res) => {
  try {
    if (isDatabaseReady) {
      const reviews = await Review.find({}, { _id: 0 })
        .sort({ date: -1 })
        .lean();
      return res.json(reviews);
    }

    // Fallback sang File JSON
    const reviews = await readFallbackReviews();
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.json(reviews);
  } catch (error) {
    res.status(500).json({
      error: "Không tải được danh sách đánh giá từ server.",
    });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const { venueId, name, rating, comment } = normalizeReviewPayload(req.body);

    if (!venueId || !name || !comment) {
      return res.status(400).json({
        error: "Thiếu thông tin đánh giá. Cần có quán, tên và nội dung nhận xét.",
      });
    }

    const newReview = {
      venueId,
      name,
      rating,
      comment,
      date: new Date().toISOString(),
    };

    if (isDatabaseReady) {
      const review = await Review.create({
        venueId,
        name,
        rating,
        comment,
        date: new Date(),
      });
      return res.status(201).json({
        success: true,
        review: {
          venueId: review.venueId,
          name: review.name,
          rating: review.rating,
          comment: review.comment,
          date: review.date,
        },
      });
    }

    // Fallback sang File JSON
    const reviews = await readFallbackReviews();
    reviews.unshift(newReview);
    await writeFallbackReviews(reviews);

    return res.status(201).json({
      success: true,
      review: newReview,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Không thể lưu đánh giá vào server.",
    });
  }
});

const venueSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    categoryKey: { type: String, default: "family-pub" },
    description: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
      zh: { type: String, default: "" },
    },
    address: { type: String, required: true, trim: true },
    phone: { type: String, default: "Đang cập nhật" },
    hours: { type: String, default: "10:00 - 23:00" },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 10 },
    lat: { type: Number, default: 21.3089 },
    lng: { type: Number, default: 105.6049 },
    tags: [{ type: String }],
    imageUrl: { type: String, default: "./assets/restaurant-placeholder.svg" },
    menuImages: [{ type: Object }],
    menuHighlights: {
      vi: [{ type: String }],
      en: [{ type: String }],
      zh: [{ type: String }],
    },
    directionsUrl: { type: String, default: "" },
    sourceLabel: { type: String, default: "Admin thêm" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Venue = mongoose.models.Venue || mongoose.model("Venue", venueSchema);

const VENUES_FILE_PATH = path.join(__dirname, "data", "published", "venues.json");

async function readPublishedVenues() {
  try {
    const data = await fs.readFile(VENUES_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writePublishedVenues(venuesList) {
  try {
    const dir = path.dirname(VENUES_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(VENUES_FILE_PATH, JSON.stringify(venuesList, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ Lỗi ghi file venues.json:", err);
  }
}

// Endpoint lấy danh sách quán gộp giữa venues.json gốc và quán mới trong MongoDB
app.get("/api/venues", async (req, res) => {
  try {
    const fileVenues = await readPublishedVenues();
    let dbVenues = [];
    if (isDatabaseReady) {
      dbVenues = await Venue.find({}, { _id: 0 }).lean();
    }

    // Gộp mảng: Quán mới từ DB xếp lên đầu, tránh trùng lặp id
    const existingIds = new Set(dbVenues.map((v) => v.id));
    const combined = [...dbVenues, ...fileVenues.filter((v) => !existingIds.has(v.id))];
    res.json(combined);
  } catch (error) {
    res.status(500).json({ error: "Không thể lấy danh sách quán." });
  }
});

// Endpoint thêm/chỉnh sửa quán từ Admin
app.post("/api/venues", async (req, res) => {
  try {
    const venueData = req.body;
    if (!venueData.id || !venueData.name || !venueData.address) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc (id, name, address)." });
    }

    if (isDatabaseReady) {
      await Venue.findOneAndUpdate({ id: venueData.id }, venueData, { upsert: true, new: true });
    } else {
      const venuesList = await readPublishedVenues();
      const index = venuesList.findIndex((v) => v.id === venueData.id);
      if (index >= 0) {
        venuesList[index] = venueData;
      } else {
        venuesList.unshift(venueData);
      }
      await writePublishedVenues(venuesList);
    }

    res.status(201).json({ success: true, venue: venueData });
  } catch (error) {
    console.error("❌ Lỗi lưu quán mới:", error);
    res.status(500).json({ error: "Không thể lưu thông tin quán." });
  }
});

app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Web Service đang chạy tại cổng ${PORT}`);
  });
});
