/**
 * text-parser.js
 * 카카오톡 / 메신저 단체 주문 텍스트 스마트 분석 엔진
 */

class SmartOrderParser {
  constructor() {
    // 음료 줄임말 사전
    this.slangDictionary = [
      { patterns: [/아[\s.]?아\b/i, /아이스\s?아메(리카노)?/i, /차아/i, /시원한\s?아메/i], name: "아메리카노", temp: "ICE" },
      { patterns: [/뜨[\s.]?아\b/i, /따[\s.]?아\b/i, /핫[\s.]?아(메)?/i, /따뜻한\s?아메(리카노)?/i, /뜨거운\s?아메/i], name: "아메리카노", temp: "HOT" },
      { patterns: [/아[\s.]?바[\s.]?라\b/i, /아이스\s?바닐라\s?라떼/i], name: "바닐라라떼", temp: "ICE" },
      { patterns: [/뜨[\s.]?바[\s.]?라\b/i, /따[\s.]?바[\s.]?라\b/i, /핫\s?바닐라\s?라떼/i, /따뜻한\s?바닐라\s?라떼/i], name: "바닐라라떼", temp: "HOT" },
      { patterns: [/아[\s.]?라\b/i, /아이스\s?라떼/i, /아이스\s?카페\s?라떼/i], name: "카페라떼", temp: "ICE" },
      { patterns: [/뜨[\s.]?라\b/i, /따[\s.]?라\b/i, /핫\s?라떼/i, /따뜻한\s?라떼/i, /따뜻한\s?카페\s?라떼/i], name: "카페라떼", temp: "HOT" },
      { patterns: [/자[\s.]?허[\s.]?블\b/i, /자몽\s?허니\s?블랙\s?티/i, /허니\s?자몽\s?블랙\s?티/i], name: "자몽 허니 블랙 티", temp: "ICE" },
      { patterns: [/바[\s.]?크[\s.]?콜\b/i, /바닐라\s?크림\s?콜드\s?브루/i], name: "바닐라 크림 콜드 브루", temp: "ICE" },
      { patterns: [/콜[\s.]?브\b/i, /콜드\s?브루/i], name: "콜드 브루", temp: "ICE" },
      { patterns: [/돌체\s?라떼/i, /돌체/i], name: "돌체 라떼", temp: "both" },
      { patterns: [/딸[\s.]?쿠[\s.]?프\b/i, /딸기\s?쿠키\s?프라페/i], name: "딸기쿠키프라페", temp: "ICE" },
      { patterns: [/퐁[\s.]?크[\s.]?러쉬/i, /퐁크/i], name: "퐁크러쉬(플레인)", temp: "ICE" },
      { patterns: [/체리\s?콕/i], name: "체리콕", temp: "ICE" },
      { patterns: [/큐브\s?라떼/i], name: "큐브라떼", temp: "ICE" },
      { patterns: [/청포도\s?에이드/i], name: "청포도에이드", temp: "ICE" },
      { patterns: [/자몽\s?에이드/i], name: "자몽에이드", temp: "ICE" },
      { patterns: [/원조\s?커피/i, /원조/i], name: "원조커피", temp: "ICE" },
      { patterns: [/앗!\s?메리카노/i, /앗메/i], name: "앗!메리카노", temp: "ICE" },
      { patterns: [/빽사이즈/i], name: "빽사이즈 아메리카노", temp: "ICE" },
      { patterns: [/피스타치오/i], name: "피스타치오 빽스치노", temp: "ICE" },
      { patterns: [/완전\s?딸기/i], name: "완전딸기", temp: "ICE" },
      { patterns: [/블루\s?캔디\s?소다/i], name: "블루캔디소다", temp: "ICE" },
      { patterns: [/스[\s.]?연[\s.]?라\b/i, /스페니쉬\s?연유\s?라떼/i], name: "스페니쉬 연유라떼", temp: "ICE" },
      { patterns: [/스피프/i, /스트로베리\s?피치/i], name: "스트로베리 피치 프라페", temp: "ICE" },
      { patterns: [/밀크티\s?쉐이크/i], name: "로얄 밀크티 쉐이크", temp: "ICE" },
      { patterns: [/민트\s?초코/i, /민초/i], name: "민트초코오레오 라떼", temp: "ICE" },
      { patterns: [/말차\s?라떼/i, /녹차\s?라떼/i], name: "말차 라떼", temp: "both" },
      { patterns: [/생과일\s?딸기/i, /딸기\s?주스/i], name: "생과일 딸기주스", temp: "ICE" },
      { patterns: [/캐모마일/i], name: "캐모마일 티", temp: "HOT" }
    ];

    // 옵션 정규표현식
    this.optionPatterns = [
      { pattern: /(연하게|샷\s?빼고|하프샷)/i, name: "연하게" },
      { pattern: /(샷\s?추가|2샷|더블샷|\+1샷)/i, name: "샷추가" },
      { pattern: /(디카페인|디카)/i, name: "디카페인" },
      { pattern: /(오트|오트밀크|귀리우유)/i, name: "오트밀크" },
      { pattern: /(두유|소이라떼)/i, name: "두유변경" },
      { pattern: /(저지방|무지방)/i, name: "저지방우유" },
      { pattern: /(덜달게|시럽\s?적게|당도\s?(30|50)%?)/i, name: "덜달게" },
      { pattern: /(달게|시럽\s?추가|시럽\s?많이|당도\s?(70|100)%?)/i, name: "달게/시럽추가" },
      { pattern: /(얼음\s?적게|얼음\s?조금)/i, name: "얼음적게" },
      { pattern: /(얼음\s?많이)/i, name: "얼음많이" },
      { pattern: /(휘핑\s?빼고|휘핑\s?x|노휘핑)/i, name: "휘핑제외" },
      { pattern: /(휘핑\s?많이)/i, name: "휘핑많이" },
      { pattern: /(사이즈업|벤티|그란데|라지)/i, name: "사이즈업" }
    ];
  }

