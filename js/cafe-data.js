/**
 * cafe-data.js
 * 카페별 기본 메뉴 프리셋 및 로컬스토리지 저장/관리 모듈
 */

// 대표 프랜차이즈 기본 프리셋 데이터
const DEFAULT_CAFES = [
  {
    id: "brunchbean",
    name: "브런치빈",
    icon: "🥗",
    themeColor: "#059669",
    categories: ["추천/인기", "커피", "페어링/에이드", "티/음료"],
    menus: [
      { id: "bb-1", name: "아메리카노", category: "커피", price: 4500, temp: "both", popular: true },
      { id: "bb-2", name: "카페라떼", category: "커피", price: 4900, temp: "both", popular: true },
      { id: "bb-13", name: "자몽에이드", category: "페어링/에이드", price: 5800, temp: "ice", popular: false },
      { id: "bb-21", name: "캐모마일 티", category: "티/음료", price: 4900, temp: "both", popular: false },
      { id: "bb-22", name: "얼그레이 티", category: "티/음료", price: 4900, temp: "both", popular: false },
      { id: "bb-23", name: "탄산음료 (콜라/사이다)", category: "티/음료", price: 3000, temp: "ice", popular: false }
    ]
  },
  {
    id: "starbucks",
    name: "스타벅스",
    icon: "☕",
    themeColor: "#00704A",
    categories: ["추천/인기", "에스프레소", "콜드브루", "프라푸치노/블렌디드", "티/기타"],
    menus: [
      { id: "sb-1", name: "카페 아메리카노", category: "에스프레소", price: 4500, temp: "both", popular: true },
      { id: "sb-2", name: "카페 라떼", category: "에스프레소", price: 5000, temp: "both", popular: true },
      { id: "sb-3", name: "바닐라 크림 콜드 브루", category: "콜드브루", price: 5800, temp: "ice", popular: true },
      { id: "sb-4", name: "돌체 라떼", category: "에스프레소", price: 5900, temp: "both", popular: true },
      { id: "sb-5", name: "콜드 브루", category: "콜드브루", price: 4900, temp: "ice", popular: false },
      { id: "sb-6", name: "자몽 허니 블랙 티", category: "티/기타", price: 5700, temp: "both", popular: true },
      { id: "sb-7", name: "자바 칩 프라푸치노", category: "프라푸치노/블렌디드", price: 6300, temp: "ice", popular: true },
      { id: "sb-8", name: "쿨 라임 피지오", category: "티/기타", price: 5900, temp: "ice", popular: false },
      { id: "sb-9", name: "카라멜 마키아또", category: "에스프레소", price: 5900, temp: "both", popular: false },
      { id: "sb-10", name: "유자 민트 티", category: "티/기타", price: 5900, temp: "both", popular: false },
      { id: "sb-11", name: "딸기 딜라이트 요거트 블렌디드", category: "프라푸치노/블렌디드", price: 6300, temp: "ice", popular: false }
    ]
  }
];

class CafeDataManager {
  constructor() {
    this.storageKey = "cafe_order_cafes_v2";
    this.activeCafeKey = "cafe_order_active_id";
    this.cafes = this.loadCafes();
  }

