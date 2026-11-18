/**
 * cafe-data.js
 * 카페별 기본 메뉴 프리셋, 실물 음료 사진 매핑 및 로컬스토리지 관리 모듈
 */

// 음료별 검증된 고화질 실물 사진 라이브러리
const DRINK_PHOTOS = {
  americano: "./images/americano.jpg",
  chamomile: "./images/chamomile.jpg",
  earlgrey: "./images/earlgrey.jpg",
  lemonade: "./images/lemonade.jpg",
  grapefruitAde: "./images/grapefruit_ade.jpg",
  latte: "./images/latte.jpg",
  strawberry: "./images/strawberry.jpg",
  matcha: "./images/matcha.jpg",
  frappuccino: "./images/frappuccino.jpg",
  absent: "./images/absent.svg",
  coldbrew: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=240&h=240&q=80",
  soda: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=240&h=240&q=80"
};

// 메뉴 이름 기반 최적 실물 사진 자동 매핑 함수
function getMenuPhoto(menuOrName) {
  const rawName = typeof menuOrName === "string" ? menuOrName : (menuOrName?.name || "");
  const name = rawName.toLowerCase().replace(/\s+/g, "");

  // 0. 불참 / 미참석 항목
  if (name.includes("불참") || name.includes("미참석") || name.includes("안마심") || name.includes("없음")) {
    return DRINK_PHOTOS.absent;
  }

  // 1. 카모마일 / 캐모마일 / 허브티
  if (name.includes("카모마일") || name.includes("캐모마일") || name.includes("페퍼민트") || name.includes("허브") || name.includes("국화")) {
    return DRINK_PHOTOS.chamomile;
  }

  // 2. 레모네이드 / 레몬에이드 / 유자 / 청포도
  if (name.includes("레모네이드") || name.includes("레몬에이드") || name.includes("레몬") || name.includes("유자") || name.includes("청포도") || name.includes("쿨라임") || name.includes("피지오") || name.includes("모히또")) {
    return DRINK_PHOTOS.lemonade;
  }

  // 3. 자몽에이드 / 자몽허니블랙티(자허블) / 기타 에이드
  if (name.includes("자몽") || name.includes("자허블") || name.includes("오렌지") || name.includes("패션") || name.includes("망고에이드") || name.includes("에이드") || name.includes("네이드")) {
    return DRINK_PHOTOS.grapefruitAde;
  }

  // 4. 얼그레이 / 홍차 / 블랙티 / 아이스티 / 밀크티
  if (name.includes("얼그레이") || name.includes("홍차") || name.includes("블랙티") || name.includes("아이스티") || name.includes("복숭아") || name.includes("밀크티") || name.includes("버블티") || name.includes("티")) {
    return DRINK_PHOTOS.earlgrey;
  }

  // 5. 딸기라떼 / 베리 / 요거트 / 스무디 / 블렌디드
  if (name.includes("딸기") || name.includes("베리") || name.includes("요거트") || name.includes("스무디") || name.includes("블렌디드")) {
    return DRINK_PHOTOS.strawberry;
  }

  // 6. 말차 / 녹차 / 그린티
  if (name.includes("말차") || name.includes("녹차") || name.includes("그린티")) {
    return DRINK_PHOTOS.matcha;
  }

  // 7. 프라푸치노 / 자바칩 / 초코 / 모카 / 쉐이크
  if (name.includes("프라푸치노") || name.includes("자바칩") || name.includes("초코") || name.includes("초콜릿") || name.includes("모카") || name.includes("쉐이크")) {
    return DRINK_PHOTOS.frappuccino;
  }

  // 8. 탄산음료 / 콜라 / 사이다
  if (name.includes("탄산") || name.includes("콜라") || name.includes("사이다")) {
    return DRINK_PHOTOS.soda;
  }

  // 9. 콜드브루 / 바닐라라떼 / 돌체라떼 / 연유라떼
  if (name.includes("콜드브루") || name.includes("더치") || name.includes("바크콜") || name.includes("바닐라") || name.includes("돌체") || name.includes("연유")) {
    return DRINK_PHOTOS.coldbrew;
  }

  // 10. 카페라떼 / 카푸치노 / 마키아또 / 아인슈페너 / 크림라떼
  if (name.includes("라떼") || name.includes("카푸치노") || name.includes("플랫화이트") || name.includes("마키아또") || name.includes("마끼아또") || name.includes("카라멜") || name.includes("아인슈페너") || name.includes("크림")) {
    return DRINK_PHOTOS.latte;
  }

  // 11. 아메리카노 및 기본 커피
  return DRINK_PHOTOS.americano;
}

