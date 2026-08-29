/* ==========================================================================
   FRONTEND LOGIC (GIAO DIỆN CLIENT CHẠY TRÊN TRÌNH DUYỆT)
   ========================================================================== */

// Web trên Render Web Service và API review dùng chung 1 origin.
const API_BASE_URL = typeof window !== "undefined" ? window.location.origin : "";
const REVIEWS_API_PATH = "/api/reviews";
const REVIEWS_AUTO_REFRESH_MS = 15000;

const translations = {
  vi: {
    title: "Bia & Nhậu Vĩnh Yên",
    metaDescription: "Trang giới thiệu quán bia, quán nhậu ở thành phố Vĩnh Yên.",
    brandTitle: "Bia & Nhậu Vĩnh Yên",
    brandSubtitle: "Khám phá quán ngon gần bạn",
    topCta: "Xem danh sách quán",
    heroEyebrow: "Website giới thiệu địa điểm ăn nhậu tại Vĩnh Yên",
    heroTitle: "Tìm quán bia, quán nhậu phù hợp theo vị trí của bạn",
    heroText: "Xem nhanh thông tin quán, địa chỉ, giờ mở cửa...",
    locateButton: "📍 Dùng vị trí của tôi",
    heroExploreButton: "🔍 Khám phá ngay",
    howItWorksButton: "Cách hoạt động",
    panelLabel: "Tổng quan",
    panelTitle: "Những gì người dùng có thể xem",
    featureList: [
      "Danh sách quán trong khu vực Vĩnh Yên",
      "Địa chỉ, số điện thoại, giờ mở cửa",
      "Điểm đánh giá và số lượt review tham khảo",
      "Ảnh quán và ảnh menu nếu có công khai",
      "Khoảng cách từ vị trí hiện tại đến quán",
    ],
    introLabel: "Dành cho người đi ăn cùng bạn bè",
    introTitle: "Giao diện đơn giản, dễ xem trên điện thoại",
    introText: "Trang được thiết kế theo kiểu danh sách nổi bật...",
    statsLabel: "Tính năng nổi bật",
    statVenueCountText: "quán trong dữ liệu mẫu",
    statTapTitle: "1 chạm",
    statTapText: "để lấy vị trí hiện tại",
    statFastTitle: "3 ngôn ngữ",
    statFastText: "Việt, Anh, Trung",
    filterLabel: "Công cụ khám phá",
    filterTitle: "Lọc và tìm quán",
    filterNote: "Khi đã cho phép truy cập vị trí, bạn có thể sắp xếp theo quán gần nhất.",
    searchLabel: "Tìm theo tên quán",
    searchPlaceholder: "Ví dụ: Hải Sản Hường Lê",
    categoryLabel: "Loại quán",
    categoryAll: "Tất cả",
    sortLabel: "Sắp xếp",
    sortRating: "Đánh giá cao",
    sortDistance: "Gần bạn nhất",
    sortReviews: "Nhiều review",
    sortName: "Tên A-Z",
    resultTitle: "Danh sách quán",
    geoNoteLabel: "Lưu ý khi dùng định vị",
    geoNoteText: "Trình duyệt cần được chạy qua `localhost` hoặc có `https`.",
    futureLabel: "Mở rộng sau này",
    futureText: "Bạn có thể bổ sung trang chi tiết quán...",
    highlightBest: "Đánh giá cao",
    highlightPopular: "Nhiều review",
    highlightNear: "Gần bạn",
    highlightQuick: "Gợi ý nhanh",
    highlightBestText: "{rating} sao từ {reviews} review tham khảo.",
    highlightPopularText: "{reviews} lượt review.",
    highlightNearText: "Khoảng cách ước tính {distance}.",
    highlightQuickText: "Bật định vị để xem quán gần bạn nhất.",
    resultLoaded: "Hiển thị {count} quán.",
    resultEmpty: "Không tìm thấy quán phù hợp.",
    emptyHint: "Thử đổi từ khóa tìm kiếm.",
    distanceUnknown: "Bật định vị để xem",
    reviewText: "{count} review tham khảo",
    sourcePrefix: "Nguồn",
    imageAltRestaurant: "Ảnh quán {name}",
    imageAltMenu: "Ảnh menu của {name}",
    menuPanelTitle: "Ảnh menu và món nổi bật",
    menuPanelHasImages: "Có {count} ảnh menu tham khảo.",
    menuPanelNoImages: "Chưa tìm thấy ảnh menu công khai.",
    menuEmpty: "Chưa có ảnh menu.",
    directionsBtn: "📍 Chỉ đường Maps",
    reviewBtn: "⭐ Đánh giá quán",
    viewReviewsBtn: "💬 Xem đánh giá ({count})",
    fieldAddress: "Địa chỉ",
    fieldHours: "Giờ mở cửa",
    fieldPhone: "Liên hệ",
    fieldDistance: "Khoảng cách",
    modalWriteTitle: "Viết đánh giá cho: {name}",
    lblReviewerName: "Tên của bạn:",
    phReviewerName: "Nhập tên của bạn...",
    lblReviewerRating: "Đánh giá sao (1-5★):",
    optRating5: "⭐⭐⭐⭐⭐ (5/5) - Rất tuyệt",
    optRating4: "⭐⭐⭐⭐ (4/5) - Tốt / Ngon",
    optRating3: "⭐⭐⭐ (3/5) - Bình thường",
    optRating2: "⭐⭐ (2/5) - Chưa hài lòng",
    optRating1: "⭐ (1/5) - Tệ",
    lblReviewerComment: "Nhận xét của bạn:",
    phReviewerComment: "Chia sẻ trải nghiệm...",
    btnCancel: "Hủy",
    btnSubmitReview: "Gửi đánh giá",
    modalAllTitle: "Tất cả đánh giá về {name}",
    noReviewsYet: "Chưa có đánh giá nào từ thực khách.",
    writeReviewFromAllBtn: "➕ Đánh giá quán này",
    reviewSuccessAlert: "🎉 Cảm ơn bạn đã gửi đánh giá thành công!",
    reviewSubmitError: "Không gửi được đánh giá. Vui lòng thử lại sau.",
    reviewLoadError: "Không tải được đánh giá mới nhất. Vui lòng thử tải lại trang.",
    latestReviewLabel: "💬 Đánh giá mới nhất từ {name} ({rating}★):",
    recentTime: "Gần đây",
    locationIdle: "Chưa lấy vị trí.",
    locationUnsupported: "Trình duyệt không hỗ trợ định vị.",
    locationLoading: "Đang lấy vị trí hiện tại...",
    locationSuccess: "Đã lấy vị trí thành công.",
    locationDenied: "Bạn đã từ chối quyền truy cập vị trí.",
    locationUnavailable: "Không xác định được vị trí.",
    locationTimeout: "Hết thời gian lấy vị trí.",
    locationError: "Không thể lấy vị trí.",
    locationSortWarning: "Chưa bật định vị.",
    dataLoading: "Đang tải dữ liệu quán...",
    dataLoadError: "Không tải được dữ liệu quán.",
    dataLoadErrorHint: "Hãy kiểm tra web server.",
  },
  en: {
    title: "Vinh Yen Beer & Food",
    metaDescription: "A website about beer spots and casual dining venues.",
    brandTitle: "Vinh Yen Beer & Food",
    brandSubtitle: "Discover places near you",
    topCta: "Browse venues",
    heroEyebrow: "A local guide for drinking and dining",
    heroTitle: "Find beer spots and local eateries",
    heroText: "Quickly view venue details...",
    locateButton: "📍 Use my location",
    heroExploreButton: "🔍 Explore now",
    howItWorksButton: "How it works",
    panelLabel: "Overview",
    panelTitle: "What visitors can see",
    featureList: ["A curated list of venues"],
    introLabel: "Built for friend groups",
    introTitle: "Simple layout",
    introText: "The page focuses on fast browsing...",
    statsLabel: "Highlights",
    statVenueCountText: "venues in sample data",
    statTapTitle: "1 tap",
    statTapText: "to get location",
    statFastTitle: "3 languages",
    statFastText: "Vietnamese, English, Chinese",
    filterLabel: "Explore tools",
    filterTitle: "Filter and search",
    filterNote: "Once location access is allowed...",
    searchLabel: "Search by venue name",
    searchPlaceholder: "Example: Hai San Huong Le",
    categoryLabel: "Venue type",
    categoryAll: "All",
    sortLabel: "Sort by",
    sortRating: "Highest rated",
    sortDistance: "Nearest to you",
    sortReviews: "Most reviewed",
    sortName: "Name A-Z",
    resultTitle: "Venue list",
    geoNoteLabel: "Location note",
    geoNoteText: "For stable geolocation...",
    futureLabel: "Possible next steps",
    futureText: "You can later add venue details...",
    highlightBest: "Top rated",
    highlightPopular: "Most reviewed",
    highlightNear: "Near you",
    highlightQuick: "Quick pick",
    highlightBestText: "{rating} stars",
    highlightPopularText: "{reviews} reviews",
    highlightNearText: "Estimated distance {distance}",
    highlightQuickText: "Turn on location",
    resultLoaded: "Showing {count} venues",
    resultEmpty: "No venues match",
    emptyHint: "Try another keyword",
    distanceUnknown: "Enable location to see",
    reviewText: "{count} reference reviews",
    sourcePrefix: "Source",
    imageAltRestaurant: "Venue photo for {name}",
    imageAltMenu: "Menu image for {name}",
    menuPanelTitle: "Menu photos",
    menuPanelHasImages: "{count} public menu images available",
    menuPanelNoImages: "No public menu image",
    menuEmpty: "No public menu image",
    directionsBtn: "📍 Get Directions",
    reviewBtn: "⭐ Write Review",
    viewReviewsBtn: "💬 View Reviews ({count})",
    fieldAddress: "Address",
    fieldHours: "Hours",
    fieldPhone: "Contact",
    fieldDistance: "Distance",
    modalWriteTitle: "Write a review for: {name}",
    lblReviewerName: "Your Name:",
    phReviewerName: "Enter your name...",
    lblReviewerRating: "Star Rating (1-5★):",
    optRating5: "⭐⭐⭐⭐⭐ (5/5) - Excellent",
    optRating4: "⭐⭐⭐⭐ (4/5) - Very Good",
    optRating3: "⭐⭐⭐ (3/5) - Average",
    optRating2: "⭐⭐ (2/5) - Poor",
    optRating1: "⭐ (1/5) - Terrible",
    lblReviewerComment: "Your Review:",
    phReviewerComment: "Share your experience...",
    btnCancel: "Cancel",
    btnSubmitReview: "Submit Review",
    modalAllTitle: "All Reviews for {name}",
    noReviewsYet: "No customer reviews yet.",
    writeReviewFromAllBtn: "➕ Write a Review",
    reviewSuccessAlert: "🎉 Thank you for submitting your review!",
    reviewSubmitError: "Could not submit your review. Please try again later.",
    reviewLoadError: "Could not load the latest reviews. Please refresh the page.",
    latestReviewLabel: "💬 Latest review from {name} ({rating}★):",
    recentTime: "Recently",
    locationIdle: "Location has not been used yet.",
    locationUnsupported: "This browser does not support geolocation.",
    locationLoading: "Getting your location...",
    locationSuccess: "Location retrieved successfully.",
    locationDenied: "You denied location access.",
    locationUnavailable: "Your location is unavailable.",
    locationTimeout: "Location request timed out.",
    locationError: "Your location could not be retrieved.",
    locationSortWarning: "Location is not enabled yet.",
    dataLoading: "Loading venue data...",
    dataLoadError: "Unable to load venue data.",
    dataLoadErrorHint: "Please check local web server.",
  },
  zh: {
    title: "永安市啤酒与聚餐指南",
    metaDescription: "介绍越南永安市啤酒馆和聚餐餐厅的网站。",
    brandTitle: "永安市啤酒与聚餐指南",
    brandSubtitle: "发现你附近的好店",
    topCta: "查看店铺列表",
    heroEyebrow: "永安聚餐与喝啤酒地点介绍网站",
    heroTitle: "按你的位置寻找合适的啤酒馆",
    heroText: "快速查看店铺信息...",
    locateButton: "📍 使用我的位置",
    heroExploreButton: "🔍 立即探索",
    howItWorksButton: "使用说明",
    panelLabel: "概览",
    panelTitle: "用户可以看到什么",
    featureList: ["永安市本地店铺列表"],
    introLabel: "适合朋友聚会",
    introTitle: "界面简洁",
    introText: "网页强调快速浏览体验...",
    statsLabel: "亮点功能",
    statVenueCountText: "示例数据中的店铺",
    statTapTitle: "一键",
    statTapText: "获取当前位置",
    statFastTitle: "三种语言",
    statFastText: "越南语、英语、中文",
    filterLabel: "探索工具",
    filterTitle: "筛选与搜索",
    filterNote: "允许定位后...",
    searchLabel: "按店名搜索",
    searchPlaceholder: "例如：Hai San Huong Le",
    categoryLabel: "店铺类型",
    categoryAll: "全部",
    sortLabel: "排序方式",
    sortRating: "评分最高",
    sortDistance: "离你最近",
    sortReviews: "评论最多",
    sortName: "名称 A-Z",
    resultTitle: "店铺列表",
    geoNoteLabel: "定位说明",
    geoNoteText: "为了稳定使用定位功能...",
    futureLabel: "后续可扩展",
    futureText: "后面可以继续增加...",
    highlightBest: "评分最高",
    highlightPopular: "评论最多",
    highlightNear: "离你最近",
    highlightQuick: "快速推荐",
    highlightBestText: "{reviews} 条参考评论",
    highlightPopularText: "共有 {reviews} 条评论",
    highlightNearText: "距离你当前位置约 {distance}",
    highlightQuickText: "开启定位后即可查看",
    resultLoaded: "当前显示 {count} 家店铺",
    resultEmpty: "没有找到合适的店铺",
    emptyHint: "请尝试更换关键词",
    distanceUnknown: "开启定位后可查看",
    reviewText: "{count} 条参考评论",
    sourcePrefix: "来源",
    imageAltRestaurant: "{name} 店铺照片",
    imageAltMenu: "{name} 菜单照片",
    menuPanelTitle: "菜单图片",
    menuPanelHasImages: "已找到 {count} 张公开菜单图片",
    menuPanelNoImages: "暂未找到公开菜单图片",
    menuEmpty: "这家店目前没有公开菜单",
    directionsBtn: "📍 地图导航",
    reviewBtn: "⭐ 评价店铺",
    viewReviewsBtn: "💬 查看评价 ({count})",
    fieldAddress: "地址",
    fieldHours: "营业时间",
    fieldPhone: "联系方式",
    fieldDistance: "距离",
    modalWriteTitle: "撰写评价: {name}",
    lblReviewerName: "您的姓名:",
    phReviewerName: "请输入您的姓名...",
    lblReviewerRating: "评分 (1-5★):",
    optRating5: "⭐⭐⭐⭐⭐ (5/5) - 非常棒",
    optRating4: "⭐⭐⭐⭐ (4/5) - 很好",
    optRating3: "⭐⭐⭐ (3/5) - 一般",
    optRating2: "⭐⭐ (2/5) - 不满意",
    optRating1: "⭐ (1/5) - 很差",
    lblReviewerComment: "您的评价:",
    phReviewerComment: "分享关于菜品...",
    btnCancel: "取消",
    btnSubmitReview: "提交评价",
    modalAllTitle: "{name} 的所有评价",
    noReviewsYet: "暂无食客评价。",
    writeReviewFromAllBtn: "➕ 评价这家店",
    reviewSuccessAlert: "🎉 感谢您的评价！",
    reviewSubmitError: "提交评价失败，请稍后再试。",
    reviewLoadError: "暂时无法加载最新评价，请刷新页面后重试。",
    latestReviewLabel: "💬 最新评价来自 {name}（{rating}★）：",
    recentTime: "最近",
    locationIdle: "尚未获取位置。",
    locationUnsupported: "当前浏览器不支持定位功能。",
    locationLoading: "正在获取你的位置...",
    locationSuccess: "位置获取成功。",
    locationDenied: "你拒绝了定位权限。",
    locationUnavailable: "暂时无法确定你的位置。",
    locationTimeout: "定位超时。",
    locationError: "无法获取你的位置。",
    locationSortWarning: "你还没有开启定位。",
    dataLoading: "正在加载店铺数据...",
    dataLoadError: "无法加载店铺数据。",
    dataLoadErrorHint: "请检查本地 web 服务。",
  },
};

