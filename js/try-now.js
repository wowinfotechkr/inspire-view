function initCamera() {
  const camEl = document.querySelector("[camera]");
  if (!camEl) return false;

  _camera3D = camEl.getObject3D("camera");
  return !!_camera3D;
}

function getCustomScore(tokenEl) {
  const camPos = new THREE.Vector3();
  const tokenPos = new THREE.Vector3();
  _camera3D.getWorldPosition(camPos);
  tokenEl.object3D.getWorldPosition(tokenPos);

  const physicalDist = camPos.distanceTo(tokenPos);

  const tempV = tokenPos.clone();
  tempV.project(_camera3D);

  // 1. 카메라 뒤에 있는 경우
  if (tempV.z > 1) {
    // 물리적 거리에 큰 상수(예: 100)를 더해 '화면 안 토큰'보다 순위를 낮춤
    // 하지만 Infinity가 아니므로 뒤에 있는 토큰 중 가장 가까운 놈을 찾을 수 있음
    return 100 + physicalDist;
  }

  // 2. 카메라 앞에 있는 경우 (화면 중앙 이탈도 0 ~ 1.4)
  return Math.sqrt(tempV.x ** 2 + tempV.y ** 2);
}

/**
 * 카메라 정중앙(0,0)으로부터 토큰이 얼마나 떨어져 있는지 계산합니다.
 * 중앙에 있으면 0, 상하좌우로 멀어질수록 숫자가 증가합니다.
 */
function getScreenDistance(tokenEl) {
  const tokenPos = new THREE.Vector3();
  tokenEl.object3D.getWorldPosition(tokenPos);

  // 3D 좌표를 2D 화면 좌표계(-1 ~ 1)로 변환
  const tempV = tokenPos.clone();
  tempV.project(_camera3D);

  // 카메라 뒤에 있는 경우 필터링 (화면 밖)
  if (tempV.z > 1) return Infinity;

  // 중앙(0,0)에서 현재 위치(x,y)까지의 직선 거리를 반환
  return Math.sqrt(tempV.x ** 2 + tempV.y ** 2);
}

function getAngle360(tokenEl) {
  const camPos = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const tokenPos = new THREE.Vector3();

  _camera3D.getWorldPosition(camPos);
  _camera3D.getWorldDirection(camDir);
  tokenEl.object3D.getWorldPosition(tokenPos);

  // 수평 투영 (Y축 무시)
  camPos.y = 0;
  tokenPos.y = 0;
  camDir.y = 0;

  camDir.normalize();
  const toToken = tokenPos.sub(camPos).normalize();

  // 카메라 정면 대비 토큰의 각도 계산 (-180 ~ 180)
  const angleRad = Math.atan2(camDir.x * toToken.z - camDir.z * toToken.x, camDir.x * toToken.x + camDir.z * toToken.z);

  return THREE.MathUtils.radToDeg(angleRad);
}

function getNearestToken(tokens) {
  let nearest = null;
  let minScore = Infinity;

  for (const t of tokens) {
    if (!t.object3D) continue;

    // 물리적 거리가 아닌 '화면 중앙 이탈도'를 기준으로 측정
    //const score = getScreenDistance(t);
    const score = getCustomScore(t);

    if (score < minScore) {
      minScore = score;
      nearest = t;
    }
  }

  if (!nearest) return null;

  const tokenPos = new THREE.Vector3();
  nearest.object3D.getWorldPosition(tokenPos);
  const tempV = tokenPos.clone();
  tempV.project(_camera3D);
  const screenDist = tempV.z > 1 ? Infinity : Math.sqrt(tempV.x ** 2 + tempV.y ** 2);

  return {
    token: nearest,
    distance: screenDist,
    angle: getAngle360(nearest),
  };
}

function updateTokenGuide() {
  if (!_camera3D && !initCamera()) return;

  const container = document.getElementById("guide-container");
  const tokens = document.querySelectorAll(".nx-token");

  if (!tokens.length) {
    container.style.display = "none";
    return;
  }

  const result = getNearestToken(tokens);

  if (!result) {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";

  const arrowWrapper = document.getElementById("arrow-wrapper");

  // 1. 토큰의 화면 투영 좌표 가져오기 (getNearestToken 내부 로직 활용)
  const tokenPos = new THREE.Vector3();
  result.token.object3D.getWorldPosition(tokenPos);
  const tempV = tokenPos.clone();
  tempV.project(_camera3D);

  const isBehind = tempV.z > 1;
  const isCentered = result.distance < 0.4;

  if (!isBehind && isCentered) {
    container.classList.add("on-target");
  } else {
    // 뒤에 있거나, 앞이라도 중앙이 아니면 무조건 다시 나타남
    container.classList.remove("on-target");
  }

  if (!isBehind) {
    // [앞에 있을 때] 8방향 상하좌우 추적
    const screenAngleRad = Math.atan2(tempV.y, tempV.x);
    const deg = THREE.MathUtils.radToDeg(screenAngleRad);
    arrowWrapper.style.transform = `rotate(${-deg + 90}deg)`;
  } else {
    // [뒤에 있을 때] 수평 각도(result.angle)를 사용하여 좌/우 회전 가이드
    // getAngle360()에서 나온 값이 양수면 오른쪽, 음수면 왼쪽 뒤에 있다는 뜻
    const angle = result.angle;
    const rotation = angle > 0 ? 90 : -90;

    arrowWrapper.style.transform = `rotate(${rotation}deg)`;
  }
}

function visibilityLoop() {
  updateTokenGuide();
  requestAnimationFrame(visibilityLoop);
}

localStorage.removeItem("caughtSeqs");

function onPermissionNext() {
  if (isRequesting) return;

  const nm = needsMotion();

  if (!camOK) {
    requestCamera();
    return;
  }

  if (nm && !motionGranted) {
    requestMotion();
    return;
  }
  loadEvent(true);
}

function checkMotionGranted(timeout = 800) {
  return new Promise((resolve) => {
    if (!needsMotion()) {
      resolve(true);
      return;
    }

    let resolved = false;

    function done(ok) {
      if (resolved) return;
      resolved = true;
      window.removeEventListener("deviceorientation", onMotion);
      resolve(ok);
    }

    function onMotion(e) {
      if (e.alpha !== null || e.beta !== null || e.gamma !== null) {
        done(true);
      }
    }

    window.addEventListener("deviceorientation", onMotion, { once: true });
    setTimeout(() => done(false), timeout);
  });
}

async function refreshPermissionStateOnly() {
  const camState = await queryPermissionState("camera");
  camOK = camState === "granted";
  // camDenied = (camState === "denied");  // ❌ 제거
  motionGranted = await checkMotionGranted();

  // denied 안내도 실제 요청 실패에서만 띄우게 바꾸는 게 안전
  if (geoDenied || camDenied) showBottomNotice(`${lang_RETRY_REQ}`);
  else hideBottomNotice();

  return { camOK, motionGranted };
}

function isInAppBrowser() {
  const u = (navigator.userAgent || "").toLowerCase();

  // 확실한 인앱 브라우저들(대부분의 케이스)
  const strongInApp = ["kakaotalk", "line", "instagram", "fbav", "fban", "facebook", "naver(inapp)", "daumapps", "snapchat", "tiktok"];

  if (strongInApp.some((k) => u.includes(k))) return true;

  // Android WebView 단독 판별(주의: 크롬에도 wv가 섞이는 경우가 있어 보수적으로)
  const isAndroidWv = u.includes("; wv") || u.includes(" wv)");
  // 크롬/삼성브라우저 등 정상 브라우저면 false로 처리
  const isChrome = u.includes("chrome") && !u.includes("edg") && !u.includes("opr");
  const isSamsung = u.includes("samsungbrowser");
  if (isAndroidWv && !(isChrome || isSamsung)) return true;

  return false;
}

function initPermissionScreen() {
  const list = document.getElementById("permList");
  list.innerHTML = "";

  const currentLang = getLang();
  const items = [{ id: "markCamera", img: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.3/img/camera.png", txt: lang[currentLang]["EXP_INFO_CAMERA_TITLE"] }];
  if (isIOS) {
    items.push({ id: "markMotion", img: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.3/img/motion.png", txt: lang[currentLang]["EXP_INFO_MOTION_TITLE"] });
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "perm-item";

    li.innerHTML = `
    			  <div class="perm-icon-wrap">
                   <img id="${item.id}" src="${item.img}" class="perm-icon icon-grayscale">
                   <span id="${item.id}OK" class="perm-ok hidden">OK</span>
                  </div>
                  <div class="perm-text">${item.txt.replace(/\n/g, "<br/>")}</div>
                `;
    list.appendChild(li);
  });
  if (camOK) {
    document.getElementById("markCamera")?.classList.remove("icon-grayscale");
    document.getElementById("markCameraOK")?.classList.remove("hidden");
  }

  document.getElementById("arWarningText").innerText = lang[currentLang]["PROMOTION_AR_WARNING"];

  const browserName = isIOS ? "Safari" : "Chrome";

  const warningText = `${lang_BROWSER_ERR1} ` + `${lang_BROWSER_ERR2}` + browserName + `${lang_BROWSER_ERR3}`;

  document.getElementById("inappWarning").innerHTML = warningText;

  if (isInAppBrowser()) {
    if (currentLang === "pt" || currentLang === "es" || currentLang === "en") {
      document.body.classList.add("lang-pt");
    }
  } else {
    if (currentLang !== "pt") {
      document.body.classList.remove("lang-pt");
      document.body.classList.remove("lang-en");
    }

    document.getElementById("inappWarning").style.display = "none";
  }

  const toggle = document.getElementById("arNoticeToggle");
  const arNoticeList = document.getElementById("arNoticeList");
  const arrow = document.getElementById("arArrowIcon");

  const arKeys = ["PROMOTION_LI1", "PROMOTION_LI2", "PROMOTION_LI3", "PROMOTION_LI4", "PROMOTION_LI5"];
  arNoticeList.innerHTML = "";
  arKeys.forEach((k) => {
    const li = document.createElement("li");
    li.textContent = lang[currentLang][k];
    arNoticeList.appendChild(li);
  });

  // 토글 클릭 이벤트
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    console.log("확인합니다1");
    const isOpen = arNoticeList.classList.toggle("open");
  });
}

function hideScreen(id) {
  document.getElementById(id).classList.add("hidden");
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
}

function setSuccess(id) {
  const el = document.getElementById(id);
  el.classList.remove("fail");
  el.classList.add("success");

  if (id == "mark-camera") {
    id = "markCamera";
  } else if (id == "mark-motion") {
    id = "markMotion";
  }

  const el2 = document.getElementById(toCamelCase(id));
  var id2 = id + "OK";
  const el3 = document.getElementById(toCamelCase(id2));
  if (el2) {
    el3.classList.remove("hidden");
    el2.classList.remove("icon-grayscale");
  }
}
function setFail(id) {
  const el = document.getElementById(id);
  el.classList.remove("success");
  el.classList.add("fail");

  const el2 = document.getElementById(toCamelCase(id));
  if (el2) {
    el2.classList.add("icon-fail-opacity");
  }
}
function clearMark(id) {
  const el = document.getElementById(id);
  el.classList.remove("success", "fail");

  const el2 = document.getElementById(toCamelCase(id));
  if (el2) {
    el2.classList.add("icon-grayscale");
    el2.classList.remove("icon-fail-opacity");
  }
}
function openAuthModalOverlay() {
  fitAuthModalScrollArea();
  document.getElementById("authModal").classList.remove("hidden");
}

function closeAuthModalOverlay() {
  document.getElementById("authModal").classList.add("hidden");
}
function showPermissionLoader() {
  document.getElementById("permissionLoader").classList.remove("hidden");
}

function hidePermissionLoader() {
  document.getElementById("permissionLoader").classList.add("hidden");
}

function needsMotion() {
  return isIOS2();
}
function isIOS2() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

async function queryPermissionState(name) {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const st = await navigator.permissions.query({ name });
      return st.state; // granted | denied | prompt
    } catch (e) {}
  }
  return "unknown";
}

