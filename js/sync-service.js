/**
 * sync-service.js
 * Firebase Firestore 기반 실시간 다자간 주문 동기화 서비스
 */

class CloudSyncService {
  constructor() {
    this.db = null;
    this.isOnline = false;
    this.hasLoadedFromServer = false;
    this.roomId = this.getRoomIdFromUrl();
    this.listeners = [];
    this.roomData = {
      title: "우면순장님을 위한 음료선택",
      activeCafeId: "brunchbean",
      cafeOrder: [],
      orders: [],
      backupOrders: [],
      availableMenuIds: null, // 오늘 관리자가 지정한 메뉴 ID 목록
      customCafes: null,
      adminPin: "1220",
      updatedAt: Date.now()
    };

    this.init();
  }

  getRoomIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    let room = params.get("room");
    if (!room) {
      room = "main_room";
    }
    return room.trim();
  }

  getShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    if (this.roomId && this.roomId !== "main_room") {
      url.searchParams.set("room", this.roomId);
    } else {
      url.searchParams.delete("room");
    }
    return url.toString();
  }

  init() {
    try {
      if (typeof firebase === "undefined" || !window.FIREBASE_CONFIG) {
        console.warn("Firebase SDK가 로드되지 않았습니다. 로컬 모드로 작동합니다.");
        return;
      }

      let app;
      if (firebase.apps && firebase.apps.length > 0) {
        app = firebase.apps[0];
      } else {
        app = firebase.initializeApp(window.FIREBASE_CONFIG);
      }

      this.db = firebase.firestore();
      this.roomRef = this.db.collection("cafe_rooms").doc(this.roomId);

      // 실시간 리스너 구독
      this.roomRef.onSnapshot(
        (doc) => {
          this.isOnline = true;
          this.updateConnectionBadge(true);

          if (doc.exists) {
            this.hasLoadedFromServer = true;
            const data = doc.data();
            this.roomData = { ...this.roomData, ...data };
            this.notifyListeners(this.roomData);
          } else {
            // 로컬 캐시(오프라인 초기 상태)에서 문서가 없다고 판단한 경우 절대 서버를 덮어쓰지 않음!
            if (doc.metadata && doc.metadata.fromCache) {
              console.warn("로컬 캐시 스냅샷 대기 중 (서버 응답 전 초기화 방지)");
              return;
            }
            this.initRoomDocSafely();
          }
        },
        (err) => {
          console.error("Firestore 실시간 동기화 오류:", err);
          this.isOnline = false;
          this.updateConnectionBadge(false);
        }
      );
    } catch (e) {
      console.error("Firebase 초기화 실패:", e);
      this.isOnline = false;
      this.updateConnectionBadge(false);
    }
  }

  async initRoomDocSafely() {
    if (!this.roomRef) return;
    try {
      // 서버에서 직접 한 번 더 확인하여 기존 주문 데이터가 절대 지워지지 않도록 보호
      const serverDoc = await this.roomRef.get({ source: "server" });
      if (serverDoc.exists) {
        this.hasLoadedFromServer = true;
        this.roomData = { ...this.roomData, ...serverDoc.data() };
        this.notifyListeners(this.roomData);
        return;
      }

      const initialData = {
        title: localStorage.getItem("cafe_order_app_title") || "우면순장님을 위한 음료선택",
        activeCafeId: localStorage.getItem("cafe_order_active_id") || "brunchbean",
        orders: [],
        adminPin: "1220",
        updatedAt: Date.now()
      };
      await this.roomRef.set(initialData, { merge: true });
    } catch (e) {
      console.error("방 초기화 문서 확인 실패:", e);
    }
  }

  onSync(callback) {
    this.listeners.push(callback);
    // 서버에서 실제 데이터를 불러온 이후에만 즉시 호출 (초기 빈 배열로 덮어쓰기 방지)
    if (this.hasLoadedFromServer && this.roomData) {
      callback(this.roomData);
    }
  }

  notifyListeners(data) {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error("리스너 실행 오류:", e);
      }
    });
  }

  // 관리자 비밀번호 변경 동기화
  async setAdminPin(adminPin) {
    const trimmed = (adminPin || "").trim();
    if (!trimmed) return false;
    this.roomData.adminPin = trimmed;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ adminPin: trimmed, updatedAt: Date.now() }, { merge: true });
        return true;
      } catch (e) {
        console.error("관리자 비밀번호 동기화 실패:", e);
        return false;
      }
    }
    return true;
  }

  // 방 타이틀 변경 (PC <-> 모바일 실시간 동기화)
  async setTitle(title) {
    const trimmed = (title || "").trim() || "모두의 음료";
    this.roomData.title = trimmed;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ title: trimmed, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("타이틀 동기화 실패:", e);
      }
    }
  }

  // 활성 카페 변경 (선택 카페 실시간 동기화)
  async setActiveCafe(cafeId) {
    this.roomData.activeCafeId = cafeId;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ activeCafeId: cafeId, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("카페 선택 동기화 실패:", e);
      }
    }
  }

  // 카페 순서 변경 동기화
  async setCafeOrder(cafeOrder) {
    this.roomData.cafeOrder = cafeOrder;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ cafeOrder, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("카페 순서 동기화 실패:", e);
      }
    }
  }

  // 오늘 주문 가능한 메뉴 ID 목록 동기화 (관리자 지정)
  async setAvailableMenuIds(menuIds) {
    this.roomData.availableMenuIds = menuIds;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ availableMenuIds: menuIds, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("주문 가능 메뉴 동기화 실패:", e);
      }
    }
  }

  // 커스텀 카페/메뉴 목록 전체 동기화
  async setCustomCafes(cafes) {
    this.roomData.customCafes = cafes;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ customCafes: cafes, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("커스텀 카페 동기화 실패:", e);
      }
    }
  }

  // 전체 카페 및 메뉴 목록 실시간 동기화 (생성/삭제/수정/순서 공통)
  async setCafes(cafes) {
    this.roomData.cafes = cafes;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ cafes, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("전체 카페 목록 동기화 실패:", e);
      }
    }
  }

  // 트랜잭션 기반 안전한 주문 업데이트 (다른 사람의 주문을 실수로 덮어쓰지 않도록 보호)
  async updateOrdersTransaction(mutatorFn) {
    if (!this.db || !this.roomRef) {
      const updated = mutatorFn(this.roomData.orders || []);
      this.roomData.orders = updated;
      return updated;
    }

    try {
      const updatedOrders = await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(this.roomRef);
        const currentOrders = (doc.exists && Array.isArray(doc.data().orders))
          ? doc.data().orders
          : (this.roomData.orders || []);
        const nextOrders = mutatorFn(JSON.parse(JSON.stringify(currentOrders)));
        transaction.set(
          this.roomRef,
          { orders: nextOrders, updatedAt: Date.now() },
          { merge: true }
        );
        return nextOrders;
      });
      this.roomData.orders = updatedOrders;
      return updatedOrders;
    } catch (e) {
      console.error("트랜잭션 주문 업데이트 실패, 일반 저장으로 대체:", e);
      const fallbackOrders = mutatorFn(this.roomData.orders || []);
      await this.setOrders(fallbackOrders);
      return fallbackOrders;
    }
  }

  // 전체 주문 상태 저장 (배열 형태)
  async setOrders(ordersArray) {
    this.roomData.orders = ordersArray;
    if (this.roomRef) {
      try {
        await this.roomRef.set({ orders: ordersArray, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("주문 목록 동기화 실패:", e);
      }
    }
  }

  // 전체 주문 비우기 (초기화 전 자동 백업 저장)
  async clearOrders() {
    const previousOrders = Array.isArray(this.roomData.orders) && this.roomData.orders.length > 0
      ? JSON.parse(JSON.stringify(this.roomData.orders))
      : null;

    this.roomData.orders = [];
    if (previousOrders) {
      this.roomData.backupOrders = previousOrders;
      this.roomData.backupSavedAt = Date.now();
    }

    if (this.roomRef) {
      try {
        const payload = { orders: [], updatedAt: Date.now() };
        if (previousOrders) {
          payload.backupOrders = previousOrders;
          payload.backupSavedAt = Date.now();
        }
        await this.roomRef.set(payload, { merge: true });
      } catch (e) {
        console.error("주문 초기화 동기화 실패:", e);
      }
    }
  }

  // 백업된 주문 복원하기
  async restoreBackupOrders() {
    const backup = this.roomData.backupOrders;
    if (!Array.isArray(backup) || backup.length === 0) return false;
    this.roomData.orders = JSON.parse(JSON.stringify(backup));
    if (this.roomRef) {
      try {
        await this.roomRef.set({
          orders: this.roomData.orders,
          updatedAt: Date.now()
        }, { merge: true });
        return true;
      } catch (e) {
        console.error("주문 백업 복원 실패:", e);
        return false;
      }
    }
    return true;
  }

  updateConnectionBadge(isOnline) {
    const badge = document.getElementById("syncStatusBadge");
    if (badge) {
      if (isOnline) {
        badge.innerHTML = `<span class="sync-dot online"></span> <span>실시간 동기화 ON</span>`;
        badge.className = "sync-badge online";
        badge.title = "모든 기기(핸드폰, PC)와 실시간으로 연결되어 있습니다.";
      } else {
        badge.innerHTML = `<span class="sync-dot offline"></span> <span>로컬 모드</span>`;
        badge.className = "sync-badge offline";
        badge.title = "오프라인/로컬 저장 모드로 작동 중입니다.";
      }
    }
  }
}

// 전역 인스턴스
window.cloudSyncService = new CloudSyncService();