const categoryTranslations = {
  "garden-pub": { vi: "Quán nhậu sân vườn", en: "Garden pub", zh: "庭院聚餐馆" },
  "family-pub": { vi: "Quán nhậu gia đình", en: "Family dining", zh: "家庭聚餐店" },
  seafood: { vi: "Hải sản", en: "Seafood", zh: "海鲜" },
  "goat-pub": { vi: "Dê - quán nhậu", en: "Goat dishes", zh: "羊肉聚餐店" },
  "goat-hotpot": { vi: "Dê - lẩu", en: "Goat hotpot", zh: "羊肉火锅" },
  "snail-pub": { vi: "Ốc - quán nhậu", en: "Snail eatery", zh: "螺类小馆" },
};

const tagTranslations = {
  garden: { vi: "Sân vườn", en: "Garden space", zh: "庭院空间" },
  groups: { vi: "Nhóm đông", en: "Large groups", zh: "适合多人" },
  nguyenTatThanh: { vi: "Nguyễn Tất Thành", en: "Nguyen Tat Thanh", zh: "阮必成路" },
  family: { vi: "Gia đình", en: "Family", zh: "家庭" },
  business: { vi: "Tiếp khách", en: "Business meal", zh: "接待聚餐" },
  tichSon: { vi: "Tích Sơn", en: "Tich Son", zh: "积山坊" },
  seafood: { vi: "Hải sản", en: "Seafood", zh: "海鲜" },
  urban: { vi: "Khu đô thị", en: "Urban area", zh: "城市新区" },
  spacious: { vi: "Không gian rộng", en: "Spacious", zh: "空间宽敞" },
  lienBao: { vi: "Liên Bảo", en: "Lien Bao", zh: "连保坊" },
  hotpot: { vi: "Lẩu", en: "Hotpot", zh: "火锅" },
  gathering: { vi: "Tụ tập", en: "Hangout", zh: "适合聚会" },
  traiGiao: { vi: "Trại Giao", en: "Trai Giao", zh: "寨交地区" },
  goat: { vi: "Dê", en: "Goat", zh: "羊肉" },
  khaiQuang: { vi: "Khai Quang", en: "Khai Quang", zh: "开光坊" },
  phanChuTrinh: { vi: "Phan Chu Trinh", en: "Phan Chu Trinh", zh: "潘周桢路" },
  ngoQuyen: { vi: "Ngô Quyền", en: "Ngo Quyen", zh: "吴权坊" },
  lightDrinks: { vi: "Nhậu nhẹ", en: "Light snacks", zh: "轻松小酌" },
};