async function updatePermissionUI() {
  const nm = needsMotion();
  document.getElementById("row-motion").style.display = nm ? "flex" : "none";
  console.log("camOK", camOK);
  if (camOK) setSuccess("mark-camera");
  else if (camDenied) setFail("mark-camera");
  else clearMark("mark-camera");

  if (nm) {
    if (motionGranted) setSuccess("mark-motion");
    else if (motionDenied) setFail("mark-motion");
    else clearMark("mark-motion");
  } else {
    setSuccess("mark-motion");
  }

  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) nextBtn.disabled = isRequesting;

  return { nm };
}

function resetPermissionBottomUI() {
  const notice = document.getElementById("permNotice");
  const nextBtn = document.getElementById("btn-next");

  if (notice) notice.classList.add("hidden"); // 안내창 숨김
  if (nextBtn) nextBtn.style.display = ""; // 다음 버튼 다시 표시
}
async function initPermissionFlow() {
  startPortalLottie();
  motionGranted = false;
  motionDenied = false;
  clearMark("mark-motion");
  hideBottomNotice();
  resetPermissionBottomUI();
  // ✅ 들어오자마자 체크만
  await refreshPermissionStateOnly();

  // ✅ 체크 결과 반영
  await updatePermissionUI();

  // ✅ 전부 OK면 바로 진입
  if (camOK && (needsMotion() ? motionGranted : true)) {
    fMaxProgress = 100;
    setTimeout(function () {
      document.getElementById("blankOverlay").style.display = "none";
    }, 700);
    loadEvent(true);
  } else {
    showScreen("permissionScreen");
  }
}

function fitAuthModalScrollArea() {
  const card = document.querySelector(".authOverlayCard");
  const content = document.querySelector(".authModalContent");

  const header = document.querySelector(".authModalHeader");
  const footer = document.querySelector(".authModalcloseBtnDiv");

  if (!card || !content) return;

  const maxCardHeight = Math.floor(window.innerHeight * 0.9);

  const cardStyle = window.getComputedStyle(card);
  const cardPadding = (parseFloat(cardStyle.paddingTop) || 0) + (parseFloat(cardStyle.paddingBottom) || 0);

  const headerH = header ? header.getBoundingClientRect().height : 0;
  const footerH = footer ? footer.getBoundingClientRect().height : 0;

  const contentStyle = window.getComputedStyle(content);
  const contentPadding = (parseFloat(contentStyle.paddingTop) || 0) + (parseFloat(contentStyle.paddingBottom) || 0);

  const SAFE_MARGIN = 120; // px (원하면 16~40 사이 조절)

  const available = maxCardHeight - cardPadding - headerH - footerH - SAFE_MARGIN;

  const maxContentHeight = Math.max(available, 120);

  content.style.maxHeight = `${maxContentHeight}px`;
  content.style.overflowY = "auto";
  content.style.webkitOverflowScrolling = "touch";
}

function setAuthModalText(type) {
  var el_authModalTitle = document.getElementById("authModalTitle");
  var el_authMainTitle = document.getElementById("authMainTitle");
  var el_authMidTitle = document.getElementById("authMidTitle");
  var el_authMidTitle2 = document.getElementById("authMidTitle2");
  var el_authMidImg = document.getElementById("authMidImg");

  var el_b1 = document.getElementById("authMidContentLi1");
  var el_b2 = document.getElementById("authMidContentLi2");
  var el_b3 = document.getElementById("authMidContentLi3");

  var el_p1 = document.getElementById("authMidContent2Li1");
  var el_p2 = document.getElementById("authMidContent2Li2");
  var el_p3 = document.getElementById("authMidContent2Li3");
  var el_p4 = document.getElementById("authMidContent2Li4");

  var el_authMidImgDiv1 = document.getElementById("authMidImgDiv1");
  var el_authMidContent = document.getElementById("authMidContent");

  el_authMidTitle.style.display = "";
  el_authMidImgDiv1.style.display = "";
  el_authMidContent.style.display = "";
  el_p4.style.display = "";

  el_authMidTitle.innerHTML = `${lang_AUTH_MID_TITLE}`;
  el_authMidTitle2.innerHTML = `${lang_AUTH_PHONE_TITLE}`;

  if (type === "GEO") {
    el_authModalTitle.innerHTML = `${lang_AUTH_MAIN_GEO_TITLE}`;
    el_authMainTitle.innerHTML = `${lang_AUTH_MAIN_GEO_CONTENT}`;
  } else if (type === "CAMERA") {
    el_authModalTitle.innerHTML = `${lang_AUTH_MAIN_TITLE}`;
    el_authMainTitle.innerHTML = `${lang_AUTH_MAIN_CONTENT}`;
  } else {
    // MOTION
    el_authModalTitle.innerHTML = `${lang_AUTH_MAIN_MOTION_TITLE}`;
    el_authMainTitle.innerHTML = `${lang_AUTH_MAIN_MOTION_CONTENT}`;
  }

  el_authMidImg.src = "../AR-NX/PLAY/img/auth/and_camera_1.jpg";

  el_b1.innerHTML = `${lang_CAMERA_STEP_1}`;
  el_b2.innerHTML = `${lang_CAMERA_STEP_2}`;
  el_b3.innerHTML = `${lang_CAMERA_STEP_3}`;

  el_p1.innerHTML = `${lang_CAMERA_PHONE_STEP_1}`;
  el_p2.innerHTML = `${lang_CAMERA_PHONE_STEP_2}`;
  el_p3.innerHTML = `${lang_CAMERA_PHONE_STEP_3}`;
  el_p4.innerHTML = `${lang_CAMERA_PHONE_STEP_4}`;

  if (type === "GEO") {
    el_b3.innerHTML = `${lang_GEO_STEP_3}`;
    el_p3.innerHTML = `${lang_GEO_PHONE_STEP_3}`;
  }
  console.log("isIOS2()", isIOS2());
  if (isIOS2()) {
    el_authMidImg.src = "../AR-NX/PLAY/img/auth/ios_camera_1.jpg";

    if (type === "CAMERA") {
      el_b2.innerHTML = `${lang_IOS_CAMERA_STEP_2}`;
      el_b3.innerHTML = `${lang_IOS_CAMERA_STEP_3}`;

      el_p1.innerHTML = `${lang_IOS_CAMERA_PHONE_STEP_1}`;
      el_p2.innerHTML = `${lang_IOS_CAMERA_PHONE_STEP_2}`;
      el_p3.innerHTML = `${lang_IOS_CAMERA_PHONE_STEP_3}`;
    }

    if (type === "GEO") {
      el_b2.innerHTML = `${lang_IOS_CAMERA_STEP_2}`;
      el_b3.innerHTML = `${lang_IOS_GEO_STEP_3}`;

      el_p1.innerHTML = `${lang_IOS_CAMERA_PHONE_STEP_1}`;
      el_p2.innerHTML = `${lang_IOS_GEO_PHONE_STEP_2}`;
      el_p3.innerHTML = `${lang_IOS_CAMERA_PHONE_STEP_3}`;
    }

    if (type === "MOTION") {
      el_authMidTitle.style.display = "none";
      el_authMidImgDiv1.style.display = "none";
      el_authMidContent.style.display = "none";
      el_p4.style.display = "none";

      el_p1.innerHTML = `${lang_IOS_MOTION_PHONE_STEP_1}`;
      el_p2.innerHTML = `${lang_IOS_MOTION_PHONE_STEP_2}`;
      el_p3.innerHTML = `${lang_IOS_MOTION_PHONE_STEP_3}`;
    }
  }

  el_p4.style.display = el_p4.innerHTML ? "" : "none";
}

