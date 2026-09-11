/**
 * app.js
 * 모두의 음료 (Cafe Order Collector) 메인 애플리케이션 로직
 */

class App {
  constructor() {
    this.cafeManager = window.cafeDataManager;
    this.textParser = window.smartOrderParser;

    // 장바구니/주문 상태: key = `${menuName}_${temp}_${options.join(',')}`
    this.orderMap = new Map(); 
    this.activeCategory = "전체";
    this.currentTab = "counter"; // 'counter', 'parser', 'manage'

    this.sync = window.cloudSyncService;

    this.initDOM();
    this.initEvents();
    this.initCloudSync();
    this.initPWAInstall();
    this.renderCafeChips();
    this.renderCategoryChips();
    this.renderMenuList();
    this.updateBottomBar();
  }

  initDOM() {
    // 탭 요소
    this.tabBtns = document.querySelectorAll(".nav-tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");

    // 카페 칩 컨테이너
    this.cafeChipsContainer = document.getElementById("cafeChipsContainer");

    // 카테고리 칩 컨테이너
    this.catChipsContainer = document.getElementById("catChipsContainer");

    // 메뉴 그리드
    this.menuGrid = document.getElementById("menuGrid");

    // 즉석 추가 인풋
    this.quickNameInput = document.getElementById("quickMenuName");
    this.quickPriceInput = document.getElementById("quickMenuPrice");
    this.quickTempSelect = document.getElementById("quickMenuTemp");
    this.quickMenuMild = document.getElementById("quickMenuMild");
    this.btnQuickAdd = document.getElementById("btnQuickAdd");

    // 텍스트 파서 요소
    this.parseInput = document.getElementById("parseInput");
    this.btnParse = document.getElementById("btnParse");
    this.parseResultContainer = document.getElementById("parseResultContainer");
    this.btnApplyParseToOrder = document.getElementById("btnApplyParseToOrder");

    // 하단 바
    this.bottomTotalCount = document.getElementById("bottomTotalCount");
    this.bottomTotalPrice = document.getElementById("bottomTotalPrice");
    this.btnResetOrder = document.getElementById("btnResetOrder");
    this.btnOpenModal = document.getElementById("btnOpenModal");

    // 모달 요소
    this.orderModal = document.getElementById("orderModal");
    this.btnCloseModal = document.getElementById("btnCloseModal");
    this.btnCloseSheet = document.getElementById("btnCloseSheet");
    this.modalCounterList = document.getElementById("modalCounterList");
    this.modalTotalCount = document.getElementById("modalTotalCount");
    this.modalTotalPrice = document.getElementById("modalTotalPrice");
    this.btnCopyKakao = document.getElementById("btnCopyKakao");

    // 정산기
    this.dutchHeadcount = document.getElementById("dutchHeadcount");
    this.dutchPerPerson = document.getElementById("dutchPerPerson");
    this.btnCopyDutch = document.getElementById("btnCopyDutch");

    // 관리 탭 요소
    this.manageCafeSelect = document.getElementById("manageCafeSelect");
    this.menuManageList = document.getElementById("menuManageList");
    this.btnAddCustomCafe = document.getElementById("btnAddCustomCafe");
    this.newCafeNameInput = document.getElementById("newCafeName");
    this.btnAddCustomMenu = document.getElementById("btnAddCustomMenu");
    this.newMenuNameInput = document.getElementById("newMenuName");
    this.newMenuPriceInput = document.getElementById("newMenuPrice");
    this.newMenuCategoryInput = document.getElementById("newMenuCategory");
    this.newMenuTempSelect = document.getElementById("newMenuTemp");
    this.btnDeleteCurrentCafe = document.getElementById("btnDeleteCurrentCafe");
    this.btnEditCurrentCafe = document.getElementById("btnEditCurrentCafe");

    // 앱 타이틀 및 카페 순서 재배치 요소
    this.brandTitleArea = document.getElementById("brandTitleArea");
    this.appTitleText = document.getElementById("appTitleText");
    this.customAppTitleInput = document.getElementById("customAppTitleInput");
    this.btnSaveAppTitle = document.getElementById("btnSaveAppTitle");
    this.cafeReorderList = document.getElementById("cafeReorderList");

    // 저장된 앱 제목 로드
    const savedTitle = this.cafeManager.getAppTitle();
    if (this.appTitleText) this.appTitleText.textContent = savedTitle;
    document.title = `${savedTitle} - 단체 음료 주문 취합기`;
    // 닉네임 및 공유 링크 요소
    this.userNicknameInput = document.getElementById("userNicknameInput");
    this.btnShareRoomLink = document.getElementById("btnShareRoomLink");

    // 저장된 닉네임 로드
    const savedNickname = localStorage.getItem("my_order_nickname") || "";
    if (this.userNicknameInput) this.userNicknameInput.value = savedNickname;

    // 새 주문 및 주문 비우기 요소
    this.btnStartNewOrder = document.getElementById("btnStartNewOrder");
    this.btnModalClearOrders = document.getElementById("btnModalClearOrders");
    this.staleOrderBanner = document.getElementById("staleOrderBanner");
    this.btnStaleNewOrder = document.getElementById("btnStaleNewOrder");
    this.btnStaleDismiss = document.getElementById("btnStaleDismiss");
    this.staleOrderBannerText = document.getElementById("staleOrderBannerText");

    // PWA 앱 설치 요소
    this.pwaInstallBanner = document.getElementById("pwaInstallBanner");
    this.btnDoInstall = document.getElementById("btnDoInstall");
    this.btnDismissInstall = document.getElementById("btnDismissInstall");
    this.btnManageInstall = document.getElementById("btnManageInstall");
    this.cardInstallPwa = document.getElementById("cardInstallPwa");

    // 토스트
    this.toastEl = document.getElementById("toastMsg");
  }

