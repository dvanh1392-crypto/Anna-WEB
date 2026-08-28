import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const linksPath = "h:\\web\\pipeline\\links.txt";
const masterPath = "h:\\web\\data\\master\\venues.master.json";

function fetchFinalUrlAndHtml(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error("Quá nhiều chuyển hướng"));
    
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return reject(new Error("URL không hợp lệ"));
    }

    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          const redirectUrl = res.headers.location.startsWith("http")
            ? res.headers.location
            : new URL(res.headers.location, url).toString();
          return resolve(fetchFinalUrlAndHtml(redirectUrl, maxRedirects - 1));
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ body: data, finalUrl: url }));
      }
    );

    req.on("error", (err) => {
      req.destroy();
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Timeout khi kết nối"));
    });
  });
}

function parseGmapsData(html, finalUrl) {
  let name = "";
  let address = "";
  let phone = "";
  let hours = "10:00 - 23:00";
  let imageUrl = "./assets/restaurant-placeholder.svg";
  let rating = 4.5;
  let reviewCount = 20;
  let lat = 21.3089;
  let lng = 105.6049;

  // 1. Tọa độ lat, lng từ finalUrl (@lat,lng)
  const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
  }

  // 2. Tên quán từ meta og:title hoặc title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    name = ogTitleMatch[1].replace(/ · Google Maps/g, "").replace(/ - Google Maps/g, "").trim();
  }

  // 3. Địa chỉ từ meta og:description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    address = ogDescMatch[1].trim();
  }

  // 4. Ảnh đại diện thực tế từ og:image
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImgMatch && ogImgMatch[1] && !ogImgMatch[1].includes("staticmap")) {
    imageUrl = ogImgMatch[1];
  }

  // 5. Số điện thoại Việt Nam
  const phoneMatch = html.match(/(?:\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}/);
  if (phoneMatch) {
    phone = phoneMatch[0];
  }

  // 6. Bóc tách Giờ mở cửa thực tế nếu tìm thấy
  const hoursMatch = html.match(/(?:Mở cửa|Open)\s*[:·]?\s*(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/i);
  if (hoursMatch && hoursMatch[1]) {
    hours = hoursMatch[1];
  }

  // 7. Bóc tách Rating & Review count
  const ratingMatch = html.match(/(\d\.\d)\s*stars/i) || html.match(/(\d\.\d)\s*sao/i) || html.match(/["'](\d\.\d)["'],\s*["']reviews["']/);
  if (ratingMatch && ratingMatch[1]) {
    rating = parseFloat(ratingMatch[1]);
  }

  const reviewsMatch = html.match(/(\d[\d.,]*)\s*reviews/i) || html.match(/(\d[\d.,]*)\s*bài đánh giá/i);
  if (reviewsMatch && reviewsMatch[1]) {
    reviewCount = parseInt(reviewsMatch[1].replace(/[.,]/g, "")) || 20;
  }

  // Lọc tên nếu dính ký tự phân cách của Google
  if (name.includes("·")) {
    const parts = name.split("·");
    name = parts[0].trim();
    if (!address && parts[1]) address = parts[1].trim();
  }

  return { name, address, phone, hours, imageUrl, rating, reviewCount, lat, lng };
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
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http"));

  if (urls.length === 0) {
    console.log("⚠️ File links.txt trống.");
    return;
  }

  console.log(`🚀 Bắt đầu lấy dữ liệu cho ${urls.length} link Google Maps...`);

  let masterVenues = [];
  if (fs.existsSync(masterPath)) {
    try {
      masterVenues = JSON.parse(fs.readFileSync(masterPath, "utf8"));
    } catch (e) {
      masterVenues = [];
    }
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i + 1}/${urls.length}] Xử lý: ${url}`);

    try {
      const { body, finalUrl } = await fetchFinalUrlAndHtml(url);
      const data = parseGmapsData(body, finalUrl);

      const displayName = data.name || `Quán ăn Vĩnh Yên #${i + 1}`;
      const displayAddress = data.address || "Vĩnh Yên, Vĩnh Phúc";

      const id = displayName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const categoryKey = guessCategory(displayName);

      const existingIndex = masterVenues.findIndex((v) => v.id === id || v.sourceUrl === url);
      const existingVenue = existingIndex >= 0 ? masterVenues[existingIndex] : {};

      const venueData = {
        id: id || `venue-${i + 1}`,
        name: displayName,
        categoryKey,
        description: existingVenue.description || {
          vi: `Quán ăn nhậu nổi tiếng tại khu vực Vĩnh Yên, Vĩnh Phúc.`,
          en: `Popular dining and beer venue in Vinh Yen.`,
          zh: `永安市特色餐馆。`,
        },
        address: displayAddress,
        phone: data.phone || existingVenue.phone || "0912 345 678",
        hours: data.hours || existingVenue.hours || "10:00 - 23:00",
        rating: data.rating,
        reviewCount: data.reviewCount,
        lat: data.lat,
        lng: data.lng,
        tags: existingVenue.tags || [categoryKey, "vinhYen"],
        imageUrl: data.imageUrl !== "./assets/restaurant-placeholder.svg" ? data.imageUrl : (existingVenue.imageUrl || data.imageUrl),
        menuImages: existingVenue.menuImages || [],
        menuHighlights: existingVenue.menuHighlights || {
          vi: ["Món ăn đặc sản", "Đồ uống / Bia lạnh"],
          en: ["House specialties", "Cold drinks"],
          zh: ["招牌菜", "冷饮"],
        },
        directionsUrl: finalUrl || url,
        sourceLabel: "Google Maps Crawler",
        sourceUrl: url,
      };

      if (existingIndex >= 0) {
        console.log(`🔄 Cập nhật: "${displayName}"`);
        masterVenues[existingIndex] = { ...masterVenues[existingIndex], ...venueData };
      } else {
        console.log(`✅ Thêm mới: "${displayName}" - Địa chỉ: ${displayAddress}`);
        masterVenues.unshift(venueData);
      }
    } catch (err) {
      console.error(`❌ Lỗi link [${i + 1}]: ${err.message}`);
    }
  }

  fs.writeFileSync(masterPath, JSON.stringify(masterVenues, null, 2), "utf8");
  console.log(`\n🎉 Hoàn thành! Đã cập nhật xong dữ liệu vào venues.master.json.`);
}

runImport();