async function requestCamera(isAuto) {
  if (isRequesting) return;

  if (isAuto) {
    saveUserLog("TRY - 카메라권한 버튼 클릭(자동)");
  } else {
    saveUserLog("TRY - 카메라권한 버튼 클릭");
  }

  showPermissionLoader();
  isRequesting = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());

    camOK = true;
    camDenied = false;
    setSuccess("mark-camera");
    hideBottomNotice();
    if (isAndroid) {
      //여기서 변경
      document.getElementById("btn-next").innerText = `${lang_EXP_BTN}`;
      loadEvent(true);
    }
    saveUserLog("TRY - 카메라권한 허용");
  } catch (err) {
    camOK = false;
    camDenied = true;
    setAuthModalText("CAMERA");
    setFail("mark-camera");
    showBottomNotice(`${lang_RETRY_REQ}`);
    console.error(err);
    saveUserLog("TRY - 카메라권한 거부");
  } finally {
    isRequesting = false;
    await updatePermissionUI();
    hidePermissionLoader();
  }
}

async function requestMotion() {
  if (isRequesting) return;
  showPermissionLoader();
  isRequesting = true;

  try {
    // ✅ requestPermission 함수가 있는 iOS Safari에서만 요청
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === "granted") {
        motionGranted = true;
        motionDenied = false;
        setSuccess("mark-motion");
        hideBottomNotice();
        loadEvent(true);
        document.getElementById("btn-next").innerText = `${lang_EXP_BTN}`;
      } else {
        motionGranted = false;
        motionDenied = true;
        setFail("mark-motion");
        setAuthModalText("MOTION");
        showBottomNotice(`${lang_RETRY_REQ}`);
      }
    } else {
      // ✅ Android/PC/대부분 WebView: 이 권한 요청 단계 자체가 없음 → 통과
      motionGranted = true;
      motionDenied = false;
      setSuccess("mark-motion");
      hideBottomNotice();
      loadEvent(true);
    }
  } catch (err) {
    motionGranted = false;
    motionDenied = true;
    setFail("mark-motion");
    showBottomNotice(`${lang_RETRY_REQ}`);
    console.error(err);
  } finally {
    isRequesting = false;
    await updatePermissionUI();
    hidePermissionLoader();
    saveUserLog("TRY - 모션권한 버튼 클릭");
  }
}

function showBottomNotice(text) {
  document.getElementById("permNoticeText").innerText = text;
  document.getElementById("permNotice").classList.remove("hidden");
  document.getElementById("btn-next").classList.add("hidden");
  hidePermissionLoader();

  document.getElementById("arNotice").style.display = "none";
  document.getElementById("cameraNoticeText").style.display = "none";
}

function hideBottomNotice() {
  document.getElementById("permNoticeText").innerText = "";
  document.getElementById("permNotice").classList.add("hidden");
  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) nextBtn.style.display = "";
  const guideDiv = document.getElementById("guideInfoBtnDiv");
  if (guideDiv) guideDiv.classList.remove("hidden");
}

async function loadEvent(isReadyEnd) {
  startPortalLottie();
  hideScreen("cameraScreen");
  hideScreen("motionScreen");
  if (isReadyEnd) {
    hideScreen("permissionScreen");
    saveUserLog("TRY - AR 로딩시작");
    initAR();
    return;
  }
}

function setLoadingView() {
  const container = document.getElementById("lottie-portal");
  if (!container) {
    console.error("[Lottie] container not found");
    return;
  }
  //const cpnTitle = sessionStorage.getItem("cpnTitle");
  const lottieText = document.getElementById("lottie-text");
  if (cpnTitle == "" || cpnTitle == null) {
    lottieText.innerHTML = `${lang_AR_INDEX_LODING_DEMO} <br> ${lang_AR_INDEX_LODING} ... `;
  } else {
    lottieText.innerHTML = `${lang_AR_INDEX_LODING_DEMO} <br> ${lang_AR_INDEX_LODING} ... `;
  }
}