let venues = [];
let globalReviews = [];
let reviewsRefreshTimer = null;
let mapInstance = null;
let markersGroup = null;

const venueGrid = document.querySelector("#venueGrid");
const resultText = document.querySelector("#resultText");
const venueCount = document.querySelector("#venueCount");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const sortSelect = document.querySelector("#sortSelect");
const locateButton = document.querySelector("#locateButton");
const locationStatus = document.querySelector("#locationStatus");
const highlightGrid = document.querySelector("#highlightGrid");
const venueTemplate = document.querySelector("#venueCardTemplate");
const languageButtons = document.querySelectorAll(".language-button");

const state = {
  query: "",
  category: "all",
  sortBy: "rating",
  userLocation: null,
  language: localStorage.getItem("vinyen-language") || "vi",
  dataLoaded: false,
  dataError: false,
};

async function loadVenueData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/venues?v=` + Date.now());
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        venues = data;
        state.dataLoaded = true;
        state.dataError = false;
        return;
      }
    }
  } catch {
    // Fallback sang file tĩnh công khai nếu API sự cố
  }

  const response = await fetch("./data/published/venues.json?v=" + Date.now());
  if (!response.ok) {
    throw new Error(`Không tải được dữ liệu quán: ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Dữ liệu quán không đúng định dạng mảng");
  }
  venues = data;
  state.dataLoaded = true;
  state.dataError = false;
}

