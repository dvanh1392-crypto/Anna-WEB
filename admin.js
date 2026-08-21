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

  try {
    const decodedUrl = decodeURIComponent(urlStr);

    // 1. Lấy tọa độ từ @lat,lng
    const coordMatch = urlStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      lat = parseFloat(coordMatch[1]);
      lng = parseFloat(coordMatch[2]);
    }

    // 2. Lấy tên quán từ /place/TEN_QUAN/
    const placeMatch = decodedUrl.match(/\/place\/([^\/@?#]+)/);
    if (placeMatch && placeMatch[1]) {
      name = placeMatch[1].replace(/\+/g, " ").trim();
    }

    // 3. Lấy tên quán từ /search/TEN_QUAN/
    if (!name) {
      const searchMatch = decodedUrl.match(/\/search\/([^\/@?#]+)/);
      if (searchMatch && searchMatch[1]) {
        name = searchMatch[1].replace(/\+/g, " ").trim();
      }
    }

    // 4. Lấy tên quán từ query param q=TEN_QUAN
    if (!name) {
      const qParam = new URL(urlStr).searchParams.get("q");
      if (qParam && !qParam.match(/^-?\d+\.\d+,/)) {
        name = qParam.replace(/\+/g, " ").trim();
      }
    }
  } catch (e) {
    console.error(e);
  }

  return { name, lat, lng };
}

if (importGmapsBtn) {
  importGmapsBtn.addEventListener("click", () => {
    const url = gmapsUrlInput.value.trim();
    if (!url) {
      showImportStatus("Vui lòng dán đường dẫn Google Maps!", true);
      return;
    }

    const parsed = parseGmapsUrl(url);
    const name = parsed.name || "Quán mới nhập từ Maps";
    const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `quan-map-${Date.now()}`;

    const newCandidate = {
      id: id,
      name: name,
      categoryKey: "family-pub",
      description: {
        vi: `Địa điểm nhậu/ăn uống mới nhập từ Google Maps.`,
        en: `New venue imported from Google Maps.`,
        zh: `从谷歌地图导入的新地点。`
      },
      address: "Khu vực Vĩnh Yên, Vĩnh Phúc",
      phone: "",
      hours: "09:00 - 23:00",
      rating: 4.2,
      reviewCount: 15,
      lat: parsed.lat || 21.3089,
      lng: parsed.lng || 105.6049,
      tags: ["googleMaps", "imported"],
      imageUrl: "./assets/restaurant-placeholder.svg",
      menuImages: [],
      menuHighlights: {
        vi: ["Các món nhắm bình dân", "Bia tươi / Bia hơi"],
        en: ["Casual side dishes", "Draft beer"],
        zh: ["平民下酒菜", "扎啤"]
      },
      directionsUrl: url,
      sourceLabel: "Google Maps",
      sourceUrl: url
    };

    pendingCandidates.unshift(newCandidate);
    saveCandidatesToLocal();
    gmapsUrlInput.value = "";
    showImportStatus(`✅ Đã trích xuất & thêm "${name}" vào Danh sách chờ duyệt!`);

    adminMode.value = "candidates";
    currentMode = "candidates";
    renderList();
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
      if (Array.isArray(localData) && localData.length > masterVenues.length) {
        masterVenues = localData;
      }
    } catch(e){}
  }

  const savedCandidates = localStorage.getItem("vinyen_pending_candidates");
  if (savedCandidates) {
    try { pendingCandidates = JSON.parse(savedCandidates); } catch(e){}
  }

  showStatus(`✅ Đã nạp đầy đủ ${masterVenues.length} quán từ venues.master.json và ${pendingCandidates.length} quán chờ duyệt.`);
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

      card.querySelector(".admin-id").value = venue.id;
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
