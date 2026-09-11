/**
 * sync-service.js
 * Firebase Firestore 기반 실시간 다자간 주문 동기화 서비스
 */

class CloudSyncService {
  constructor() {
    this.db = null;
    this.isOnline = false;
    this.roomId = this.getRoomIdFromUrl();
    this.listeners = [];
    this.roomData = {
      title: "모두의 음료",
      activeCafeId: "starbucks",
      cafeOrder: [],
      orders: [],
      customCafes: null,
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
            const data = doc.data();
            this.roomData = { ...this.roomData, ...data };
            this.notifyListeners(this.roomData);
          } else {
            // 최초 접속 시 기본 데이터로 방 생성
            this.initRoomDoc();
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

  async initRoomDoc() {
    try {
      const initialData = {
        title: localStorage.getItem("cafe_order_app_title") || "모두의 음료",
        activeCafeId: localStorage.getItem("cafe_order_active_id") || "starbucks",
        orders: [],
        updatedAt: Date.now()
      };
      await this.roomRef.set(initialData, { merge: true });
    } catch (e) {
      console.error("방 초기화 문서 생성 실패:", e);
    }
  }

  onSync(callback) {
    this.listeners.push(callback);
    // 현재 데이터가 있으면 즉시 1회 호출
    if (this.roomData) {
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

  // 전체 주문 비우기 (초기화)
  async clearOrders() {
    this.roomData.orders = [];
    if (this.roomRef) {
      try {
        await this.roomRef.set({ orders: [], updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.error("주문 초기화 동기화 실패:", e);
      }
    }
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