async function loadServerReviews() {
  const res = await fetch(`${API_BASE_URL}${REVIEWS_API_PATH}?v=${Date.now()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Không tải được đánh giá từ server (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) {
        message = data.error;
      }
    } catch (error) {
      // Bỏ qua lỗi parse JSON để giữ message mặc định.
    }
    throw new Error(message);
  }

  const data = await res.json();
  globalReviews = Array.isArray(data) ? data : [];
  return globalReviews;
}

async function syncServerReviews({ rerender = false, silent = true } = {}) {
  try {
    await loadServerReviews();
    if (rerender && state.dataLoaded && !state.dataError) {
      renderVenues();
    }
    return true;
  } catch (err) {
    console.error("Không thể tải đánh giá từ server:", err);
    if (!silent) {
      alert(t("reviewLoadError"));
    }
    return false;
  }
}

function renderLoadingState() {
  if (venueCount) venueCount.textContent = "0";
  if (highlightGrid) highlightGrid.innerHTML = "";
  if (resultText) resultText.textContent = t("dataLoading");
  if (venueGrid) venueGrid.innerHTML = "";
}

function renderDataError() {
  if (venueCount) venueCount.textContent = "0";
  if (highlightGrid) highlightGrid.innerHTML = "";
  if (resultText) resultText.textContent = t("dataLoadError");
  if (venueGrid) {
    venueGrid.innerHTML = "";
    const errorState = document.createElement("div");
    errorState.className = "empty-state";
    errorState.textContent = t("dataLoadErrorHint");
    venueGrid.appendChild(errorState);
  }
}

function t(key) {
  return translations[state.language][key];
}

function formatText(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? "");
}

function getCategoryLabel(categoryKey) {
  return categoryTranslations[categoryKey]?.[state.language] ?? categoryKey;
}

function getTagLabel(tagKey) {
  return tagTranslations[tagKey]?.[state.language] ?? tagKey;
}

function formatDistance(distanceKm) {
  if (distanceKm == null || Number.isNaN(distanceKm)) {
    return t("distanceUnknown");
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return state.language === "zh" ? `${meters} 米` : `${meters} m`;
  }

  return state.language === "zh"
    ? `${distanceKm.toFixed(1)} 公里`
    : `${distanceKm.toFixed(1)} km`;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function enrichVenue(venue) {
  const distance =
    state.userLocation != null
      ? haversineDistance(state.userLocation.lat, state.userLocation.lng, venue.lat, venue.lng)
      : null;

  return { ...venue, distance };
}

function buildSearchableText(venue) {
  const descVi = venue.description?.vi || (typeof venue.description === "string" ? venue.description : "");
  const descEn = venue.description?.en || "";
  const descZh = venue.description?.zh || "";
  const highlightsVi = venue.menuHighlights?.vi || [];
  const highlightsEn = venue.menuHighlights?.en || [];
  const highlightsZh = venue.menuHighlights?.zh || [];
  const tags = venue.tags || [];

  return [
    venue.name || "",
    venue.address || "",
    descVi,
    descEn,
    descZh,
    getCategoryLabel(venue.categoryKey),
    ...tags.map((tag) => getTagLabel(tag)),
    ...highlightsVi,
    ...highlightsEn,
    ...highlightsZh,
  ]
    .join(" ")
    .toLowerCase();
}

function getFilteredVenues() {
  let result = venues.map(enrichVenue);

  if (state.query) {
    const query = state.query.toLowerCase().trim();
    result = result.filter((venue) => buildSearchableText(venue).includes(query));
  }

  if (state.category !== "all") {
    result = result.filter((venue) => venue.categoryKey === state.category);
  }

  switch (state.sortBy) {
    case "distance":
      result.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
      break;
    case "reviews":
      result.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name, state.language));
      break;
    default:
      result.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
  }

  return result;
}

function renderMap(currentVenues) {
  const mapContainer = document.getElementById("map");
  if (!mapContainer || typeof L === "undefined") return;

  if (!mapInstance) {
    mapInstance = L.map("map").setView([21.3089, 105.6049], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance);
    markersGroup = L.layerGroup().addTo(mapInstance);
  }

  markersGroup.clearLayers();

  if (state.userLocation) {
    const userMarker = L.circleMarker([state.userLocation.lat, state.userLocation.lng], {
      radius: 8,
      fillColor: "#2563eb",
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    }).bindPopup("<b>📍 Vị trí của bạn</b>");
    markersGroup.addLayer(userMarker);
  }

  const bounds = [];

  currentVenues.forEach((venue) => {
    if (venue.lat && venue.lng) {
      const latLng = [venue.lat, venue.lng];
      bounds.push(latLng);

      const marker = L.marker(latLng);
      marker.bindPopup(`
        <div style="font-family: sans-serif;">
          <b style="font-size: 14px; color: #1e293b;">${venue.name}</b><br>
          <span style="font-size: 12px; color: #64748b;">${venue.address}</span>
        </div>
      `);

      marker.on("click", () => {
        const cardEl = document.querySelector(`[data-id="${venue.id}"]`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
          cardEl.style.transition = "outline 0.3s ease";
          cardEl.style.outline = "3px solid #2563eb";
          setTimeout(() => {
            cardEl.style.outline = "none";
          }, 2000);
        }
      });

      markersGroup.addLayer(marker);
    }
  });

  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }
}

function updateStaticText() {
  document.documentElement.lang = state.language;
  document.title = t("title");
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", t("metaDescription"));

  const staticBindings = {
    brandTitle: t("brandTitle"),
    brandSubtitle: t("brandSubtitle"),
    topCta: t("topCta"),
    heroEyebrow: t("heroEyebrow"),
    heroTitle: t("heroTitle"),
    heroText: t("heroText"),
    heroExploreButton: t("heroExploreButton"),
    howItWorksButton: t("howItWorksButton"),
    panelLabel: t("panelLabel"),
    panelTitle: t("panelTitle"),
    introLabel: t("introLabel"),
    introTitle: t("introTitle"),
    introText: t("introText"),
    statsLabel: t("statsLabel"),
    statVenueCountText: t("statVenueCountText"),
    statTapTitle: t("statTapTitle"),
    statTapText: t("statTapText"),
    statFastTitle: t("statFastTitle"),
    statFastText: t("statFastText"),
    filterLabel: t("filterLabel"),
    filterNote: t("filterNote"),
    searchLabel: t("searchLabel"),
    categoryLabel: t("categoryLabel"),
    sortLabel: t("sortLabel"),
    resultTitle: t("resultTitle"),
    geoNoteLabel: t("geoNoteLabel"),
    geoNoteText: t("geoNoteText"),
    futureLabel: t("futureLabel"),
    futureText: t("futureText"),
    lblReviewerName: t("lblReviewerName"),
    lblReviewerRating: t("lblReviewerRating"),
    optRating5: t("optRating5"),
    optRating4: t("optRating4"),
    optRating3: t("optRating3"),
    optRating2: t("optRating2"),
    optRating1: t("optRating1"),
    lblReviewerComment: t("lblReviewerComment"),
    closeModalBtn: t("btnCancel"),
    submitReviewBtn: t("btnSubmitReview"),
    writeReviewFromAllBtn: t("writeReviewFromAllBtn"),
  };

  Object.entries(staticBindings).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });

  if (locateButton) locateButton.textContent = t("locateButton");
  const heroExploreBtn = document.getElementById("heroExploreButton");
  if (heroExploreBtn) heroExploreBtn.textContent = t("heroExploreButton");
  if (searchInput) searchInput.placeholder = t("searchPlaceholder");

  const reviewerNameInput = document.getElementById("reviewerName");
  if (reviewerNameInput) reviewerNameInput.placeholder = t("phReviewerName");

  const reviewerCommentInput = document.getElementById("reviewerComment");
  if (reviewerCommentInput) reviewerCommentInput.placeholder = t("phReviewerComment");

  const featureList = document.querySelector("#featureList");
  if (featureList) {
    featureList.innerHTML = "";
    t("featureList").forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      featureList.appendChild(li);
    });
  }

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.language);
  });
}

function populateFilters() {
  if (!categoryFilter || !sortSelect) return;
  categoryFilter.innerHTML = "";
  sortSelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = t("categoryAll");
  categoryFilter.appendChild(allOption);

  const categories = [...new Set(venues.map((venue) => venue.categoryKey))];
  categories
    .sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b), state.language))
    .forEach((categoryKey) => {
      const option = document.createElement("option");
      option.value = categoryKey;
      option.textContent = getCategoryLabel(categoryKey);
      categoryFilter.appendChild(option);
    });

  [
    { value: "rating", label: t("sortRating") },
    { value: "distance", label: t("sortDistance") },
    { value: "reviews", label: t("sortReviews") },
    { value: "name", label: t("sortName") },
  ].forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    sortSelect.appendChild(option);
  });

  categoryFilter.value = state.category;
  sortSelect.value = state.sortBy;
}

function renderHighlights(currentVenues) {
  if (!venues.length || !highlightGrid) {
    if (highlightGrid) highlightGrid.innerHTML = "";
    return;
  }

  const byRating = [...venues].sort(
    (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  )[0];
  const byReviews = [...venues].sort((a, b) => b.reviewCount - a.reviewCount)[0];
  const nearest =
    currentVenues.find((item) => item.distance != null) || currentVenues[0] || venues[0];

  const highlightItems = [
    {
      label: t("highlightBest"),
      title: byRating.name,
      text: formatText(t("highlightBestText"), {
        rating: byRating.rating.toFixed(1),
        reviews: byRating.reviewCount,
      }),
    },
    {
      label: t("highlightPopular"),
      title: byReviews.name,
      text: formatText(t("highlightPopularText"), { reviews: byReviews.reviewCount }),
    },
    {
      label: state.userLocation ? t("highlightNear") : t("highlightQuick"),
      title: nearest.name,
      text: state.userLocation
        ? formatText(t("highlightNearText"), { distance: formatDistance(nearest.distance) })
        : t("highlightQuickText"),
    },
  ];

  highlightGrid.innerHTML = "";
  highlightItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "highlight-card";
    card.innerHTML = `
      <span class="highlight-label">${item.label}</span>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    `;
    highlightGrid.appendChild(card);
  });
}

function renderMenuPanel(fragment, venue) {
  const venueMedia = fragment.querySelector(".venue-media");
  const venueImageWrap = fragment.querySelector(".venue-image-wrap");
  const venueImage = fragment.querySelector(".venue-image");
  const menuPanel = fragment.querySelector(".menu-panel");

  if (!venue.imageUrl || venue.imageUrl.includes("restaurant-placeholder")) {
    if (venueImageWrap) venueImageWrap.style.display = "none";
  } else if (venueImage) {
    venueImage.src = venue.imageUrl;
    venueImage.alt = formatText(t("imageAltRestaurant"), { name: venue.name });
  }

  if (!venue.menuImages || !venue.menuImages.length) {
    if (menuPanel) menuPanel.style.display = "none";
  } else {
    fragment.querySelector(".menu-panel-title").textContent = t("menuPanelTitle");
    const menuPanelNote = fragment.querySelector(".menu-panel-note");
    const menuGallery = fragment.querySelector(".menu-gallery");
    const menuHighlights = fragment.querySelector(".menu-highlight-list");

    menuGallery.innerHTML = "";
    menuHighlights.innerHTML = "";

    menuPanelNote.textContent = formatText(t("menuPanelHasImages"), {
      count: venue.menuImages.length,
    });
    venue.menuImages.forEach((image, index) => {
      const img = document.createElement("img");
      img.src = image.url;
      img.alt = formatText(t("imageAltMenu"), { name: venue.name }) + ` ${index + 1}`;
      img.loading = "lazy";
      menuGallery.appendChild(img);
    });

    const highlights = typeof venue.menuHighlights === "object"
      ? (venue.menuHighlights[state.language] || venue.menuHighlights.vi || [])
      : [];
    highlights.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      menuHighlights.appendChild(li);
    });
  }

  if ((!venue.imageUrl || venue.imageUrl.includes("restaurant-placeholder")) && (!venue.menuImages || !venue.menuImages.length)) {
    if (venueMedia) venueMedia.style.display = "none";
  }
}

function renderVenues() {
  if (!venueGrid) return;

  if (state.dataError) {
    renderDataError();
    return;
  }

  if (!state.dataLoaded) {
    renderLoadingState();
    return;
  }

  const currentVenues = getFilteredVenues();
  venueGrid.innerHTML = "";
  if (venueCount) venueCount.textContent = String(venues.length);

  renderHighlights(currentVenues);
  renderMap(currentVenues);

  if (!currentVenues.length) {
    if (resultText) resultText.textContent = t("resultEmpty");
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = t("emptyHint");
    venueGrid.appendChild(emptyState);
    return;
  }

  if (resultText) resultText.textContent = formatText(t("resultLoaded"), { count: currentVenues.length });

  currentVenues.forEach((venue) => {
    if (!venueTemplate) return;
    const fragment = venueTemplate.content.cloneNode(true);

    const cardArticle = fragment.querySelector(".venue-card");
    if (cardArticle) cardArticle.setAttribute("data-id", venue.id);

    renderMenuPanel(fragment, venue);

    // ÉP KIỂU STRING ĐỂ LỌC REVIEW CHÍNH XÁC
    const userReviews = globalReviews.filter((r) => String(r.venueId) === String(venue.id));
    let displayRating = venue.rating || 4.0;
    if (userReviews.length > 0) {
      const sum = userReviews.reduce((acc, curr) => acc + (parseFloat(curr.rating) || 4), 0);
      displayRating = (sum + (venue.rating || 4.0)) / (userReviews.length + 1);
    }

    fragment.querySelector(".venue-category").textContent = getCategoryLabel(venue.categoryKey);
    fragment.querySelector(".venue-name").textContent = venue.name || "";
    fragment.querySelector(".venue-rating").textContent = `${displayRating.toFixed(1)} ★`;
    
    const descText = typeof venue.description === "object" 
      ? (venue.description[state.language] || venue.description.vi || "")
      : (venue.description || "");
    fragment.querySelector(".venue-description").textContent = descText;
    fragment.querySelector(".venue-address").textContent = venue.address;
    fragment.querySelector(".venue-hours").textContent = venue.hours;
    fragment.querySelector(".venue-phone").textContent = venue.phone;
    fragment.querySelector(".venue-distance").textContent = formatDistance(venue.distance);
    fragment.querySelector(".review-count").textContent = formatText(t("reviewText"), {
      count: (venue.reviewCount || 0) + userReviews.length,
    });

    const metaLabels = fragment.querySelectorAll(".meta-list span");
    if (metaLabels.length >= 4) {
      metaLabels[0].textContent = t("fieldAddress");
      metaLabels[1].textContent = t("fieldHours");
      metaLabels[2].textContent = t("fieldPhone");
      metaLabels[3].textContent = t("fieldDistance");
    }

    const tagList = fragment.querySelector(".tag-list");
    venue.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = getTagLabel(tag);
      tagList.appendChild(span);
    });

    // CẬP NHẬT LINK CHỈ ĐƯỜNG MAPS TỰ ĐỘNG TẠO TUYẾN TỪ VỊ TRÍ HIỆN TẠI
    const mapsBtn = fragment.querySelector(".primary-action-btn");
    if (mapsBtn) {
      mapsBtn.textContent = t("directionsBtn");
      const destQuery = (venue.lat && venue.lng) 
        ? `${venue.lat},${venue.lng}` 
        : encodeURIComponent(`${venue.name}, ${venue.address}`);
      
      if (state.userLocation) {
        mapsBtn.href = `https://www.google.com/maps/dir/?api=1&origin=${state.userLocation.lat},${state.userLocation.lng}&destination=${destQuery}`;
      } else {
        mapsBtn.href = venue.directionsUrl || `https://www.google.com/maps/dir/?api=1&destination=${destQuery}`;
      }
    }

    const reviewBtn = fragment.querySelector(".review-btn");
    if (reviewBtn) {
      reviewBtn.textContent = t("reviewBtn");
      reviewBtn.addEventListener("click", () => {
        openWriteReviewModal(venue);
      });
    }

    const viewReviewsBtn = fragment.querySelector(".view-reviews-btn");
    if (viewReviewsBtn) {
      viewReviewsBtn.innerHTML = formatText(t("viewReviewsBtn"), { count: `<span class="user-review-count">${userReviews.length}</span>` });
      viewReviewsBtn.addEventListener("click", async () => {
        await openAllReviewsModal(venue);
      });
    }

    // HIỂN THỊ ĐÁNH GIÁ MỚI NHẤT
    const reviewsPreview = fragment.querySelector(".user-reviews-preview");
    if (reviewsPreview) {
      if (userReviews.length > 0) {
        const latest = userReviews[0];
        reviewsPreview.innerHTML = `
          <div class="user-review-item" style="margin-top: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 14px;">
            <div style="font-weight: 700; color: #047857; font-size: 0.9rem; margin-bottom: 4px;">
              ${formatText(t("latestReviewLabel"), { name: latest.name, rating: latest.rating })}
            </div>
            <div style="color: #1e293b; font-size: 0.92rem; line-height: 1.4;">
              "${latest.comment}"
            </div>
          </div>
        `;
      } else {
        reviewsPreview.innerHTML = "";
      }
    }

    venueGrid.appendChild(fragment);
  });
}

