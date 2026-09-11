/**
 * cafe-data.js
 * 카페별 기본 메뉴 프리셋 및 로컬스토리지 저장/관리 모듈
 */

// 대표 프랜차이즈 기본 프리셋 데이터
const DEFAULT_CAFES = [
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
  },
  {
    id: "megacoffee",
    name: "메가MGC커피",
    icon: "🟡",
    themeColor: "#D97706",
    categories: ["추천/인기", "커피", "디카페인", "스무디/프라페", "에이드/티"],
    menus: [
      { id: "mg-1", name: "아메리카노", category: "커피", price: 2000, temp: "both", popular: true },
      { id: "mg-2", name: "메가초코", category: "스무디/프라페", price: 3800, temp: "both", popular: true },
      { id: "mg-3", name: "카페라떼", category: "커피", price: 2900, temp: "both", popular: true },
      { id: "mg-4", name: "딸기쿠키프라페", category: "스무디/프라페", price: 3900, temp: "ice", popular: true },
      { id: "mg-5", name: "퐁크러쉬(플레인)", category: "스무디/프라페", price: 3900, temp: "ice", popular: true },
      { id: "mg-6", name: "바닐라라떼", category: "커피", price: 3400, temp: "both", popular: true },
      { id: "mg-7", name: "체리콕", category: "에이드/티", price: 3300, temp: "ice", popular: false },
      { id: "mg-8", name: "큐브라떼", category: "커피", price: 4200, temp: "ice", popular: true },
      { id: "mg-9", name: "허니자몽블랙티", category: "에이드/티", price: 3700, temp: "both", popular: false },
      { id: "mg-10", name: "청포도에이드", category: "에이드/티", price: 3500, temp: "ice", popular: false },
      { id: "mg-11", name: "디카페인 아메리카노", category: "디카페인", price: 3000, temp: "both", popular: false }
    ]
  },
  {
    id: "compose",
    name: "컴포즈커피",
    icon: "☕",
    themeColor: "#B45309",
    categories: ["추천/인기", "커피", "더치커피", "프라페/스무디", "티/에이드"],
    menus: [
      { id: "cp-1", name: "아메리카노", category: "커피", price: 1500, temp: "both", popular: true },
      { id: "cp-2", name: "카페라떼", category: "커피", price: 2900, temp: "both", popular: true },
      { id: "cp-3", name: "바닐라라떼", category: "커피", price: 3300, temp: "both", popular: true },
      { id: "cp-4", name: "더치커피", category: "더치커피", price: 3300, temp: "both", popular: false },
      { id: "cp-5", name: "민트초코오레오 라떼", category: "프라페/스무디", price: 3500, temp: "ice", popular: true },
      { id: "cp-6", name: "자바칩 프라페", category: "프라페/스무디", price: 4000, temp: "ice", popular: true },
      { id: "cp-7", name: "망고스무디", category: "프라페/스무디", price: 3800, temp: "ice", popular: false },
      { id: "cp-8", name: "자몽에이드", category: "티/에이드", price: 3500, temp: "ice", popular: false },
      { id: "cp-9", name: "돌체라떼", category: "커피", price: 3800, temp: "both", popular: true }
    ]
  },
  {
    id: "paiks",
    name: "빽다방",
    icon: "🔷",
    themeColor: "#1E40AF",
    categories: ["추천/인기", "커피", "음료/티", "빽스치노/주스"],
    menus: [
      { id: "pk-1", name: "앗!메리카노", category: "커피", price: 2000, temp: "both", popular: true },
      { id: "pk-2", name: "원조커피", category: "커피", price: 2500, temp: "both", popular: true },
      { id: "pk-3", name: "빽사이즈 아메리카노", category: "커피", price: 3000, temp: "ice", popular: true },
      { id: "pk-4", name: "바닐라라떼", category: "커피", price: 3700, temp: "both", popular: true },
      { id: "pk-5", name: "완전딸기", category: "음료/티", price: 4000, temp: "ice", popular: true },
      { id: "pk-6", name: "피스타치오 빽스치노", category: "빽스치노/주스", price: 4500, temp: "ice", popular: true },
      { id: "pk-7", name: "블루캔디소다", category: "음료/티", price: 3500, temp: "ice", popular: false },
      { id: "pk-8", name: "달달연유라떼", category: "커피", price: 3700, temp: "both", popular: false }
    ]
  },
  {
    id: "twosome",
    name: "투썸플레이스",
    icon: "🍰",
    themeColor: "#B91C1C",
    categories: ["추천/인기", "커피", "티/음료", "프라페/블렌디드"],
    menus: [
      { id: "ts-1", name: "아메리카노", category: "커피", price: 4500, temp: "both", popular: true },
      { id: "ts-2", name: "카페라떼", category: "커피", price: 5000, temp: "both", popular: true },
      { id: "ts-3", name: "스페니쉬 연유라떼", category: "커피", price: 5800, temp: "both", popular: true },
      { id: "ts-4", name: "스트로베리 피치 프라페", category: "프라페/블렌디드", price: 6100, temp: "ice", popular: true },
      { id: "ts-5", name: "로얄 밀크티 쉐이크", category: "프라페/블렌디드", price: 6500, temp: "ice", popular: true },
      { id: "ts-6", name: "신촌 블루밍 라떼", category: "커피", price: 6000, temp: "both", popular: false }
    ]
  },
  {
    id: "custom-local",
    name: "우리동네/사내 카페",
    icon: "🏬",
    themeColor: "#4B5563",
    categories: ["추천/인기", "커피", "논커피", "티"],
    menus: [
      { id: "ct-1", name: "아메리카노", category: "커피", price: 3000, temp: "both", popular: true },
      { id: "ct-2", name: "카페라떼", category: "커피", price: 3500, temp: "both", popular: true },
      { id: "ct-3", name: "바닐라빈 라떼", category: "커피", price: 4000, temp: "both", popular: true },
      { id: "ct-4", name: "말차 라떼", category: "논커피", price: 4500, temp: "both", popular: false },
      { id: "ct-5", name: "생과일 딸기주스", category: "논커피", price: 4800, temp: "ice", popular: true },
      { id: "ct-6", name: "캐모마일 티", category: "티", price: 3500, temp: "both", popular: false }
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

  addCafe(name, icon = "☕", themeColor = "#6366F1") {
    const id = "custom_" + Date.now();
    const newCafe = {
      id,
      name: name.trim(),
      icon: icon || "☕",
      themeColor: themeColor || "#6366F1",
      categories: ["추천/인기", "커피", "논커피", "티/음료"],
      menus: [
        { id: `m_${Date.now()}_1`, name: "아메리카노", category: "커피", price: 3000, temp: "both", popular: true },
        { id: `m_${Date.now()}_2`, name: "카페라떼", category: "커피", price: 3500, temp: "both", popular: true }
      ]
    };
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

    if (!cafe.categories.includes(newMenu.category)) {
      cafe.categories.push(newMenu.category);
    }

    cafe.menus.push(newMenu);
    this.saveCafes();
    return newMenu;
  }

  deleteMenu(cafeId, menuId) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return false;
    cafe.menus = cafe.menus.filter(m => m.id !== menuId);
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
