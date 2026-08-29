let masterVenues = [];
let pendingCandidates = [];
let currentMode = "master";

const loadMasterBtn = document.getElementById("loadMasterBtn");
const loadCandidatesBtn = document.getElementById("loadCandidatesBtn");
const refreshBtn = document.getElementById("refreshBtn");
const downloadMasterBtn = document.getElementById("downloadMasterBtn");
const downloadPublishedBtn = document.getElementById("downloadPublishedBtn");
const adminSearch = document.getElementById("adminSearch");
const adminMode = document.getElementById("adminMode");
const adminStatus = document.getElementById("adminStatus");
const adminGrid = document.getElementById("adminGrid");
const adminListTitle = document.getElementById("adminListTitle");
const adminListSubtitle = document.getElementById("adminListSubtitle");

const importGmapsBtn = document.getElementById("importGmapsBtn");
const gmapsUrlInput = document.getElementById("gmapsUrlInput");
const importGmapsStatus = document.getElementById("importGmapsStatus");

const candidateTemplate = document.getElementById("candidateCardTemplate");
const masterTemplate = document.getElementById("masterCardTemplate");

function showStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
}

function showImportStatus(message, isError = false) {
  importGmapsStatus.style.display = "block";
  importGmapsStatus.textContent = message;
  importGmapsStatus.style.borderColor = isError ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)";
}