function openWriteReviewModal(venue) {
  document.getElementById("modalVenueId").value = venue.id;
  document.getElementById("modalVenueTitle").textContent = formatText(t("modalWriteTitle"), { name: venue.name });
  document.getElementById("reviewModal").style.display = "grid";
}

async function openAllReviewsModal(venue) {
  const modal = document.getElementById("allReviewsModal");
  const title = document.getElementById("allReviewsTitle");
  const list = document.getElementById("allReviewsList");
  const writeBtn = document.getElementById("writeReviewFromAllBtn");

  title.textContent = formatText(t("modalAllTitle"), { name: venue.name });

  const loaded = await syncServerReviews({ silent: true });

  if (!loaded && !globalReviews.length) {
    list.innerHTML = `<div class="empty-state">${t("reviewLoadError")}</div>`;
    modal.style.display = "grid";
    return;
  }

  const userReviews = globalReviews.filter((r) => String(r.venueId) === String(venue.id));

  if (userReviews.length === 0) {
    list.innerHTML = `<div class="empty-state">${t("noReviewsYet")}</div>`;
  } else {
    const langLocales = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };
    const locale = langLocales[state.language] || "vi-VN";
    list.innerHTML = userReviews.map(r => `
      <div class="review-card-full">
        <div class="review-card-header">
          <span class="review-card-author">${r.name}</span>
          <span class="review-card-rating">${"★".repeat(parseInt(r.rating) || 5)} (${r.rating}/5)</span>
        </div>
        <div class="review-card-time">${r.date ? new Date(r.date).toLocaleString(locale) : t("recentTime")}</div>
        <p class="review-card-body">${r.comment}</p>
      </div>
    `).join("");
  }

  writeBtn.onclick = () => {
    modal.style.display = "none";
    openWriteReviewModal(venue);
  };

  modal.style.display = "grid";
}