  initCloudSync() {
    if (!this.sync) return;

    this.sync.onSync((roomData) => {
      if (!roomData) return;

      // 1. 앱 타이틀 실시간 동기화
      if (roomData.title && roomData.title !== this.cafeManager.getAppTitle()) {
        this.cafeManager.setAppTitle(roomData.title);
        if (this.appTitleText) this.appTitleText.textContent = roomData.title;
        document.title = `${roomData.title} - 단체 음료 주문 취합기`;
        if (this.customAppTitleInput) this.customAppTitleInput.value = roomData.title;
      }

      // 2. 전체 카페 및 메뉴 목록 실시간 동기화 (생성/삭제/수정/순서 전체 반영)
      if (Array.isArray(roomData.cafes) && roomData.cafes.length > 0) {
        const currentCafesJson = JSON.stringify(this.cafeManager.cafes);
        const incomingCafesJson = JSON.stringify(roomData.cafes);
        if (currentCafesJson !== incomingCafesJson) {
          this.cafeManager.setAllCafes(roomData.cafes);
          this.renderCafeChips();
          this.renderCategoryChips();
          this.updateOrRenderMenuList();
          if (this.currentTab === "manage") {
            this.renderManageView();
          }
        }
      } else if (this.sync.isOnline && (!roomData.cafes || roomData.cafes.length === 0)) {
        this.sync.setCafes(this.cafeManager.cafes);
      }

      // 2-1. 활성 카페 실시간 동기화
      if (roomData.activeCafeId && roomData.activeCafeId !== this.cafeManager.getActiveCafeId()) {
        if (this.cafeManager.cafes.some(c => c.id === roomData.activeCafeId)) {
          this.cafeManager.setActiveCafeId(roomData.activeCafeId);
          this.renderCafeChips();
          this.renderCategoryChips();
          this.updateOrRenderMenuList();
        }
      }

      // 2-2. 카페 표시 순서 실시간 동기화 (모바일 <-> PC)
      if (Array.isArray(roomData.cafeOrder) && roomData.cafeOrder.length > 0) {
        if (this.cafeManager.applyCafeOrder(roomData.cafeOrder)) {
          this.renderCafeChips();
          this.renderCategoryChips();
          this.updateOrRenderMenuList();
          if (this.currentTab === "manage") {
            this.renderCafeReorderList();
          }
        }
      }

      // 3. 주문 목록 실시간 동기화
      if (Array.isArray(roomData.orders)) {
        this.orderMap.clear();
        roomData.orders.forEach(item => {
          this.orderMap.set(item.key, {
            menuName: item.menuName,
            temp: item.temp,
            price: item.price || 0,
            qty: item.qty,
            options: item.options || [],
            persons: item.persons || [],
            personMap: item.personMap || {}
          });
        });
        this.updateBottomBar();
        this.updateOrRenderMenuList();

        // 모달이 열려있다면 주문서 내용도 실시간으로 갱신
        if (this.orderModal && this.orderModal.classList.contains("active")) {
          this.renderModalCounterList();
        }

        // 이전 세션 주문(2시간 이상 경과) 감지 배너
        if (roomData.orders.length > 0 && roomData.updatedAt) {
          const elapsedHours = (Date.now() - roomData.updatedAt) / (1000 * 60 * 60);
          if (this.staleOrderBanner && this.staleOrderBannerText && elapsedHours >= 2) {
            let totalQty = 0;
            roomData.orders.forEach(o => totalQty += (o.qty || 0));
            this.staleOrderBannerText.textContent = `이전 주문 내역(총 ${totalQty}잔 / ${Math.floor(elapsedHours)}시간 전)이 남아있습니다.`;
            this.staleOrderBanner.style.display = "flex";
          } else if (this.staleOrderBanner) {
            this.staleOrderBanner.style.display = "none";
          }
        } else if (this.staleOrderBanner) {
          this.staleOrderBanner.style.display = "none";
        }
      }
    });
  }