  /**
   * 한 줄 텍스트 파싱
   * 예: "1. 김철수 대리: 아아 (연하게) 2잔"
   */
  parseLine(line, currentCafeMenus = []) {
    let cleanLine = line.trim();
    if (!cleanLine) return null;

    // 1) 앞 번호 제거 (예: "1. ", "1) ", "[1] ")
    cleanLine = cleanLine.replace(/^(\d+[\.\)\s\-\]]+|[-*•]\s*)/, "").trim();

    // 2) 이름/화자 분리 (예: "홍길동: ", "홍길동 - ", "홍길동 / ")
    let person = "";
    const personMatch = cleanLine.match(/^([가-힣a-zA-Z0-9_\s]{2,10}?)\s*[:\-\/]\s*(.*)$/);
    let drinkPart = cleanLine;
    if (personMatch) {
      person = personMatch[1].trim();
      drinkPart = personMatch[2].trim();
    } else {
      // 쉼표나 띄어쓰기로 첫 단어가 이름인 형태 (예: "김민수 아아 1잔")
      const spaceMatch = cleanLine.match(/^([가-힣]{2,4})\s+(.+)$/);
      // 만약 첫 단어가 음료 줄임말이 아니면 이름으로 추정
      if (spaceMatch && !this.matchesAnyDrink(spaceMatch[1])) {
        person = spaceMatch[1].trim();
        drinkPart = spaceMatch[2].trim();
      }
    }

    if (!drinkPart) return null;

    // 3) 수량 추출 (예: "2잔", "3개", "x 2", "* 2", 끝의 숫자)
    let qty = 1;
    const qtyMatch = drinkPart.match(/(\d+)\s*(잔|개|cup|cups)?$/i) || drinkPart.match(/[xX*]\s*(\d+)/);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10) || 1;
      drinkPart = drinkPart.replace(qtyMatch[0], "").trim();
    }

    // 4) 옵션 추출
    const foundOptions = [];
    for (const opt of this.optionPatterns) {
      if (opt.pattern.test(drinkPart)) {
        foundOptions.push(opt.name);
        drinkPart = drinkPart.replace(opt.pattern, "").trim();
      }
    }

    // 5) 온도(HOT/ICE) 명시 확인
    let detectedTemp = null;
    if (/(아이스|ice|차(가운)?|시원한|🧊)/i.test(drinkPart)) {
      detectedTemp = "ICE";
      drinkPart = drinkPart.replace(/(아이스|ice|차(가운)?|시원한|🧊)/gi, "").trim();
    } else if (/(따뜻한|뜨거운|hot|따|뜨|핫|♨️|🔥)/i.test(drinkPart)) {
      detectedTemp = "HOT";
      drinkPart = drinkPart.replace(/(따뜻한|뜨거운|hot|따|뜨|핫|♨️|🔥)/gi, "").trim();
    }

    // 6) 음료 이름 매칭
    // 괄호 및 특수문자 정리
    drinkPart = drinkPart.replace(/[\(\)\[\]\{\}]/g, " ").trim();

    let resolvedName = drinkPart;
    let finalTemp = detectedTemp;

    // 6-1. 슬랭/줄임말 매칭
    let matchedSlang = false;
    for (const item of this.slangDictionary) {
      for (const pattern of item.patterns) {
        if (pattern.test(cleanLine) || pattern.test(drinkPart)) {
          resolvedName = item.name;
          if (!finalTemp && item.temp !== "both") {
            finalTemp = item.temp;
          }
          matchedSlang = true;
          break;
        }
      }
      if (matchedSlang) break;
    }

    // 6-2. 현재 카페 메뉴 목록과 유사도 매칭 (아직 슬랭으로 안 잡힌 경우)
    if (!matchedSlang && currentCafeMenus && currentCafeMenus.length > 0) {
      const normalizedSearch = drinkPart.replace(/\s+/g, "").toLowerCase();
      const foundMenu = currentCafeMenus.find(m => {
        const menuClean = m.name.replace(/\s+/g, "").toLowerCase();
        return normalizedSearch.includes(menuClean) || menuClean.includes(normalizedSearch);
      });
      if (foundMenu) {
        resolvedName = foundMenu.name;
        if (!finalTemp) {
          finalTemp = foundMenu.temp === "ice" ? "ICE" : (foundMenu.temp === "hot" ? "HOT" : "ICE");
        }
      }
    }

    // 기본 온도는 ICE로 디폴트 (한국 카페 주문의 80% 이상이 얼죽아)
    if (!finalTemp) {
      finalTemp = "ICE";
    }

    // 정돈되지 않은 찌꺼기 문자열 제거
    resolvedName = resolvedName.replace(/^[:\-\/,\s]+|[:\-\/,\s]+$/g, "").trim();
    if (!resolvedName) {
      resolvedName = "기타 음료";
    }

    return {
      raw: line,
      person: person || "익명",
      menuName: resolvedName,
      temp: finalTemp,
      options: foundOptions,
      qty: qty > 0 ? qty : 1
    };
  }

  matchesAnyDrink(text) {
    const t = text.trim().toLowerCase();
    const commonSlangs = ["아아", "뜨아", "따아", "아라", "뜨라", "따라", "아바라", "자허블", "바크콜", "콜브", "메가초코", "앗메"];
    return commonSlangs.includes(t);
  }

  /**
   * 전체 텍스트 덩어리를 받아 줄별로 파싱하고 종합 집계 반환
   */
  parseFullText(fullText, currentCafeMenus = []) {
    if (!fullText || !fullText.trim()) {
      return { items: [], summary: [], totalQty: 0 };
    }

    const lines = fullText.split(/\r?\n/);
    const parsedItems = [];

    for (const rawLine of lines) {
      const parsed = this.parseLine(rawLine, currentCafeMenus);
      if (parsed) {
        parsedItems.push(parsed);
      }
    }

    // 집계 계산 (메뉴명 + 온도 + 옵션별 그룹핑)
    const summaryMap = new Map();
    let totalQty = 0;

    for (const item of parsedItems) {
      const optStr = item.options.length > 0 ? ` (${item.options.join(", ")})` : "";
      const key = `${item.temp ? `[${item.temp}] ` : ""}${item.menuName}${optStr}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          key,
          menuName: item.menuName,
          temp: item.temp,
          options: item.options,
          qty: 0,
          persons: []
        });
      }

      const entry = summaryMap.get(key);
      entry.qty += item.qty;
      totalQty += item.qty;
      if (item.person && item.person !== "익명") {
        entry.persons.push(`${item.person}${item.qty > 1 ? `(${item.qty})` : ""}`);
      }
    }

    const summary = Array.from(summaryMap.values()).sort((a, b) => b.qty - a.qty);

    return {
      items: parsedItems,
      summary,
      totalQty
    };
  }
}

// 전역 인스턴스
window.smartOrderParser = new SmartOrderParser();