document.addEventListener("DOMContentLoaded", () => {
  const closeModalBtn = document.getElementById("closeModalBtn");
  const reviewModal = document.getElementById("reviewModal");
  const reviewForm = document.getElementById("reviewForm");
  const closeAllReviewsBtn = document.getElementById("closeAllReviewsBtn");
  const allReviewsModal = document.getElementById("allReviewsModal");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      reviewModal.style.display = "none";
    });
  }

  if (closeAllReviewsBtn) {
    closeAllReviewsBtn.addEventListener("click", () => {
      allReviewsModal.style.display = "none";
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const venueId = document.getElementById("modalVenueId").value;
      const name = document.getElementById("reviewerName").value.trim();
      const rating = document.getElementById("reviewerRating").value;
      const comment = document.getElementById("reviewerComment").value.trim();

      if (!name || !comment) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId, name, rating, comment }),
        });

        if (response.ok) {
          await syncServerReviews({ rerender: true, silent: true });
          reviewForm.reset();
          reviewModal.style.display = "none";

          const cardEl = document.querySelector(`[data-id="${venueId}"]`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        } else {
          let message = t("reviewSubmitError");
          try {
            const data = await response.json();
            if (data?.error) {
              message = data.error;
            }
          } catch (error) {
            // Không làm gì, dùng message mặc định.
          }
          alert(message);
        }
      } catch (err) {
        console.error("Lỗi gửi đánh giá:", err);
        alert(t("reviewSubmitError"));
      }
    });
  }
});