  loadCafes() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 카페별 카테고리를 실제 등록된 메뉴에 맞게 자동 정돈
          parsed.forEach(c => this.syncCafeCategories(c));
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load cafes from storage", e);
    }
    this.saveCafes(DEFAULT_CAFES);
    return JSON.parse(JSON.stringify(DEFAULT_CAFES));
  }

  saveCafes(cafesToSave) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(cafesToSave || this.cafes));
    } catch (e) {
      console.error("Failed to save cafes", e);
    }
  }

  getActiveCafeId() {
    const saved = localStorage.getItem(this.activeCafeKey);
    if (saved === "custom_1789116989987") return "brunchbean";
    if (saved && this.cafes.some(c => c.id === saved)) {
      return saved;
    }
    return this.cafes[0].id;
  }

  setActiveCafeId(id) {
    localStorage.setItem(this.activeCafeKey, id);
  }

  getActiveCafe() {
    const id = this.getActiveCafeId();
    return this.cafes.find(c => c.id === id) || this.cafes[0];
  }

  getAppTitle() {
    return localStorage.getItem("cafe_order_app_title") || "모두의 음료";
  }

  setAppTitle(newTitle) {
    const trimmed = (newTitle || "").trim() || "모두의 음료";
    localStorage.setItem("cafe_order_app_title", trimmed);
    return trimmed;
  }

  moveCafe(cafeId, direction) {
    // direction: -1 (위/앞으로), 1 (아래/뒤로)
    const index = this.cafes.findIndex(c => c.id === cafeId);
    if (index === -1) return false;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.cafes.length) return false;

    const [item] = this.cafes.splice(index, 1);
    this.cafes.splice(targetIndex, 0, item);
    this.saveCafes();
    return true;
  }

  getCafeOrderIds() {
    return this.cafes.map(c => c.id);
  }

  applyCafeOrder(orderIds) {
    if (!Array.isArray(orderIds) || orderIds.length === 0) return false;
    const currentOrder = this.getCafeOrderIds().join(",");
    if (currentOrder === orderIds.join(",")) return false; // 이미 동일 순서면 무시

    const cafeMap = new Map(this.cafes.map(c => [c.id, c]));
    const newCafes = [];
    orderIds.forEach(id => {
      if (cafeMap.has(id)) {
        newCafes.push(cafeMap.get(id));
        cafeMap.delete(id);
      }
    });
    for (const c of cafeMap.values()) {
      newCafes.push(c);
    }
    this.cafes = newCafes;
    this.saveCafes();
    return true;
  }

  syncCafeCategories(cafe) {
    if (!cafe || !Array.isArray(cafe.menus)) return;
    const menuCats = Array.from(new Set(cafe.menus.map(m => m.category).filter(Boolean)));
    const hasPopular = cafe.menus.some(m => m.popular);
    cafe.categories = hasPopular ? ["추천/인기", ...menuCats] : menuCats;
  }

  addCafe(name, icon = "☕", themeColor = "#6366F1") {
    const id = "custom_" + Date.now();
    const newCafe = {
      id,
      name: name.trim(),
      icon: icon || "☕",
      themeColor: themeColor || "#6366F1",
      categories: ["추천/인기", "커피"],
      menus: [
        { id: `m_${Date.now()}_1`, name: "아메리카노", category: "커피", price: 3000, temp: "both", popular: true },
        { id: `m_${Date.now()}_2`, name: "카페라떼", category: "커피", price: 3500, temp: "both", popular: true }
      ]
    };
    this.syncCafeCategories(newCafe);
    this.cafes.push(newCafe);
    this.saveCafes();
    this.setActiveCafeId(id);
    return newCafe;
  }

  deleteCafe(cafeId) {
    if (this.cafes.length <= 1) {
      alert("최소 1개의 카페는 유지되어야 합니다.");
      return false;
    }
    this.cafes = this.cafes.filter(c => c.id !== cafeId);
    this.saveCafes();
    if (this.getActiveCafeId() === cafeId) {
      this.setActiveCafeId(this.cafes[0].id);
    }
    return true;
  }

  addMenu(cafeId, { name, category, price, temp, popular }) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return null;

    const newMenu = {
      id: "menu_" + Date.now(),
      name: name.trim(),
      category: category.trim() || "커피",
      price: Number(price) || 0,
      temp: temp || "both",
      popular: !!popular
    };

    if (!Array.isArray(cafe.menus)) cafe.menus = [];
    cafe.menus.push(newMenu);
    this.syncCafeCategories(cafe);
    this.saveCafes();
    return newMenu;
  }

  deleteMenu(cafeId, menuId) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return false;
    cafe.menus = (cafe.menus || []).filter(m => m.id !== menuId);
    this.syncCafeCategories(cafe);
    this.saveCafes();
    return true;
  }

  setAllCafes(cafes) {
    if (!Array.isArray(cafes) || cafes.length === 0) return false;
    this.cafes = cafes;
    this.cafes.forEach(c => this.syncCafeCategories(c));
    this.saveCafes();
    if (!this.cafes.some(c => c.id === this.getActiveCafeId())) {
      this.setActiveCafeId(this.cafes[0].id);
    }
    return true;
  }

  updateCafeName(cafeId, newName) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe || !newName || !newName.trim()) return false;
    cafe.name = newName.trim();
    this.saveCafes();
    return true;
  }

  updateMenu(cafeId, menuId, { name, category, price, temp, popular }) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return false;
    const menu = (cafe.menus || []).find(m => m.id === menuId);
    if (!menu) return false;

    if (name && name.trim()) menu.name = name.trim();
    if (price !== undefined && price !== "") menu.price = Number(price) || 0;
    if (category && category.trim()) menu.category = category.trim();
    if (temp) menu.temp = temp;
    if (popular !== undefined) menu.popular = !!popular;

    this.syncCafeCategories(cafe);
    this.saveCafes();
    return true;
  }

  resetToDefaults() {
    this.cafes = JSON.parse(JSON.stringify(DEFAULT_CAFES));
    this.saveCafes();
    this.setActiveCafeId(this.cafes[0].id);
  }
}

// 전역 인스턴스
window.cafeDataManager = new CafeDataManager();
