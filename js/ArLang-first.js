var langStr = "";
var langArr = ["th","vi","ja","ko","es","pt","en","km"];
var langPosition = ["th","vi","ja","ko","es","pt","en","km"];
var langMultiYn = "N";

var SUPPORTED_LANGS = ["th","vi","ja","ko","es","pt","en","km"];
var FALLBACK_PRIORITY = ["th","vi","ja","ko","es","pt","en","km"];



var lang = {
		"ko" : {
		    "AR_INDEX_TITLE" : "리워드 프로모션 - AR",
			"OPEN_IN_BROWSER": "브라우저에서 열기",
			"OPEN_IN_BROWSER2": "다시 브라우저에서 열기",
			"INAPP_INFO_TEXT": "현재 브라우저에서는 일부 기능이 제한됩니다.<br>다른 브라우저로 이동해 주세요.",
		    "INAPP_INFO_TITLE": "브라우저 환경 안내",
		    "LOADING_TEXT1" : "당신을 위한 특별한 경험을",
		    "LOADING_TEXT1_2" : "준비하고 있습니다.",
		    "LOADING_TEXT2" : "잠시만 기다려주세요.",
		    "LOADING_APP_BTN": "공식 앱으로 바로 시작하기",
		},
		"en" : {
		    "AR_INDEX_TITLE" : "Rewards Promotion - AR",
			"OPEN_IN_BROWSER": "Open in browser",
			"OPEN_IN_BROWSER2": "Open in browser again",
			"INAPP_INFO_TEXT": "Some features are limited in this browser.<br>Please use another browser.",
		    "INAPP_INFO_TITLE": "Browser Environment Notice",
		    "LOADING_TEXT1" : "We are preparing",
		    "LOADING_TEXT1_2" : "a special experience just for you.",
		    "LOADING_TEXT2" : "Please wait a moment.",
		    "LOADING_APP_BTN": "Start in the official app",
		},
		"ja": {
		    "AR_INDEX_TITLE" : "リワードプロモーション - AR",
			"OPEN_IN_BROWSER": "ブラウザで開く",
  			"OPEN_IN_BROWSER2": "ブラウザで再度開く",
  			"INAPP_INFO_TEXT": "このブラウザでは一部の機能が制限されています。<br>別のブラウザをご利用ください。",
		    "INAPP_INFO_TITLE": "ブラウザ環境のご案内",
		    "LOADING_TEXT1" : "あなたのための特別な体験を",
		    "LOADING_TEXT1_2" : "準備しています。",
		    "LOADING_TEXT2" : "少々お待ちください。",
		    "LOADING_APP_BTN": "公式アプリで今すぐ始める",
		},
		"th" : {
		    "AR_INDEX_TITLE" : "โปรโมชั่นรางวัล - AR",
			"OPEN_IN_BROWSER": "เปิดในเบราว์เซอร์",
  			"OPEN_IN_BROWSER2": "เปิดในเบราว์เซอร์อีกครั้ง",
			"INAPP_INFO_TEXT": "เบราว์เซอร์นี้มีข้อจำกัดบางประการ<br>กรุณาใช้เบราว์เซอร์อื่น",
		    "INAPP_INFO_TITLE": "แจ้งสภาพแวดล้อมของเบราว์เซอร์",
		    "LOADING_TEXT1" : "เรากำลังเตรียมประสบการณ์พิเศษ",
		    "LOADING_TEXT1_2" : "สำหรับคุณ",
		    "LOADING_TEXT2" : "กรุณารอสักครู่",
		    "LOADING_APP_BTN": "เริ่มใช้งานทันทีในแอปอย่างเป็นทางการ",
		},
		"es" : {
		    "AR_INDEX_TITLE" : "Promoción de recompensas - AR",
			"OPEN_IN_BROWSER": "Abrir en navegador",
  			"OPEN_IN_BROWSER2": "Abrir en navegador de nuevo",
  			"INAPP_INFO_TEXT": "Algunas funciones están limitadas en este navegador.<br>Utilice otro navegador.",
		    "INAPP_INFO_TITLE": "Aviso sobre el entorno del navegador",
		    "LOADING_TEXT1" : "Estamos preparando",
		    "LOADING_TEXT1_2" : "una experiencia especial para ti.",
		    "LOADING_TEXT2" : "Por favor espere un momento.",
		    "LOADING_APP_BTN": "Comenzar ahora en la app oficial",
		},
		"vi" : {
		    "AR_INDEX_TITLE" : "Khuyến mãi phần thưởng - AR",
			"OPEN_IN_BROWSER": "Mở bằng trình duyệt",
  			"OPEN_IN_BROWSER2": "Mở lại bằng trình duyệt",
  			"INAPP_INFO_TEXT": "Một số tính năng bị hạn chế trên trình duyệt này.<br>Vui lòng sử dụng trình duyệt khác.",
		    "INAPP_INFO_TITLE": "Thông báo môi trường trình duyệt",
		    "LOADING_TEXT1" : "Chúng tôi đang chuẩn bị",
		    "LOADING_TEXT1_2" : "một trải nghiệm đặc biệt dành cho bạn.",
		    "LOADING_TEXT2" : "Vui lòng đợi một chút.",
		    "LOADING_APP_BTN": "Bắt đầu ngay trong ứng dụng chính thức",
		},
		"pt" : {
		    "AR_INDEX_TITLE" : "Promoção de Recompensas - RA",
		    "OPEN_IN_BROWSER": "Abrir no navegador",
  			"OPEN_IN_BROWSER2": "Abrir novamente no navegador",
  			"INAPP_INFO_TEXT": "Alguns recursos estão limitados neste navegador.<br>Use outro navegador.",
		    "INAPP_INFO_TITLE": "Aviso sobre o ambiente do navegador",
		    "LOADING_TEXT1" : "Estamos preparando",
		    "LOADING_TEXT1_2" : "uma experiência especial para você.",
		    "LOADING_TEXT2" : "Por favor, aguarde um momento.",
		    "LOADING_APP_BTN": "Começar agora no app oficial",
		},
		"km" : {
		    "AR_INDEX_TITLE" : "ប្រូម៉ូសិនរង្វាន់ - AR",
			"INAPP_INFO_TEXT": "មុខងារមួយចំនួនត្រូវបានដាក់កម្រិតលើ Browser នេះ។<br>សូមប្តូរទៅប្រើ Browser ផ្សេង។",
		    "INAPP_INFO_TITLE": "ការណែនាំអំពីបរិយាកាស Browser",
			"OPEN_IN_BROWSER": "បើកក្នុង Browser",
			"OPEN_IN_BROWSER2": "បើកម្តងទៀតក្នុង Browser",
			"LOADING_TEXT1" : "យើងកំពុងរៀបចំបទពិសោធន៍ពិសេស",
			"LOADING_TEXT1_2" : "សម្រាប់អ្នក",
			"LOADING_TEXT2" : "សូមរង់ចាំបន្តិច។",
			"LOADING_APP_BTN": "ចាប់ផ្តើមភ្លាមៗក្នុងកម្មវិធីផ្លូវការ",
		}
}