function setStatus(message, tone = "") {
  if (!locationStatus) return;
  locationStatus.textContent = message;
  locationStatus.className = "status-card";
  if (tone) {
    locationStatus.classList.add(tone);
  }
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    setStatus(t("locationUnsupported"), "error");
    return;
  }

  setStatus(t("locationLoading"), "warning");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      if (locationStatus) {
        locationStatus.dataset.statusKey = "locationSuccess";
        locationStatus.dataset.statusTone = "success";
      }
      setStatus(t("locationSuccess"), "success");
      renderVenues();
    },
    (error) => {
      let message = t("locationError");
      let statusKey = "locationError";

      if (error.code === error.PERMISSION_DENIED) {
        message = t("locationDenied");
        statusKey = "locationDenied";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        message = t("locationUnavailable");
        statusKey = "locationUnavailable";
      } else if (error.code === error.TIMEOUT) {
        message = t("locationTimeout");
        statusKey = "locationTimeout";
      }

      if (locationStatus) {
        locationStatus.dataset.statusKey = statusKey;
        locationStatus.dataset.statusTone = "error";
      }
      setStatus(message, "error");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function applyLanguage() {
  localStorage.setItem("vinyen-language", state.language);
  updateStaticText();
  if (state.dataLoaded) {
    populateFilters();
  }
  renderVenues();

  if (locationStatus && locationStatus.dataset.statusKey) {
    setStatus(t(locationStatus.dataset.statusKey), locationStatus.dataset.statusTone || "");
  } else {
    setStatus(t("locationIdle"));
  }
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderVenues();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderVenues();
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    if (state.sortBy === "distance" && state.userLocation == null && locationStatus) {
      locationStatus.dataset.statusKey = "locationSortWarning";
      locationStatus.dataset.statusTone = "warning";
      setStatus(t("locationSortWarning"), "warning");
    }
    renderVenues();
  });
}

