/**
 * app.js
 * 모두의 음료 (Cafe Order Collector)
 * - 일반 주문자: 극도로 단순한 1초 주문 (이름 입력 -> 음료 톡 터치 -> 주문 완료)
 * - 관리자: 나만 카페/메뉴 지정, 주문자 링크 복사, 실시간 취합 주문서, 카톡 공지, 정산
 */

class App {
  constructor() {
    this.cafeManager = window.cafeDataManager;
    this.textParser = window.smartOrderParser;
    this.sync = window.cloudSyncService;

    // 관리자 비밀번호 (클라우드 동기화, 기본값 1220)
    this.adminPin = localStorage.getItem("cafe_order_admin_pin") || "1220";

    // 관리자 여부 확인 (저장된 세션의 PIN이 현재 PIN과 일치할 때만)
    this.isAdmin = this.checkAdminAuth();

    // 주문자 현재 선택 상태
    this.currentSelection = {
      menuId: null,
      menuName: "",
      price: 0,
      temp: "ICE", // 'ICE' | 'HOT'
      mild: false,
      qty: 1
    };

    // 오늘 주문 가능한 메뉴 ID (null이면 카페 전체 메뉴)
    this.availableMenuIds = null;

    // 전체 주문 목록 (Firestore 동기화)
    this.orders = [];

    // 활성 관리자 서브탭
    this.currentAdminTab = "menu-setting";

    this.initDOM();
    this.initEvents();
    this.initCloudSync();
    this.applyViewMode();
    this.renderTodayCafeHeader();
    this.renderSimpleMenuList();
    this.renderLiveOrders();
    this.checkMySubmittedOrder();
  }

  // 현재 관리자 비밀번호 조회
  getAdminPin() {
    if (this.sync && this.sync.roomData && this.sync.roomData.adminPin) {
      return String(this.sync.roomData.adminPin).trim();
    }
    return this.adminPin || localStorage.getItem("cafe_order_admin_pin") || "1220";
  }

  // 관리자 권한 확인
  checkAdminAuth() {
    const isLogged = localStorage.getItem("cafe_order_admin_logged") === "true";
    if (!isLogged) return false;
    const loggedPin = localStorage.getItem("cafe_order_admin_logged_pin");
    const currentPin = this.getAdminPin();
    if (loggedPin && loggedPin !== currentPin) {
      return false;
    }
    return true;
  }

  setAdminAuth(isAdmin) {
    this.isAdmin = isAdmin;
    if (isAdmin) {
      localStorage.setItem("cafe_order_admin_logged", "true");
      localStorage.setItem("cafe_order_admin_logged_pin", this.getAdminPin());
    } else {
      localStorage.removeItem("cafe_order_admin_logged");
      localStorage.removeItem("cafe_order_admin_logged_pin");
      // URL에서 admin 제거
      const url = new URL(window.location.href);
      url.searchParams.delete("admin");
      window.history.replaceState({}, "", url.toString());
    }
    this.applyViewMode();
  }

  initDOM() {
    // 공통 헤더 요소
    this.appTitleText = document.getElementById("appTitleText");
    this.btnAdminAuth = document.getElementById("btnAdminAuth");
    this.adminLockIcon = document.getElementById("adminLockIcon");
    this.adminLockText = document.getElementById("adminLockText");
    this.adminModeBanner = document.getElementById("adminModeBanner");
    this.btnExitAdmin = document.getElementById("btnExitAdmin");
    this.todayCafeName = document.getElementById("todayCafeName");
    this.btnCopyShareLinkHeader = document.getElementById("btnCopyShareLinkHeader");

    // 일반 주문자 섹션 요소
    this.userOrderSection = document.getElementById("userOrderSection");
    this.userOrderName = document.getElementById("userOrderName");
    this.simpleMenuList = document.getElementById("simpleMenuList");
    this.bottomUserBar = document.getElementById("bottomUserBar");
    this.bottomSelectedSummary = document.getElementById("bottomSelectedSummary");
    this.bottomSelectedPrice = document.getElementById("bottomSelectedPrice");
    this.btnSubmitMyOrder = document.getElementById("btnSubmitMyOrder");

    // 내 주문 완료 카드 요소
    this.mySubmittedOrderCard = document.getElementById("mySubmittedOrderCard");
    this.submittedTitleText = document.getElementById("submittedTitleText");
    this.submittedDetailsList = document.getElementById("submittedDetailsList");
    this.btnChangeMyOrder = document.getElementById("btnChangeMyOrder");
    this.btnCancelMyOrder = document.getElementById("btnCancelMyOrder");

    // 실시간 현황 아코디언 요소
    this.btnToggleLiveOrders = document.getElementById("btnToggleLiveOrders");
    this.liveOrdersContent = document.getElementById("liveOrdersContent");
    this.accordionArrow = document.getElementById("accordionArrow");
    this.liveTotalCountBadge = document.getElementById("liveTotalCountBadge");
    this.liveOrdersList = document.getElementById("liveOrdersList");

    // 관리자 패널 섹션 요소
    this.adminPanelSection = document.getElementById("adminPanelSection");
    this.adminTabBtns = document.querySelectorAll(".admin-tab-btn");
    this.adminTabContents = document.querySelectorAll(".admin-tab-content");
    this.btnAdminCopyLink = document.getElementById("btnAdminCopyLink");
    this.btnAdminCopyNotice = document.getElementById("btnAdminCopyNotice");
    this.adminCafeSelect = document.getElementById("adminCafeSelect");
    this.btnAdminDeleteCafe = document.getElementById("btnAdminDeleteCafe");
    this.btnAdminAddCafeModal = document.getElementById("btnAdminAddCafeModal");
    this.adminMenuChecklist = document.getElementById("adminMenuChecklist");
    this.btnSelectAllMenus = document.getElementById("btnSelectAllMenus");
    this.btnDeselectAllMenus = document.getElementById("btnDeselectAllMenus");
    this.btnOpenAddMenuForm = document.getElementById("btnOpenAddMenuForm");
    this.inlineAddMenuBox = document.getElementById("inlineAddMenuBox");
    this.adminNewMenuName = document.getElementById("adminNewMenuName");
    this.adminNewMenuPrice = document.getElementById("adminNewMenuPrice");
    this.adminNewMenuTemp = document.getElementById("adminNewMenuTemp");
    this.btnSaveNewMenu = document.getElementById("btnSaveNewMenu");
    this.btnCancelNewMenu = document.getElementById("btnCancelNewMenu");
    this.adminAppTitleInput = document.getElementById("adminAppTitleInput");
    this.btnAdminSaveTitle = document.getElementById("btnAdminSaveTitle");
    this.adminNewPinInput = document.getElementById("adminNewPinInput");
    this.btnAdminSavePin = document.getElementById("btnAdminSavePin");
    this.btnToggleShowAdminPin = document.getElementById("btnToggleShowAdminPin");

    // 관리자 취합 주문서 요소
    this.adminTotalPersonCount = document.getElementById("adminTotalPersonCount");
    this.adminTotalCupCount = document.getElementById("adminTotalCupCount");
    this.adminAbsentPersonCount = document.getElementById("adminAbsentPersonCount");
    this.adminTotalPriceCount = document.getElementById("adminTotalPriceCount");
    this.btnAdminCopyKakao = document.getElementById("btnAdminCopyKakao");
    this.btnAdminClearAllOrders = document.getElementById("btnAdminClearAllOrders");
    this.adminBackupRestoreBox = document.getElementById("adminBackupRestoreBox");
    this.btnAdminRestoreBackup = document.getElementById("btnAdminRestoreBackup");
    this.adminCounterSummaryList = document.getElementById("adminCounterSummaryList");
    this.adminAbsentSummaryBox = document.getElementById("adminAbsentSummaryBox");
    this.adminPersonDetailList = document.getElementById("adminPersonDetailList");
    this.adminDutchHeadcount = document.getElementById("adminDutchHeadcount");
    this.adminDutchPerPerson = document.getElementById("adminDutchPerPerson");
    this.btnAdminCopyDutch = document.getElementById("btnAdminCopyDutch");

    // 관리자 단톡방 복붙 파서 요소
    this.adminParseInput = document.getElementById("adminParseInput");
    this.btnAdminDoParse = document.getElementById("btnAdminDoParse");
    this.adminParseResultContainer = document.getElementById("adminParseResultContainer");
    this.btnAdminApplyParse = document.getElementById("btnAdminApplyParse");

    // 관리자 비밀번호 모달
    this.adminAuthModal = document.getElementById("adminAuthModal");
    this.adminPinInput = document.getElementById("adminPinInput");
    this.btnSubmitAdminAuth = document.getElementById("btnSubmitAdminAuth");
    this.btnCancelAdminAuth = document.getElementById("btnCancelAdminAuth");
    this.btnCloseAdminAuthModal = document.getElementById("btnCloseAdminAuthModal");

    // 새 카페 모달
    this.addCafeModal = document.getElementById("addCafeModal");
    this.modalNewCafeName = document.getElementById("modalNewCafeName");
    this.btnSaveNewCafeModal = document.getElementById("btnSaveNewCafeModal");
    this.btnCancelNewCafeModal = document.getElementById("btnCancelNewCafeModal");
    this.btnCloseAddCafeModal = document.getElementById("btnCloseAddCafeModal");

    // 토스트
    this.toastEl = document.getElementById("toastMsg");

    // 저장된 이름 불러오기
    const savedName = localStorage.getItem("my_order_nickname") || "";
    if (this.userOrderName) this.userOrderName.value = savedName;

    // 저장된 타이틀 불러오기
    const savedTitle = this.cafeManager.getAppTitle();
    if (this.appTitleText) this.appTitleText.textContent = savedTitle;
    document.title = `${savedTitle} - 단체 음료 주문`;
    if (this.adminAppTitleInput) this.adminAppTitleInput.value = savedTitle;
  }