async function eventIsOpen() {
  console.log("eventIsOpen");
  localStorage.removeItem("isOpen");
  const saved = JSON.parse(localStorage.getItem("eventPeriod") || "{}");
  const { startDate, startTime, endDate, endTime } = saved || {};
  console.log(!startDate || !startTime || !endDate || !endTime);
  if (!startDate || !startTime || !endDate || !endTime) return false;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}${m}${d}`; // 로컬 YYYYMMDD

  const startDateFmt = `${startDate.slice(0, 4)}.${startDate.slice(4, 6)}.${startDate.slice(6, 8)}`;
  const endDateFmt = `${endDate.slice(0, 4)}.${endDate.slice(4, 6)}.${endDate.slice(6, 8)}`;
  const startTimeFmt = `${startTime.slice(0, 2)}:${startTime.slice(2, 4)}`;
  const endTimeFmt = `${endTime.slice(0, 2)}:${endTime.slice(2, 4)}`;

  const timeBlock =
    startTime === "0000" && endTime === "2400"
      ? ""
      : `
        	    <div class="kv-label">${lang_INFO_TIME}</div>
        	    <div class="kv-value">${startTimeFmt}<br> ~ ${endTimeFmt}</div>
        	  `;

  // 날짜 범위
  console.log(todayStr < startDate || todayStr > endDate);
  if (todayStr < startDate || todayStr > endDate) {
    stopPortalLottie(true);

    const eventNotActive = document.getElementById("eventNotActive");
    eventNotActive.style.display = "flex";
    eventNotActive.innerHTML = `
        		<div class="event-expired-box">
        		  <div class="event-expired-title">${lang_INFO_NO_DATE}</div>

        		  <div class="event-expired-date">
        		    <span class="label" style="padding-right: 8px;">${lang_INFO_DATE}</span>
        		    <span class="date">${startDateFmt} ~ ${endDateFmt}</span>
        		  </div>
        		</div>    	        
  	      `;

    return false;
  }

  // 시간 범위 (심야 구간 지원)
  const nowHM = now.getHours() * 100 + now.getMinutes();
  const sHM = parseInt(startTime, 10);
  const eHM = endTime === "2400" ? 2400 : parseInt(endTime, 10);

  let inTime;
  if (sHM <= eHM) inTime = nowHM >= sHM && nowHM < eHM;
  else inTime = nowHM >= sHM || nowHM < eHM;

  if (!inTime) {
    const r = await Swal.fire({
      title: `${lang_INFO}`,
      html: `
        	        <div class="info-wrap">
        	          <div style="height:20px"></div>
        	          <div class="content-title">${lang_INFO_NO_TIME}</div>
        	          <div style="height:5px"></div>
        	          <div class="info-board">
        	            <div class="kv">
        	              <div class="kv-label">${lang_INFO_DATE}</div>
        	              <div class="kv-value">${startDateFmt} ~ ${endDateFmt}</div>
        	              ${timeBlock}
        	            </div>
        	          </div>
        	        </div>
        	      `,
      confirmButtonText: `${lang_CHECK}`,
      backdrop: true,
      allowOutsideClick: false,
      customClass: { popup: "common-popup3", confirmButton: "btn-full", actions: "fill-actions" },
    });
    if (r.isConfirmed) window.history.back();
    return false;
  }

  setWithExpiry("isOpen", "Y", 10 * 60 * 1000);
  return true;
}

function getRandomPointInRadius(lat, lng, radiusMeters) {
  const earthRadius = 6378137; // 지구 반지름 (m)

  // 원 안에서 균일하게 뽑으려면 거리에 sqrt 사용
  const rand = Math.random();
  const rand2 = Math.random();
  const distance = radiusMeters * Math.sqrt(rand); // 0 ~ radius
  const angle = 2 * Math.PI * rand2; // 0 ~ 2π

  const dx = distance * Math.cos(angle);
  const dy = distance * Math.sin(angle);

  const newLat = lat + (dy / earthRadius) * (180 / Math.PI);
  const newLng = lng + (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

  return { lat: newLat, lng: newLng };
}

function setWithExpiry(key, value, ttlMs) {
  const now = Date.now();
  const item = {
    value: value,
    expiry: now + ttlMs,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

// 불러올 때
function getWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = Date.now();

  if (now > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

function checkCameraReady() {
  if (sceneLoaded && videoReady && renderStarted && !isCameraLoaded) {
    isCameraLoaded = true;
    updateProgress("camera");
    onCameraReady();
  }
}

async function onCameraReady() {
  stopPortalLottie();

  const overlay = document.getElementById("startOverlay");
  if (overlay) {
    overlay.classList.remove("hidden");
    overlay.style.display = "flex";
  }

  meals = await getMealsForSpawn();
  if (meals.length > WANT_TOKEN_COUNT) meals = meals.slice(0, WANT_TOKEN_COUNT);

  const radius = PICKUP_MAX_DIST * 0.92;

  await spawn2DAroundCamera(meals, radius);
}

function showEventNotice() {
  const currentLang = getLang();
  const d = lang[currentLang] || lang.en;

  let bodyMsg = d.EVENT_BODY.replace("${n1}", `<strong>${demoTokenCnt}</strong>`).replace("${n2}", `<strong>${demoTokenRadio}</strong>`);
  var getEventTitle = d.EVENT_TITLE;
  var getEventBody2 = d.EVENT_BODY_2;
  swalx({
    kind: "one", // '확인' 버튼 하나만 있는 타입
    title: getEventTitle,
    message: `<div style="line-height:1.6; font-size:16px;">${bodyMsg}<br>${getEventBody2}</div>`,
    mode: "html",
    confirmText: d.CHECK,
    allowOutsideClick: true,
    onConfirm: () => {
      document.body.classList.remove("modal-blur");
    },
    onCancel: () => {
      document.body.classList.remove("modal-blur");
    },
  });
}

function playGiftSequence() {
  giftPlaying = false;

  var giftOverlay = document.getElementById("giftOverlay");
  const giftContainer = document.getElementById("gift-lottie");
  const sparkleContainer = document.getElementById("sparkle-lottie");

  if (giftAnim) giftAnim.destroy();
  giftContainer.innerHTML = "";
  sparkleContainer.innerHTML = "";

  giftOverlay.classList.remove("hidden");
  giftContainer.classList.remove("hidden");
  sparkleContainer.classList.add("hidden");

  giftAnim = lottie.loadAnimation({
    container: giftContainer,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.3/lottie/gift_box.json",
  });

  giftAnim.addEventListener("DOMLoaded", () => {
    giftAnim.playSegments([0, 15], true);
  });

  giftAnim.addEventListener("complete", () => {
    if (!giftPlaying) {
      giftAnim.playSegments([0, 15], true);
      return;
    }

    giftContainer.classList.add("hidden");
    sparkleContainer.classList.remove("hidden");
    //sparkleAnim.goToAndPlay(0, true);
    startTripleSparkles();
  });

  giftContainer.onclick = () => {
    if (giftPlaying) return;
    giftPlaying = true;
    giftAnim.setSpeed(2);
    giftAnim.loop = false;
    giftAnim.playSegments([15, 30], true);
    saveUserLog("TRY - 선물상자 클릭");

    const sound = document.getElementById("gift-sound");
    if (sound) {
      sound.currentTime = 0; // 사운드가 씹히지 않게 초기화 후 재생
      sound.play().catch((e) => console.log("Sound play failed", e));
    }
  };
}

function startTripleSparkles() {
  const sparkleContainer = document.getElementById("sparkle-lottie");

  sparkleContainer.innerHTML = "";
  sparkleContainer.style.position = "relative";
  sparkleContainer.style.overflow = "visible"; // 화면 밖 나가도 OK면

  const anims = [];

  for (let i = 0; i < 3; i++) {
    const d = document.createElement("div");
    d.style.position = "absolute";
    d.style.inset = "0";
    d.style.pointerEvents = "none";
    d.style.transformOrigin = "center center";

    if (i === 0) {
      d.style.transform = "translate(0px, 0px) scale(1.1)";
    }

    if (i === 1) {
      d.style.transform = "translate(40px, -70px) scale(1.5)";
    }

    if (i === 2) {
      d.style.transform = "translate(-35px, 60px) scale(1.3)";
    }

    sparkleContainer.appendChild(d);

    const anim = lottie.loadAnimation({
      container: d,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.3/lottie/fireworks.json",
    });

    anims.push(anim);
  }

  function chain(idx) {
    if (!anims[idx] || !anims[idx + 1]) return;

    let fired = false;

    anims[idx].addEventListener("enterFrame", (e) => {
      const total = anims[idx].totalFrames || 0;
      if (!fired && total > 0 && e.currentTime >= total * 0.5) {
        fired = true;
        anims[idx + 1].goToAndPlay(0, true);
        chain(idx + 1);
      }
    });
  }

  anims[0].addEventListener("DOMLoaded", () => {
    anims[0].goToAndPlay(0, true);
    chain(0);
  });

  anims[2].addEventListener("complete", () => {
    document.getElementById("giftOverlay").classList.add("hidden");
    giftPlaying = false;
    openArModal2();
  });
}

function windowLoaded() {
  console.log("windowLoaded");
  const params = new URLSearchParams(location.search);
  const getMemberid = params.get("memberid");
  if (getMemberid) {
    /* const oldMemberid = localStorage.getItem("memberid");

           fetch("/mergeId.do", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ "oldId": oldMemberid, "newId": getMemberid, "brand": cBrand, "store": cStore, "code": cCode }),
           })
           .then((data) => {
             console.log(data);
             console.log("data.proc_code: " + data.proc_code);
             if (data.proc_code == "0000") {
           	  if (data.couponCd != null && data.couponCd.length == 16) {
           		couponCreatedYn = "Y";
           	  }
             }
           }); */

    localStorage.setItem("memberid", getMemberid);
    const url = new URL(location.href);
    url.searchParams.delete("memberid");
    history.replaceState(null, "", url.toString());
  }

  let cleanUrl = window.location.href.split("#")[0];
  sessionStorage.setItem("returnUrl", cleanUrl);
  //alert("returnUrl:"+sessionStorage.getItem("returnUrl")+",cleanUrl:"+cleanUrl)
}

function setWithExpiry(key, value, ttlMs) {
  const now = Date.now();
  const item = {
    value: value,
    expiry: now + ttlMs,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

// 불러올 때
function getWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = Date.now();

  if (now > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

function updateGiftIndicator() {
  const hasCoupon = !!sessionStorage.getItem("couponNumber");
  if (hasCoupon) {
    cornerGiftBtn.classList.add("has-coupon");
    cornerGiftBtn.setAttribute("aria-label", "${lang_COUPON_OPEN}");
  } else {
    cornerGiftBtn.classList.remove("has-coupon");
    cornerGiftBtn.setAttribute("aria-label", "${lang_COUPON_CHECK}");
  }
}

function formatDate(dateStr) {
  let year = dateStr.slice(0, 4);
  let month = dateStr.slice(4, 6);
  let day = dateStr.slice(6, 8);

  return `${year}.${month}.${day}`;
}

function formatDateOnly(updt) {
  const year = updt.year + 1900;
  const month = String(updt.month + 1).padStart(2, "0");
  const date = String(updt.date).padStart(2, "0");
  return `${year}.${month}.${date}`;
}

// 시간만
function formatTimeOnly(updt) {
  const hours = String(updt.hours).padStart(2, "0");
  const minutes = String(updt.minutes).padStart(2, "0");
  const seconds = String(updt.seconds).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function hideLoader() {
  console.log("hideLoader");
  const loader = document.getElementById("myapp-ar-loader");
  if (loader) {
    loader.style.transition = "opacity 0.5s ease";
    loader.style.opacity = "0";
    setTimeout(() => (loader.style.display = "none"), 500);
  }
}

function setMealSumList(list, isAni) {
  mealSumList = list;
  console.log();
  const stampCounterWrapper = document.getElementById("stampCounterWrapper");
  const stampCounter = document.getElementById("stampCounter");
  const stampCounter2 = document.getElementById("stampCounter2");
  const stampTotalCounterWrapper = document.getElementById("stampTotalCounterWrapper");
  const stampTotalCounter = document.getElementById("stampTotalCounter");
  const stampTotalCounter2 = document.getElementById("stampTotalCounter2");
  var rewardUtilCountDiv = document.getElementById("rewardUtilCount");

  stampCounter.addEventListener("click", (e) => {
    // for Test
    //showCouponAlert()
    //showDemoAlert()
  });

  if (mealSumList.length > 0) {
    viewMealCnt = mealSumList[0].MH_VIEW_MEAL_CNT;
    ameal = mealSumList[0].SU_AMEAL;
    console.log("currentRewardCnt", currentRewardCnt);
    updateTokenUI(currentRewardCnt, WANT_TOKEN_COUNT, "2");

    var rewardUtilCount = Number(maxMealCnt) - Number(ameal);
    console.log("rewardUtilCount", rewardUtilCount);
    if (rewardUtilCountDiv) rewardUtilCountDiv.textContent = rewardUtilCount ?? maxMealCnt;

    stampCounterWrapper.style.display = "flex";
    stampTotalCounterWrapper.style.display = "flex";
  } else {
    checkChangemeal();
  }

  if (isAni) {
    stampCounter.classList.remove("pulse-effect");
    void stampCounter.offsetWidth;
    stampCounter.classList.add("pulse-effect");
  }
}

function openArModal2() {
  var giftContainer = document.getElementById("gift-lottie");
  var sparkleContainer = document.getElementById("sparkle-lottie");
  saveUserLog("TRY - 마지막 모달 진입");
  giftContainer.classList.add("hidden");
  sparkleContainer.classList.add("hidden");
  const modal2 = document.getElementById("arModal2");
  modal2.classList.remove("hidden");
  modal2.style.opacity = "1";
  modal2.style.pointerEvents = "auto";
}

async function checkChangemeal() {
  const res = await fetch(`/getUserMeal2.do?userid=${memberid}&brand=${cBrand}&store=${cStore}&code=${cCode}`);
  //const res = await fetch(`/getUser.do?id=${23e23262-ec28-4446-b2a8-b3292d051732}`);
  const resJson = await res.json();
  const stampCounterWrapper = document.getElementById("stampCounterWrapper");
  const stampCounter = document.getElementById("stampCounter");
  const stampTotalCounterWrapper = document.getElementById("stampTotalCounterWrapper");
  //await fetchMealCount();
  var numberToken = Number(WANT_TOKEN_COUNT) - Number(currentRewardCnt);
  updateTokenUI(numberToken, WANT_TOKEN_COUNT, "2");
  const rewardUtilEl = document.getElementById("rewardUtilCount");
  if (rewardUtilEl) rewardUtilEl.textContent = mealCount;

  stampCounterWrapper.style.display = "flex";
  stampTotalCounterWrapper.style.display = "flex";
}

function getUserMeal() {
  //if (!memberid) return;
  fetch(`/getUserMealForTicket.do?&brand=${cBrand}&store=${cStore}&code=${cCode}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("밀데이터", data);
      setMealSumList(data.mealSumList);
    });
}