if (locateButton) {
  locateButton.addEventListener("click", () => {
    if (locationStatus) {
      locationStatus.dataset.statusKey = "locationLoading";
      locationStatus.dataset.statusTone = "warning";
    }
    requestLocation();
  });
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.language = button.dataset.lang;
    applyLanguage();
  });
});

window.switchLanguage = (lang) => {
  if (!translations[lang]) return;
  state.language = lang;
  applyLanguage();
};

async function bootstrap() {
  state.language = translations[state.language] ? state.language : "vi";
  if (locationStatus) {
    locationStatus.dataset.statusKey = "locationIdle";
    locationStatus.dataset.statusTone = "";
  }
  applyLanguage();

  try {
    await loadVenueData();
    populateFilters();
    renderVenues();
  } catch (error) {
    console.error(error);
    state.dataLoaded = false;
    state.dataError = true;
    renderDataError();
  }

  await syncServerReviews({ rerender: true, silent: true });

  if (reviewsRefreshTimer) {
    window.clearInterval(reviewsRefreshTimer);
  }
  reviewsRefreshTimer = window.setInterval(() => {
    syncServerReviews({ rerender: true, silent: true });
  }, REVIEWS_AUTO_REFRESH_MS);
}

bootstrap();

window.addEventListener("focus", () => {
  syncServerReviews({ rerender: true, silent: true });
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    syncServerReviews({ rerender: true, silent: true });
  }
});