// 대표 프랜차이즈 기본 프리셋 데이터
const DEFAULT_CAFES = [
  {
    id: "brunchbean",
    name: "브런치빈",
    icon: "🥗",
    themeColor: "#059669",
    categories: ["추천/인기", "커피"],
    menus: [
      { id: "menu_1794831411663", name: "아메리카노", category: "커피", price: 0, temp: "both", popular: true, image: DRINK_PHOTOS.americano },
      { id: "m_1794885909407", name: "카페라떼", category: "커피", price: 0, temp: "hot", popular: true, image: DRINK_PHOTOS.latte },
      { id: "menu_1794831429056", name: "카모마일티", category: "커피", price: 0, temp: "hot", popular: true, image: DRINK_PHOTOS.chamomile },
      { id: "menu_1794831434879", name: "얼그레이티", category: "커피", price: 0, temp: "hot", popular: true, image: DRINK_PHOTOS.earlgrey },
      { id: "menu_1794831446232", name: "레모네이드", category: "커피", price: 0, temp: "ice", popular: true, image: DRINK_PHOTOS.lemonade },
      { id: "menu_1794831453647", name: "자몽에이드", category: "커피", price: 0, temp: "ice", popular: true, image: DRINK_PHOTOS.grapefruitAde },
      { id: "menu_1794831903712", name: "불참합니다", category: "커피", price: 0, temp: "both", popular: true, image: DRINK_PHOTOS.absent }
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
          parsed.forEach(c => {
            if (Array.isArray(c.menus)) {
              c.menus.forEach(m => {
                m.image = getMenuPhoto(m.name);
              });
            }
            this.syncCafeCategories(c);
          });
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

  // 오늘 주문 가능한 메뉴 목록 반환 (관리자가 지정한 메뉴 필터링)
  getAvailableMenus(cafeId, availableMenuIds) {
    const cafe = this.cafes.find(c => c.id === cafeId) || this.getActiveCafe();
    if (!cafe || !Array.isArray(cafe.menus)) return [];
    if (!Array.isArray(availableMenuIds) || availableMenuIds.length === 0) {
      return cafe.menus;
    }
    const idSet = new Set(availableMenuIds);
    const filtered = cafe.menus.filter(m => idSet.has(m.id));
    return filtered.length > 0 ? filtered : cafe.menus;
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
    if (currentOrder === orderIds.join(",")) return false;

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
        { id: `m_${Date.now()}_1`, name: "아메리카노", category: "커피", price: 3000, temp: "both", popular: true, image: DRINK_PHOTOS.americano },
        { id: `m_${Date.now()}_2`, name: "카페라떼", category: "커피", price: 3500, temp: "both", popular: true, image: DRINK_PHOTOS.latte },
        { id: `m_${Date.now()}_3`, name: "바닐라라떼", category: "커피", price: 4000, temp: "both", popular: false, image: DRINK_PHOTOS.coldbrew }
      ]
    };
    this.cafes.push(newCafe);
    this.saveCafes();
    return newCafe;
  }

  deleteCafe(cafeId) {
    if (this.cafes.length <= 1) {
      alert("최소 1개의 카페는 남아있어야 합니다!");
      return false;
    }
    this.cafes = this.cafes.filter(c => c.id !== cafeId);
    if (this.getActiveCafeId() === cafeId) {
      this.setActiveCafeId(this.cafes[0].id);
    }
    this.saveCafes();
    return true;
  }

  addMenu(cafeId, menuData) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return null;
    const newMenu = {
      id: "m_" + Date.now(),
      name: menuData.name.trim(),
      category: menuData.category || "커피",
      price: parseInt(menuData.price, 10) || 0,
      temp: menuData.temp || "both",
      popular: !!menuData.popular,
      image: getMenuPhoto(menuData.name)
    };
    cafe.menus.push(newMenu);
    this.syncCafeCategories(cafe);
    this.saveCafes();
    return newMenu;
  }

  updateMenu(cafeId, menuId, updatedData) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return false;
    const menu = cafe.menus.find(m => m.id === menuId);
    if (!menu) return false;
    Object.assign(menu, updatedData);
    menu.image = getMenuPhoto(menu.name);
    this.syncCafeCategories(cafe);
    this.saveCafes();
    return true;
  }

  deleteMenu(cafeId, menuId) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return false;
    cafe.menus = cafe.menus.filter(m => m.id !== menuId);
    this.syncCafeCategories(cafe);
    this.saveCafes();
    return true;
  }

  updateCafeName(cafeId, newName) {
    const cafe = this.cafes.find(c => c.id === cafeId);
    if (!cafe) return false;
    const trimmed = (newName || "").trim();
    if (!trimmed) return false;
    cafe.name = trimmed;
    this.saveCafes();
    return true;
  }

  setAllCafes(cafes) {
    if (!Array.isArray(cafes) || cafes.length === 0) return;
    cafes.forEach(c => {
      if (Array.isArray(c.menus)) {
        c.menus.forEach(m => {
          m.image = getMenuPhoto(m.name);
        });
      }
      this.syncCafeCategories(c);
    });
    this.cafes = cafes;
    this.saveCafes();
  }

  resetToDefaults() {
    this.cafes = JSON.parse(JSON.stringify(DEFAULT_CAFES));
    this.setActiveCafeId(this.cafes[0].id);
    this.saveCafes();
  }
}

// 전역 싱글톤 인스턴스
window.DRINK_PHOTOS = DRINK_PHOTOS;
window.getMenuPhoto = getMenuPhoto;
window.cafeDataManager = new CafeDataManager();