async function fetchMealList({ lat, lon, brand, store, code }) {
  const res = await fetch(`/getMealListForTicket.do?brand=${brand}&store=${store}&code=${code}`);

  const data = await res.json();

  return data.mealList; // ⭐ 여기서 바로 반환
}

async function fetchMealCount() {
  const res = await fetch(`/getMealCountForTicket.do?brand=${cBrand}&store=${cStore}&code=${cCode}`);

  const data = await res.json();
  console.log("data", data);
  mealCount = data.mealCount.SU_AMEAL;
  console.log("mealCount", mealCount);
  currentRewardCnt = data.remainCount;
}

function initAR() {
  console.log("initAR");
  //setMemberid();
  //getUserMeal();
  //connectWebSocket();

  updateTokenUI(WANT_TOKEN_COUNT, WANT_TOKEN_COUNT, "1");

  const observer = new MutationObserver(() => {
    const swalContainer = document.querySelector(".swal2-container");
    if (!swalContainer) {
      // swal2-container가 사라진 시점
      const loader = document.getElementById("myapp-ar-loader");
      loader.style.display = "flex";

      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const arScene = document.createElement("a-scene");
  arScene.setAttribute("id", "scene");
  arScene.setAttribute("embedded", "");
  arScene.setAttribute("xr-mode-ui", "enabled: false");
  arScene.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false;");
  //arScene.setAttribute("renderer", "antialias: true; sortObjects: true");
  arScene.setAttribute("touch-action", "none");

  const camera = document.createElement("a-entity");
  camera.setAttribute("camera", "fov: 40;");
  camera.setAttribute("rotation-reader", "");
  camera.setAttribute("cursor", "rayOrigin: mouse;");
  //camera.setAttribute("cursor", "rayOrigin: entity; fuse: false");
  //camera.setAttribute( "cursor", "rayOrigin: entity; fuse: false; showLine: false");
  camera.setAttribute("raycaster", "objects: .clickable; far: 1000; interval: 0");
  camera.setAttribute("look-controls", "touchEnabled: false; mouseEnabled: false");

  arScene.appendChild(camera);
  document.body.appendChild(arScene);

  arScene.addEventListener("loaded", () => {
    console.log("TEST0108 - arScene loaded");
    sceneLoaded = true;
    updateProgress("scene");
    checkCameraReady();

    visibilityLoop();
  });

  const waitForArjsVideo = setInterval(() => {
    const video = document.getElementById("arjs-video");
    if (!video) return;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      console.log("TEST0108 - AR.js 카메라 준비 완료 (#arjs-video)");
      videoReady = true;
      updateProgress("video");
      clearInterval(waitForArjsVideo);
      checkCameraReady();
    }
  }, 100);

  arScene.addEventListener("renderstart", () => {
    console.log("TEST0108 - renderstart");
    renderStarted = true;
    updateProgress("render");
    checkCameraReady();
  });

  document.querySelector("#progressWrap").style.visibility = "visible";

  gpsLoaded = true;
  updateProgress("gps");

  absUrl = selectedTokenImg;

  dispW = IMG_MAX_SIZE;
  dispH = IMG_MAX_SIZE;

  //tokenImgLoad();
  isMarkerDataLoaded = true;
  updateProgress("markerData");
  saveUserLog("TRY - 마커 로딩 완료");
}

function checkCouponCreated() {
  if (couponCreatedYn == "Y") {
    couponCreatedYn = "N";
    const panel = document.getElementById("resultPanel");
    const title = document.getElementById("resultTitle");
    const message = document.getElementById("resultMessage");

    message.innerHTML = `${lang_TICKET_GET_1}<br>${lang_TICKET_GET_2}`;
    panel.classList.remove("win", "lose");
    panel.classList.add("win");

    document.getElementById("resultText").textContent = `${lang_CONGRATULATIONS}`;

    document.getElementById("useCouponBtn").style.display = "inline-block";
  }
}

function showCouponAlert() {
  const panel = document.getElementById("resultPanel");
  const title = document.getElementById("resultTitle");
  const message = document.getElementById("resultMessage");
  const video = document.getElementById("bgVideo");

  message.innerHTML = `${lang_TICKET_GET_1}<br>${lang_TICKET_GET_2}`;
  panel.classList.remove("win", "lose");
  panel.classList.add("win");

  document.getElementById("resultText").textContent = `${lang_CONGRATULATIONS}`;

  //launchConfetti();
  //document.getElementById("useCouponBtn").style.display = "inline-block";

  panel.style.display = "block";
  document.getElementById("overlay").classList.add("show");
  video.currentTime = 0;
  video.play().catch((err) => console.warn("재생 실패:", err));
  showResultSingleButton();
  panel.classList.add("show");
}

function showResultSingleButton() {
  const actions = document.querySelector("#resultPanel .result-actions");

  actions.classList.add("single");

  const shareBtn = actions.querySelector(".btn-share");
  if (shareBtn) shareBtn.style.display = "none";
  const closeBtn = actions.querySelector(".btn-close");
  closeBtn.innerText = `${lang_CHECK}`;
}

function handleCollect(model, message, seq, isSound) {
  var soundOn = isSound;
  if (soundOn == null) soundOn = true;
  const sound = document.getElementById("collect-sound");
  if (sound && soundOn) {
    sound.currentTime = 0; // 사운드가 씹히지 않게 초기화 후 재생
    sound.play().catch((e) => console.log("Sound play failed", e));
  }

  const effect = document.createElement("a-entity");
  effect.setAttribute("geometry", { primitive: "sphere", radius: 0.2 });
  effect.setAttribute("material", { color: "#00ff00", opacity: 0.5 });
  effect.setAttribute("animation", {
    property: "scale",
    to: "2 2 2",
    dur: 200,
    easing: "easeOutCubic",
  });
  model.appendChild(effect);

  model.setAttribute("animation__fadeout", {
    property: "scale",
    to: "0 0 0",
    dur: 400,
    easing: "easeInOutCubic",
  });

  showToast(message);

  setTimeout(() => {
    const scene = document.querySelector("a-scene");
    if (scene && model.parentNode === scene) {
      scene.removeChild(model);
    }
  }, 850);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerHTML = message.replace(/\n/g, "<br>");
  toast.style.display = "block";
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => (toast.style.display = "none"), 300);
  }, 3000);
}

function addLogText(logText) {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML += logText + "<br>";
}