// ===== 2) 언어 결정 =====
function getLangParam() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("lang");
}

function getLang() {
  // 1) URL 파라미터
  const urlLang = getLangParam();
  if (SUPPORTED_LANGS.includes(urlLang)) return urlLang;

  // 2) 브라우저 언어들 가져오기
  const browserLangs = (navigator.languages || [navigator.language || "en"])
    .map(l => l.slice(0,2));  // "en-US" → "en"

  // 3) 내가 정한 우선순위 순서대로 검사
//  for (const pref of FALLBACK_PRIORITY) {
//    if (browserLangs.includes(pref) && SUPPORTED_LANGS.includes(pref)) {
//      return pref;
//    }
//  }

  // 4) 그래도 없으면 fallback (내 배열 첫번째)
  //return FALLBACK_PRIORITY[0] || "en";
  return browserLangs[0] || "en";
}

// (선택) URL에 lang 없으면 붙여줌
(function ensureLangInUrl() {
  const urlLang = getLangParam();
  if (!SUPPORTED_LANGS.includes(urlLang)) {
    const fallback = getLang();
    const u = new URL(location.href);
    u.searchParams.set("lang", fallback);
    if (u.toString() !== location.href) location.replace(u.toString());
  }
})();

// ===== 3) 전역 변수 생성 (ko_KEY / en_KEY / ... + 현재언어용 lang_KEY) =====
function initLangVarsAll() {
  Object.keys(lang).forEach(L => {
    const dict = lang[L];
    Object.keys(dict).forEach(k => {
      window[`${L}_${k}`] = dict[k];      // 예: en_COUPON_CHECK
    });
  });
}
function initLangVarsCurrent() {
  const L = getLang();
  const dict = lang[L] || lang.en;
  Object.keys(dict).forEach(k => {
    window[`lang_${k}`] = dict[k];        // 예: lang_COUPON_CHECK
  });
}