  initPWAInstall() {
    // 1. 서비스 워커 등록
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(err => {
          console.warn("Service worker 등록 실패:", err);
        });
      });
    }

    this.deferredInstallPrompt = null;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

    // 이미 독립 앱으로 실행 중이면 배너와 설치 카드 숨김
    if (isStandalone) {
      if (this.pwaInstallBanner) this.pwaInstallBanner.style.display = "none";
      if (this.cardInstallPwa) this.cardInstallPwa.style.display = "none";
      return;
    }

    // 2. 크롬/안드로이드 공식 PWA 설치 프롬프트 이벤트 감지
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;

      // 이번 세션에서 닫지 않았다면 상단 배너 표시
      if (!sessionStorage.getItem("dismiss_install_banner") && this.pwaInstallBanner) {
        this.pwaInstallBanner.style.display = "flex";
      }
    });

    // 3. 설치 버튼 클릭 핸들러
    const handleInstallAction = async () => {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        const choiceResult = await this.deferredInstallPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          this.showToast("앱 설치가 시작되었습니다! 🎉");
        }
        this.deferredInstallPrompt = null;
        if (this.pwaInstallBanner) this.pwaInstallBanner.style.display = "none";
      } else {
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIos) {
          alert("📱 아이폰 홈 화면 추가 방법:\n\n1. 사파리 브라우저 하단 중앙 [공유 (네모 위 화살표 ↑)] 버튼 터치\n2. 메뉴에서 [홈 화면에 추가] 선택\n3. 우측 상단 [추가]를 누르면 바탕화면에 생성됩니다!");
        } else {
          alert("📱 브라우저 메뉴에서 바로 설치하기:\n\n우측 상단 메뉴(점 3개 ⋮)를 누르고 [앱 설치] 또는 [홈 화면에 추가]를 눌러주세요!");
        }
      }
    };

    if (this.btnDoInstall) {
      this.btnDoInstall.addEventListener("click", handleInstallAction);
    }
    if (this.btnManageInstall) {
      this.btnManageInstall.addEventListener("click", handleInstallAction);
    }

    if (this.btnDismissInstall) {
      this.btnDismissInstall.addEventListener("click", () => {
        if (this.pwaInstallBanner) this.pwaInstallBanner.style.display = "none";
        sessionStorage.setItem("dismiss_install_banner", "1");
      });
    }

    // 4. 앱 설치 완료 감지
    window.addEventListener("appinstalled", () => {
      if (this.pwaInstallBanner) this.pwaInstallBanner.style.display = "none";
      if (this.cardInstallPwa) this.cardInstallPwa.style.display = "none";
      this.showToast("바탕화면에 모두의음료 앱이 설치되었습니다! ☕");
    });
  }

  initEvents() {
    // 닉네임 저장 이벤트
    if (this.userNicknameInput) {
      this.userNicknameInput.addEventListener("input", () => {
        localStorage.setItem("my_order_nickname", this.userNicknameInput.value.trim());
      });
    }

    // 공유 링크 복사 이벤트
    if (this.btnShareRoomLink) {
      this.btnShareRoomLink.addEventListener("click", () => {
        const url = this.sync ? this.sync.getShareUrl() : window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          this.showToast("주문방 링크가 복사되었습니다! 카톡에 공유하세요 📋");
        }).catch(() => {
          prompt("아래 주소를 복사하여 단톡방에 공유하세요:", url);
        });
      });
    }

    // 앱 제목 변경 이벤트
    if (this.brandTitleArea) {
      this.brandTitleArea.addEventListener("click", () => {
        const current = this.cafeManager.getAppTitle();
        const input = prompt("새로운 프로그램 제목을 입력하세요:", current);
        if (input !== null) {
          this.updateAppTitle(input);
        }
      });
    }

    if (this.btnSaveAppTitle) {
      this.btnSaveAppTitle.addEventListener("click", () => {
        this.updateAppTitle(this.customAppTitleInput.value);
      });
      this.customAppTitleInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.updateAppTitle(this.customAppTitleInput.value);
      });
    }

    // 탭 전환 이벤트
    this.tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 즉석 메뉴 추가
    this.btnQuickAdd.addEventListener("click", () => this.handleQuickAdd());
    this.quickNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleQuickAdd();
    });

    // 카톡 텍스트 파싱
    this.btnParse.addEventListener("click", () => this.handleParseText());
    if (this.btnApplyParseToOrder) {
      this.btnApplyParseToOrder.addEventListener("click", () => this.applyParseResultsToOrder());
    }

    // 샘플 텍스트 버튼
    document.querySelectorAll(".btn-sample").forEach(btn => {
      btn.addEventListener("click", () => {
        const sampleText = btn.dataset.sample;
        if (sampleText) {
          this.parseInput.value = sampleText.replace(/\\n/g, "\n");
          this.handleParseText();
        }
      });
    });

    // 새 주문 시작 및 주문 초기화 이벤트
    if (this.btnStartNewOrder) {
      this.btnStartNewOrder.addEventListener("click", () => this.clearAllOrders(true));
    }
    if (this.btnResetOrder) {
      this.btnResetOrder.addEventListener("click", () => this.clearAllOrders(true));
    }
    if (this.btnModalClearOrders) {
      this.btnModalClearOrders.addEventListener("click", () => this.clearAllOrders(true));
    }
    if (this.btnStaleNewOrder) {
      this.btnStaleNewOrder.addEventListener("click", () => this.clearAllOrders(false));
    }
    if (this.btnStaleDismiss) {
      this.btnStaleDismiss.addEventListener("click", () => {
        if (this.staleOrderBanner) this.staleOrderBanner.style.display = "none";
      });
    }

    // 모달 열기 / 닫기
    this.btnOpenModal.addEventListener("click", () => this.openOrderModal());
    this.btnCloseModal.addEventListener("click", () => this.closeOrderModal());
    this.btnCloseSheet.addEventListener("click", () => this.closeOrderModal());
    this.orderModal.addEventListener("click", (e) => {
      if (e.target === this.orderModal) this.closeOrderModal();
    });

    // 카톡 텍스트 복사
    this.btnCopyKakao.addEventListener("click", () => this.copyKakaoSummary());

    // 더치페이 인원 수 변경
    this.dutchHeadcount.addEventListener("input", () => this.calculateDutchPay());
    this.btnCopyDutch.addEventListener("click", () => this.copyDutchSummary());

    // 관리 탭 이벤트
    this.btnAddCustomCafe.addEventListener("click", () => this.handleAddCafe());
    this.btnAddCustomMenu.addEventListener("click", () => this.handleAddMenu());
    this.btnDeleteCurrentCafe.addEventListener("click", () => this.handleDeleteCafe());
    if (this.btnEditCurrentCafe) {
      this.btnEditCurrentCafe.addEventListener("click", () => this.handleEditCafeName());
    }
    this.manageCafeSelect.addEventListener("change", (e) => {
      this.cafeManager.setActiveCafeId(e.target.value);
      this.renderCafeChips();
      this.renderCategoryChips();
      this.renderMenuList();
      this.renderManageMenuList();
    });
  }

  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add("show");
    setTimeout(() => {
      this.toastEl.classList.remove("show");
    }, 2400);
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    this.tabBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
    this.tabContents.forEach(content => {
      content.classList.toggle("active", content.id === `tab-${tabId}`);
    });

    if (tabId === "manage") {
      this.renderManageView();
    }
  }

  // --- 카페 선택 및 카테고리 칩 렌더링 ---
  renderCafeChips() {
    const activeId = this.cafeManager.getActiveCafeId();
    this.cafeChipsContainer.innerHTML = "";

    this.cafeManager.cafes.forEach(cafe => {
      const chip = document.createElement("button");
      chip.className = `cafe-chip ${cafe.id === activeId ? "active" : ""}`;
      chip.innerHTML = `<span>${cafe.icon || "☕"}</span> <span>${cafe.name}</span>`;
      chip.addEventListener("click", () => {
        if (this.cafeManager.getActiveCafeId() !== cafe.id) {
          let totalOrdersCount = 0;
          for (const item of this.orderMap.values()) totalOrdersCount += item.qty;
          if (totalOrdersCount > 0) {
            const currentCafe = this.cafeManager.getActiveCafe();
            const confirmed = confirm(`현재 '${currentCafe.name}'에서 담은 주문(${totalOrdersCount}잔)이 있습니다.\n'${cafe.name}'(으)로 변경하시겠습니까?\n\n[확인]: 기존 주문을 비우고 새 카페로 시작\n[취소]: 현재 카페 유지`);
            if (!confirmed) return;
            this.orderMap.clear();
            if (this.sync) this.sync.clearOrders();
          }
          this.cafeManager.setActiveCafeId(cafe.id);
          this.activeCategory = "전체";
          this.renderCafeChips();
          this.renderCategoryChips();
          this.renderMenuList();
          this.updateBottomBar();
          if (this.sync) this.sync.setActiveCafe(cafe.id);
          this.showToast(`'${cafe.name}' 메뉴판으로 변경되었습니다.`);
        }
      });
      this.cafeChipsContainer.appendChild(chip);
    });

    // [+ 카페 추가] 바로가기 칩
    const addChip = document.createElement("button");
    addChip.className = "cafe-chip btn-add-cafe";
    addChip.innerHTML = `<span>➕</span> <span>카페 추가</span>`;
    addChip.addEventListener("click", () => {
      this.switchTab("manage");
      this.newCafeNameInput.focus();
    });
    this.cafeChipsContainer.appendChild(addChip);
  }

  renderCategoryChips() {
    const activeCafe = this.cafeManager.getActiveCafe();
    this.catChipsContainer.innerHTML = "";

    const categories = ["전체", ...(activeCafe.categories || [])];
    categories.forEach(cat => {
      const chip = document.createElement("button");
      chip.className = `cat-chip ${this.activeCategory === cat ? "active" : ""}`;
      chip.textContent = cat;
      chip.addEventListener("click", () => {
        this.activeCategory = cat;
        this.renderCategoryChips();
        this.renderMenuList();
      });
      this.catChipsContainer.appendChild(chip);
    });
  }

  // --- 메뉴 리스트 렌더링 ---
  renderMenuList() {
    const activeCafe = this.cafeManager.getActiveCafe();
    this.menuGrid.innerHTML = "";

    let menus = activeCafe.menus || [];
    if (this.activeCategory === "추천/인기") {
      menus = menus.filter(m => m.popular);
    } else if (this.activeCategory !== "전체") {
      menus = menus.filter(m => m.category === this.activeCategory);
    }

    if (menus.length === 0) {
      this.menuGrid.innerHTML = `
        <div style="text-align: center; padding: 36px 12px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>등록된 메뉴가 없습니다.</div>
          <div style="font-size: 0.8rem; margin-top: 4px;">아래 '즉석 메뉴 추가'로 음료를 바로 추가해보세요!</div>
        </div>
      `;
      return;
    }

    menus.forEach(menu => {
      const card = this.createMenuCard(menu, activeCafe);
      this.menuGrid.appendChild(card);
    });
  }

  // 실시간 주문 수신 시 기존 카드 DOM을 파괴하지 않고 상태만 즉각 갱신
  updateOrRenderMenuList() {
    const existingCards = this.menuGrid.querySelectorAll(".menu-card");
    if (existingCards.length > 0) {
      existingCards.forEach(card => {
        if (card._updateCardState) {
          card._updateCardState();
        }
      });
    } else {
      this.renderMenuList();
    }
  }

  createMenuCard(menu, cafe) {
    const card = document.createElement("div");
    card.className = "menu-card";
    card._menuName = menu.name;

    let currentTemp = menu.temp === "hot" ? "HOT" : "ICE";
    let isMild = false;

    // 기존 주문 내역을 스캔하여 기본 선택 온도 및 연하게 상태 자동 세팅
    const existingOrders = Array.from(this.orderMap.values()).filter(o => o.menuName === menu.name && o.qty > 0);
    if (existingOrders.length > 0) {
      if (menu.temp === "both") {
        const hasIce = existingOrders.some(o => o.temp === "ICE");
        const hasHot = existingOrders.some(o => o.temp === "HOT");
        if (!hasIce && hasHot) currentTemp = "HOT";
      }
      const allMild = existingOrders.every(o => (o.options || []).includes("연하게"));
      if (allMild) isMild = true;
    }

    const getOrderKey = () => `${menu.name}_${currentTemp}${isMild ? '_연하게' : ''}`;
    const getCurrentQty = () => {
      const item = this.orderMap.get(getOrderKey());
      return item ? item.qty : 0;
    };

    const updateCardState = () => {
      const currentQty = getCurrentQty();
      let totalMenuQty = 0;
      const variations = [];

      for (const item of this.orderMap.values()) {
        if (item.menuName === menu.name && item.qty > 0) {
          totalMenuQty += item.qty;
          const optText = (item.options || []).includes("연하게") ? "연하게" : "";
          const desc = `${item.temp}${optText ? `(${optText})` : ''} ${item.qty}잔`;
          variations.push(desc);
        }
      }

      card.classList.toggle("has-order", totalMenuQty > 0);

      const qtyEl = card.querySelector(".qty-val");
      if (qtyEl) {
        qtyEl.textContent = currentQty;
        qtyEl.classList.toggle("nonzero", currentQty > 0);
      }

      const breakdownEl = card.querySelector(".menu-order-breakdown");
      if (breakdownEl) {
        if (totalMenuQty > 0) {
          breakdownEl.innerHTML = `<span class="menu-order-summary-badge">총 ${totalMenuQty}잔 [${variations.join(', ')}]</span>`;
        } else {
          breakdownEl.innerHTML = "";
        }
      }
    };

    card._updateCardState = updateCardState;

    // 카드 내부 HTML
    card.innerHTML = `
      <div class="menu-info" style="cursor: pointer;" title="터치하여 1잔 추가">
        <div class="menu-tags">
          ${menu.popular ? '<span class="badge-popular">인기</span>' : ''}
          ${menu.temp === 'ice' ? '<span class="badge-temp badge-ice">ICE전용</span>' : ''}
          ${menu.temp === 'hot' ? '<span class="badge-temp badge-hot">HOT전용</span>' : ''}
        </div>
        <div class="menu-name" title="${menu.name}">${menu.name}</div>
        <div class="menu-price">${menu.price.toLocaleString()}원</div>
        <div class="menu-order-breakdown"></div>
      </div>
      <div class="order-controls">
        <button type="button" class="btn-opt-mild ${isMild ? 'active' : ''}" title="연하게(샷 조절)">🌱 연하게</button>
        ${menu.temp === 'both' ? `
          <div class="temp-toggle-group">
            <button type="button" class="btn-temp ice ${currentTemp === 'ICE' ? 'active' : ''}">ICE</button>
            <button type="button" class="btn-temp hot ${currentTemp === 'HOT' ? 'active' : ''}">HOT</button>
          </div>
        ` : ''}
        <div class="qty-stepper">
          <button type="button" class="btn-step btn-minus">−</button>
          <span class="qty-val ${getCurrentQty() > 0 ? 'nonzero' : ''}">${getCurrentQty()}</span>
          <button type="button" class="btn-step btn-plus">+</button>
        </div>
      </div>
    `;

    // 연하게 토글 버튼 이벤트
    const btnMild = card.querySelector(".btn-opt-mild");
    if (btnMild) {
      btnMild.addEventListener("click", () => {
        isMild = !isMild;
        btnMild.classList.toggle("active", isMild);
        updateCardState();
      });
    }

    // 메뉴 정보 클릭 시에도 +1 추가
    card.querySelector(".menu-info").addEventListener("click", () => {
      btnPlus.click();
    });

    // 온도 토글 이벤트 (both인 경우)
    if (menu.temp === "both") {
      const btnIce = card.querySelector(".btn-temp.ice");
      const btnHot = card.querySelector(".btn-temp.hot");

      btnIce.addEventListener("click", () => {
        currentTemp = "ICE";
        btnIce.classList.add("active");
        btnHot.classList.remove("active");
        updateCardState();
      });

      btnHot.addEventListener("click", () => {
        currentTemp = "HOT";
        btnHot.classList.add("active");
        btnIce.classList.remove("active");
        updateCardState();
      });
    }

    // 수량 변경 이벤트
    const btnPlus = card.querySelector(".btn-plus");
    const btnMinus = card.querySelector(".btn-minus");

    btnPlus.addEventListener("click", () => {
      const myName = (this.userNicknameInput ? this.userNicknameInput.value.trim() : "") || "익명";
      const key = getOrderKey();
      const existing = this.orderMap.get(key) || {
        menuName: menu.name,
        temp: currentTemp,
        price: menu.price,
        qty: 0,
        options: isMild ? ["연하게"] : [],
        persons: [],
        personMap: {}
      };
      existing.qty += 1;
      if (!existing.personMap) existing.personMap = {};
      existing.personMap[myName] = (existing.personMap[myName] || 0) + 1;
      this.orderMap.set(key, existing);
      if (navigator.vibrate) navigator.vibrate(10);
      updateCardState();
      this.updateBottomBar();
      this.syncOrdersToCloud();
    });

    btnMinus.addEventListener("click", () => {
      const myName = (this.userNicknameInput ? this.userNicknameInput.value.trim() : "") || "익명";
      const key = getOrderKey();
      const existing = this.orderMap.get(key);
      if (existing && existing.qty > 0) {
        existing.qty -= 1;
        if (!existing.personMap) existing.personMap = {};
        if (existing.personMap[myName] && existing.personMap[myName] > 0) {
          existing.personMap[myName] -= 1;
          if (existing.personMap[myName] === 0) delete existing.personMap[myName];
        } else {
          const firstKey = Object.keys(existing.personMap)[0];
          if (firstKey) {
            existing.personMap[firstKey] -= 1;
            if (existing.personMap[firstKey] === 0) delete existing.personMap[firstKey];
          }
        }
        if (existing.qty === 0) {
          this.orderMap.delete(key);
        }
        if (navigator.vibrate) navigator.vibrate(10);
        updateCardState();
        this.updateBottomBar();
        this.syncOrdersToCloud();
      }
    });

    updateCardState();
    return card;
  }

  syncOrdersToCloud() {
    if (!this.sync) return;
    const arr = [];
    for (const [key, item] of this.orderMap.entries()) {
      if (item.qty > 0) {
        const personList = [];
        if (item.personMap && Object.keys(item.personMap).length > 0) {
          for (const [pName, pQty] of Object.entries(item.personMap)) {
            if (pQty > 0) {
              personList.push(`${pName}${pQty > 1 ? `(${pQty})` : ''}`);
            }
          }
        } else if (item.persons && item.persons.length > 0) {
          personList.push(...item.persons);
        }

        arr.push({
          key,
          menuName: item.menuName,
          temp: item.temp,
          price: item.price || 0,
          qty: item.qty,
          options: item.options || [],
          persons: personList,
          personMap: item.personMap || {}
        });
      }
    }
    this.sync.setOrders(arr);
  }

  // --- 즉석 메뉴 추가 ---
  handleQuickAdd() {
    const name = this.quickNameInput.value.trim();
    const price = parseInt(this.quickPriceInput.value, 10) || 0;
    const temp = this.quickTempSelect.value;
    const isMild = this.quickMenuMild ? this.quickMenuMild.checked : false;
    const myName = (this.userNicknameInput ? this.userNicknameInput.value.trim() : "") || "익명";

    if (!name) {
      alert("음료 이름을 입력해주세요.");
      return;
    }

    const optList = isMild ? ["연하게"] : ["즉석추가"];
    const key = `${name}_${temp}${isMild ? '_연하게' : ''}`;
    const existing = this.orderMap.get(key) || {
      menuName: name,
      temp: temp,
      price: price,
      qty: 0,
      options: optList,
      persons: [],
      personMap: {}
    };
    existing.qty += 1;
    if (!existing.personMap) existing.personMap = {};
    existing.personMap[myName] = (existing.personMap[myName] || 0) + 1;
    this.orderMap.set(key, existing);

    this.quickNameInput.value = "";
    this.quickPriceInput.value = "";
    if (this.quickMenuMild) this.quickMenuMild.checked = false;
    this.updateBottomBar();
    this.showToast(`'${name} (${temp}${isMild ? ' / 연하게' : ''})' 1잔이 추가되었습니다!`);
    this.syncOrdersToCloud();
  }

  // --- 텍스트 파싱 탭 처리 ---
  handleParseText() {
    const rawText = this.parseInput.value.trim();
    if (!rawText) {
      alert("분석할 단톡방 대화 텍스트를 입력해주세요.");
      return;
    }

    const activeCafe = this.cafeManager.getActiveCafe();
    const result = this.textParser.parseFullText(rawText, activeCafe.menus);
    this.lastParsedResult = result;

    this.renderParseResults(result);
  }

  renderParseResults(result) {
    this.parseResultContainer.innerHTML = "";

    if (result.items.length === 0) {
      this.parseResultContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted);">
          인식된 음료 주문이 없습니다. 텍스트를 다시 확인해주세요.
        </div>
      `;
      return;
    }

    // 상단 요약 배지
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.alignItems = "center";
    headerRow.style.marginBottom = "10px";
    headerRow.innerHTML = `
      <span style="font-weight: 800; font-size: 0.95rem;">총 ${result.totalQty}잔 인식됨</span>
      <span style="font-size: 0.8rem; color: var(--text-muted);">${result.summary.length}종류 메뉴</span>
    `;
    this.parseResultContainer.appendChild(headerRow);

    result.summary.forEach(item => {
      const card = document.createElement("div");
      card.className = "result-card";
      const personText = item.persons.length > 0 ? `주문자: ${item.persons.join(", ")}` : "주문자 미지정";

      card.innerHTML = `
        <div>
          <div class="result-title">
            <span class="badge-temp ${item.temp === 'ICE' ? 'badge-ice' : 'badge-hot'}">${item.temp}</span>
            <span>${item.menuName}</span>
            ${item.options.length > 0 ? `<span style="font-size:0.75rem; color:#B45309;">(${item.options.join(', ')})</span>` : ''}
          </div>
          <div class="result-persons">${personText}</div>
        </div>
        <div class="result-qty-badge">${item.qty}잔</div>
      `;
      this.parseResultContainer.appendChild(card);
    });

    if (this.btnApplyParseToOrder) {
      this.btnApplyParseToOrder.style.display = "flex";
    }
  }

  applyParseResultsToOrder() {
    if (!this.lastParsedResult || this.lastParsedResult.items.length === 0) return;

    const activeCafe = this.cafeManager.getActiveCafe();

    this.lastParsedResult.items.forEach(item => {
      // 메뉴 가격 매칭 시도
      let price = 0;
      const matched = activeCafe.menus.find(m => m.name.includes(item.menuName) || item.menuName.includes(m.name));
      if (matched) {
        price = matched.price;
      }

      const optKey = item.options.length > 0 ? item.options.join(",") : "";
      const key = `${item.menuName}_${item.temp}_${optKey}`;

      const existing = this.orderMap.get(key) || {
        menuName: item.menuName,
        temp: item.temp,
        price: price,
        qty: 0,
        options: item.options,
        persons: []
      };

      existing.qty += item.qty;
      if (item.person && item.person !== "익명") {
        if (!existing.personMap) existing.personMap = {};
        existing.personMap[item.person] = (existing.personMap[item.person] || 0) + item.qty;
        if (!existing.persons.includes(item.person)) {
          existing.persons.push(item.person);
        }
      }
      this.orderMap.set(key, existing);
    });

    this.updateBottomBar();
    this.renderMenuList();
    this.showToast(`총 ${this.lastParsedResult.totalQty}잔이 주문서에 합산되었습니다!`);
    this.switchTab("counter");
    this.syncOrdersToCloud();
  }

  // --- 하단 바 및 모달 상태 갱신 ---
  updateBottomBar() {
    let totalCount = 0;
    let totalPrice = 0;

    for (const item of this.orderMap.values()) {
      totalCount += item.qty;
      totalPrice += (item.price || 0) * item.qty;
    }

    this.bottomTotalCount.textContent = `총 ${totalCount}잔`;
    this.bottomTotalPrice.textContent = `${totalPrice.toLocaleString()}원`;

    // 1/N 정산 기본 인원수 세팅
    if (this.dutchHeadcount) {
      const currentHeadcount = parseInt(this.dutchHeadcount.value, 10) || 1;
      this.calculateDutchPay(totalPrice, currentHeadcount);
    }
  }

  renderModalCounterList() {
    if (!this.modalCounterList) return;
    const activeCafe = this.cafeManager.getActiveCafe();
    this.modalCounterList.innerHTML = "";

    let totalCount = 0;
    let totalPrice = 0;

    for (const item of this.orderMap.values()) {
      if (item.qty <= 0) continue;
      totalCount += item.qty;
      totalPrice += (item.price || 0) * item.qty;

      const optText = item.options.length > 0 ? ` (${item.options.join(", ")})` : "";
      const personText = item.persons && item.persons.length > 0 ? `[${item.persons.join(", ")}]` : "";

      const row = document.createElement("div");
      row.className = "counter-list-item";
      row.title = "터치하여 주문 완료 체크";
      row.innerHTML = `
        <div>
          <span class="counter-item-name">
            <span class="badge-temp ${item.temp === 'ICE' ? 'badge-ice' : 'badge-hot'}" style="margin-right: 4px;">${item.temp}</span>
            ${item.menuName}${optText}
          </span>
          ${personText ? `<div style="font-size:0.75rem; color:#64748B; margin-top:2px;">${personText}</div>` : ''}
        </div>
        <div class="counter-item-qty">${item.qty}잔</div>
      `;
      row.addEventListener("click", () => {
        row.classList.toggle("checked");
        if (navigator.vibrate) navigator.vibrate(12);
      });
      this.modalCounterList.appendChild(row);
    }

    if (totalCount === 0) {
      this.modalCounterList.innerHTML = `<div style="text-align:center; padding:24px 10px; color:var(--text-muted); font-size:0.9rem;">담긴 주문이 없습니다.</div>`;
    }

    if (this.modalTotalCount) this.modalTotalCount.textContent = `총 ${totalCount}잔`;
    if (this.modalTotalPrice) this.modalTotalPrice.textContent = `${totalPrice.toLocaleString()}원 (${activeCafe.name})`;

    this.calculateDutchPay(totalPrice);
  }

  openOrderModal() {
    if (this.orderMap.size === 0) {
      this.showToast("아직 담은 음료가 없습니다!");
      return;
    }
    this.renderModalCounterList();
    this.orderModal.classList.add("active");
  }

  closeOrderModal() {
    this.orderModal.classList.remove("active");
  }

  async clearAllOrders(showConfirm = true) {
    let totalQty = 0;
    for (const item of this.orderMap.values()) totalQty += item.qty;

    if (totalQty === 0) {
      this.showToast("현재 작성된 주문이 없습니다.");
      return;
    }

    if (showConfirm) {
      if (!confirm("새로운 주문을 시작하시겠습니까?\n현재 담긴 모든 주문 내역이 비워지며, 연결된 모든 기기(스마트폰, PC)에서도 실시간으로 초기화됩니다.")) {
        return;
      }
    }

    this.orderMap.clear();
    this.updateBottomBar();
    this.updateOrRenderMenuList();
    if (this.orderModal && this.orderModal.classList.contains("active")) {
      this.closeOrderModal();
    }
    if (this.staleOrderBanner) {
      this.staleOrderBanner.style.display = "none";
    }
    if (this.sync) {
      await this.sync.clearOrders();
    }
    this.showToast("새 주문이 시작되었습니다. 모든 화면이 초기화되었습니다! ✨");
  }

  calculateDutchPay(fixedTotalPrice, count) {
    let totalPrice = fixedTotalPrice;
    if (totalPrice === undefined) {
      totalPrice = 0;
      for (const item of this.orderMap.values()) {
        totalPrice += (item.price || 0) * item.qty;
      }
    }

    const headcount = count !== undefined ? count : (parseInt(this.dutchHeadcount.value, 10) || 1);
    const perPerson = Math.ceil(totalPrice / Math.max(1, headcount));
    this.dutchPerPerson.textContent = `${perPerson.toLocaleString()}원`;
  }

  // 카톡 공유용 주문 텍스트 생성 및 복사
  copyKakaoSummary() {
    const activeCafe = this.cafeManager.getActiveCafe();
    let totalCount = 0;
    let totalPrice = 0;

    let lines = [];
    lines.push(`☕ [${activeCafe.name}] 단체 음료 주문 내역`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    for (const item of this.orderMap.values()) {
      if (item.qty <= 0) continue;
      totalCount += item.qty;
      totalPrice += (item.price || 0) * item.qty;

      const optText = item.options.length > 0 ? ` (${item.options.join(", ")})` : "";
      const personText = item.persons && item.persons.length > 0 ? ` ➜ ${item.persons.join(", ")}` : "";
      lines.push(`• [${item.temp}] ${item.menuName}${optText}: ${item.qty}잔${personText}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`총 ${totalCount}잔 / 예상 합계: ${totalPrice.toLocaleString()}원`);

    const fullText = lines.join("\n");
    navigator.clipboard.writeText(fullText).then(() => {
      this.showToast("카카오톡 공유 텍스트가 복사되었습니다! ✨");
    }).catch(() => {
      prompt("아래 텍스트를 복사하세요:", fullText);
    });
  }

  copyDutchSummary() {
    const activeCafe = this.cafeManager.getActiveCafe();
    let totalPrice = 0;
    for (const item of this.orderMap.values()) {
      totalPrice += (item.price || 0) * item.qty;
    }
    const headcount = parseInt(this.dutchHeadcount.value, 10) || 1;
    const perPerson = Math.ceil(totalPrice / Math.max(1, headcount));

    const text = `💸 [${activeCafe.name}] 음료 정산 안내\n총 금액: ${totalPrice.toLocaleString()}원 (${headcount}명)\n👉 1인당: ${perPerson.toLocaleString()}원 보내주세요!`;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast("정산 요청 텍스트가 복사되었습니다! 💸");
    }).catch(() => {
      prompt("아래 텍스트를 복사하세요:", text);
    });
  }

  updateAppTitle(newTitle) {
    const title = this.cafeManager.setAppTitle(newTitle);
    if (this.appTitleText) this.appTitleText.textContent = title;
    document.title = `${title} - 단체 음료 주문 취합기`;
    if (this.customAppTitleInput) this.customAppTitleInput.value = title;
    if (this.sync) this.sync.setTitle(title);
    this.showToast(`앱 제목이 '${title}'(으)로 변경되었습니다! ✨`);
  }

  // --- 카페/메뉴 관리 탭 기능 ---
  renderManageView() {
    // 0. 앱 제목 인풋 갱신
    if (this.customAppTitleInput) {
      this.customAppTitleInput.value = this.cafeManager.getAppTitle();
    }

    // 1. 카페 순서 목록 렌더링
    this.renderCafeReorderList();

    // 2. 카페 셀렉트 박스 갱신
    this.manageCafeSelect.innerHTML = "";
    this.cafeManager.cafes.forEach(cafe => {
      const opt = document.createElement("option");
      opt.value = cafe.id;
      opt.textContent = `${cafe.icon || "☕"} ${cafe.name}`;
      if (cafe.id === this.cafeManager.getActiveCafeId()) {
        opt.selected = true;
      }
      this.manageCafeSelect.appendChild(opt);
    });

    this.renderManageMenuList();
  }

  renderCafeReorderList() {
    if (!this.cafeReorderList) return;
    this.cafeReorderList.innerHTML = "";

    this.cafeManager.cafes.forEach((cafe, index) => {
      const row = document.createElement("div");
      row.className = "reorder-cafe-item";
      const isFirst = index === 0;
      const isLast = index === this.cafeManager.cafes.length - 1;

      row.innerHTML = `
        <div class="reorder-cafe-info">
          <span>${cafe.icon || '☕'}</span>
          <span>${cafe.name}</span>
          ${cafe.id === this.cafeManager.getActiveCafeId() ? '<span class="badge-popular" style="font-size:0.68rem;">선택중</span>' : ''}
        </div>
        <div class="reorder-actions">
          <button type="button" class="btn-reorder btn-move-up" ${isFirst ? 'disabled' : ''} title="왼쪽(앞)으로 이동">▲ 위로</button>
          <button type="button" class="btn-reorder btn-move-down" ${isLast ? 'disabled' : ''} title="오른쪽(뒤)으로 이동">▼ 아래로</button>
        </div>
      `;

      row.querySelector(".btn-move-up").addEventListener("click", () => {
        if (this.cafeManager.moveCafe(cafe.id, -1)) {
          this.renderCafeChips();
          this.renderCafeReorderList();
          this.renderManageView();
          if (this.sync) {
            this.sync.setCafes(this.cafeManager.cafes);
            this.sync.setCafeOrder(this.cafeManager.getCafeOrderIds());
          }
          this.showToast(`'${cafe.name}' 카페가 앞으로 이동되었습니다.`);
        }
      });

      row.querySelector(".btn-move-down").addEventListener("click", () => {
        if (this.cafeManager.moveCafe(cafe.id, 1)) {
          this.renderCafeChips();
          this.renderCafeReorderList();
          this.renderManageView();
          if (this.sync) {
            this.sync.setCafes(this.cafeManager.cafes);
            this.sync.setCafeOrder(this.cafeManager.getCafeOrderIds());
          }
          this.showToast(`'${cafe.name}' 카페가 뒤로 이동되었습니다.`);
        }
      });

      this.cafeReorderList.appendChild(row);
    });
  }

  renderManageMenuList() {
    const activeCafe = this.cafeManager.getActiveCafe();
    this.menuManageList.innerHTML = "";

    if (!activeCafe.menus || activeCafe.menus.length === 0) {
      this.menuManageList.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:8px 0;">등록된 메뉴가 없습니다.</div>`;
      return;
    }

    activeCafe.menus.forEach(menu => {
      const container = document.createElement("div");

      const row = document.createElement("div");
      row.className = "menu-manage-item";
      row.innerHTML = `
        <div class="menu-manage-info">
          <span style="font-weight:700;">${menu.name}</span>
          <span style="font-size:0.8rem; color:var(--text-muted); margin-left:6px;">(${menu.price.toLocaleString()}원 / ${menu.temp})</span>
          <span style="font-size:0.75rem; color:#64748B; margin-left:4px;">[${menu.category}]</span>
        </div>
        <div class="menu-manage-actions">
          <button type="button" class="btn-edit-menu" data-id="${menu.id}">✏️ 수정</button>
          <button type="button" class="btn-del-menu" data-id="${menu.id}">삭제</button>
        </div>
      `;

      // 인라인 메뉴 수정 폼
      const editForm = document.createElement("div");
      editForm.className = "menu-edit-form";
      editForm.style.display = "none";
      editForm.innerHTML = `
        <div class="edit-row">
          <input type="text" class="form-input edit-name" value="${menu.name}" placeholder="메뉴 이름">
          <input type="number" class="form-input edit-price" value="${menu.price}" placeholder="가격(원)" style="max-width: 110px;">
        </div>
        <div class="edit-row">
          <input type="text" class="form-input edit-cat" value="${menu.category}" placeholder="카테고리">
          <select class="form-select edit-temp" style="max-width: 140px;">
            <option value="both" ${menu.temp === 'both' ? 'selected' : ''}>HOT / ICE</option>
            <option value="ice" ${menu.temp === 'ice' ? 'selected' : ''}>ICE 전용</option>
            <option value="hot" ${menu.temp === 'hot' ? 'selected' : ''}>HOT 전용</option>
          </select>
        </div>
        <div class="edit-actions">
          <button type="button" class="btn-cancel-edit">취소</button>
          <button type="button" class="btn-save-edit">저장 & 전체반영</button>
        </div>
      `;

      // 수정 버튼 토글
      row.querySelector(".btn-edit-menu").addEventListener("click", () => {
        const isHidden = editForm.style.display === "none";
        editForm.style.display = isHidden ? "flex" : "none";
      });

      // 수정 취소
      editForm.querySelector(".btn-cancel-edit").addEventListener("click", () => {
        editForm.style.display = "none";
      });

      // 수정 저장
      editForm.querySelector(".btn-save-edit").addEventListener("click", () => {
        const updatedName = editForm.querySelector(".edit-name").value.trim();
        const updatedPrice = parseInt(editForm.querySelector(".edit-price").value, 10) || 0;
        const updatedCat = editForm.querySelector(".edit-cat").value.trim() || "기타";
        const updatedTemp = editForm.querySelector(".edit-temp").value;

        if (!updatedName) {
          alert("메뉴 이름을 입력해주세요.");
          return;
        }

        this.cafeManager.updateMenu(activeCafe.id, menu.id, {
          name: updatedName,
          price: updatedPrice,
          category: updatedCat,
          temp: updatedTemp
        });

        this.renderManageMenuList();
        this.renderCategoryChips();
        this.renderMenuList();

        if (this.sync) {
          this.sync.setCafes(this.cafeManager.cafes);
        }
        this.showToast(`'${updatedName}' 메뉴가 수정되어 전체 반영되었습니다! ✨`);
      });

      // 삭제
      row.querySelector(".btn-del-menu").addEventListener("click", () => {
        if (confirm(`'${menu.name}' 메뉴를 삭제하시겠습니까?`)) {
          this.cafeManager.deleteMenu(activeCafe.id, menu.id);
          this.renderManageMenuList();
          this.renderMenuList();
          if (this.sync) {
            this.sync.setCafes(this.cafeManager.cafes);
          }
          this.showToast(`'${menu.name}' 메뉴가 삭제되었습니다.`);
        }
      });

      container.appendChild(row);
      container.appendChild(editForm);
      this.menuManageList.appendChild(container);
    });
  }

  handleEditCafeName() {
    const activeCafe = this.cafeManager.getActiveCafe();
    const newName = prompt(`'${activeCafe.name}' 카페의 새로운 이름을 입력하세요:`, activeCafe.name);
    if (newName !== null) {
      const trimmed = newName.trim();
      if (trimmed && trimmed !== activeCafe.name) {
        this.cafeManager.updateCafeName(activeCafe.id, trimmed);
        this.renderCafeChips();
        this.renderCategoryChips();
        this.renderMenuList();
        this.renderManageView();
        if (this.sync) {
          this.sync.setCafes(this.cafeManager.cafes);
        }
        this.showToast(`카페 이름이 '${trimmed}'(으)로 수정되어 전체 반영되었습니다! ✨`);
      }
    }
  }

  handleAddCafe() {
    const name = this.newCafeNameInput.value.trim();
    if (!name) {
      alert("새로운 카페 이름을 입력해주세요.");
      return;
    }
    this.cafeManager.addCafe(name);
    this.newCafeNameInput.value = "";
    this.renderCafeChips();
    this.renderManageView();
    if (this.sync) {
      this.sync.setCafes(this.cafeManager.cafes);
      this.sync.setCafeOrder(this.cafeManager.getCafeOrderIds());
    }
    this.showToast(`새 카페 '${name}'이(가) 등록되었습니다!`);
  }

  handleDeleteCafe() {
    const activeCafe = this.cafeManager.getActiveCafe();
    if (confirm(`정말 '${activeCafe.name}' 카페를 목록에서 삭제하시겠습니까?`)) {
      if (this.cafeManager.deleteCafe(activeCafe.id)) {
        this.renderCafeChips();
        this.renderCategoryChips();
        this.renderMenuList();
        this.renderManageView();
        if (this.sync) {
          this.sync.setCafes(this.cafeManager.cafes);
          this.sync.setCafeOrder(this.cafeManager.getCafeOrderIds());
        }
        this.showToast("카페가 삭제되었습니다.");
      }
    }
  }

  handleAddMenu() {
    const activeCafe = this.cafeManager.getActiveCafe();
    const name = this.newMenuNameInput.value.trim();
    const price = parseInt(this.newMenuPriceInput.value, 10) || 0;
    const category = this.newMenuCategoryInput.value.trim() || "커피";
    const temp = this.newMenuTempSelect.value;

    if (!name) {
      alert("추가할 메뉴 이름을 입력해주세요.");
      return;
    }

    this.cafeManager.addMenu(activeCafe.id, {
      name,
      price,
      category,
      temp,
      popular: false
    });

    this.newMenuNameInput.value = "";
    this.newMenuPriceInput.value = "";
    this.renderManageMenuList();
    this.renderCategoryChips();
    this.renderMenuList();
    if (this.sync) {
      this.sync.setCafes(this.cafeManager.cafes);
    }
    this.showToast(`'${name}' 메뉴가 추가되었습니다!`);
  }
}

// 앱 실행
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