async function startPortalLottie() {
  // 이미 실행 중이면 중복 생성 방지
  console.log("portalAnim:" + portalAnim);
  if (portalAnim) {
    portalAnim.play();
    //portalAnim.destroy();
    //portalAnim = null;
    return;
  } else {
    if (!portalAnimLoaded) {
      portalAnimLoaded = true;
      //await loadScript("https://unpkg.com/lottie-web/build/player/lottie.min.js");
    } else {
      return;
    }
  }

  var loader = document.getElementById("myapp-ar-loader");
  loader.style.display = "flex";

  portalAnim = lottie.loadAnimation({
    container: document.getElementById("lottie-portal"),
    renderer: "svg",
    loop: false,
    autoplay: true,
    path: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.3/lottie/portal_ntokozo.json",
  });
}

// ⏸️ Lottie 정지 함수
function stopPortalLottie(isForce) {
  console.log("stopPortalLottie");
  // for Test
  //return;
  if (isForce == null || !isForce) {
    //if (!isCameraLoaded || !isMarkerDataLoaded) return;
    if (!isCameraLoaded) return;
  }

  if (isForce) {
    saveUserLog("TRY - 로딩 종료");
  } else {
    saveUserLog("TRY - 로딩 종료");
  }

  const loader = document.getElementById("myapp-ar-loader");
  if (loader) {
    loader.style.transition = "opacity 0.5s ease";
    loader.style.opacity = "0";
    setTimeout(() => (loader.style.display = "none"), 500);
  }
  if (portalAnim) {
    portalAnim.stop(); // 현재 프레임에서 정지
    // 또는 완전 제거하고 싶다면 destroy():
    if (!isForce) {
      portalAnim.destroy();
      portalAnim = null;
    }
  }
}

function updateVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

window.addEventListener("resize", updateVh);
window.addEventListener("orientationchange", updateVh);
document.addEventListener("DOMContentLoaded", updateVh);

function updateProgress(stepKey) {
  progress += LOAD_STEPS[stepKey];
  if (progress > 100) progress = 100;
  if (progress == 60) progress = 100;

  const bar = document.querySelector("#progressBar");
  const text = document.querySelector("#progressText");

  bar.style.width = progress + "%";
  text.innerText = `${progress}%`;

  //if (progress == 100) stopPortalLottie();
  console.log(`[LOAD] ${stepKey} 완료 → ${progress}%`);
}

function build10RandomTokenPlaces(userLat, userLng, radiusMeters) {
  const places = [];
  for (let i = 0; i < 10; i++) {
    const p = getRandomPointInRadius(userLat, userLng, radiusMeters);
    places.push({ MD_GPSX: p.lat, MD_GPSY: p.lng });
  }
  return places;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img); // 로드 완료되면 img 객체 반환
    img.onerror = reject; // 에러 발생 시 reject
  });
}

async function getImageSize(img) {
  const src = img;
  try {
    const image = await loadImage(src); // 여기서 이미지 로드 기다림
    //console.log("width:", image.width);
    //console.log("height:", image.height);
    return { width: image.width, height: image.height };
  } catch (err) {
    console.error("이미지 로드 실패", err);
  }
}

function getRandomNXPosition(tokens) {
  let pos;
  let attempts = 0;

  do {
    const x = Math.random() * 30 - 15;
    const y = Math.random() * 30 - 15;
    const z = Math.random() * 30 - 15;

    pos = { x, y, z };

    // 1️⃣ 토큰끼리 최소 거리 체크 (x-z 평면)
    const tooClose = tokens.some((t) => {
      const dx = t.x - pos.x;
      const dz = t.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      return dist < MIN_DISTANCE;
    });

    // 2️⃣ 카메라와 최소 거리 체크 (3D 거리)
    const dxCam = cameraPos.x - pos.x;
    const dyCam = cameraPos.y - pos.y;
    const dzCam = cameraPos.z - pos.z;
    const distCam = Math.sqrt(dxCam * dxCam + dyCam * dyCam + dzCam * dzCam);
    const tooCloseToCam = distCam < MIN_CAM_DISTANCE;

    if (!tooClose && !tooCloseToCam) break; // 조건 만족하면 확정
    attempts++;
  } while (attempts < 100);

  return pos;
}

async function spawn2DAroundCamera(mealList, radius) {
  const scene = document.querySelector("a-scene");
  if (!scene || !scene.camera) return;

  const THREE = AFRAME.THREE;
  const cam = scene.camera;

  const camWorldPos = new THREE.Vector3();
  cam.getWorldPosition(camWorldPos);

  //const points = generatePoints(mealList.length, radius, TOKEN_MIN_SPACING);
  const points = [];

  while (points.length < mealList.length) {
    //points.push({ x: (Math.random() - 0.5) * radius * 2, z: (Math.random() - 0.5) * radius * 2 });
    points.push(getRandomNXPosition(points));
  }
  console.log(points);
  console.log("밀리스트길이", mealList.length);
  //console.log(getRandomNXPosition(points))
  for (let i = 0; i < mealList.length; i++) {
    const place = mealList[i];
    const seq = place?.MD_SEQ ?? String(i);

    if (isCaught(seq)) continue;

    const img = place?.MH_IMG || "./img/token/KR_bibimbap.png";

    const imgSize = await getImageSize(img);
    //console.log(imgSize)
    const w = imgSize.width || 1;
    const h = imgSize.height || 1;

    if (w >= h) {
      // 가로가 더 길거나 정사각형 → width = 2, height = 2 * (h/w)
      dispH = IMG_MAX_SIZE;
      dispW = +(IMG_MAX_SIZE * (h / w)).toFixed(3);
    } else {
      // 세로가 더 김 → height = 2, width = 2 * (w/h)
      dispW = IMG_MAX_SIZE;
      dispH = +(IMG_MAX_SIZE * (w / h)).toFixed(3);
    }

    const p = points[i];
    //const y = (Math.random() * 1.2) - 0.2;

    //const offset = new THREE.Vector3(p.x, p.y, p.z);
    //offset.applyQuaternion(cam.quaternion);

    //const worldPos = camWorldPos.clone().add(offset);
    //const scenePos = scene.object3D.worldToLocal(worldPos.clone());

    const plane = document.createElement("a-entity");
    //plane.setAttribute("position", `${scenePos.x} ${scenePos.y} ${scenePos.z}`);
    plane.setAttribute("position", `${p.x} ${p.y} ${p.z}`);
    plane.setAttribute("look-at", "[camera]");
    plane.classList.add("nx-token");
    /* plane.setAttribute("width", `${dispH.toFixed(3)}`);
    		    plane.setAttribute("height", `${dispW.toFixed(3)}`);
    		    plane.setAttribute("material", `
    		    		  src: ${img};
    		    		  transparent: true;
    		    		  opacity: 1;
    		    		  depthWrite: false;
    		    		  depthTest: false;
    		    		  shader: flat;
    		    		  side: double;
    		    		`); */
    //plane.setAttribute("billboard", "");
    //plane.setAttribute("class", "clickable");
    plane.dataset.seq = seq;

    const hit = document.createElement("a-box");
    hit.setAttribute("width", `${((dispH + dispW) / 2).toFixed(3)}`);
    hit.setAttribute("height", `${((dispH + dispW) / 2).toFixed(3)}`);
    hit.setAttribute("material", "opacity: 0; transparent: true");
    hit.setAttribute("class", "clickable");
    hit.setAttribute("depth", "0.5");
    hit.setAttribute("position", "0 0 0.05");
    plane.appendChild(hit);

    const image = document.createElement("a-image");
    image.setAttribute("src", `${img}`);
    image.setAttribute("width", `${dispH.toFixed(3)}`);
    image.setAttribute("height", `${dispW.toFixed(3)}`);

    hit.appendChild(image);

    const onPick = async (ev) => {
      ev?.preventDefault?.();
      if (!plane.object3D.visible) return;
      if (isProcessing) return;

      // 중복 클릭 방지
      if (isCaught(seq)) return;

      isProcessing = true;

      // UX: 눌렀을 때 즉시 반응
      plane.object3D.visible = false;

      try {
        if (USE_CATCH_FETCH) {
          // ✅ 실캐치
          const res = await fetch("/catchMealForTicket.do", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brand: place?.MD_BRAND,
              store: place?.MD_STORE,
              code: place?.MD_CODE,
              seq: place?.MD_SEQ,
              userid: checkMember,
            }),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (data.proc_code === "0000") {
            markCaught(seq);
            collectedCnt += 1;
            console.log("데이터확인", data.mealSumList);
            if (data.mealSumList) setMealSumList(data.mealSumList, true);
            if (data.couponCd != null && data.couponCd.length == 16) {
              showCouponAlert();
            } else {
              handleCollect(plane, `${lang_COLLECTION_COMPLETE}`, seq);
            }
          } else if (data.proc_code === "7777") {
            markCaught(seq);
            handleCollect(plane, `${lang_TOKEN_ALREADY}`, seq, false);
          } else {
            throw new Error(`proc_code=${data.proc_code}`);
          }
        } else {
          markCaught(seq);
          collectedCnt += 1;
          handleCollect(plane, `${lang_COLLECTION_COMPLETE}`, seq);

          const remainMiniEl = document.getElementById("remainMini");
          let rmnCnt = Number(remainMiniEl.innerHTML);
          rmnCnt--;
          updateTokenUI(rmnCnt, WANT_TOKEN_COUNT, "2");
          // 필요하면 테스트용 mealSumList도 여기서 setMealSumList로 넣어도 됨
          //setMealSumList(dataTestmealSumList, true);
        }
      } catch (err) {
        console.error(err);
        alert();

        // 실패하면 롤백
        plane.object3D.visible = true;
        unmarkCaught(seq);

        showToast(`${lang_COLLECTION_FAIL}\n${lang_COLLECTION_CHECK_INTERNET}`);
      } finally {
        setTimeout(() => (isProcessing = false), 300);
      }
    };

    // 모바일 안정: click + touchstart + mousedown
    plane.addEventListener("click", onPick);
    plane.addEventListener("mousedown", onPick);
    plane.addEventListener("touchstart", onPick, { passive: false });

    scene.appendChild(plane);
  }

  // 디버그 로그: 실제 몇 개 뿌렸는지
  console.log("[spawn] wanted:", mealList.length, "radius:", radius, "minSpacing:", TOKEN_MIN_SPACING);
}

