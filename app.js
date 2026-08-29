import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://dvanh1392_db_user:2snY4Qwe60ot0nme@cluster0.hijknxb.mongodb.net/vinyen_db?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Kết nối thành công Cơ sở dữ liệu MongoDB Atlas!"))
  .catch((err) => console.error("❌ Lỗi kết nối MongoDB Atlas:", err.message));

const reviewSchema = new mongoose.Schema({
  venueId: { type: String, required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, default: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

// API Lấy danh sách review
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách đánh giá từ database." });
  }
});

// API Tạo review mới
app.post("/api/reviews", async (req, res) => {
  try {
    const { venueId, name, rating, comment } = req.body;
    if (!venueId || !name || !comment) {
      return res.status(400).json({ error: "Thiếu thông tin đánh giá" });
    }

    const newReview = new Review({
      venueId,
      name: name.trim(),
      rating: parseInt(rating) || 5,
      comment: comment.trim(),
    });

    await newReview.save();
    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    res.status(500).json({ error: "Không thể lưu đánh giá vào database." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});