  // 모드별 화면 표시/숨김 전환
  applyViewMode() {
    if (this.isAdmin) {
      if (this.adminModeBanner) this.adminModeBanner.style.display = "flex";
      if (this.adminPanelSection) this.adminPanelSection.style.display = "flex";
      if (this.userOrderSection) this.userOrderSection.style.display = "none";
      if (this.bottomUserBar) this.bottomUserBar.style.display = "none";
      if (this.btnAdminAuth) {
        this.btnAdminAuth.classList.add("active");
        if (this.adminLockIcon) this.adminLockIcon.textContent = "🔓";
        if (this.adminLockText) this.adminLockText.textContent = "관리자 ON";
      }
      this.renderAdminView();
    } else {
      if (this.adminModeBanner) this.adminModeBanner.style.display = "none";
      if (this.adminPanelSection) this.adminPanelSection.style.display = "none";
      if (this.userOrderSection) this.userOrderSection.style.display = "flex";
      if (this.bottomUserBar) this.bottomUserBar.style.display = "flex";
      if (this.btnAdminAuth) {
        this.btnAdminAuth.classList.remove("active");
        if (this.adminLockIcon) this.adminLockIcon.textContent = "🔒";
        if (this.adminLockText) this.adminLockText.textContent = "관리자";
      }
      this.renderSimpleMenuList();
      this.updateBottomUserBar();
    }
  }