function pickPointsInCircle(count, radius, minSpacing) {
  const pts = [];
  const maxTry = count * 50;

  let tries = 0;
  while (pts.length < count && tries < maxTry) {
    tries++;
    const a = Math.random() * Math.PI * 2;
    const d = radius * Math.sqrt(Math.random());
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;

    // 기존 점과 너무 가까우면 버림
    let ok = true;
    for (const p of pts) {
      const dx = p.x - x;
      const dz = p.z - z;
      if (Math.hypot(dx, dz) < minSpacing) {
        ok = false;
        break;
      }
    }
    if (ok) pts.push({ x, z });
  }
  return pts;
}

function isCaught(seq) {
  const raw = localStorage.getItem("caughtSeqs") || "[]";
  const arr = JSON.parse(raw);
  return arr.includes(String(seq));
}

function markCaught(seq) {
  const raw = localStorage.getItem("caughtSeqs") || "[]";
  const arr = JSON.parse(raw);
  const s = String(seq);
  if (!arr.includes(s)) {
    arr.push(s);
    localStorage.setItem("caughtSeqs", JSON.stringify(arr));
  }
}

function calcRadiusByCount(count) {
  return Math.max(8, Math.sqrt(count) * 3);
}

function getCaughtSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem("caughtSeqs") || "[]"));
  } catch {
    return new Set();
  }
}
function isCaught(seq) {
  return getCaughtSet().has(String(seq));
}
function markCaught(seq) {
  const set = getCaughtSet();
  set.add(String(seq));
  localStorage.setItem("caughtSeqs", JSON.stringify([...set]));
}
function unmarkCaught(seq) {
  const set = getCaughtSet();
  set.delete(String(seq));
  localStorage.setItem("caughtSeqs", JSON.stringify([...set]));
}

function generatePoints(count, radius, minSpacing) {
  const pts = [];
  const maxTry = Math.max(5000, count * 200);

  for (let t = 0; t < maxTry && pts.length < count; t++) {
    const a = Math.random() * Math.PI * 2;
    const d = radius * Math.sqrt(Math.random());
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;

    let ok = true;
    for (const p of pts) {
      if (Math.hypot(p.x - x, p.z - z) < minSpacing) {
        ok = false;
        break;
      }
    }
    if (ok) pts.push({ x, z });
  }

  return pts;
}

function buildImgListForMeals(imgs, mealCount) {
  const imgCount = imgs.length;

  if (mealCount <= 0) return [];

  const shuffled = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  if (mealCount <= imgCount) {
    return shuffled(imgs).slice(0, mealCount);
  }

  const result = shuffled(imgs);
  const remain = mealCount - imgCount;

  for (let i = 0; i < remain; i++) {
    result.push(imgs[Math.floor(Math.random() * imgCount)]);
  }
  return result;
}

async function getMealsForSpawn() {
  const imgs = ["../AR-EX/img/token/coin_buddha_statue.png", "../AR-EX/img/token/coin_gold_bar.png", "../AR-EX/img/token/coin_money_1.png", "../AR-EX/img/token/jewel_diamond.png", "../AR-EX/img/token/people_girl_1.png", "../AR-EX/img/token/people_girl_2.png", "../AR-EX/img/token/people_girl_3.png", "../AR-EX/img/token/people_girl_4.png", "../AR-EX/img/token/people_girl_5.png", "../AR-EX/img/token/people_man_1.png", "../AR-EX/img/token/people_man_2.png", "../AR-EX/img/token/people_man_3.png", "../AR-EX/img/token/cosmetics_cream.png", "../AR-EX/img/token/cosmetics_lipstick.png", "../AR-EX/img/token/item_flower.png", "../AR-EX/img/token/car_1.png", "../AR-EX/img/token/item_skeleton.png", "../AR-EX/img/token/drink_americano.png", "../AR-EX/img/token/drink_beer.png", "../AR-EX/img/token/drink_chamisul.png", "../AR-EX/img/token/drink_champagne.png", "../AR-EX/img/token/drink_cocktail_1.png", "../AR-EX/img/token/drink_cocktail_2.png", "../AR-EX/img/token/drink_whiskey.png", "../AR-EX/img/token/drink_wine.png", "../AR-EX/img/token/food_hotdog.png", "../AR-EX/img/token/food_kimbap.png", "../AR-EX/img/token/food_macaron.png", "../AR-EX/img/token/JP_sushi.png", "../AR-EX/img/token/food_watermelon.png", "../AR-EX/img/token/ID_barong_mask.png", "../AR-EX/img/token/ID_garuda.png", "../AR-EX/img/token/IN_elephant.png", "../AR-EX/img/token/IN_lionstatue.png", "../AR-EX/img/token/TH_buddha_statue.png", "../AR-EX/img/token/TH_dragon_sculpture.png", "../AR-EX/img/token/US_route66.png", "../AR-EX/img/token/US_statue_of_liberty.png", "../AR-EX/img/token/VN_conicalhat.png"];

  if (!USE_MOCK_MEAL) {
    const mealCount = WANT_TOKEN_COUNT;
    const pickedImgs = buildImgListForMeals(imgs, mealCount);

    return Array.from({ length: mealCount }, (_, i) => ({
      MD_BRAND: "",
      MD_STORE: "",
      MD_CODE: "",
      MD_SEQ: String(i + 1),
      MH_IMG: pickedImgs[i],
    }));
  }

  const lat = typeof eventGpsx !== "undefined" && eventGpsx ? eventGpsx : 0;
  const lon = typeof eventGpsy !== "undefined" && eventGpsy ? eventGpsy : 0;

  //fetchMealCount();
  const resJson = await fetchMealList({ lat, lon, brand: cBrand, store: cStore, code: cCode });

  console.log("resJson", resJson);

  if (!Array.isArray(resJson)) return [];

  const mealCount = resJson.length;
  const pickedImgs = buildImgListForMeals(imgs, mealCount);

  return resJson.map((meal, i) => ({
    ...meal,
    MH_IMG: pickedImgs[i], // 규칙대로 배정
  }));
}