// Bóc tách thông tin từ Google Maps URL
function parseGmapsUrl(urlStr) {
  let lat = null;
  let lng = null;
  let name = "";
  let address = "";

  try {
    const decodedUrl = decodeURIComponent(urlStr);

    // 1. Lấy tọa độ từ @lat,lng
    const coordMatch = urlStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      lat = parseFloat(coordMatch[1]);
      lng = parseFloat(coordMatch[2]);
    }

    // 2. Lấy tên từ !1s...!2sTEN_QUAN (dạng link chia sẻ)
    const shareMatch = decodedUrl.match(/!2s([^!]+)/);
    if (shareMatch && shareMatch[1]) {
      name = shareMatch[1].replace(/\+/g, " ").trim();
    }

    // 3. Lấy tên quán từ /place/TEN_QUAN/
    if (!name) {
      const placeMatch = decodedUrl.match(/\/place\/([^\/@?#]+)/);
      if (placeMatch && placeMatch[1]) {
        name = placeMatch[1].replace(/\+/g, " ").trim();
      }
    }

    // 4. Lấy tên quán từ /search/TEN_QUAN/ hoặc query param q=
    if (!name) {
      const searchMatch = decodedUrl.match(/\/search\/([^\/@?#]+)/);
      if (searchMatch && searchMatch[1]) {
        name = searchMatch[1].replace(/\+/g, " ").trim();
      }
    }

    // Nếu tên chứa phẩy (chứa địa chỉ) -> tách tên và địa chỉ
    if (name.includes(",")) {
      const parts = name.split(",");
      name = parts[0].trim();
      address = parts.slice(1).join(",").trim();
    }
  } catch (e) {
    console.error(e);
  }

  return { name, lat, lng, address };
}

// Bộ từ điển mẫu tự động dịch Mô tả & Món ăn chuẩn 3 ngôn ngữ theo loại quán
const presetTemplates = {
  "family-pub": {
    desc: {
      vi: "Quán ăn nhậu gia đình ấm cúng, không gian thoáng mát tại khu vực Vĩnh Yên, phù hợp tụ họp bạn bè.",
      en: "Cozy family dining & drinking spot with a spacious atmosphere in Vinh Yen, perfect for gatherings.",
      zh: "永安地区温馨的家庭聚餐与小酌场所，环境舒适，非常适合朋友聚会。"
    },
    menu: {
      vi: ["Lẩu thập cẩm", "Gà chạy bộ hấp lá chanh", "Bia lạnh / Đồ uống giải khát"],
      en: ["Hotpot combo", "Steamed free-range chicken with lime leaves", "Cold beer & Refreshments"],
      zh: ["什锦火锅", "柠檬叶蒸走地鸡", "冰镇啤酒 / 凉饮"]
    },
    tags: ["family", "gathering", "vinhYen"]
  },
  "garden-pub": {
    desc: {
      vi: "Quán nhậu sân vườn rộng rãi, nhiều cây xanh, đồ ăn tươi ngon đặc sắc tại Vĩnh Yên.",
      en: "Spacious garden pub with lush greenery and delicious fresh dishes in Vinh Yen.",
      zh: "永安大型花园露天酒馆，绿树成荫，提供新鲜美味特色菜肴。"
    },
    menu: {
      vi: ["Đồ nướng than hoa", "Bò nướng tảng", "Bia hơi tươi mát"],
      en: ["Charcoal BBQ", "Grilled beef steak", "Fresh draft beer"],
      zh: ["炭火烧烤", "烤大块牛肉", "清爽鲜啤酒"]
    },
    tags: ["gardenPub", "outdoor", "popular"]
  },
  "seafood": {
    desc: {
      vi: "Nhà hàng hải sản tươi sống nhập mới hàng ngày, chế biến đậm đà phục vụ thực khách Vĩnh Yên.",
      en: "Fresh seafood restaurant sourced daily, skillfully prepared for Vinh Yen foodies.",
      zh: "每日新鲜到货的海鲜餐厅，精心烹饪，服务永安食客。"
    },
    menu: {
      vi: ["Cua / Ghẹ hấp sả", "Tôm hùm bỏ lò phô mai", "Mực trứng chiên mắm"],
      en: ["Steamed crab with lemongrass", "Baked lobster with cheese", "Fried squid with fish sauce"],
      zh: ["香茅蒸蟹", "芝麻烤龙虾", "鱼露炸蛋黄鱿鱼"]
    },
    tags: ["seafood", "fresh", "premium"]
  },
  "goat-pub": {
    desc: {
      vi: "Quán chuyên các món dê núi Ninh Bình tươi ngon, hương vị đậm đà hấp dẫn.",
      en: "Specialty restaurant serving fresh Ninh Binh mountain goat dishes with rich flavors.",
      zh: "专业提供新鲜宁平山羊肉菜肴的特色餐馆，风味浓郁吸引人。"
    },
    menu: {
      vi: ["Dê tái chanh", "Dê nướng tảng", "Tiết canh dê đặc sản"],
      en: ["Goat salad with lime", "Grilled mountain goat", "Specialty goat blood soup"],
      zh: ["柠汁凉拌羊肉", "烤大块山羊肉", "特色羊血冻"]
    },
    tags: ["goatPub", "specialty", "ninhBinh"]
  },
  "goat-hotpot": {
    desc: {
      vi: "Quán lẩu dê thuốc bắc thơm nức, bổ dưỡng, nước dùng đậm đà cho những ngày tụ họp.",
      en: "Nutritious herbal goat hotpot with rich flavorful broth, ideal for social gatherings.",
      zh: "香气扑鼻滋补的中药羊肉火锅，汤底浓郁，非常适合聚会。"
    },
    menu: {
      vi: ["Lẩu dê nhúng dấm", "Lẩu dê thuốc bắc", "Vú dê nướng sa tế"],
      en: ["Goat hotpot in vinegar broth", "Herbal goat hotpot", "Sate grilled goat udder"],
      zh: ["醋汤涮羊肉火锅", "中药滋补羊肉锅", "沙爹烤羊乳房"]
    },
    tags: ["goatHotpot", "nutritious", "popular"]
  },
  "snail-pub": {
    desc: {
      vi: "Quán ốc và đồ ăn vặt nhậu đêm nhộn nhịp, đa dạng các loại ốc tươi hấp sả ớt.",
      en: "Lively night snail & snack pub featuring a variety of fresh snails steamed with lemongrass & chili.",
      zh: "热闹的夜宵螺类与小吃酒馆，提供丰富多样香茅辣椒蒸鲜螺。"
    },
    menu: {
      vi: ["Ốc hương xào bơ tỏi", "Ốc mồi hấp sả", "Nem chua rán nướng"],
      en: ["Sweet snails sauteed in garlic butter", "Steamed snails with lemongrass", "Fried fermented pork rolls"],
      zh: ["蒜蓉黄油炒香螺", "香茅蒸鲜螺", "炸发酵酸肉卷"]
    },
    tags: ["snailPub", "nightLife", "snacks"]
  }
};

if (importGmapsBtn) {
  importGmapsBtn.addEventListener("click", async () => {
    const manualName = document.getElementById("manualNameInput")?.value.trim() || "";
    const manualAddress = document.getElementById("manualAddressInput")?.value.trim() || "";
    const manualPhone = document.getElementById("manualPhoneInput")?.value.trim() || "";
    const manualHours = document.getElementById("manualHoursInput")?.value.trim() || "";
    const manualRating = parseFloat(document.getElementById("manualRatingInput")?.value) || 4.5;
    const manualCategory = document.getElementById("manualCategoryInput")?.value || "family-pub";
    const url = gmapsUrlInput?.value.trim() || "";

    if (!manualName && !url) {
      showImportStatus("Vui lòng nhập Tên quán hoặc dán Đường dẫn Google Maps!", true);
      return;
    }

    showImportStatus("⏳ Đang tự động xử lý và dịch thuật đa ngôn ngữ...", false);

    const parsed = parseGmapsUrl(url);
    const finalName = manualName || parsed.name || "Quán ăn mới Vĩnh Yên";
    const finalAddress = manualAddress || parsed.address || "TP. Vĩnh Yên, Vĩnh Phúc";
    const id = finalName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `quan-map-${Date.now()}`;

    // Tự động chọn template dịch thuật tương ứng với loại quán
    const template = presetTemplates[manualCategory] || presetTemplates["family-pub"];

    const newVenue = {
      id: id,
      name: finalName,
      categoryKey: manualCategory,
      description: template.desc,
      address: finalAddress,
      phone: manualPhone || "Đang cập nhật",
      hours: manualHours || "10:00 - 23:00",
      rating: manualRating,
      reviewCount: 15,
      lat: parsed.lat || 21.3089,
      lng: parsed.lng || 105.6049,
      tags: template.tags,
      imageUrl: "./assets/restaurant-placeholder.svg",
      menuImages: [],
      menuHighlights: template.menu,
      directionsUrl: (parsed.lat && parsed.lng) 
        ? `https://www.google.com/maps/dir/?api=1&destination=${parsed.lat},${parsed.lng}` 
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(finalName + " " + finalAddress)}`,
      sourceLabel: "Thêm từ Admin",
      sourceUrl: url
    };

    try {
      // 🚀 Gửi API lưu thẳng vào MongoDB/Server mà KHÔNG CẦN GIT PUSH!
      const API_BASE = window.location.origin;
      const res = await fetch(`${API_BASE}/api/venues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVenue),
      });

      if (res.ok) {
        masterVenues.unshift(newVenue);
        saveMasterToLocal();

        if (document.getElementById("manualNameInput")) document.getElementById("manualNameInput").value = "";
        if (document.getElementById("manualAddressInput")) document.getElementById("manualAddressInput").value = "";
        if (document.getElementById("manualPhoneInput")) document.getElementById("manualPhoneInput").value = "";
        if (document.getElementById("manualHoursInput")) document.getElementById("manualHoursInput").value = "";
        if (document.getElementById("manualRatingInput")) document.getElementById("manualRatingInput").value = "";
        if (gmapsUrlInput) gmapsUrlInput.value = "";

        showImportStatus(`🎉 ĐÃ LƯU TRỰC TIẾP QUÁN "${finalName}" VÀO DATABASE MONGODB! Quán mới đã hiển thị chuẩn 3 ngôn ngữ trên trang chủ.`);
        adminMode.value = "master";
        currentMode = "master";
        renderList();
      } else {
        showImportStatus("❌ Không thể lưu quán mới lên Server.", true);
      }
    } catch (err) {
      console.error(err);
      // Fallback lưu local nếu mất mạng
      masterVenues.unshift(newVenue);
      saveMasterToLocal();
      showImportStatus(`⚠️ Đã lưu quán "${finalName}" vào bộ nhớ tạm local (Server không phản hồi).`);
    }
  });
}

async function loadData() {
  try {
    const masterRes = await fetch("./data/master/venues.master.json?v=" + Date.now());
    if (masterRes.ok) {
      const fileData = await masterRes.json();
      if (Array.isArray(fileData) && fileData.length > 0) {
        masterVenues = fileData;
      }
    }
  } catch (e) {
    console.warn("Chưa đọc được master file");
  }

  // Khôi phục các quán đã sửa/thêm local nếu có
  const savedMaster = localStorage.getItem("vinyen_master_venues");
  if (savedMaster) {
    try {
      const localData = JSON.parse(savedMaster);
      if (Array.isArray(localData)) {
        // Gộp quán mới trong localStorage vào master file gốc nếu chưa có
        localData.forEach(item => {
          if (!masterVenues.some(m => m.id === item.id || m.name === item.name)) {
            masterVenues.push(item);
          }
        });
      }
    } catch(e){}
  }

  const savedCandidates = localStorage.getItem("vinyen_pending_candidates");
  if (savedCandidates) {
    try { pendingCandidates = JSON.parse(savedCandidates); } catch(e){}
  }

  showStatus(`✅ Đã nạp tổng cộng ${masterVenues.length} quán (cả cũ và mới) vào hệ thống!`);
  renderList();
}

function saveMasterToLocal() {
  localStorage.setItem("vinyen_master_venues", JSON.stringify(masterVenues));
}

function saveCandidatesToLocal() {
  localStorage.setItem("vinyen_pending_candidates", JSON.stringify(pendingCandidates));
}

function renderList() {
  adminGrid.innerHTML = "";
  const query = adminSearch.value.trim().toLowerCase();

  let list = currentMode === "master" ? masterVenues : pendingCandidates;
  if (query) {
    list = list.filter(item => 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.address && item.address.toLowerCase().includes(query))
    );
  }

  adminListTitle.textContent = currentMode === "master" ? "Danh sách quán đã duyệt (Master)" : "Danh sách quán chờ duyệt";
  adminListSubtitle.textContent = `Hiển thị ${list.length} địa điểm.`;

  list.forEach((venue, index) => {
    if (currentMode === "master") {
      const card = masterTemplate.content.cloneNode(true);
      card.querySelector(".venue-category").textContent = venue.categoryKey || "Chưa phân loại";
      card.querySelector(".venue-name").textContent = venue.name;
      card.querySelector(".venue-rating").textContent = `★ ${venue.rating || 4.0}`;
      card.querySelector(".venue-description").textContent = venue.description?.vi || "";

      const idInput = card.querySelector(".admin-id");
      idInput.value = venue.id;
      idInput.readOnly = true;
      idInput.title = "ID cố định của quán (không thể sửa để tránh mất đánh giá)";
      idInput.style.backgroundColor = "#f1f5f9";
      card.querySelector(".admin-category").value = venue.categoryKey || "family-pub";
      card.querySelector(".admin-rating").value = venue.rating || 4.0;
      card.querySelector(".admin-reviews").value = venue.reviewCount || 10;
      card.querySelector(".admin-name").value = venue.name;
      card.querySelector(".admin-address").value = venue.address || "";
      card.querySelector(".admin-phone").value = venue.phone || "";
      card.querySelector(".admin-hours").value = venue.hours || "";
      card.querySelector(".admin-image").value = venue.imageUrl || "";
      card.querySelector(".admin-tags").value = (venue.tags || []).join(", ");

      const mapBtn = card.querySelector(".admin-open-map");
      mapBtn.href = venue.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}`;

      card.querySelector(".admin-save").addEventListener("click", () => {
        const article = adminGrid.children[index];
        venue.id = article.querySelector(".admin-id").value;
        venue.categoryKey = article.querySelector(".admin-category").value;
        venue.rating = parseFloat(article.querySelector(".admin-rating").value) || 4.0;
        venue.reviewCount = parseInt(article.querySelector(".admin-reviews").value) || 10;
        venue.name = article.querySelector(".admin-name").value;
        venue.address = article.querySelector(".admin-address").value;
        venue.phone = article.querySelector(".admin-phone").value;
        venue.hours = article.querySelector(".admin-hours").value;
        venue.imageUrl = article.querySelector(".admin-image").value;
        venue.tags = article.querySelector(".admin-tags").value.split(",").map(t => t.trim()).filter(Boolean);

        saveMasterToLocal();
        showStatus(`✅ Đã lưu thay đổi cho "${venue.name}"!`);
        renderList();
      });

      card.querySelector(".admin-delete").addEventListener("click", () => {
        if (confirm(`Bạn có chắc muốn xóa quán "${venue.name}"?`)) {
          masterVenues.splice(index, 1);
          saveMasterToLocal();
          showStatus(`Đã xóa quán khỏi danh sách!`);
          renderList();
        }
      });

      adminGrid.appendChild(card);
    } else {
      const card = candidateTemplate.content.cloneNode(true);
      card.querySelector(".venue-category").textContent = venue.categoryKey || "Cần duyệt";
      card.querySelector(".venue-name").textContent = venue.name;
      card.querySelector(".venue-rating").textContent = `★ ${venue.rating || 4.0}`;
      card.querySelector(".venue-source").textContent = venue.sourceLabel || "Chưa rõ";
      card.querySelector(".venue-coordinates").textContent = `${venue.lat || 0}, ${venue.lng || 0}`;
      card.querySelector(".venue-hours").textContent = venue.hours || "Chưa có";
      card.querySelector(".venue-bestmatch").textContent = "Không";

      card.querySelector(".admin-name").value = venue.name || "";
      card.querySelector(".admin-id").value = venue.id;
      card.querySelector(".admin-category").value = venue.categoryKey || "family-pub";
      card.querySelector(".admin-image").value = venue.imageUrl || "";
      card.querySelector(".admin-phone").value = venue.phone || "";
      card.querySelector(".admin-address").value = venue.address || "";

      const mapBtn = card.querySelector(".admin-open-map");
      mapBtn.href = venue.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name)}`;

      card.querySelector(".admin-promote").addEventListener("click", () => {
        const article = adminGrid.children[index];
        venue.name = article.querySelector(".admin-name").value || venue.name;
        venue.id = article.querySelector(".admin-id").value || venue.id;
        venue.categoryKey = article.querySelector(".admin-category").value;
        venue.imageUrl = article.querySelector(".admin-image").value;
        venue.phone = article.querySelector(".admin-phone").value;
        venue.address = article.querySelector(".admin-address").value;

        masterVenues.push(venue);
        pendingCandidates.splice(index, 1);

        saveMasterToLocal();
        saveCandidatesToLocal();
        showStatus(`🎉 Đã duyệt và chuyển "${venue.name}" sang Danh sách Master!`);
        renderList();
      });

      adminGrid.appendChild(card);
    }
  });
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

if (loadMasterBtn) loadMasterBtn.addEventListener("click", () => { currentMode = "master"; adminMode.value = "master"; renderList(); });
if (loadCandidatesBtn) loadCandidatesBtn.addEventListener("click", () => { currentMode = "candidates"; adminMode.value = "candidates"; renderList(); });
if (refreshBtn) refreshBtn.addEventListener("click", loadData);
if (adminMode) adminMode.addEventListener("change", (e) => { currentMode = e.target.value; renderList(); });
if (adminSearch) adminSearch.addEventListener("input", renderList);

if (downloadMasterBtn) downloadMasterBtn.addEventListener("click", () => {
  downloadJSON("venues.master.json", masterVenues);
});

if (downloadPublishedBtn) downloadPublishedBtn.addEventListener("click", () => {
  downloadJSON("venues.json", masterVenues);
});

loadData();
