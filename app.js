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

app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

connectDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Web Service đang chạy tại cổng ${PORT}`);
  });
});