function haversineDistance(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function gpsDeltaAndStability({ prevPos, nowPos, prevTsMs, nowTsMs }) {
  const dt = (nowTsMs - prevTsMs) / 1000;

  if (!isFinite(dt) || dt < MIN_DT_SEC) {
    return { gpsStable: false, moveDeltaM: 0, reason: "dt_too_small" };
  }

  const d = haversineDistance(prevPos, nowPos);
  const speed = d / dt;

  if (d >= MAX_SINGLE_JUMP_M) {
    return { gpsStable: false, moveDeltaM: 0, reason: "jump_distance" };
  }

  if (speed > WALK_SPEED_MAX_MPS) {
    return { gpsStable: false, moveDeltaM: 0, reason: "too_fast" };
  }

  return { gpsStable: true, moveDeltaM: d, reason: "ok" };
}

function createDailyState(nowPos, nowTsMs) {
  return {
    prevPos: nowPos,
    prevTsMs: nowTsMs,
    elapsedSecToday: 0,
    moveDistTodayM: 0,
    collectedToday: 0,
    lastGpsStable: true,
  };
}

function onGpsUpdate(state, nowPos, nowTsMs) {
  const r = gpsDeltaAndStability({
    prevPos: state.prevPos,
    nowPos,
    prevTsMs: state.prevTsMs,
    nowTsMs,
  });

  const dt = (nowTsMs - state.prevTsMs) / 1000;
  if (isFinite(dt) && dt > 0) state.elapsedSecToday += dt;

  if (r.gpsStable) state.moveDistTodayM += r.moveDeltaM;

  state.prevPos = nowPos;
  state.prevTsMs = nowTsMs;
  state.lastGpsStable = r.gpsStable;

  return r;
}

function onCollect(state, count = 1) {
  state.collectedToday += count;
}

function calcWeightW({ elapsedSecToday, moveDistTodayM, collectedToday, gpsStableNow }) {
  const timeScore = clamp01(elapsedSecToday / TIME_TARGET_SEC);
  const collectScore = clamp01(1 - collectedToday / COLLECT_TARGET);

  /*  gps 오류일시 가중치 변경
	 * 
	 const moveScore = gpsStableNow
	   ? clamp01(moveDistTodayM / MOVE_TARGET_M)
	   : MOVE_NEUTRAL_SCORE; */
  const moveScore = gpsStableNow ? clamp01(moveDistTodayM / MOVE_TARGET_M) : 0.1;

  const Wraw = timeScore * WT + collectScore * WC + moveScore * WM;
  const W = Math.pow(Wraw, WEIGHT_POWER);

  return { W, Wraw, timeScore, collectScore, moveScore };
}

function fetchCount_Deterministic(state) {
  const { W } = calcWeightW({
    elapsedSecToday: state.elapsedSecToday,
    moveDistTodayM: state.moveDistTodayM,
    collectedToday: state.collectedToday,
    gpsStableNow: state.lastGpsStable,
  });

  const fetch = Math.round(MIN_TOKENS + W * (MAX_TOKENS - MIN_TOKENS));
  return clamp(fetch, 1, MAX_TOKENS);
}

function pickBucket(W) {
  for (const b of BUCKETS) {
    if (W >= b.minW && (W < b.maxW || (b.maxW === 1.0 && W <= 1.0))) return b;
  }
  return W < BUCKETS[0].maxW ? BUCKETS[0] : BUCKETS[BUCKETS.length - 1];
}

function fetchCount_Randomized(state) {
  const { W } = calcWeightW({
    elapsedSecToday: state.elapsedSecToday,
    moveDistTodayM: state.moveDistTodayM,
    collectedToday: state.collectedToday,
    gpsStableNow: state.lastGpsStable,
  });

  const b = pickBucket(W);
  const low = clamp(b.min - JITTER, 1, MAX_TOKENS);
  const high = clamp(b.max + JITTER, 1, MAX_TOKENS);

  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function closeCouponPopup() {
  document.getElementById("resultPanel").classList.remove("show");
  document.getElementById("resultTitle").classList.remove("animate-text", "boom-effect");
  document.getElementById("overlay").classList.remove("show");
  const overlay = document.getElementById("overlay");
  const video = document.getElementById("bgVideo");

  overlay.classList.remove("show");

  if (video) {
    video.pause();
    video.currentTime = 0;
  }

  document.getElementById("resultPanel").style.display = "none";
  scanningPaused = false;
  if (confettiFrameId) cancelAnimationFrame(confettiFrameId);
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderTutorialToken() {
  console.log("renderTutorialToken Start");
  document.getElementById("stampCounterWrapper").style.display = "none";
  document.getElementById("tutorialOverlay").style.display = "flex";
  document.getElementById("tutorialConfirmBtn").addEventListener("click", () => {
    document.getElementById("tutorialOverlay").style.display = "none";
    showEventNotice();
  });
  document.getElementById("tutorialStep2Confirm").addEventListener("click", () => {
    document.getElementById("tutorialOverlayStep2").style.display = "none";
    document.getElementById("stampCounterWrapper").style.display = "flex";
    showEventNotice();
  });

  const camera = document.querySelector("[camera]");
  if (!camera) {
    console.error("camera not found");
    return;
  }

  const model = document.createElement("a-entity");
  model.setAttribute("id", "ar-item-initial");

  model.setAttribute("position", "0 0 -12");

  model.setAttribute("look-at", "[camera]");

  const hitbox = document.createElement("a-box");
  hitbox.setAttribute("height", `${((dispH + dispW) / 2).toFixed(3)}`);
  hitbox.setAttribute("width", `${((dispH + dispW) / 2).toFixed(3)}`);
  hitbox.setAttribute("depth", "0.1");
  hitbox.setAttribute("material", "opacity: 0");
  hitbox.setAttribute("class", "clickable");

  const image = document.createElement("a-image");
  image.setAttribute("src", "/img/logo/logo128.png");
  image.setAttribute("height", `${dispH.toFixed(3)}`);
  image.setAttribute("width", `${dispW.toFixed(3)}`);
  console.log(image);

  hitbox.appendChild(image);
  model.appendChild(hitbox);

  model.addEventListener("click", () => {
    console.log("Initial token clicked!");
    var soundOn = true;
    if (soundOn) {
      const sound = document.getElementById("collect-sound");
      if (sound) sound.play();
    }

    const effect = document.createElement("a-entity");
    effect.setAttribute("geometry", { primitive: "sphere", radius: 0.2 });
    effect.setAttribute("material", { color: "#00ff00", opacity: 0.5 });
    effect.setAttribute("animation", {
      property: "scale",
      to: "2 2 2",
      dur: 200,
      easing: "easeOutCubic",
    });
    model.appendChild(effect);

    model.setAttribute("animation__fadeout", {
      property: "scale",
      to: "0 0 0",
      dur: 400,
      easing: "easeInOutCubic",
    });

    showToast(`${lang_COLLECTION_COMPLETE}`);

    document.getElementById("stampCounter2").textContent = "1" + document.getElementById("stampCounter2").textContent.substring(1);

    setTimeout(() => {
      const scene = document.querySelector("a-scene");
      if (scene && model.parentNode === scene) {
        scene.removeChild(model);
      }

      document.getElementById("tutorialOverlayStep2").style.display = "block";
    }, 850);
  });

  camera.appendChild(model);

  console.log("renderTutorialToken End");
}

function fitInstructionsToCard() {
  const card = document.querySelector(".arOverlayCard");
  const header = document.querySelector(".arOverlayHeader");

  const count = document.getElementById("arModalInfoCount");
  const inst = document.querySelector(".arModalContent .instructions");

  if (!card || !header || !map || !count || !inst) return;

  const cardMax = Math.floor(window.innerHeight * 0.8);

  const headerH = header.offsetHeight || 0;
  const countH = count.offsetHeight || 0;

  const extra = 50;

  const available = cardMax - headerH - countH - extra;

  inst.style.maxHeight = Math.max(90, available) + "px";
  inst.style.overflowY = "auto";
}

function connectWebSocket() {
  const wsBase = location.protocol === "https:" ? "wss://qrpay-soln.beyondt.net" : "ws://" + location.host;
  const wsUrl = `${wsBase}/websocket/token/${cpncd}`;
  webSocket = new WebSocket(wsUrl);

  webSocket.onopen = () => {
    console.log("WebSocket 연결:", wsUrl);
  };

  webSocket.onmessage = (event) => {
    try {
      console.log("event:", event);
      console.log("event.data:", event.data);
      const response = JSON.parse(event.data);
      console.log("response:", response);
      if (response.div !== "remainInfo") return;

      var webResponse;
      try {
        webResponse = JSON.parse(event.data);
      } catch (e) {
        console.error("JSON 파싱 실패:", event.data);
        return;
      }

      if (webResponse.div !== "remainInfo") return;

      var remainCnt = Number(webResponse.data?.remainCnt ?? 0);
      var totalCnt = Number(webResponse.data?.totalCnt ?? WANT_TOKEN_COUNT);

      updateTokenUI(remainCnt, totalCnt, "1");
    } catch (e) {
      console.error("WebSocket 파싱 실패:", event.data);
    }
  };

  webSocket.onerror = (e) => console.error("WS 에러", e);

  webSocket.onclose = () => {
    console.log("WS 끊김 — 재연결 시도");
    setTimeout(connectWebSocket, 2000);
  };
}

function updateTokenUI(remainCnt, totalCnt, div) {
  const prevEl = document.getElementById("remainMini");
  const prevValueNum = prevEl ? Number(prevEl.textContent) : NaN;

  const hasPrev = Number.isFinite(prevValueNum);
  const remainNum = Number(remainCnt);

  const changed = hasPrev && Number.isFinite(remainNum) && remainNum < prevValueNum;

  currentRewardCnt = remainNum;

  const totalMiniEl = document.getElementById("totalMini");
  const remainMiniEl = document.getElementById("remainMini");

  if (totalMiniEl) totalMiniEl.textContent = totalCnt;
  if (remainMiniEl) remainMiniEl.textContent = remainCnt ?? currentRewardCnt;

  if (changed || div === "2") {
    saveUserLog("TRY - 토큰 줍기");
    //playGiftSequence();
    requestAnimationFrame(() => animateChange(document.getElementById("remainMini")));
  }

  if (remainCnt == 0) playGiftSequence(() => openArModal2());
}

function animateChange(el) {
  if (!el) return;
  el.classList.remove("pop-ar");
  void el.offsetWidth; // reflow로 애니메이션 재시작
  el.classList.add("pop-ar");
}

function preloadAudio(id) {
  const audio = document.getElementById(id);
  if (!audio) return;

  audio.preload = "auto"; // none → auto
  audio.load(); // 네트워크 요청 시작
}
