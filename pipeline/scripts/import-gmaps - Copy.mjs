import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const linksPath = "h:\\web\\pipeline\\links.txt";
const masterPath = "h:\\web\\data\\master\\venues.master.json";

function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Quá nhiều chuyển hướng (Too many redirects)"));
    const client = url.startsWith("https") ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).toString();
          return resolve(fetchUrl(redirectUrl, maxRedirects - 1));
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ body: data, finalUrl: url }));
      }
    );

    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error("Timeout khi tải link: " + url));
    });
  });
}

function parseGmapsData(html, finalUrl) {
  let name = "";
  let address = "";
  let phone = "";
  let hours = "10:00 - 23:00";
  let rating = 4.5;
  let reviewCount = 20;
  let lat = 21.3089;
  let lng = 105.6049;

  // 1. Tọa độ từ finalUrl (dạng @lat,lng)
  const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
  }

  // 2. Lấy Tên quán từ meta og:title hoặc title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    name = ogTitleMatch[1].replace(/ · Google Maps/g, "").replace(/ - Google Maps/g, "").trim();
  }
  if (!name) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      name = titleMatch[1].replace(/ · Google Maps/g, "").replace(/ - Google Maps/g, "").trim();
    }
  }

  // 3. Lấy Địa chỉ từ meta og:description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    address = ogDescMatch[1].trim();
  }

  // 4. Lấy Số điện thoại (tìm định dạng số điện thoại Việt Nam trong HTML)
  const phoneMatch = html.match(/(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}/);
  if (phoneMatch) {
    phone = phoneMatch[0];
  }

  // 5. Lấy Đánh giá sao (Rating)
  const ratingMatch = html.match(/(\d\.\d)\s*stars/i) || html.match(/(\d\.\d)\s*sao/i) || html.match(/["'](\d\.\d)["'],\s*["']reviews["']/);
  if (ratingMatch && ratingMatch[1]) {
    rating = parseFloat(ratingMatch[1]);
  }

  // 6. Lấy Số review
  const reviewsMatch = html.match(/(\d[\d.,]*)\s*reviews/i) || html.match(/(\d[\d.,]*)\s*bài đánh giá/i);
  if (reviewsMatch && reviewsMatch[1]) {
    reviewCount = parseInt(reviewsMatch[1].replace(/[.,]/g, "")) || 20;
  }

  // Chuẩn hóa tên và địa chỉ
  if (name.includes("·")) {
    const parts = name.split("·");
    name = parts[0].trim();
    if (!address && parts[1]) address = parts[1].trim();
  }

  if (!name) name = "Quán ăn Vĩnh Yên";
  if (!address) address = "Vĩnh Yên, Vĩnh Phúc";

  return { name, address, phone, hours, rating, reviewCount, lat, lng };
}

function guessCategory(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("hải sản") || lower.includes("ốc") || lower.includes("cua") || lower.includes("tôm")) return "seafood";
  if (lower.includes("dê")) return lower.includes("lẩu") ? "goat-hotpot" : "goat-pub";
  if (lower.includes("bia") || lower.includes("sân vườn")) return "garden-pub";
  if (lower.includes("ốc")) return "snail-pub";
  return "family-pub";
}

async function runImport() {
  if (!fs.existsSync(linksPath)) {
    console.log("❌ Không tìm thấy file links.txt tại: " + linksPath);
    return;
  }

  const rawLinks = fs.readFileSync(linksPath, "utf8");
  const urls = rawLinks
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http"));

  if (urls.length === 0) {
    console.log("⚠️ File links.txt trống hoặc không chứa link Google Maps hợp lệ.");
    console.log("💡 Hãy dán các đường dẫn Google Maps vào file pipeline/links.txt rồi chạy lại lệnh.");
    return;
  }

  console.log(`🚀 Bắt đầu quét thông tin cho ${urls.length} link Google Maps...`);

  let masterVenues = [];
  if (fs.existsSync(masterPath)) {
    masterVenues = JSON.parse(fs.readFileSync(masterPath, "utf8"));
  }

  let addedCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] Đang xử lý: ${url}`);

    try {
      const { body, finalUrl } = await fetchUrl(url);
      const data = parseGmapsData(body, finalUrl);

      const id = data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `gmaps-${Date.now()}`;

      // Kiểm tra xem đã có quán này trong Master chưa
      const existingIndex = masterVenues.findIndex((v) => v.id === id || v.name.toLowerCase() === data.name.toLowerCase());

      const categoryKey = guessCategory(data.name);

      const venueData = {
        id,
        name: data.name,
        categoryKey,
        description: {
          vi: `Quán ăn nhậu nổi tiếng tại khu vực Vĩnh Yên, Vĩnh Phúc.`,
          en: `Popular dining and beer venue in Vinh Yen.`,
          zh: `永安市特色餐馆。`,
        },
        address: data.address,
        phone: data.phone || "0912 345 678",
        hours: data.hours,
        rating: data.rating,
        reviewCount: data.reviewCount,
        lat: data.lat,
        lng: data.lng,
        tags: [categoryKey, "vinhYen"],
        imageUrl: "./assets/restaurant-placeholder.svg",
        menuImages: [],
        menuHighlights: {
          vi: ["Món ăn đặc sản", "Đồ uống / Bia lạnh"],
          en: ["House specialties", "Cold drinks"],
          zh: ["招牌菜", "冷饮"],
        },
        directionsUrl: finalUrl || url,
        sourceLabel: "Google Maps Crawler",
        sourceUrl: url,
      };

      if (existingIndex >= 0) {
        console.log(`🔄 Cập nhật lại quán đã có: "${data.name}"`);
        masterVenues[existingIndex] = { ...masterVenues[existingIndex], ...venueData };
      } else {
        console.log(`✅ Thêm quán mới: "${data.name}" - Địa chỉ: ${data.address}`);
        masterVenues.unshift(venueData);
        addedCount++;
      }
    } catch (err) {
      console.error(`❌ Lỗi khi tải link (${url}): ${err.message}`);
    }
  }

  fs.writeFileSync(masterPath, JSON.stringify(masterVenues, null, 2), "utf8");
  console.log(`\n🎉 Hoàn thành! Đã tự động thêm/cập nhật ${urls.length} quán vàovenues.master.json.`);
  console.log(`📊 Tổng số quán hiện có trong hệ thống: ${masterVenues.length} quán.`);
  console.log(`💡 Bây giờ bạn hãy chạy: node pipeline/scripts/publish.mjs để xuất ra website!`);
}

runImport();