// ===== 4) 문자열 치환기: "${lang_KEY}" 들을 실제 값으로 바꿈 =====
function resolveLangTemplate(str) {
  if (typeof str !== "string" || !str.includes("${")) return str;
  // ${lang_KEY} -> window.lang_KEY
  return str.replace(/\$\{(lang_[A-Z0-9_]+)\}/g, (_, v) => {
    const val = window[v];
    return (val !== undefined && val !== null) ? String(val) : _;
  }).replace(/\$\{((ko|en|ja|th|vi|es|pt|km)_[A-Z0-9_]+)\}/g, (_, v) => {
    const val = window[v];
    return (val !== undefined && val !== null) ? String(val) : _;
  });
}

// ===== 5) DOM 전체를 한 번에 치환 =====
function i18nApplyPlaceholders(root=document) {
  // 5-1) <title>, <meta>
  if (document.title) document.title = resolveLangTemplate(document.title);

  document.querySelectorAll('meta[content]').forEach(m => {
    m.setAttribute('content', resolveLangTemplate(m.getAttribute('content')));
  });

  // 5-2) 텍스트/HTML 노드
  // 안전하게 속성만 바꿔도 되지만, 이미 HTML 내에 ${...}가 있으니 innerHTML 치환도 수행
  const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_ELEMENT, null);
  const attrNames = ["aria-label","title","alt","placeholder","value","data-label"];
  while (walker.nextNode()) {
    const el = walker.currentNode;

    // innerHTML에 ${...}가 있으면 치환
    if (el.innerHTML && el.innerHTML.includes("${")) {
      el.innerHTML = resolveLangTemplate(el.innerHTML);
    }

    // 대표 속성들 치환
    for (const name of attrNames) {
      if (el.hasAttribute && el.hasAttribute(name)) {
        const v = el.getAttribute(name);
        const nv = resolveLangTemplate(v);
        if (nv !== v) el.setAttribute(name, nv);
      }
    }
  }
}

// ===== 6) 동적 추가에도 대응 (선택) =====
const i18nObserver = new MutationObserver(muts => {
  for (const m of muts) {
    m.addedNodes.forEach(n => {
      if (n.nodeType === 1) i18nApplyPlaceholders(n);
    });
    if (m.type === "attributes") {
      const el = m.target;
      const v = el.getAttribute(m.attributeName);
      const nv = resolveLangTemplate(v);
      if (nv !== v) el.setAttribute(m.attributeName, nv);
    }
  }
});

function initI18n() {
  initLangVarsAll();
  initLangVarsCurrent();
  i18nApplyPlaceholders(document);

  // SweetAlert 등 동적 DOM 대응
  i18nObserver.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label","title","alt","placeholder","value","content"]
  });
  document.dispatchEvent(new Event('i18n:ready'));
}