  initEvents() {
    // 관리자 버튼 클릭 -> 로그인 모달
    if (this.btnAdminAuth) {
      this.btnAdminAuth.addEventListener("click", () => {
        if (this.isAdmin) {
          this.setAdminAuth(false);
          this.showToast("일반 주문자 모드로 전환되었습니다.");
        } else {
          this.openAdminAuthModal();
        }
      });
    }

    // 관리자 상단 배너에서 주문자 화면 보기 클릭
    if (this.btnExitAdmin) {
      this.btnExitAdmin.addEventListener("click", () => {
        this.setAdminAuth(false);
        this.showToast("일반 주문자 모드로 전환되었습니다.");
      });
    }

    // 관리자 PIN 모달 이벤트
    if (this.btnSubmitAdminAuth) {
      this.btnSubmitAdminAuth.addEventListener("click", () => this.handleAdminPinSubmit());
    }
    if (this.adminPinInput) {
      this.adminPinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.handleAdminPinSubmit();
      });
    }
    if (this.btnCancelAdminAuth) {
      this.btnCancelAdminAuth.addEventListener("click", () => this.closeAdminAuthModal());
    }
    if (this.btnCloseAdminAuthModal) {
      this.btnCloseAdminAuthModal.addEventListener("click", () => this.closeAdminAuthModal());
    }

    // 상단 링크 복사 버튼들
    if (this.btnCopyShareLinkHeader) {
      this.btnCopyShareLinkHeader.addEventListener("click", () => this.copyShareLink());
    }
    if (this.btnAdminCopyLink) {
      this.btnAdminCopyLink.addEventListener("click", () => this.copyShareLink());
    }
    if (this.btnAdminCopyNotice) {
      this.btnAdminCopyNotice.addEventListener("click", () => this.copyInviteNotice());
    }

    // 주문자 이름 입력 시 로컬스토리지 저장
    if (this.userOrderName) {
      this.userOrderName.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        localStorage.setItem("my_order_nickname", val);
        this.checkMySubmittedOrder();
        this.updateBottomUserBar();
      });
    }

    // 주문 완료 제출 버튼
    if (this.btnSubmitMyOrder) {
      this.btnSubmitMyOrder.addEventListener("click", () => this.submitMyOrder());
    }

    // 내 주문 변경 / 취소
    if (this.btnChangeMyOrder) {
      this.btnChangeMyOrder.addEventListener("click", () => {
        if (this.mySubmittedOrderCard) this.mySubmittedOrderCard.style.display = "none";
        this.showToast("원하시는 음료를 다시 선택한 후 주문 완료를 눌러주세요.");
      });
    }
    if (this.btnCancelMyOrder) {
      this.btnCancelMyOrder.addEventListener("click", () => this.cancelMyOrder());
    }

    // 실시간 현황 아코디언 토글
    if (this.btnToggleLiveOrders) {
      this.btnToggleLiveOrders.addEventListener("click", () => {
        const isOpen = this.liveOrdersContent.style.display === "block";
        this.liveOrdersContent.style.display = isOpen ? "none" : "block";
        if (this.accordionArrow) {
          this.accordionArrow.classList.toggle("open", !isOpen);
        }
      });
    }

    // 관리자 탭 전환
    this.adminTabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.admintab;
        this.switchAdminTab(tab);
      });
    });

    // 관리자 카페 선택 변경
    if (this.adminCafeSelect) {
      this.adminCafeSelect.addEventListener("change", (e) => {
        const cafeId = e.target.value;
        this.cafeManager.setActiveCafeId(cafeId);
        // 새 카페 선택 시 해당 카페 전체 메뉴를 기본 선택으로
        this.availableMenuIds = null;
        if (this.sync) {
          this.sync.setActiveCafe(cafeId);
          this.sync.setAvailableMenuIds(null);
        }
        this.renderTodayCafeHeader();
        this.renderAdminMenuChecklist();
        this.renderSimpleMenuList();
        this.showToast(`오늘의 카페가 [${this.cafeManager.getActiveCafe().name}]으로 지정되었습니다.`);
      });
    }

    // 관리자 전체 선택 / 전체 해제
    if (this.btnSelectAllMenus) {
      this.btnSelectAllMenus.addEventListener("click", () => {
        const activeCafe = this.cafeManager.getActiveCafe();
        this.availableMenuIds = activeCafe.menus.map(m => m.id);
        if (this.sync) this.sync.setAvailableMenuIds(this.availableMenuIds);
        this.renderAdminMenuChecklist();
        this.renderSimpleMenuList();
        this.showToast("모든 메뉴가 선택되었습니다.");
      });
    }
    if (this.btnDeselectAllMenus) {
      this.btnDeselectAllMenus.addEventListener("click", () => {
        this.availableMenuIds = [];
        if (this.sync) this.sync.setAvailableMenuIds([]);
        this.renderAdminMenuChecklist();
        this.renderSimpleMenuList();
        this.showToast("모든 메뉴 선택이 해제되었습니다.");
      });
    }

    // 관리자 새 메뉴 인라인 폼 토글
    if (this.btnOpenAddMenuForm) {
      this.btnOpenAddMenuForm.addEventListener("click", () => {
        const isHidden = this.inlineAddMenuBox.style.display === "none";
        this.inlineAddMenuBox.style.display = isHidden ? "block" : "none";
        if (isHidden && this.adminNewMenuName) this.adminNewMenuName.focus();
      });
    }
    if (this.btnCancelNewMenu) {
      this.btnCancelNewMenu.addEventListener("click", () => {
        if (this.inlineAddMenuBox) this.inlineAddMenuBox.style.display = "none";
      });
    }
    if (this.btnSaveNewMenu) {
      this.btnSaveNewMenu.addEventListener("click", () => this.handleSaveNewMenu());
    }

    // 관리자 타이틀 변경
    if (this.btnAdminSaveTitle) {
      this.btnAdminSaveTitle.addEventListener("click", () => {
        const title = (this.adminAppTitleInput.value || "").trim();
        if (!title) return;
        this.cafeManager.setAppTitle(title);
        if (this.appTitleText) this.appTitleText.textContent = title;
        document.title = `${title} - 단체 음료 주문`;
        if (this.sync) this.sync.setTitle(title);
        this.showToast("프로그램 제목이 저장되었습니다.");
      });
    }

    // 관리자 비밀번호 변경 및 확인
    if (this.btnAdminSavePin) {
      this.btnAdminSavePin.addEventListener("click", () => this.handleSaveNewAdminPin());
    }
    if (this.adminNewPinInput) {
      this.adminNewPinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.handleSaveNewAdminPin();
      });
    }
    if (this.btnToggleShowAdminPin) {
      this.btnToggleShowAdminPin.addEventListener("click", () => {
        alert(`현재 설정된 관리자 비밀번호는 [ ${this.getAdminPin()} ] 입니다.`);
      });
    }

    // 관리자 현재 선택된 카페 삭제
    if (this.btnAdminDeleteCafe) {
      this.btnAdminDeleteCafe.addEventListener("click", () => {
        const activeCafe = this.cafeManager.getActiveCafe();
        if (this.cafeManager.cafes.length <= 1) {
          alert("최소 1개의 카페는 남아있어야 합니다.");
          return;
        }
        if (confirm(`[${activeCafe.name}] 카페를 목록에서 삭제하시겠습니까?\n(현재 접수된 주문 내역은 지워지지 않고 그대로 유지됩니다.)`)) {
          if (this.cafeManager.deleteCafe(activeCafe.id)) {
            const nextCafe = this.cafeManager.getActiveCafe();
            this.availableMenuIds = null;
            if (this.sync) {
              this.sync.setCafes(this.cafeManager.cafes);
              this.sync.setActiveCafe(nextCafe.id);
              this.sync.setAvailableMenuIds(null);
            }
            this.renderTodayCafeHeader();
            this.renderAdminCafeSelect();
            this.renderAdminMenuChecklist();
            this.renderSimpleMenuList();
            this.showToast(`[${activeCafe.name}] 카페가 삭제되고 [${nextCafe.name}]으로 전환되었습니다.`);
          }
        }
      });
    }

    // 관리자 카톡 결과 공지 복사
    if (this.btnAdminCopyKakao) {
      this.btnAdminCopyKakao.addEventListener("click", () => this.copyOrderKakaoSummary());
    }

    // 관리자 주문 전체 초기화 (이중 확인 및 자동 백업 적용)
    if (this.btnAdminClearAllOrders) {
      this.btnAdminClearAllOrders.addEventListener("click", async () => {
        if (this.orders.length === 0) {
          this.showToast("초기화할 주문 내역이 없습니다.");
          return;
        }
        const checkWord = prompt(
          "⚠️ 정말로 현재 접수된 모든 주문 내역을 비우시겠습니까?\n실수로 지우는 것을 방지하기 위해 아래 입력칸에 [초기화] 라고 입력해주세요.\n(초기화하더라도 직전 주문은 자동 백업되어 복구할 수 있습니다.)"
        );
        if (checkWord === null) return;
        if (checkWord.trim() !== "초기화") {
          alert("'초기화'를 정확히 입력해야 주문이 비워집니다. (취소되었습니다)");
          return;
        }

        if (this.sync) {
          await this.sync.clearOrders();
        }
        this.orders = [];
        localStorage.removeItem("my_submitted_order");
        this.checkMySubmittedOrder();
        this.renderAdminView();
        this.renderLiveOrders();
        this.showToast("주문이 전체 초기화되었습니다. (실수인 경우 '복구' 버튼으로 되살릴 수 있습니다)");
      });
    }

    // 직전에 초기화된 백업 주문 복구
    if (this.btnAdminRestoreBackup) {
      this.btnAdminRestoreBackup.addEventListener("click", async () => {
        if (!confirm("직전에 초기화된 주문 내역을 다시 복구하시겠습니까?")) return;
        if (this.sync) {
          const ok = await this.sync.restoreBackupOrders();
          if (ok) {
            this.orders = this.sync.roomData.orders || [];
            this.renderAdminView();
            this.renderLiveOrders();
            this.checkMySubmittedOrder();
            this.showToast("♻️ 이전 주문 내역이 성공적으로 복구되었습니다!");
          }
        }
      });
    }

    // 더치페이 인원수 변경
    if (this.adminDutchHeadcount) {
      this.adminDutchHeadcount.addEventListener("input", () => this.updateAdminDutchPrice());
    }
    if (this.btnAdminCopyDutch) {
      this.btnAdminCopyDutch.addEventListener("click", () => this.copyAdminDutchPay());
    }

    // 새 카페 추가 모달 열기
    if (this.btnAdminAddCafeModal) {
      this.btnAdminAddCafeModal.addEventListener("click", () => {
        if (this.addCafeModal) this.addCafeModal.classList.add("active");
        if (this.modalNewCafeName) {
          this.modalNewCafeName.value = "";
          this.modalNewCafeName.focus();
        }
      });
    }
    if (this.btnCloseAddCafeModal) {
      this.btnCloseAddCafeModal.addEventListener("click", () => {
        if (this.addCafeModal) this.addCafeModal.classList.remove("active");
      });
    }
    if (this.btnCancelNewCafeModal) {
      this.btnCancelNewCafeModal.addEventListener("click", () => {
        if (this.addCafeModal) this.addCafeModal.classList.remove("active");
      });
    }
    if (this.btnSaveNewCafeModal) {
      this.btnSaveNewCafeModal.addEventListener("click", () => {
        const name = (this.modalNewCafeName.value || "").trim();
        if (!name) {
          alert("카페 이름을 입력해주세요!");
          return;
        }
        const newCafe = this.cafeManager.addCafe(name);
        this.cafeManager.setActiveCafeId(newCafe.id);
        if (this.sync) {
          this.sync.setCafes(this.cafeManager.cafes);
          this.sync.setActiveCafe(newCafe.id);
        }
        if (this.addCafeModal) this.addCafeModal.classList.remove("active");
        this.renderTodayCafeHeader();
        this.renderAdminCafeSelect();
        this.renderAdminMenuChecklist();
        this.renderSimpleMenuList();
        this.showToast(`새 카페 [${name}]이 생성되고 지정되었습니다.`);
      });
    }

    // 단톡방 파서
    if (this.btnAdminDoParse) {
      this.btnAdminDoParse.addEventListener("click", () => this.handleAdminParse());
    }
    if (this.btnAdminApplyParse) {
      this.btnAdminApplyParse.addEventListener("click", () => this.applyAdminParseResults());
    }
  }

  // 관리자 모달 열기/닫기
  openAdminAuthModal() {
    if (this.adminAuthModal) {
      this.adminAuthModal.classList.add("active");
      if (this.adminPinInput) {
        this.adminPinInput.value = "";
        this.adminPinInput.focus();
      }
    }
  }

  closeAdminAuthModal() {
    if (this.adminAuthModal) this.adminAuthModal.classList.remove("active");
  }

  handleAdminPinSubmit() {
    const pin = (this.adminPinInput.value || "").trim();
    const currentPin = this.getAdminPin();
    if (pin && pin === currentPin) {
      localStorage.setItem("cafe_order_admin_logged_pin", currentPin);
      this.setAdminAuth(true);
      this.closeAdminAuthModal();
      this.showToast("👑 관리자 인증 성공! 메뉴 지정 및 관리가 가능합니다.");
    } else {
      alert("관리자 비밀번호가 일치하지 않습니다.");
      this.adminPinInput.select();
    }
  }

  async handleSaveNewAdminPin() {
    if (!this.adminNewPinInput) return;
    const newPin = (this.adminNewPinInput.value || "").trim();
    if (!newPin || newPin.length < 2) {
      alert("새 관리자 비밀번호를 2자리 이상 입력해주세요!");
      this.adminNewPinInput.focus();
      return;
    }
    this.adminPin = newPin;
    localStorage.setItem("cafe_order_admin_pin", newPin);
    localStorage.setItem("cafe_order_admin_logged_pin", newPin);
    if (this.sync) {
      await this.sync.setAdminPin(newPin);
    }
    this.adminNewPinInput.value = "";
    this.showToast(`🔐 관리자 비밀번호가 변경되었습니다! (다른 기기의 기존 관리자 모드는 자동 해제됩니다)`);
  }

  // 관리자 서브탭 전환
  switchAdminTab(tabKey) {
    this.currentAdminTab = tabKey;
    this.adminTabBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.admintab === tabKey);
    });
    this.adminTabContents.forEach(content => {
      content.classList.toggle("active", content.id === `admintab-${tabKey}`);
    });
    if (tabKey === "order-summary") {
      this.renderAdminOrderSummary();
    }
  }

  // 클라우드 동기화 리스너
  initCloudSync() {
    if (!this.sync) return;

    this.sync.onSync((roomData) => {
      if (!roomData) return;

      // 0. 관리자 비밀번호 동기화 및 이전 비밀번호 접속자 자동 로그아웃
      if (roomData.adminPin) {
        const syncedPin = String(roomData.adminPin).trim();
        this.adminPin = syncedPin;
        localStorage.setItem("cafe_order_admin_pin", syncedPin);
        if (this.isAdmin) {
          const loggedPin = localStorage.getItem("cafe_order_admin_logged_pin");
          if (loggedPin && loggedPin !== syncedPin) {
            this.setAdminAuth(false);
            this.showToast("관리자 비밀번호가 변경되어 일반 주문자 화면으로 전환되었습니다.");
          }
        }
      }

      // 1. 앱 타이틀 동기화
      if (roomData.title && roomData.title !== this.cafeManager.getAppTitle()) {
        this.cafeManager.setAppTitle(roomData.title);
        if (this.appTitleText) this.appTitleText.textContent = roomData.title;
        document.title = `${roomData.title} - 단체 음료 주문`;
        if (this.adminAppTitleInput) this.adminAppTitleInput.value = roomData.title;
      }

      // 2. 전체 카페 및 메뉴 동기화 (일반 접속자가 서버의 카페 목록을 덮어쓰지 않도록 보호)
      if (Array.isArray(roomData.cafes) && roomData.cafes.length > 0) {
        this.cafeManager.setAllCafes(roomData.cafes);
      }

      // 3. 활성 카페 동기화
      if (roomData.activeCafeId && roomData.activeCafeId !== this.cafeManager.getActiveCafeId()) {
        if (this.cafeManager.cafes.some(c => c.id === roomData.activeCafeId)) {
          this.cafeManager.setActiveCafeId(roomData.activeCafeId);
          this.renderTodayCafeHeader();
        }
      }

      // 4. 오늘 주문 가능한 메뉴 ID 목록 동기화
      this.availableMenuIds = Array.isArray(roomData.availableMenuIds) ? roomData.availableMenuIds : null;

      // 5. 주문 목록 동기화
      if (Array.isArray(roomData.orders)) {
        this.orders = roomData.orders;
      } else {
        this.orders = [];
      }

      // 화면 업데이트
      this.renderTodayCafeHeader();
      this.renderSimpleMenuList();
      this.renderLiveOrders();
      this.checkMySubmittedOrder();

      if (this.isAdmin) {
        this.renderAdminView();
      }
    });
  }

  // 상단 헤더 오늘 카페 렌더링
  renderTodayCafeHeader() {
    const activeCafe = this.cafeManager.getActiveCafe();
    if (this.todayCafeName && activeCafe) {
      this.todayCafeName.textContent = activeCafe.name;
    }
  }

  // ==========================================
  // 일반 주문자 모드 렌더링
  // ==========================================

  // 초간단 메뉴 리스트 렌더링 (관리자가 지정한 메뉴만!)
  renderSimpleMenuList() {
    if (!this.simpleMenuList) return;
    const activeCafe = this.cafeManager.getActiveCafe();
    const availableMenus = this.cafeManager.getAvailableMenus(activeCafe.id, this.availableMenuIds);

    this.simpleMenuList.innerHTML = "";

    if (availableMenus.length === 0) {
      this.simpleMenuList.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 0.95rem;">
          ☕ 오늘 주문받을 메뉴가 아직 지정되지 않았습니다.<br>
          <span style="font-size: 0.8rem; margin-top: 4px; display: inline-block;">관리자가 메뉴를 선택하면 여기에 자동으로 나타납니다!</span>
        </div>
      `;
      return;
    }

    availableMenus.forEach(menu => {
      const card = document.createElement("div");
      const isSelected = this.currentSelection.menuId === menu.id;
      card.className = `simple-menu-card ${isSelected ? "selected" : ""}`;
      card.dataset.menuid = menu.id;
      const photoUrl = window.getMenuPhoto(menu.name);
      const isAbsentMenu = menu.name.includes("불참") || menu.name.includes("미참석");

      // 온도 버튼 옵션 생성
      let tempBtnsHtml = "";
      if (isAbsentMenu) {
        tempBtnsHtml = `
          <button type="button" class="btn-temp-choice ice ${isSelected ? "selected" : ""}" data-temp="불참" style="background: ${isSelected ? '#475569' : '#F1F5F9'}; color: ${isSelected ? '#FFFFFF' : '#475569'}; border-color: #CBD5E1;">
            <span>👋</span> <span>${isSelected ? "불참 선택됨" : "불참 선택하기"}</span>
          </button>
        `;
      } else if (menu.temp === "both") {
        const iceSelected = isSelected && this.currentSelection.temp === "ICE";
        const hotSelected = isSelected && this.currentSelection.temp === "HOT";
        tempBtnsHtml = `
          <button type="button" class="btn-temp-choice ice ${iceSelected ? "selected" : ""}" data-temp="ICE">
            <span>🧊</span> <span>ICE</span>
          </button>
          <button type="button" class="btn-temp-choice hot ${hotSelected ? "selected" : ""}" data-temp="HOT">
            <span>♨️</span> <span>HOT</span>
          </button>
        `;
      } else if (menu.temp === "ice") {
        const iceSelected = isSelected;
        tempBtnsHtml = `
          <button type="button" class="btn-temp-choice ice ${iceSelected ? "selected" : ""}" data-temp="ICE">
            <span>🧊</span> <span>ICE 전용</span>
          </button>
        `;
      } else {
        const hotSelected = isSelected;
        tempBtnsHtml = `
          <button type="button" class="btn-temp-choice hot ${hotSelected ? "selected" : ""}" data-temp="HOT">
            <span>♨️</span> <span>HOT 전용</span>
          </button>
        `;
      }

      // 옵션 칩 (연하게 - 커피류/일반 음료에만 표시, 불참에는 숨김)
      const isMild = isSelected && this.currentSelection.mild;
      const mildChipHtml = `
        <div class="option-toggle-chip ${isMild ? "active" : ""}" data-option="mild">
          <span>🌱</span> <span>연하게 (샷 조절)</span>
        </div>
      `;

      card.innerHTML = `
        <div class="simple-menu-header-row">
          <div class="menu-photo-thumb-box">
            <img src="${photoUrl}" alt="${menu.name}" class="menu-real-photo" loading="lazy" onerror="this.onerror=null; this.src='./images/americano.jpg'">
          </div>
          <div class="simple-menu-info-col">
            <div class="simple-menu-title">${menu.name}</div>
            <div class="simple-menu-price">${menu.price ? menu.price.toLocaleString() + '원' : ''}</div>
          </div>
        </div>
        <div class="simple-menu-controls">
          <div class="temp-button-group">
            ${tempBtnsHtml}
          </div>
          ${(isSelected && !isAbsentMenu) ? `
            <div class="simple-qty-box">
              <button type="button" class="btn-qty-mini btn-qty-minus">−</button>
              <span class="qty-mini-val">${this.currentSelection.qty}</span>
              <button type="button" class="btn-qty-mini btn-qty-plus">+</button>
            </div>
          ` : ''}
        </div>
        ${(isSelected && !isAbsentMenu) ? `
          <div class="options-chip-row">
            ${mildChipHtml}
          </div>
        ` : ''}
      `;

      // 이벤트 바인딩: 온도 버튼 터치
      card.querySelectorAll(".btn-temp-choice").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const temp = btn.dataset.temp;
          this.selectMenu(menu, temp);
        });
      });

      // 연하게 토글
      const mildBtn = card.querySelector(".option-toggle-chip");
      if (mildBtn) {
        mildBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.currentSelection.mild = !this.currentSelection.mild;
          this.renderSimpleMenuList();
          this.updateBottomUserBar();
        });
      }

      // 수량 +, -
      const btnMinus = card.querySelector(".btn-qty-minus");
      const btnPlus = card.querySelector(".btn-qty-plus");
      if (btnMinus) {
        btnMinus.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this.currentSelection.qty > 1) {
            this.currentSelection.qty--;
            this.renderSimpleMenuList();
            this.updateBottomUserBar();
          }
        });
      }
      if (btnPlus) {
        btnPlus.addEventListener("click", (e) => {
          e.stopPropagation();
          this.currentSelection.qty++;
          this.renderSimpleMenuList();
          this.updateBottomUserBar();
        });
      }

      this.simpleMenuList.appendChild(card);
    });
  }

  // 메뉴 선택 처리
  selectMenu(menu, temp) {
    this.currentSelection = {
      menuId: menu.id,
      menuName: menu.name,
      price: menu.price || 0,
      temp: temp || (menu.temp === "hot" ? "HOT" : "ICE"),
      mild: this.currentSelection.menuId === menu.id ? this.currentSelection.mild : false,
      qty: this.currentSelection.menuId === menu.id ? this.currentSelection.qty : 1
    };
    this.renderSimpleMenuList();
    this.updateBottomUserBar();
  }

  // 불참 메뉴 여부 판별 헬퍼
  isAbsentOrder(item) {
    if (!item) return false;
    const name = String(item.menuName || item.name || "").replace(/\s+/g, "");
    const temp = String(item.temp || "").trim();
    return temp === "불참" || name.includes("불참") || name.includes("미참석");
  }

  // 하단 주문 바 업데이트
  updateBottomUserBar() {
    if (!this.bottomUserBar) return;

    const hasSelection = !!this.currentSelection.menuId;
    const userName = (this.userOrderName ? this.userOrderName.value : "").trim();

    if (!hasSelection) {
      if (this.bottomSelectedSummary) {
        this.bottomSelectedSummary.textContent = "음료 카드의 ICE / HOT을 눌러주세요";
      }
      if (this.bottomSelectedPrice) this.bottomSelectedPrice.textContent = "";
      if (this.btnSubmitMyOrder) {
        this.btnSubmitMyOrder.disabled = true;
        this.btnSubmitMyOrder.innerHTML = `<span>주문 완료</span>`;
      }
    } else {
      const isAbsent = this.isAbsentOrder(this.currentSelection);
      const mildStr = this.currentSelection.mild ? " (연하게)" : "";
      const summaryText = isAbsent
        ? `[불참] ${this.currentSelection.menuName}`
        : `[${this.currentSelection.temp}] ${this.currentSelection.menuName}${mildStr} ${this.currentSelection.qty}잔`;
      const totalPrice = (this.currentSelection.price * this.currentSelection.qty).toLocaleString();

      if (this.bottomSelectedSummary) {
        this.bottomSelectedSummary.textContent = summaryText;
      }
      if (this.bottomSelectedPrice) {
        this.bottomSelectedPrice.textContent = this.currentSelection.price > 0 ? `${totalPrice}원` : "";
      }
      if (this.btnSubmitMyOrder) {
        this.btnSubmitMyOrder.disabled = false;
        this.btnSubmitMyOrder.innerHTML = `<span>✅ ${userName ? userName + ': ' : ''}${isAbsent ? '불참 접수하기' : '주문 완료하기'}</span>`;
      }
    }
  }

  // 주문 제출 처리
  async submitMyOrder() {
    const userName = (this.userOrderName ? this.userOrderName.value : "").trim();
    if (!userName) {
      alert("주문자 이름을 먼저 입력해주세요! (예: 김철수 순장님)");
      if (this.userOrderName) {
        this.userOrderName.focus();
        this.userOrderName.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!this.currentSelection.menuId) {
      alert("마실 음료를 먼저 선택해주세요!");
      return;
    }

    // 주문 객체 생성
    const orderItemKey = `${this.currentSelection.menuName}_${this.currentSelection.temp}_${this.currentSelection.mild ? '연하게' : '기본'}`;
    const myOrderData = {
      id: "ord_" + Date.now(),
      person: userName,
      menuName: this.currentSelection.menuName,
      temp: this.currentSelection.temp,
      options: this.currentSelection.mild ? ["연하게"] : [],
      price: this.currentSelection.price,
      qty: this.currentSelection.qty,
      key: orderItemKey,
      updatedAt: Date.now()
    };

    // 내 로컬 스토리지에 제출 기록 저장
    localStorage.setItem("my_submitted_order", JSON.stringify(myOrderData));
    localStorage.setItem("my_order_nickname", userName);

    // 트랜잭션 기반으로 서버의 최신 주문 목록에 내 주문만 안전하게 병합 (다른 사람 주문 덮어쓰기 원천 차단)
    const applyMyOrder = (baseOrders) => {
      const filteredOrders = (baseOrders || []).filter(o => {
        if (o.person === userName) return false;
        if (Array.isArray(o.persons) && o.persons.includes(userName)) {
          o.persons = o.persons.filter(p => p !== userName);
          if (o.personMap && o.personMap[userName]) {
            o.qty -= o.personMap[userName];
            delete o.personMap[userName];
          }
        }
        return (o.qty || 0) > 0;
      });

      const existingGroup = filteredOrders.find(o => o.key === orderItemKey);
      if (existingGroup) {
        existingGroup.qty = (existingGroup.qty || 0) + myOrderData.qty;
        if (!Array.isArray(existingGroup.persons)) existingGroup.persons = [];
        if (!existingGroup.persons.includes(userName)) existingGroup.persons.push(userName);
        if (!existingGroup.personMap) existingGroup.personMap = {};
        existingGroup.personMap[userName] = (existingGroup.personMap[userName] || 0) + myOrderData.qty;
      } else {
        filteredOrders.push({
          key: orderItemKey,
          menuName: myOrderData.menuName,
          temp: myOrderData.temp,
          options: myOrderData.options,
          price: myOrderData.price,
          qty: myOrderData.qty,
          persons: [userName],
          personMap: { [userName]: myOrderData.qty }
        });
      }
      return filteredOrders;
    };

    if (this.sync && this.sync.updateOrdersTransaction) {
      this.orders = await this.sync.updateOrdersTransaction(applyMyOrder);
    } else {
      this.orders = applyMyOrder(this.orders);
      if (this.sync) await this.sync.setOrders(this.orders);
    }

    this.checkMySubmittedOrder();
    this.renderLiveOrders();
    this.showToast(`🎉 ${userName}님의 주문이 성공적으로 접수되었습니다!`);

    // 상단으로 부드럽게 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 내 접수 완료 상태 카드 확인 & 렌더링
  checkMySubmittedOrder() {
    if (!this.mySubmittedOrderCard) return;

    const savedRaw = localStorage.getItem("my_submitted_order");
    const currentName = (this.userOrderName ? this.userOrderName.value : "").trim();

    if (!savedRaw || !currentName) {
      this.mySubmittedOrderCard.style.display = "none";
      return;
    }

    try {
      const myOrder = JSON.parse(savedRaw);
      if (myOrder.person !== currentName) {
        this.mySubmittedOrderCard.style.display = "none";
        return;
      }

      // 내 주문이 전체 orders에 실제로 존재하는지 확인
      const stillExists = this.orders.some(o => {
        if (o.person === currentName) return true;
        if (Array.isArray(o.persons) && o.persons.includes(currentName)) return true;
        return false;
      });

      if (!stillExists && this.orders.length > 0) {
        // 이미 다른 사람이나 관리자에 의해 지워졌다면 숨김
        this.mySubmittedOrderCard.style.display = "none";
        return;
      }

      const isAbsent = this.isAbsentOrder(myOrder);
      const mildStr = (myOrder.options && myOrder.options.includes("연하게")) ? " (연하게)" : "";
      const priceStr = myOrder.price ? `${(myOrder.price * myOrder.qty).toLocaleString()}원` : "";
      const photoUrl = window.getMenuPhoto(myOrder.menuName);

      if (this.submittedTitleText) {
        this.submittedTitleText.textContent = isAbsent
          ? `${currentName}님의 불참이 접수되었습니다!`
          : `${currentName}님의 주문이 접수되었습니다!`;
      }
      if (this.submittedDetailsList) {
        this.submittedDetailsList.innerHTML = `
          <div class="submitted-order-row">
            <img src="${photoUrl}" alt="${myOrder.menuName}" class="submitted-order-thumb" loading="lazy" onerror="this.style.display='none'">
            <div class="submitted-order-info">
              <div class="submitted-order-drink">
                ${isAbsent
                  ? `[불참] ${myOrder.menuName}`
                  : `[${myOrder.temp}] ${myOrder.menuName}${mildStr} <span class="submitted-order-qty">${myOrder.qty}잔</span>`
                }
              </div>
              ${priceStr ? `<div class="submitted-order-price">${priceStr}</div>` : ''}
            </div>
          </div>
        `;
      }

      this.mySubmittedOrderCard.style.display = "block";
    } catch (e) {
      this.mySubmittedOrderCard.style.display = "none";
    }
  }

  // 내 주문 취소
  async cancelMyOrder() {
    const currentName = (this.userOrderName ? this.userOrderName.value : "").trim();
    if (!confirm(`${currentName}님의 주문을 취소하시겠습니까?`)) return;

    const removeMyOrder = (baseOrders) => {
      return (baseOrders || []).filter(o => {
        if (o.person === currentName) return false;
        if (Array.isArray(o.persons) && o.persons.includes(currentName)) {
          o.persons = o.persons.filter(p => p !== currentName);
          if (o.personMap && o.personMap[currentName]) {
            o.qty -= o.personMap[currentName];
            delete o.personMap[currentName];
          }
        }
        return (o.qty || 0) > 0;
      });
    };

    localStorage.removeItem("my_submitted_order");
    if (this.sync && this.sync.updateOrdersTransaction) {
      this.orders = await this.sync.updateOrdersTransaction(removeMyOrder);
    } else {
      this.orders = removeMyOrder(this.orders);
      if (this.sync) await this.sync.setOrders(this.orders);
    }

    this.checkMySubmittedOrder();
    this.renderLiveOrders();
    this.showToast("주문이 취소되었습니다.");
  }

  // 실시간 주문 현황 (접이식 아코디언)
  renderLiveOrders() {
    if (!this.liveOrdersList || !this.liveTotalCountBadge) return;

    let totalCups = 0;
    const drinkPersonList = [];
    const absentNames = [];

    this.orders.forEach(item => {
      const isAbsent = this.isAbsentOrder(item);
      if (isAbsent) {
        if (item.person) {
          absentNames.push(item.person);
        } else if (Array.isArray(item.persons)) {
          item.persons.forEach(p => absentNames.push(p));
        }
        return;
      }

      totalCups += (item.qty || 0);
      const mildStr = (item.options && item.options.includes('연하게')) ? ' (연하게)' : '';
      if (item.person) {
        drinkPersonList.push({
          name: item.person,
          menu: `[${item.temp}] ${item.menuName}${mildStr} ${item.qty}잔`
        });
      } else if (Array.isArray(item.persons)) {
        item.persons.forEach(p => {
          const qty = (item.personMap && item.personMap[p]) || 1;
          drinkPersonList.push({
            name: p,
            menu: `[${item.temp}] ${item.menuName}${mildStr} ${qty}잔`
          });
        });
      }
    });

    if (absentNames.length > 0) {
      this.liveTotalCountBadge.textContent = `${drinkPersonList.length}명 / 총 ${totalCups}잔 · [불참] ${absentNames.length}명`;
    } else {
      this.liveTotalCountBadge.textContent = `${drinkPersonList.length}명 / 총 ${totalCups}잔`;
    }

    if (drinkPersonList.length === 0 && absentNames.length === 0) {
      this.liveOrdersList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 14px 0;">
          아직 접수된 주문이 없습니다.<br>가장 먼저 음료를 선택해보세요! ☕
        </div>
      `;
      return;
    }

    let html = drinkPersonList.map(item => `
      <div class="live-order-item">
        <span class="live-person-name">👤 ${item.name}</span>
        <span class="live-menu-tag">${item.menu}</span>
      </div>
    `).join("");

    if (absentNames.length > 0) {
      html += `
        <div class="absent-summary-box live-absent-box">
          <span class="absent-badge">[불참] ${absentNames.length}명</span>
          <span class="absent-names-text">${absentNames.join(", ")}</span>
        </div>
      `;
    }

    this.liveOrdersList.innerHTML = html;
  }


  // ==========================================
  // 관리자 제어 패널 렌더링 & 제어 로직
  // ==========================================

  renderAdminView() {
    this.renderAdminCafeSelect();
    this.renderAdminMenuChecklist();
    this.renderAdminOrderSummary();
  }

  // 관리자 카페 셀렉트 렌더링
  renderAdminCafeSelect() {
    if (!this.adminCafeSelect) return;
    const activeId = this.cafeManager.getActiveCafeId();
    this.adminCafeSelect.innerHTML = this.cafeManager.cafes.map(c => `
      <option value="${c.id}" ${c.id === activeId ? 'selected' : ''}>
        ${c.icon || '☕'} ${c.name} (${c.menus ? c.menus.length : 0}개 메뉴)
      </option>
    `).join("");
  }

  // 오늘 주문받을 메뉴 체크리스트 렌더링
  renderAdminMenuChecklist() {
    if (!this.adminMenuChecklist) return;
    const activeCafe = this.cafeManager.getActiveCafe();
    if (!activeCafe || !Array.isArray(activeCafe.menus)) {
      this.adminMenuChecklist.innerHTML = "<div>메뉴가 없습니다.</div>";
      return;
    }

    // availableMenuIds가 null이면 전체가 체크된 상태로 간주
    const isAllChecked = this.availableMenuIds === null;
    const checkedSet = new Set(this.availableMenuIds || []);

    this.adminMenuChecklist.innerHTML = "";

    activeCafe.menus.forEach(menu => {
      const isChecked = isAllChecked || checkedSet.has(menu.id);
      const itemEl = document.createElement("div");
      itemEl.className = `admin-check-item ${isChecked ? "checked" : ""}`;
      const photoUrl = window.getMenuPhoto(menu.name);

      itemEl.innerHTML = `
        <div class="admin-check-left">
          <input type="checkbox" class="admin-checkbox" ${isChecked ? "checked" : ""} data-menuid="${menu.id}">
          <img src="${photoUrl}" alt="${menu.name}" class="admin-menu-mini-thumb" loading="lazy" onerror="this.style.display='none'">
          <div>
            <div class="admin-menu-name">${menu.name}</div>
            <div class="admin-menu-price-tag">
              ${menu.price ? menu.price.toLocaleString() + '원' : ''} · [${menu.temp === 'both' ? 'ICE/HOT' : menu.temp.toUpperCase()}]
            </div>
          </div>
        </div>
        <button type="button" class="btn-delete-menu-mini" title="메뉴 삭제" data-menuid="${menu.id}">🗑️</button>
      `;

      // 체크박스 클릭
      const checkbox = itemEl.querySelector(".admin-checkbox");
      checkbox.addEventListener("change", (e) => {
        e.stopPropagation();
        this.toggleMenuAvailability(menu.id, checkbox.checked);
      });

      // 전체 행 클릭 시에도 체크 토글
      itemEl.addEventListener("click", (e) => {
        if (e.target.closest(".btn-delete-menu-mini")) return;
        checkbox.checked = !checkbox.checked;
        this.toggleMenuAvailability(menu.id, checkbox.checked);
      });

      // 메뉴 삭제
      const btnDel = itemEl.querySelector(".btn-delete-menu-mini");
      btnDel.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`[${menu.name}] 메뉴를 카페에서 영구 삭제하시겠습니까?`)) {
          this.cafeManager.deleteMenu(activeCafe.id, menu.id);
          if (this.sync) this.sync.setCafes(this.cafeManager.cafes);
          this.renderAdminMenuChecklist();
          this.renderSimpleMenuList();
          this.showToast(`[${menu.name}] 메뉴가 삭제되었습니다.`);
        }
      });

      this.adminMenuChecklist.appendChild(itemEl);
    });
  }

  // 메뉴 체크 상태 변경
  toggleMenuAvailability(menuId, isChecked) {
    const activeCafe = this.cafeManager.getActiveCafe();
    // null이었으면 모든 메뉴 ID를 배열로 초기화
    let currentIds = this.availableMenuIds !== null
      ? [...this.availableMenuIds]
      : activeCafe.menus.map(m => m.id);

    if (isChecked) {
      if (!currentIds.includes(menuId)) currentIds.push(menuId);
    } else {
      currentIds = currentIds.filter(id => id !== menuId);
    }

    this.availableMenuIds = currentIds;
    if (this.sync) {
      this.sync.setAvailableMenuIds(this.availableMenuIds);
    }
    this.renderAdminMenuChecklist();
    this.renderSimpleMenuList();
  }

  // 새 메뉴 등록
  handleSaveNewMenu() {
    const activeCafe = this.cafeManager.getActiveCafe();
    const name = (this.adminNewMenuName.value || "").trim();
    const price = parseInt(this.adminNewMenuPrice.value, 10) || 0;
    const temp = this.adminNewMenuTemp.value || "both";

    if (!name) {
      alert("메뉴 이름을 입력해주세요!");
      this.adminNewMenuName.focus();
      return;
    }

    const newMenu = this.cafeManager.addMenu(activeCafe.id, {
      name,
      price,
      temp,
      category: "커피",
      popular: true
    });

    // 오늘 지정 메뉴 목록에 즉시 추가
    if (this.availableMenuIds !== null) {
      this.availableMenuIds.push(newMenu.id);
      if (this.sync) this.sync.setAvailableMenuIds(this.availableMenuIds);
    }

    if (this.sync) this.sync.setCafes(this.cafeManager.cafes);

    this.adminNewMenuName.value = "";
    this.adminNewMenuPrice.value = "";
    if (this.inlineAddMenuBox) this.inlineAddMenuBox.style.display = "none";

    this.renderAdminMenuChecklist();
    this.renderSimpleMenuList();
    this.showToast(`새 메뉴 [${name}]이 등록되었습니다!`);
  }

  // 관리자 취합 주문서 렌더링
  renderAdminOrderSummary() {
    let totalCups = 0;
    let totalPrice = 0;
    const drinkPersonList = [];
    const absentNames = [];
    const menuSummaryMap = new Map(); // key -> { title, qty, price }

    this.orders.forEach(item => {
      const qty = item.qty || 0;
      const price = item.price || 0;
      const isAbsent = this.isAbsentOrder(item);

      if (isAbsent) {
        if (item.person) {
          absentNames.push(item.person);
        } else if (Array.isArray(item.persons)) {
          item.persons.forEach(p => absentNames.push(p));
        }
        return;
      }

      totalCups += qty;
      totalPrice += (qty * price);

      const mildStr = (item.options && item.options.includes('연하게')) ? ' (연하게)' : '';
      const menuTitle = `[${item.temp}] ${item.menuName}${mildStr}`;

      if (menuSummaryMap.has(menuTitle)) {
        const existing = menuSummaryMap.get(menuTitle);
        existing.qty += qty;
        existing.price += (qty * price);
      } else {
        menuSummaryMap.set(menuTitle, { title: menuTitle, qty, price: qty * price });
      }

      if (item.person) {
        drinkPersonList.push({
          name: item.person,
          menu: menuTitle,
          qty,
          key: item.key
        });
      } else if (Array.isArray(item.persons)) {
        item.persons.forEach(p => {
          const pQty = (item.personMap && item.personMap[p]) || 1;
          drinkPersonList.push({
            name: p,
            menu: menuTitle,
            qty: pQty,
            key: item.key
          });
        });
      }
    });

    if (this.adminTotalPersonCount) this.adminTotalPersonCount.textContent = `${drinkPersonList.length}명`;
    if (this.adminTotalCupCount) this.adminTotalCupCount.textContent = `${totalCups}잔`;
    if (this.adminAbsentPersonCount) this.adminAbsentPersonCount.textContent = `${absentNames.length}명`;
    if (this.adminTotalPriceCount) this.adminTotalPriceCount.textContent = `${totalPrice.toLocaleString()}원`;

    // 백업된 주문 내역이 있을 경우 복구 버튼 노출
    if (this.adminBackupRestoreBox) {
      const hasBackup = this.sync && this.sync.roomData && Array.isArray(this.sync.roomData.backupOrders) && this.sync.roomData.backupOrders.length > 0;
      this.adminBackupRestoreBox.style.display = hasBackup ? "block" : "none";
    }

    // 1. 카운터 주문용 메뉴별 합계 (음료만 표시)
    if (this.adminCounterSummaryList) {
      if (menuSummaryMap.size === 0) {
        this.adminCounterSummaryList.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 18px 0; font-size: 0.9rem;">
            접수된 음료 주문이 없습니다.
          </div>
        `;
      } else {
        this.adminCounterSummaryList.innerHTML = Array.from(menuSummaryMap.values()).map(m => `
          <div class="counter-summary-item" onclick="this.classList.toggle('checked')">
            <span class="counter-item-title">${m.title}</span>
            <span class="counter-item-qty">${m.qty}잔</span>
          </div>
        `).join("");
      }
    }

    // 1-2. 불참 메뉴 별도 구분 표시 ([불참] 인원수와 명단 이어서 표시)
    if (this.adminAbsentSummaryBox) {
      if (absentNames.length > 0) {
        this.adminAbsentSummaryBox.style.display = "block";
        this.adminAbsentSummaryBox.innerHTML = `
          <div class="absent-summary-row" onclick="this.classList.toggle('checked')">
            <span class="absent-badge">[불참] ${absentNames.length}명</span>
            <span class="absent-names-text">${absentNames.join(", ")}</span>
          </div>
        `;
      } else {
        this.adminAbsentSummaryBox.style.display = "none";
        this.adminAbsentSummaryBox.innerHTML = "";
      }
    }

    // 2. 주문자별 상세 명단 (음료 주문자와 불참 명단 구분 표시)
    if (this.adminPersonDetailList) {
      if (drinkPersonList.length === 0 && absentNames.length === 0) {
        this.adminPersonDetailList.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 18px 0; font-size: 0.9rem;">
            주문자 명단이 비어있습니다.
          </div>
        `;
      } else {
        let detailHtml = drinkPersonList.map(p => `
          <div class="person-detail-card">
            <div class="person-detail-left">
              <span class="person-card-name">👤 ${p.name}</span>
              <span class="person-card-menu">${p.menu} · ${p.qty}잔</span>
            </div>
            <button type="button" class="btn-delete-person-order" data-person="${encodeURIComponent(p.name)}">삭제</button>
          </div>
        `).join("");

        if (absentNames.length > 0) {
          detailHtml += `
            <div class="absent-detail-section">
              <div class="absent-detail-header">
                <span class="absent-badge">[불참] ${absentNames.length}명</span>
                <span class="absent-names-text">${absentNames.join(", ")}</span>
              </div>
              <div class="absent-chip-list">
                ${absentNames.map(name => `
                  <span class="absent-person-chip">
                    <span>${name}</span>
                    <button type="button" class="btn-delete-absent-chip btn-delete-person-order" data-person="${encodeURIComponent(name)}" title="삭제">✕</button>
                  </span>
                `).join("")}
              </div>
            </div>
          `;
        }

        this.adminPersonDetailList.innerHTML = detailHtml;

        this.adminPersonDetailList.querySelectorAll(".btn-delete-person-order").forEach(btn => {
          btn.addEventListener("click", () => {
            const pName = decodeURIComponent(btn.dataset.person || "");
            if (pName) this.deleteSinglePersonOrder(pName);
          });
        });
      }
    }

    // 더치페이 인원수 자동 기본값 동기화 (불참 제외한 실제 음료 주문 인원 기준)
    if (this.adminDutchHeadcount && drinkPersonList.length > 0) {
      this.adminDutchHeadcount.value = drinkPersonList.length;
    }
    this.updateAdminDutchPrice();
  }

  // 관리자 명단에서 1명 주문 삭제
  async deleteSinglePersonOrder(personName) {
    if (!confirm(`[${personName}]님의 주문을 삭제하시겠습니까?`)) return;

    const removePerson = (baseOrders) => {
      return (baseOrders || []).filter(o => {
        if (o.person === personName) return false;
        if (Array.isArray(o.persons) && o.persons.includes(personName)) {
          o.persons = o.persons.filter(p => p !== personName);
          if (o.personMap && o.personMap[personName]) {
            o.qty -= o.personMap[personName];
            delete o.personMap[personName];
          }
        }
        return (o.qty || 0) > 0;
      });
    };

    if (this.sync && this.sync.updateOrdersTransaction) {
      this.orders = await this.sync.updateOrdersTransaction(removePerson);
    } else {
      this.orders = removePerson(this.orders);
      if (this.sync) await this.sync.setOrders(this.orders);
    }
    this.renderAdminOrderSummary();
    this.renderLiveOrders();
    this.checkMySubmittedOrder();
    this.showToast(`[${personName}]님의 주문이 삭제되었습니다.`);
  }

  // 더치페이 계산
  updateAdminDutchPrice() {
    if (!this.adminDutchPerPerson) return;
    let totalPrice = 0;
    this.orders.forEach(o => {
      totalPrice += ((o.qty || 0) * (o.price || 0));
    });

    const headcount = parseInt(this.adminDutchHeadcount ? this.adminDutchHeadcount.value : 1, 10) || 1;
    const perPerson = Math.ceil(totalPrice / headcount);
    this.adminDutchPerPerson.textContent = `${perPerson.toLocaleString()}원`;
  }

  // 더치페이 결과 복사
  copyAdminDutchPay() {
    let totalPrice = 0;
    this.orders.forEach(o => totalPrice += ((o.qty || 0) * (o.price || 0)));
    const headcount = parseInt(this.adminDutchHeadcount ? this.adminDutchHeadcount.value : 1, 10) || 1;
    const perPerson = Math.ceil(totalPrice / headcount);

    const text = `💸 [음료 1/N 정산 안내]\n• 총 금액: ${totalPrice.toLocaleString()}원 (${headcount}명)\n👉 1인당: ${perPerson.toLocaleString()}원\n\n감사합니다!`;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast("정산 안내 문구가 복사되었습니다! 단톡방에 붙여넣으세요.");
    });
  }

  // 단톡방 결과 공지 복사
  copyOrderKakaoSummary() {
    const activeCafe = this.cafeManager.getActiveCafe();
    let totalCups = 0;
    let totalPrice = 0;
    const menuSummaryMap = new Map();
    const drinkPersonList = [];
    const absentNames = [];

    this.orders.forEach(item => {
      const qty = item.qty || 0;
      const price = item.price || 0;
      const isAbsent = this.isAbsentOrder(item);

      if (isAbsent) {
        if (item.person) {
          absentNames.push(item.person);
        } else if (Array.isArray(item.persons)) {
          item.persons.forEach(p => absentNames.push(p));
        }
        return;
      }

      totalCups += qty;
      totalPrice += (qty * price);

      const mildStr = (item.options && item.options.includes('연하게')) ? ' (연하게)' : '';
      const menuTitle = `[${item.temp}] ${item.menuName}${mildStr}`;
      menuSummaryMap.set(menuTitle, (menuSummaryMap.get(menuTitle) || 0) + qty);

      if (item.person) {
        drinkPersonList.push(`${item.person}: ${menuTitle}`);
      } else if (Array.isArray(item.persons)) {
        item.persons.forEach(p => drinkPersonList.push(`${p}: ${menuTitle}`));
      }
    });

    let msg = `☕ [${activeCafe.name}] 음료 주문 취합 결과\n`;
    msg += `━━━━━━━━━━━━\n`;
    if (absentNames.length > 0) {
      msg += `총 수량: ${totalCups}잔 (주문 ${drinkPersonList.length}명 / 불참 ${absentNames.length}명)\n\n`;
    } else {
      msg += `총 수량: ${totalCups}잔 (${drinkPersonList.length}명)\n\n`;
    }

    msg += `[메뉴별 합계]\n`;
    if (menuSummaryMap.size === 0) {
      msg += `• 주문 음료 없음\n`;
    } else {
      menuSummaryMap.forEach((qty, title) => {
        msg += `• ${title} : ${qty}잔\n`;
      });
    }

    if (drinkPersonList.length > 0) {
      msg += `\n[주문자 명단]\n`;
      msg += drinkPersonList.join("\n") + "\n";
    }

    if (absentNames.length > 0) {
      msg += `\n[불참] ${absentNames.length}명 : ${absentNames.join(", ")}\n`;
    }

    if (totalPrice > 0) {
      msg += `\n총 금액: ${totalPrice.toLocaleString()}원\n`;
    }

    navigator.clipboard.writeText(msg).then(() => {
      this.showToast("카톡 주문 취합 결과가 복사되었습니다!");
    });
  }

  // 주문자 초대 링크 복사 (admin 파라미터 제외)
  copyShareLink() {
    const shareUrl = this.sync ? this.sync.getShareUrl() : window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.showToast("🔗 주문자용 링크가 복사되었습니다! 단톡방에 공유하세요.");
    });
  }

  // 카톡 초대 안내문 복사
  copyInviteNotice() {
    const activeCafe = this.cafeManager.getActiveCafe();
    const shareUrl = this.sync ? this.sync.getShareUrl() : window.location.href;
    const notice = `📢 [${activeCafe.name} 음료 주문 안내]\n오늘 모임 음료를 취합합니다!\n아래 링크를 누르고 원하시는 메뉴를 1초 만에 선택해 주세요 ☕\n\n👉 주문 링크:\n${shareUrl}`;

    navigator.clipboard.writeText(notice).then(() => {
      this.showToast("카톡 초대 문구가 복사되었습니다! 단톡방에 붙여넣으세요.");
    });
  }

  // 단톡방 파서 처리
  handleAdminParse() {
    const text = (this.adminParseInput.value || "").trim();
    if (!text) {
      alert("단톡방 주문 텍스트를 입력해주세요!");
      return;
    }

    const activeCafe = this.cafeManager.getActiveCafe();
    const results = this.textParser.parseText(text, activeCafe.menus);
    this._parsedResults = results;

    if (!results || results.length === 0) {
      this.adminParseResultContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 14px;">인식된 주문이 없습니다.</div>
      `;
      this.btnAdminApplyParse.style.display = "none";
      return;
    }

    let html = `<div style="font-weight: 800; margin-bottom: 8px;">🔍 분석 결과 (총 ${results.length}건 감지):</div>`;
    results.forEach(r => {
      const mild = r.mild ? '🌱연하게' : '';
      html += `
        <div style="display: flex; justify-content: space-between; padding: 6px 8px; background: #F8FAFC; border-radius: 8px; margin-bottom: 4px; font-size: 0.85rem;">
          <span><b>${r.person || '익명'}</b> : [${r.temp}] ${r.menuName} ${mild}</span>
          <span style="font-weight: 800; color: var(--primary);">${r.qty}잔</span>
        </div>
      `;
    });

    this.adminParseResultContainer.innerHTML = html;
    this.btnAdminApplyParse.style.display = "block";
  }

  // 파서 결과 주문서에 담기
  async applyAdminParseResults() {
    if (!this._parsedResults || this._parsedResults.length === 0) return;

    this._parsedResults.forEach(r => {
      const mildStr = r.mild ? "연하게" : "기본";
      const key = `${r.menuName}_${r.temp}_${mildStr}`;
      const existing = this.orders.find(o => o.key === key);

      if (existing) {
        existing.qty = (existing.qty || 0) + r.qty;
        if (!Array.isArray(existing.persons)) existing.persons = [];
        if (r.person && !existing.persons.includes(r.person)) existing.persons.push(r.person);
        if (!existing.personMap) existing.personMap = {};
        if (r.person) {
          existing.personMap[r.person] = (existing.personMap[r.person] || 0) + r.qty;
        }
      } else {
        this.orders.push({
          key,
          menuName: r.menuName,
          temp: r.temp,
          options: r.mild ? ["연하게"] : [],
          price: r.price || 0,
          qty: r.qty,
          persons: r.person ? [r.person] : [],
          personMap: r.person ? { [r.person]: r.qty } : {}
        });
      }
    });

    if (this.sync) await this.sync.setOrders(this.orders);

    this.adminParseInput.value = "";
    this.adminParseResultContainer.innerHTML = "";
    this.btnAdminApplyParse.style.display = "none";
    this.switchAdminTab("order-summary");
    this.showToast("분석된 주문이 주문서에 모두 반영되었습니다!");
  }

  // 토스트 알림 표시
  showToast(msg) {
    if (!this.toastEl) return;
    this.toastEl.textContent = msg;
    this.toastEl.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastEl.classList.remove("show");
    }, 2800);
  }
}

// 초기화
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
