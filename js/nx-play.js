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

function getRandomNXPosition() {
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

function loadNXTokens() {
  const raw = localStorage.getItem(NX_CONFIG.STORAGE_KEY + "_" + cpncd);
  return raw ? JSON.parse(raw) : [];
}

function saveNXTokens(tTokens) {
  localStorage.setItem(NX_CONFIG.STORAGE_KEY + "_" + cpncd, JSON.stringify(tTokens));
}

function loadCurrentPosition() {
  const raw = sessionStorage.getItem(NX_CONFIG.POSITION_KEY);
  return raw ? JSON.parse(raw) : "";
}

function saveCurrentPosition(pos) {
  sessionStorage.setItem(NX_CONFIG.POSITION_KEY, JSON.stringify(pos));
}

function createNXTokenEntity(token) {
  const model = document.createElement("a-entity");
  //console.log("TEST0128");
  model.setAttribute("id", `${token.id}`);
  model.setAttribute("position", `${token.pos.x} ${token.pos.y} ${token.pos.z}`);
  model.setAttribute("look-at", "[camera]");
  model.classList.add("nx-token");

  const hitbox = document.createElement("a-box");
  hitbox.setAttribute("width", `${((dispH + dispW) / 2).toFixed(3)}`);
  hitbox.setAttribute("height", `${((dispH + dispW) / 2).toFixed(3)}`);

  hitbox.setAttribute("material", "opacity: 0; transparent: true");
  //hitbox.setAttribute("material", "color: red; opacity: 0.5;");
  hitbox.setAttribute("class", "clickable");
  hitbox.setAttribute("depth", "0.5");
  hitbox.setAttribute("position", "0 0 0.05");
  //hitbox.setAttribute("look-at", "[camera]");

  const image = document.createElement("a-image");
  image.setAttribute("src", absUrl);
  image.setAttribute("width", `${dispH.toFixed(3)}`);
  image.setAttribute("height", `${dispW.toFixed(3)}`);

  hitbox.appendChild(image);
  model.appendChild(hitbox);

  const onCollect = (e) => {
    //alert("Event target: " + e.target.id);
    e.stopPropagation();

    if (model.getAttribute("data-collected")) return;
    model.setAttribute("data-collected", "true");

    console.log("NX Token clicked:", token.id);
    console.log("NX Token clicked:", token);
    fetch("/catchMeal.do", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: token.brand,
        store: token.store,
        code: token.code,
        seq: token.seq,
        userid: memberid,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          showToast(`${lang_COUPON_USE_ERROR}(${response.status})`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        console.log("data.proc_code: " + data.proc_code);
        if (data.proc_code == "0000") {
          onCollectToken(model, `${lang_COLLECTION_COMPLETE}`, token.seq);
          setMealSumList(data.mealSumList, true);
          console.log("data.couponCd:" + data.couponCd);
          colletedCnt = data.mealSumList[0].TODAY_CNT;

          if (data.couponCd != null && data.couponCd.length == 16) {
            console.log(`${lang_COUPON_ISSUED}`);
            if (!user_demo) {
              checkCoupon();
              //showCouponAlert();
              playGiftSequence(() => showCouponAlert());
            } else {
              showDemoAlert();
            }
          }
        } else if (data.proc_code == "7777") {
          onCollectToken(model, `${lang_TOKEN_ALREADY}`, token.seq, false);
        } else {
          showToast(`${lang_COLLECTION_ERROR} (${data.proc_code})`);
        }
      })
      .catch((err) => {
        console.error(err);
        showToast(`${lang_COLLECTION_FAIL}
              		  ${lang_COLLECTION_CHECK_INTERNET}`);
      })
      .finally(() => {
        setTimeout(function () {
          isProcessing = false;
        }, 500);
      });
  };

  const onCollectToken = (model, message, seq, isSound) => {
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

    mealList = mealList.filter((item) => item.MD_SEQ !== seq);
    fullMealList = fullMealList.filter((item) => item.MD_SEQ !== seq);
    let i = tokens.length;
    while (i--) {
      if (tokens[i].seq === seq) {
        tokens.splice(i, 1);
      }
    }
    saveNXTokens(tokens);
    console.log(mealList);
    console.log(fullMealList);
    console.log(tokens);
    setTimeout(() => {
      const scene = document.querySelector("a-scene");
      if (scene && model.parentNode === scene) {
        scene.removeChild(model);
      }
    }, 850);
  };

  hitbox.addEventListener("click", onCollect);

  return model;
}

function showCountdown(sec) {
  const countContainer = document.getElementById("count-container");
  const countWrapper = document.getElementById("count-wrapper");
  const countText = document.getElementById("count-text");

  countText.textContent = sec;
  countContainer.classList.remove("hidden");

  // 숫자 변경 시 살짝 튀는 효과
  countWrapper.classList.add("pulse");
  setTimeout(() => {
    countWrapper.classList.remove("pulse");
  }, 150);
}

function hideCountdown() {
  const countContainer = document.getElementById("count-container");
  countContainer.classList.add("hidden");
}

function setIntervalForNXTokens() {
  setInterval(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastFetchTime) / 1000);
    const remain = 60 - elapsed;

    // 기본적으로 숨김
    hideCountdown();

    const container = document.getElementById("guide-container");
    const isGuideVisible = container && window.getComputedStyle(container).display !== "none";
    // 카운트다운 조건
    if (isInside && tokens.length === 0 && remain > 0 && remain <= 10 && !isGuideVisible) {
      showCountdown(remain);
    } else {
      //showCountdown(remain);
    }

    if (remain <= 0 && isInside) {
      initNXTokens();
      hideCountdown();
      //lastFetchTime = now;
    }
  }, 1000); // 1초 체크
}

async function initNXTokens(div) {
  lastFetchTime = Date.now();
  //div - 1:최초로드 2:영역벗어남
  let loadedTokens = loadNXTokens();
  if (div == "1") {
    isInitNXTokens = true;
    loadedTokens.forEach((token) => {
      token.painted = false;
    });

    setIntervalForNXTokens();
  }

  // 기존 배열 비우고
  tokens.length = 0;

  if (div == "2") {
    document.querySelectorAll("a-entity[id^='nx-token-']").forEach((el) => el.remove());
    return;
  }

  // 내용만 채워 넣기
  loadedTokens.forEach((t) => tokens.push(t));
  const oldTokensLength = tokens.length;
  console.log("tokens.length:" + tokens.length);

  if (div != "1" || tokens.length == 0) {
    let count = NX_CONFIG.INIT_MIN + Math.floor(Math.random() * (NX_CONFIG.INIT_MAX - NX_CONFIG.INIT_MIN + 1));
    console.log("elapsedSec:" + elapsedSec);
    console.log("moveDist:" + moveDist);
    console.log("colletedCnt:" + colletedCnt);

    let state = {
      elapsedSecToday: elapsedSec,
      moveDistTodayM: moveDist,
      collectedToday: colletedCnt,
      gpsStableNow: true,
    };
    if (div == "1" && oldTokensLength == 0) {
      state = {
        elapsedSecToday: 300,
        moveDistTodayM: moveDist,
        collectedToday: colletedCnt,
        gpsStableNow: true,
      };
    }
    count = fetchCount_Randomized(state);
    console.log("NX_CONFIG.MAX_TOKEN:" + NX_CONFIG.MAX_TOKEN);
    console.log("oldTokensLength:" + oldTokensLength);
    const remain = Math.max(0, NX_CONFIG.MAX_TOKEN - oldTokensLength);
    count = Math.min(count, remain);
    //count = 50;

    if (count > 0) {
      const existingSeq = tokens.map((token) => token.seq);
      fullMealList = await getMealListNX(count, existingSeq);
    } else {
      fullMealList = [];
    }
    mealList = fullMealList;

    console.log(mealList);
    console.log(tokens);

    mealList.forEach((place, index) => {
      const token = new Object();
      token.id = `nx-token-${place.MD_SEQ}`;
      token.pos = getRandomNXPosition();
      token.collected = false;
      token.painted = false;
      token.createdAt = Date.now();
      token.brand = place.MD_BRAND;
      token.store = place.MD_STORE;
      token.code = place.MD_CODE;
      token.seq = place.MD_SEQ;
      tokens.push(token);
    });

    console.log(tokens);

    console.log("NX 토큰 생성:", tokens.length);
  }

  spawnNXTokens(tokens);

  saveNXTokens(tokens);
}

function spawnNXTokens(tTokens) {
  const scene = document.querySelector("a-scene");
  if (!scene) {
    console.error("scene not found");
    return;
  }

  tTokens.forEach((token) => {
    if (token.collected) return;
    if (token.painted) return;

    const entity = createNXTokenEntity(token);
    scene.appendChild(entity);

    token.painted = true;
  });
}

async function getMealListNX(limit, existingSeq = []) {
  var returnData = [];
  try {
    const response = await fetch(`/getMealListNX.do`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brand: cBrand,
        store: cStore,
        code: cCode,
        limit: limit,
        excludeSeq: existingSeq, // 중복 제외용 seq 리스트
      }),
    });
    const data = await response.json();
    returnData = data.mealList;
  } catch (e) {
    console.log(e);
  }

  return returnData;
}

function toScreenPosition(obj, camera) {
  const vector = new THREE.Vector3();
  obj.object3D.getWorldPosition(vector);

  vector.project(camera); // 3D → NDC (-1 ~ 1)

  const x = ((vector.x + 1) / 2) * window.innerWidth;
  const y = ((-vector.y + 1) / 2) * window.innerHeight;

  return { x, y, z: vector.z }; // z < 0 → 카메라 뒤
}

function getDistanceMeter(lat1, lon1, lat2, lon2) {
  console.log("lat1:" + lat1);
  console.log("lon1:" + lon1);
  console.log("lat2:" + lat2);
  console.log("lon2:" + lon2);

  const R = 6371000; // 지구 반지름 (m)
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function gpsToWorld(lat, lon, originLat, originLon) {
  const R = 6378137;
  const dLat = ((lat - originLat) * Math.PI) / 180;
  const dLon = ((lon - originLon) * Math.PI) / 180;
  const x = dLon * R * Math.cos((originLat * Math.PI) / 180);
  const z = dLat * R;
  return { x, y: 0, z };
}

function getBearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function updatePromoOverlay(pos, distance) {
  var promo = document.getElementById("promoOverlay");
  if (!showPromoOverlay()) {
    if (promo) promo.style.display = "block";
  } else {
    // ✅ startOverlay가 떠 있으면 뒤에 절대 보이면 안 됨 → 강제 숨김
    if (promo) promo.style.display = "none";
  }

  const distanceDiv = document.getElementById("promoDistance");

  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  // 거리 표시
  const distanceMeter = getDistanceMeter(lat, lng, arEventInfo.eventGpsx, arEventInfo.eventGpsy);
  distanceDiv.innerText = formatDistance(distanceMeter);
}

function hidePromoOverlay() {
  document.getElementById("promoOverlay").style.display = "none";
}

function smoothRotate(target) {
  if (lastBearing === null) {
    lastBearing = target;
    return target;
  }

  let diff = target - lastBearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  lastBearing += diff * 0.25; // 보정 강도
  return lastBearing;
}

function formatDistance(meter) {
  if (meter < 1000) {
    return `${meter.toFixed(0)}m`;
  }

  const km = meter / 1000;

  if (km >= 20) {
    return "20km+";
  }

  return `${km.toFixed(1)}km`;
}

function onPermissionNext() {
  if (isRequesting) return;

  const nm = needsMotion();

  // 1) 위치
  if (!geoOK) {
    requestGeolocation();
    return;
  }

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
  const geoState = await queryPermissionState("geolocation");
  geoOK = geoState === "granted";

  const camState = await queryPermissionState("camera");
  camOK = camState === "granted";

  motionGranted = await checkMotionGranted();

  if (geoDenied || camDenied) showBottomNotice(`${lang_RETRY_REQ}`);
  else hideBottomNotice();

  return { geoOK, camOK, motionGranted };
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
  const items = [
    { id: "markGeo", img: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.7/img/location.png", txt: lang[currentLang]["PERM_ITEM_LOCATION"] },
    { id: "markCamera", img: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.7/img/camera.png", txt: lang[currentLang]["PERM_ITEM_CAMERA"] },
  ];
  if (isIOS) {
    items.push({ id: "markMotion", img: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.7/img/motion.png", txt: lang[currentLang]["PERM_ITEM_MOTION"] });
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
  
  if (geoOK) {
    document.getElementById("markGeo")?.classList.remove("icon-grayscale");
    document.getElementById("markGeoOK")?.classList.remove("hidden");
  }
  
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

  const arKeys = ["PROMOTION_LI1", "PROMOTION_LI2", "PROMOTION_LI3", "PROMOTION_LI4", "PROMOTION_LI5", "PROMOTION_LI6"];
  arNoticeList.innerHTML = "";
  arKeys.forEach((k) => {
    const li = document.createElement("li");
    li.textContent = lang[currentLang][k];
    arNoticeList.appendChild(li);
  });

  // 토글 클릭 이벤트
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = arNoticeList.classList.toggle("open");
  });
}

function hideScreen(id) {
  document.getElementById(id).classList.add("hidden");
}

function setSuccess(id) {
  const el = document.getElementById(id);
  el.classList.remove("fail");
  el.classList.add("success");

  if (id == "mark-camera") {
    id = "markCamera";
  } else if (id == "mark-motion") {
    id = "markMotion";
  } else if ("mark-Geo"){
    id = "markGeo";
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

  if (geoOK) setSuccess("mark-geo");
  else if (geoDenied) setFail("mark-geo");
  else clearMark("mark-geo");

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
  setRowDone("row-geo", geoOK);
  setRowDone("row-camera", camOK);
  if (nm) setRowDone("row-motion", motionGranted);
  else setRowDone("row-motion", true);

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
  if (geoOK && camOK && (needsMotion() ? motionGranted : true)) {
    fMaxProgress = 100;
    setTimeout(function () {
    	document.getElementById("blankOverlay").style.display = "none";
	}, 700);
    loadEvent(true);
  } else {
    showScreen("permissionScreen");
  }
}

async function bootstrapPermissionState() {
  const geoState = await queryPermissionState("geolocation");
  if (geoState === "granted") geoOK = true;

  const camState = await queryPermissionState("camera");
  if (camState === "granted") camOK = true;
}

function requestGeolocation() {
  showPermissionLoader();
  isRequesting = true;

  navigator.geolocation.getCurrentPosition(
    async () => {
      geoOK = true;
      geoDenied = false;
      setSuccess("mark-geo");
      hideBottomNotice();
      isRequesting = false;
      await updatePermissionUI();
      hidePermissionLoader();
    },
    async (err) => {
      geoOK = false;
      geoDenied = true;
      setFail("mark-geo");
      setAuthModalText("GEO");
      let message = "";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = " (PERMISSION DENIED)";
          break;
        case err.POSITION_UNAVAILABLE:
          message = " (POSITION UNAVAILABLE)";
          break;
        case err.TIMEOUT:
          message = " (TIMEOUT)";
          break;
      }
      showBottomNotice(`${lang_RETRY_REQ}${message}`);

      isRequesting = false;
      await updatePermissionUI();
      console.error(err);
      hidePermissionLoader();
    },
    { enableHighAccuracy: true, timeout: 25000, maximumAge: 10000 },
  );

  saveUserLog("PLAY - 위치권한 버튼 클릭");
}

function detectAndroid() {
  const ua = navigator.userAgent || "";
  const uaData = navigator.userAgentData;

  const byUA = /Android/i.test(ua);

  const platform = (uaData?.platform || "").toLowerCase();
  const byUAData = platform === "android";

  return byUA || byUAData;
}

async function requestCamera() {
  if (isRequesting) return;
  showPermissionLoader();
  isRequesting = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());

    camOK = true;
    camDenied = false;
    setSuccess("mark-camera");
    hideBottomNotice();
    if (detectAndroid()) {
      loadEvent(true);
    }
  } catch (err) {
    camOK = false;
    camDenied = true;
    setFail("mark-camera");
    setAuthModalText("CAMERA");
    showBottomNotice(`${lang_RETRY_REQ}`);
    console.error(err);
  } finally {
    isRequesting = false;
    await updatePermissionUI();
    saveUserLog("PLAY - 카메라권한 버튼 클릭");
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
      } else {
        motionGranted = false;
        motionDenied = true;
        setAuthModalText("MOTION");
        setFail("mark-motion");
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
    saveUserLog("PLAY - 모션권한 버튼 클릭");
  }
}

function showBottomNotice(text) {
  document.getElementById("permNoticeText").innerText = text;
  document.getElementById("permNotice").classList.remove("hidden");
  document.getElementById("btn-next").classList.add("hidden");
  hidePermissionLoader();

  document.getElementById("arNotice").style.display = "none";
}

function hideBottomNotice() {
  document.getElementById("permNoticeText").innerText = "";
  document.getElementById("permNotice").classList.add("hidden");
  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) nextBtn.style.display = "";
  const guideDiv = document.getElementById("guideInfoBtnDiv");
  if (guideDiv) guideDiv.classList.remove("hidden");
}

function requestGeolocation_old() {
  navigator.geolocation.getCurrentPosition(
    () => {
      showScreen("cameraScreen");
    },
    (err) => {
      document.getElementById("requestGeolocationBtn").style.display = "none";

      let message = "";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = " (PERMISSION DENIED)";
          break;
        case err.POSITION_UNAVAILABLE:
          message = " (POSITION UNAVAILABLE)";
          break;
        case err.TIMEOUT:
          message = " (TIMEOUT)";
          break;
        default:
          message = "";
      }

      document.getElementById("geoMessage").innerText = `${lang_RETRY_REQ}` + message;
      console.error(err);
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0,
    },
  );
  saveUserLog("PLAY - 위치권한 버튼 클릭");
}

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
}



function requestCamera_old() {
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      stream.getTracks().forEach((track) => track.stop());

      hideScreen("cameraScreen");
      //loadEvent();
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        showScreen("motionScreen");
      } else {
        loadEvent(true);
      }
    })
    .catch((err) => {
      // 바로 거부 메시지 대신 200ms 뒤 재확인
      setTimeout(async () => {
        try {
          const status = await navigator.permissions.query({ name: "camera" });
          if (status.state === "granted") {
            hideScreen("cameraScreen");
            loadEvent(true);
          } else {
            document.getElementById("requestCameraBtn").style.display = "none";
            document.getElementById("cameraMessage").innerText = `${lang_RETRY_REQ}`;
          }
        } catch (e) {
          // permissions API 지원 안될 경우 바로 메시지
          document.getElementById("requestCameraBtn").style.display = "none";
          document.getElementById("cameraMessage").innerText = `${lang_RETRY_REQ}`;
        }
      }, 200);
    });
  saveUserLog("PLAY - 카메라권한 버튼 클릭");
}

function requestMotion_old() {
  // iOS 13 이상에서만 필요한 권한 요청
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then((response) => {
        if (response === "granted") {
          hideScreen("motionScreen");
          loadEvent(true); // 모션 센서 의존 이벤트 실행
        } else {
          document.getElementById("requestMotionBtn").style.display = "none";
          document.getElementById("motionMessage").innerText = `${lang_RETRY_REQ}`;
        }
      })
      .catch(() => {
        // 권한 요청 중 에러 발생 시
        document.getElementById("requestMotionBtn").style.display = "none";
        document.getElementById("motionMessage").innerText = `${lang_RETRY_REQ}`;
      });
  } else {
    // iOS 이외 환경: 별도 권한 요청 불필요
    hideScreen("motionScreen");
    loadEvent(true);
  }
  saveUserLog("모션센서권한 버튼 클릭");
}

async function loadEvent(isReadyEnd) {
  startPortalLottie();
  hideScreen("geoScreen");
  hideScreen("cameraScreen");
  hideScreen("motionScreen");
  console.log("isReadyEnd: " + isReadyEnd);
  console.log("arEventInfo: " + arEventInfo);
  if (isReadyEnd) {
    hideScreen("permissionScreen");
    document.getElementById("global-map").style.display = "none";
    document.getElementById("event-wrap").style.display = "none";
    saveUserLog("PLAY - AR 로딩시작");
    initAR();
    return;
  }

  try {
    //console.log("cCode: "+cCode)
    //console.log("cBrand: "+cBrand)
    //console.log("cStore: "+cStore)
    const res = await fetch("/ar-eventinfo.do?campcd=" + cCode + "&cBrand=" + cBrand + "&cStore=" + cStore);
    const data = await res.json();
    //console.log(data);

    arEventInfo = data;
    console.log("arEventInfo : ", arEventInfo);
    //arEventInfo.linkDiv = "1";

    if (arEventInfo.linkDiv == "1" && !isInitPermissionEnd) {
      isInitPermissionEnd = true;
      initPermissionFlow();
      return;
    }

    //currentPositionLoad();
  } catch (e) {
    console.log(e);
  }

  const response = await fetch("/getGoogleMapsKey.do");
  const apiKey = await response.text();
   
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=onGoogleMapsLoaded&loading=async`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  try {
    if (arEventInfo && arEventInfo.return_cd == "00000000") {
      //startPortalLottie();
      const cpnTitleEl = arEventInfo.cpnTitle || lang_COUPON;
      cpnTitle = cpnTitleEl;
      setLoadingView();
      let couponTitleEl = (arEventInfo.couponTitle || "") + "  " + (arEventInfo.couponAmt || "") + `${lang_CURRENCY_UNIT}`;
      let couponContentEl = (arEventInfo.couponContent || "").replace(/\n/g, "<br>");
      let couponContentEl2 = (arEventInfo.couponContent || "").replace(/\n/g, " ");
      eventInfoReward = couponContentEl2;
      // 기간 정보 저장
      const eventPeriod = {
        startDate: arEventInfo.eventSdate,
        startTime: arEventInfo.eventStime,
        endDate: arEventInfo.eventEdate,
        endTime: arEventInfo.eventEtime,
      };
      localStorage.setItem("eventPeriod", JSON.stringify(eventPeriod));

      var imgUrlCheck = arEventInfo.eventImg || "/img/logo/logo128.png";
      console.log("imgUrlCheck", imgUrlCheck);
      if (imgUrlCheck != "/img/logo/logo128.png") {
        imgUrlCheck = "https://view-admin.beyondt.net/uploaded?fileName=" + imgUrlCheck;
      }
      var startBoxImg2 = document.getElementById("startBoxImg");
      startBoxImg2.src = imgUrlCheck;

      // ✅ 반드시 await
      console.log("eventIsOpen()");
      const ok = await eventIsOpen();
      console.log("ok:" + ok);
      if (!ok) return;

      eventSdate = formatDate(arEventInfo.eventSdate);
      eventEdate = formatDate(arEventInfo.eventEdate);

      eventInfoDateto = formatDate(arEventInfo.eventSdate);
      eventInfoAmt = arEventInfo.couponAmt;
      currentRewardCnt = arEventInfo.eventRemainToken;
      eventInfoAmtSymbol = arEventInfo.eventAmtSymbol;
      eventInfoDatefrom = formatDate(arEventInfo.eventEdate);
      eventChangecnt = arEventInfo.eventViewMealCnt;
      eventChangeMealCnt = arEventInfo.eventViewMealCnt;
      eventGpsx = Number(arEventInfo.eventGpsx);
      eventGpsy = Number(arEventInfo.eventGpsy);
      eventInfoCount = Number(arEventInfo.eventGpsy);
      eventRadius = Number(arEventInfo.eventRadius);
      eventTotalCount = Number(arEventInfo.eventTotalCount) || 0;

      if (checkFirstCount) {
        //var total = Number(eventTotalCount) - Number(currentRewardCnt)
        updateTokenUI(currentRewardCnt, eventTotalCount, "2");
        checkFirstCount = false;
      } else {
        updateTokenUI(currentRewardCnt, eventTotalCount, "2");
      }

      if (arEventInfo.eventImg == null || arEventInfo.eventImg == "") {
        eventImg = viewAdminUrl + imgDefault;
      } else {
        eventImg = viewAdminUrl + "/uploaded?fileName=" + arEventInfo.eventImg;
      }

      var promoCornerImg = document.getElementById("promoCornerImg");
      promoCornerImg.src = eventImg;

      const address = await getAddressFromLatLng(eventGpsx, eventGpsy);
      let addrPlaceholderStr = "display: block;";
      let addrInfoStr = "display: none;";
      if (address != null && address != "") {
        addrPlaceholderStr = "display: none;";
        addrInfoStr = "display: block;";
      }
      setInfoMapNew(address, eventInfoDateto, eventInfoDatefrom, eventInfoAmt, eventInfoAmtSymbol, eventInfoReward);
      // 세션스토리지에 프로모션명 저장
      //sessionStorage.setItem("cpnTitle", arEventInfo.cpnTitle);

      if (arEventInfo.linkDiv == "1") {
        hideScreen("readyScreen");
        document.getElementById("global-map").style.display = "none";
        initAR();
        return;
      }

      // 안내창 띄우기 20251103
      //setInfoMap();
      //document.getElementById("event-wrap").style.display = "block";
      var eventDateEl = document.getElementById("event-date");
      var couponEl = document.getElementById("coupon-content");
      var addressEl = document.getElementById("addrInfo");
      var address_check = await getAddressFromLatLng(eventGpsx, eventGpsy);
      var changeNumberEl = document.getElementById("event-changenumber");

      couponEl.innerHTML = couponContentEl;

      eventDateEl.textContent = eventSdate + " ~ " + eventEdate;
      addressEl.textContent = address_check;
      changeNumberEl.textContent = eventChangecnt;
      //이곳에서 실행
    }
  } catch (e) {
    console.warn("[event] fallback used:", e);
  }
}
function setInfoMap() {
  if (typeof initMap === "function") {
    initMap(eventGpsx, eventGpsy, eventRadius, eventImg);
  }

  // 2. AR 안내 토글 영역
  const toggleBtn = document.getElementById("arNoticeToggle2");
  const arrowIcon = document.getElementById("arArrowIcon2");
  const list = document.getElementById("arNoticeList2");
  const dialogDesc = document.getElementById("dialog-desc");

  if (toggleBtn && arrowIcon && list && dialogDesc) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = list.classList.toggle("show");
      arrowIcon.classList.toggle("rotate");

      if (isOpen) {
        // 열리는 동안 스크롤 따라가기
        let animationId;
        const followScroll = () => {
          dialogDesc.scrollTo({
            top: dialogDesc.scrollHeight,
            behavior: "smooth",
          });
          animationId = requestAnimationFrame(followScroll);
        };

        followScroll();

        // transition 끝나면 스크롤 따라가기 멈춤
        list.addEventListener(
          "transitionend",
          () => {
            cancelAnimationFrame(animationId);
          },
          { once: true },
        );
      }
    });
  }

  // 3. 이벤트 날짜 / 주소 세팅 (필요 시 값 주입)
  const eventDateEl = document.getElementById("event-date");
  //const addrPlaceholder = document.getElementById("addr-placeholder");
  const addrInfo = document.getElementById("addrInfo");

  // 기존의 eventSdate, eventEdate, address 변수를 그대로 쓴다고 가정
  if (typeof eventSdate !== "undefined" && typeof eventEdate !== "undefined") {
    eventDateEl.textContent = eventSdate + " ~ " + eventEdate;
  }

  if (typeof address !== "undefined" && address) {
    // 주소가 준비되면 스켈레톤 숨기고 실제 주소 보여주기
    //addrPlaceholder.style.display = "none";
    // addrInfo.style.display = "block";
    addrInfo.textContent = address;
  }

  // 4. 확인 버튼 (기존 onConfirm)
  const confirmBtn = document.getElementById("eventConfirmBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      // swalx.onConfirm 안에 있던 로직
      if (document.getElementById("global-map")) {
        document.getElementById("global-map").style.display = "none";
      }
      document.getElementById("event-wrap").style.display = "none";
      if (typeof hideScreen === "function") {
        hideScreen("readyScreen");
      }
      if (typeof initAR === "function") {
        const loader = document.getElementById("myapp-ar-loader");
        loader.style.opacity = "1";
        loader.style.display = "flex";
        startPortalLottie();
        //initAR();
        initPermissionFlow();
      }
      saveUserLog("참여하기 버튼 클릭");
    });
  }

  // 5. 취소 버튼 (기존 onCancel)
  const cancelBtn = document.getElementById("eventCancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      if (window.history.length > 1) {
        window.history.back();
      } else if (typeof isIOS !== "undefined" && isIOS) {
        window.close();
      } else {
        window.location.href = "/";
      }
    });
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
    lottieText.innerHTML = `${lang_AR_INDEX_LODING} ... `;
  } else {
    lottieText.innerHTML = `${cpnTitle} <br> ${lang_AR_INDEX_LODING} ... `;
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

async function setAddrInfo(lat, lng) {
  console.log("setAddrInfo");
  const el = document.getElementById("addrInfo");
  el.textContent = await getAddressFromLatLng(lat, lng);
}

async function getAddressFromLatLng(lat, lng, callback) {
  console.log("getAddressFromLatLng");
  //if (typeof google === "undefined" || !google.maps) {
  if (!googleMapApiLoaded) {
    console.warn("Google Maps not loaded yet.");
    pendingGeocode = () => setAddrInfo(lat, lng);
    return "";
  }

  const geocoder = new google.maps.Geocoder();
  const latlng = { lat, lng };

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK") {
        console.log(results);
        if (results[0]) resolve(results[0].formatted_address);
        else reject("주소 결과 없음");
      } else {
        reject(`Geocoder 실패: ${status}`);
      }
    });
  });
}

function onGoogleMapsLoaded() {
  googleMapApiLoaded = true;
  if (pendingInit) {
    pendingInit();
    pendingInit = null;
  }
  if (pendingGeocode) {
    pendingGeocode();
    pendingGeocode = null;
  }
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

function initMap(lat, lng, radius, img, { fit = "width", padding = 24 } = {}) {
  if (mapInitialized) return;
  if (!googleMapApiLoaded) {
    pendingInit = () => initMap(lat, lng, radius, img, { fit, padding });
    return;
  }

  const center = new google.maps.LatLng(lat, lng);
  const mapEl = document.getElementById("global-map-new");

  function zoomForRadiusByWidth(latDeg, rMeters, widthPx, padPx) {
    const usablePx = Math.max(1, widthPx - padPx * 2);
    const metersPerPixel = (2 * rMeters) / usablePx;
    const cosLat = Math.cos((latDeg * Math.PI) / 180);
    const raw = Math.log2((156543.03392 * cosLat) / metersPerPixel);
    return Math.max(0, Math.min(22, raw));
  }
  function zoomForRadiusByHeight(latDeg, rMeters, heightPx, padPx) {
    const usablePx = Math.max(1, heightPx - padPx * 2);
    const metersPerPixel = (2 * rMeters) / usablePx;
    const cosLat = Math.cos((latDeg * Math.PI) / 180);
    const raw = Math.log2((156543.03392 * cosLat) / metersPerPixel);
    return Math.max(0, Math.min(22, raw));
  }

  function computeFinalZoom() {
    const w = mapEl.clientWidth;
    const h = mapEl.clientHeight;

    // ✅ hidden 상태면 0px일 수 있음 → 다음 프레임 재시도
    if (!w || !h) return null;

    const zWidth = zoomForRadiusByWidth(lat, radius, w, padding);
    const zHeight = zoomForRadiusByHeight(lat, radius, h, padding);
    const targetZoom = fit === "height" ? zHeight : zWidth;

    // 10% 여유
    return targetZoom + Math.log2(0.9);
  }

  function start() {
    const finalZoom = computeFinalZoom();
    if (finalZoom == null) return requestAnimationFrame(start);

    mapInitialized = true;
    mapReady = false;

    __nxFinalZoom = finalZoom; // ✅ 최종 줌 저장

    __nxMap = new google.maps.Map(mapEl, {
      center,
      zoom: finalZoom, // ✅ 처음부터 최종 줌으로 생성!
      draggable: false,
      scrollwheel: false,
      disableDoubleClickZoom: true,
      keyboardShortcuts: false,
      disableDefaultUI: true,
    });

    __nxCircle = new google.maps.Circle({
      strokeColor: "#FF3B30",
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: "#FF6347",
      fillOpacity: 0.1,
      map: __nxMap,
      center,
      radius,
    });

    // ✅ 이제 idle에서는 "줌 변경" 하지 말고 ready 판정만
    google.maps.event.addListenerOnce(__nxMap, "idle", () => {
      requestAnimationFrame(() => waitCircleFullyVisible(padding));
    });

    window.__nxReflowMap = function (padding = 24) {
      if (!__nxMap || !__nxCircle) return;
      google.maps.event.trigger(__nxMap, "resize");
      __nxMap.setCenter(__nxCircle.getCenter());
      if (__nxFinalZoom != null) __nxMap.setZoom(__nxFinalZoom);
    };
  }

  start();
}

function waitCircleFullyVisible(padding = 24) {
  const circleBounds = __nxCircle?.getBounds?.();
  const mapBounds = __nxMap?.getBounds?.();

  if (!circleBounds || !mapBounds) {
    requestAnimationFrame(() => waitCircleFullyVisible(padding));
    return;
  }

  const fullyVisible = mapBounds.contains(circleBounds.getNorthEast()) && mapBounds.contains(circleBounds.getSouthWest());

  if (fullyVisible) {
    mapReady = true;
    return;
  }

  requestAnimationFrame(() => waitCircleFullyVisible(padding));
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

function onCameraReady() {
  if (!isMarkerDataLoaded) {
    const canShowBehindUi = !showPromoOverlay();

    if (canShowBehindUi) {
      document.getElementById("gpsLoading").style.display = "flex";
      console.log("TEST0202 - onCameraReady() - show");
    } else {
      const gps = document.getElementById("gpsLoading");
      if (gps) gps.style.display = "none";
      console.log("TEST0202 - onCameraReady() - hide");
    }

    var rewardUtilCountDiv = document.getElementById("rewardUtilCount");
    if (rewardUtilCountDiv) rewardUtilCountDiv.textContent = eventChangeMealCnt;
  }

  stopPortalLottie();
}

function swalx({
  kind = "plain", // 'one' | 'two' | 'plain'
  title = "",
  message = "",
  mode = "text", // 'text' | 'html'
  confirmText = "OK",
  cancelText = null,
  allowOutsideClick = false,
  allowEscapeKey = true,
  showConfirmButton = true,
  showCloseButton = false,
  timer = null,
  onConfirm = () => {},
  onCancel = () => {},
  popupMods = [],
  onOpen = null,
  backdropColor = "rgba(0, 0, 0, 0.75)",
  popupOpacity = 1,
} = {}) {
  const baseClass = `swx ${kind === "one" ? "one" : kind === "two" ? "two" : ""}`;

  if (popupOpacity === 0) {
    popupMods.push("transparent-popup");
  }

  const opts = {
    title,
    ...(mode === "html" ? { html: message } : { text: message }),
    showConfirmButton: showConfirmButton,
    showCancelButton: kind === "two" || !!cancelText,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText || undefined,
    allowOutsideClick,
    allowEscapeKey,
    showCloseButton,
    backdrop: true,
    buttonsStyling: false, // ← 커스텀 버튼 스타일 적용을 위해 꼭 필요
    reverseButtons: kind === "two", // ← 취소 | 확인 (취소 왼쪽)
    customClass: {
      popup: [baseClass, "common-popup4", ...popupMods].join(" "),
      confirmButton: kind === "one" ? "btn-full" : kind === "two" ? "btn-yes" : "",
      cancelButton: kind === "two" ? "btn-no" : "",
      actions: kind === "two" ? "split-actions" : kind === "one" ? "fill-actions" : undefined,
    },
    didOpen: (popupEl) => {
      if (typeof onOpen === "function") {
        onOpen(popupEl);
      }
    },
    ...(backdropColor !== null ? { backdrop: backdropColor } : {}),
  };

  if (timer != null) opts.timer = timer;

  return Swal.fire(opts).then((res) => {
    if (res.isConfirmed) onConfirm(res);
    else onCancel(res);
    return res;
  });
}

/* ⚙️ 헬퍼: 기간/시간 전용 */
function swalxPeriodTime({
  title = "",
  notice = "", // 상단 한 줄 안내(옵션)
  dateLabel = "기간 :",
  timeLabel = "시간 :",
  startDate = "",
  endDate = "",
  startTime = "",
  endTime = "",
  kind = "one", // 'one' 또는 'two' 추천
  confirmText = "확인",
  cancelText = null,
  icon = null,
  onConfirm = () => {},
  onCancel = () => {},
} = {}) {
  const html = `
		    ${notice ? `<div class="content-title">${notice}</div>` : ""}
		    <div class="kv">
		      <div class="kv-label">${dateLabel}</div>
		      <div class="kv-value">${startDate} ~ ${endDate}</div>
		      <div class="kv-label">${timeLabel}</div>
		      <div class="kv-value">${startTime} ~ ${endTime}</div>
		    </div>`;
  swalx({
    kind,
    title,
    message: html,
    mode: "html",
    icon,
    confirmText,
    cancelText,
    allowOutsideClick: false,
    onConfirm,
    onCancel,
  });
}

function windowLoaded() {
  console.log("windowLoaded");
  const params = new URLSearchParams(location.search);
  const getMemberid = params.get("memberid");
  if (getMemberid) {
    memberid = getMemberid;
    localStorage.setItem("memberid", getMemberid);
    const url = new URL(location.href);
    url.searchParams.delete("memberid");
    history.replaceState(null, "", url.toString());
    checkLogin();
  }

  let cleanUrl = window.location.href.split("#")[0];
  sessionStorage.setItem("returnUrl", cleanUrl);
  //alert("returnUrl:"+sessionStorage.getItem("returnUrl")+",cleanUrl:"+cleanUrl)

  cornerGiftBtn = document.getElementById("cornerGiftBtn");
  leftPeek = document.getElementById("leftPeek");
  peekOverlay = document.getElementById("peekOverlay");
  peekCloseBtn = document.getElementById("peekCloseBtn");
  peekNoCoupon = document.getElementById("peekNoCoupon");
  peekCoupon = document.getElementById("peekCoupon");
  peekCouponText = document.getElementById("peekCouponText");
  peekLogoutBtn = document.getElementById("peekLogoutBtn");

  cornerGiftBtn.addEventListener("click", (e) => {
    // for Test
    //showCouponAlert();
    //return;
    if (isLogined) {
      e.stopPropagation();
      openPeek();
    } else {
      //showCouponCheckAlert();
      swalx({
        kind: "one",
        mode: "html",
        message: `<div style="font-weight:bold;">${lang_COUPON_CHECK_LOGIN}</div><br>`,
        confirmText: `${lang_DO_LOGIN}`,
        popupMods: ["has-badge"],
        onConfirm: () => {
          //location.replace("/login");
          saveUserLog("로그인 버튼 클릭");
          document.getElementById("loginWrap").style.display = "flex";
        },
        allowOutsideClick: true,
      });
    }
    saveUserLog("리워드 버튼 클릭");
  });

  peekOverlay.addEventListener("click", (e) => {
    if (justOpened) return;
    if (e.target !== peekOverlay) return;
    closePeek();
  });

  leftPeek.addEventListener("click", (e) => e.stopPropagation());

  peekLogoutBtn.addEventListener("click", function () {
    //showLogoutConfirm();
    swalx({
      kind: "two",
      mode: "html",
      message: `<div style="font-weight:bold;">${lang_DO_LOGOUT}</div>`,
      confirmText: `${lang_YES}`,
      cancelText: `${lang_NO}`,
      onConfirm: logout,
    });
  });

  // for Test
  /* setMemberid();
           getUserMeal();
           checkLogin();
           checkCoupon(); */

  document.getElementById("useCouponBtn").addEventListener("click", () => {
    closeCouponPopup();
    if (isLogined) {
      openPeek();
    } else {
      //showCouponCreatedAlert();

      swalx({
        kind: "one",
        mode: "html",
        message: `<div style="font-weight:bold;">${lang_COUPON_CHECK_LOGIN}</div><br>`,
        confirmText: `${lang_DO_LOGIN}`,
        popupMods: ["has-badge"],
        onConfirm: () => {
          //location.replace("/login");
          document.getElementById("loginWrap").style.display = "flex";
        },
        allowOutsideClick: true,
      });
    }
  });

  document.getElementById("confirmBtn").addEventListener("click", () => {
    closeCouponPopup();
  });

  document.getElementById("loginWrapCloseBtn").addEventListener("click", () => {
    document.getElementById("loginWrap").style.display = "none";
  });
}

//ISOPEN 제어
function showWrongUrlPopup() {
  Swal.fire({
    title: `잘못된 접근입니다.`,
    icon: "warning",
    confirmButtonText: `${lang_CHECK}`,
    customClass: {
      popup: "common-popup",
      confirmButton: "custom-confirm-btn",
    },
  }).then(() => {
    location.href = "/AR-VIEW/?cpncd=" + cpncd;
  });
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

function closeCouponPopup() {
  document.getElementById("resultPanel").classList.remove("show");
  document.getElementById("resultTitle").classList.remove("animate-text", "boom-effect");
  document.getElementById("overlay").classList.remove("show");
  //const overlay = document.getElementById("overlay");
  //const video = document.getElementById("bgVideo");

  //overlay.classList.remove("show");

  //if (video) {
  //  video.pause();
  //  video.currentTime = 0; // 항상 처음으로 리셋
  //}

  document.getElementById("resultPanel").style.display = "none";
  scanningPaused = false;
  if (confettiFrameId) cancelAnimationFrame(confettiFrameId);
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function checkLogin() {
  const res = await fetch(`/getUser.do?id=${memberid}`);
  //const res = await fetch(`/getUser.do?id=${23e23262-ec28-4446-b2a8-b3292d051732}`);
  const resJson = await res.json();
  if (resJson != null && resJson.user != null) {
    isLogined = true;
  }
}

async function checkCoupon() {
  //memberid="23e23262-ec28-4446-b2a8-b3292d051732"
  const res = await fetch(`/selectUserCouponList.do?id=${memberid}&cBrand=${cBrand}&cStore=${cStore}`);
  const resJson = await res.json();
  console.log("쿠폰 가져오는 결과확인 resJson", resJson);
  userCouponList = Array.isArray(resJson.userCouponList) ? resJson.userCouponList : [];
  if (!user_demo) {
    //cornerGiftBtn.style.display = "inline-flex";
  }

  if (userCouponList.length > 0) {
    cornerGiftBtn.classList.add("has-coupon");
  } else {
    cornerGiftBtn.classList.remove("has-coupon");
  }
}

function closePeek() {
  // 슬라이드 아웃
  scanningPaused = false;
  leftPeek.classList.remove("open");
  peekOverlay.classList.remove("show");
  // 전환이 끝나면 가시성만 해제 (DOM 유지)
  const onEnd = (e) => {
    if (e.propertyName === "transform") {
      leftPeek.classList.remove("is-visible");
      leftPeek.setAttribute("aria-hidden", "true");
      leftPeek.removeEventListener("transitionend", onEnd);
    }
  };
  leftPeek.addEventListener("transitionend", onEnd);
}

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

function openPeek() {
  refreshMyCoupons();
  getMemberid();

  leftPeek.classList.add("is-visible"); // <- 새 클래스 (CSS에 추가)
  leftPeek.setAttribute("aria-hidden", "false");
  peekOverlay.classList.add("show");

  requestAnimationFrame(() => {
    leftPeek.classList.add("open"); // transform: translateX(0)
  });

  justOpened = true;
  setTimeout(() => {
    justOpened = false;
  }, 180);
  scanningPaused = true;
}

async function refreshMyCoupons() {
  if (DEV_LOCAL) {
    const list = JSON.parse(localStorage.getItem("myCoupons") || "[]");
    renderCouponList(list);
    return;
  }

  try {
    const res = await fetch(`/selectUserCouponList.do?id=${memberid}&cBrand=${cBrand}&cStore=${cStore}`);
    const resJson = await res.json();
    renderCouponList(Array.isArray(resJson.userCouponList) ? resJson.userCouponList : []);
  } catch (e) {
    console.error("refreshMyCoupons error", e);
    renderCouponList([]);
  }
}
async function getMemberid() {
  try {
    const res2 = await fetch(`/getMemberId.do?id=${memberid}`);
    const resJson2 = await res2.json();
    console.log("resJson2", resJson2);
    // 이름 / 이메일 표시
    document.getElementById("user-name").textContent = resJson2.MU_NAME || "";
    document.getElementById("user-email").textContent = resJson2.MU_MAIL || `${lang_EMAIL_NOT}`;

    const iconBox = document.getElementById("userIcon");

    iconBox.className = "user-icon";

    const soc = String(resJson2.MU_SOCDIV || "");
    localStorage.setItem("SOCDIV", soc);
    // 아이콘 표시 (5종류 중 하나)
    const iconMap = {
      1: { src: "/img/logo/Google.png", alt: "Google" },
      3: { src: "/img/logo/Facebook.png", alt: "Facebook" },
      5: { src: "/img/logo/Kakao.png", alt: "Kakao" },
      6: { src: "/img/logo/Line.png", alt: "Line" },
    };

    const icon = iconMap[soc];
    iconBox.innerHTML = `<img src="${icon.src}" alt="${icon.alt}" />`;
  } catch (e) {
    console.error("memberid error", e);
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

function renderCouponList(list) {
  const listEl = document.getElementById("couponList");
  const emptyEl = document.getElementById("peekNoCoupon");
  const couponEl = document.getElementById("peekCoupon");
  if (!list.length) {
    listEl.style.display = "none";
    emptyEl.style.display = "block";
    return;
  }
  emptyEl.style.display = "none";
  couponEl.style.display = "block";
  listEl.style.display = "block";

  listEl.innerHTML = list
    .map((c, i) => {
      //console.log(c);

      c.mc_name = c.MC_NAME;
      c.mc_type = c.MC_TYPE;
      c.mc_div = c.MC_DIV;
      c.mc_amt = c.MC_AMT;
      c.mc_sdate = ` ${formatDate(c.MC_SDATE)}`;
      c.mc_edate = ` ${formatDate(c.MC_EDATE)}`;
      c.coupon_sid = c.MU_UNIQUE;
      c.coupon_no = c.MU_UNIQUE.replace(/(\d{4})(?=\d)/g, "$1-");
      c.mc_indt = c.MU_INDT;
      c.mc_cpnName = c.MH_NAME || "";
      c.mc_couponContent = c.MC_CONTENT;

      if (c.MC_LINK_DIV == "1") {
        if (c.MC_AMT != 0 && c.MC_CURRENCY != null) {
          c.mc_couponContent = c.MC_AMT + " " + c.MC_CURRENCY;
        }
      }

      const title = c.mc_name || `${lang_COUPON}`;
      const t = c.mc_type || "";
      const d = c.mc_div || "";
      const amt = c.mc_amt;
      const sdate = c.mc_sdate || c.mc_sdatem || "";
      const edate = c.mc_edate || "";
      //const period = [sdate, edate].filter(Boolean).join(" ~ ");
      const period = c.mc_sdate + " ~ " + c.mc_edate || "";
      const sid = c.coupon_sid || c.MP_CPN_SID || "";
      const no = c.coupon_no || c.MP_CPN_NO || "";
      const couponContent = c.mc_couponContent || "";
      const theme = c.MU_USEYN === "Y" ? "unused" : "used";
      const couponPw = c.MC_COUPON_USE_PW || "";
      const couponPwyn = couponPw == "" ? "N" : "Y";
      const eventName = c.mc_name;
      const dateonly = formatDateOnly(c.MC_UPDT);
      const timeonly = formatTimeOnly(c.MC_UPDT);
      const linkdiv = c.MC_LINK_DIV;
      const currency = c.MC_CURRENCY;
      const t9code = c.MH_T9_CODE || "";
      // 혜택 텍스트
      let benefit = t || `${lang_COUPON_BENEFIT}`;
      if (t == "1") {
        if (d == "2") benefit = `${lang_COUPON_DISCOUNT} ${amt}%`;
        else if (amt) benefit = `${lang_COUPON_DISCOUNT} ${Number(amt).toLocaleString("ko-KR")} ${lang_CURRENCY_UNIT}`;
      } else if (t == "2") {
        benefit = `${lang_COUPON_EXCHANGE}`;
      }
      const variant = t == "2" ? "is-exchange" : "is-discount";
      const rewardsUseyn = theme == "unused" ? "" : `${dateonly} <br> ${timeonly}`;
      return `
            <div class="ticket ticket--${theme} ${variant}" data-sid="${sid}" data-period="${period}" data-theme="${theme}" data-currency="${currency}" data-linkdiv="${linkdiv}" data-couponcontent="${couponContent}" data-no="${no}" data-couponpw="${couponPwyn}" data-eventname="${eventName}" data-t9code="${t9code}">
            <div class="click-model">
              <div class="coupon-title">${no}</div>
              <div class="coupon-meta">${period}</div>
              <div class="coupon-content">${c.mc_couponContent}</div>
              <div class="ticket__stub" role="button" tabindex="0" aria-label="${lang_COUPON_USE}">
                <span class="ticket__use">${rewardsUseyn}</span>
              </div>
              </div>
            </div>
          `;
    })
    .join("");

  // 스텁 클릭 → QR 모달
  listEl.querySelectorAll(".ticket").forEach((card) => {
    const themeYN = card.dataset.theme || "";
    const stub = card.querySelector(".click-model");
    if (themeYN == "used") {
      return;
    }
    stub.addEventListener("click", () => {
      const couponSid = card.dataset.sid || "";
      const couponNo = card.dataset.no || "";
      let couponContent = card.dataset.couponcontent || "";
      const period = card.dataset.period || "";
      const couponPw = card.dataset.couponpw || "";
      let eventName = card.dataset.eventname || "";
      const linkDiv = card.dataset.linkdiv || "";
      const t9Code = card.dataset.t9code || "";

      const title = card.querySelector(".coupon-title")?.textContent || `${lang_COUPON}`;
      sessionStorage.setItem("couponSid", couponSid);
      sessionStorage.setItem("couponNumber", couponNo);
      //updateGiftIndicator();

      if (linkDiv == "1") {
        eventName = `${lang_KLINE_COUPON_NM}`;
        console.log(card.dataset);
        couponContent = `${lang_KLINE_COUPON_DETAIL1}${card.dataset.couponcontent}${lang_KLINE_COUPON_DETAIL2}`;
      }
      console.log("t9Code:" + t9Code);
      showCouponQR({ no: couponNo, sid: couponSid, couponContent: couponContent, period: period, name: title, couponPw: couponPw, eventName: eventName, linkDiv: linkDiv, t9Code: t9Code });
    });
    // 접근성: 엔터키로도 실행
    stub.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        stub.click();
      }
    });
  });
}
function showCouponQR({ no, sid, couponContent, period, name, couponPw, eventName, linkDiv, t9Code }) {
  const safeName = (name || `${lang_COUPON}`).replace(/[<>]/g, "");
  const needsTwo = couponPw === "Y";
  const linkDivTwo = linkDiv == "1";
  const twoButtons = needsTwo || linkDivTwo;
  const confirmLabel = linkDivTwo ? `${lang_OPEN_LINK}` : needsTwo ? `${lang_COUPON_USE}` : `${lang_CLOSE}`;
  const edithtml = linkDivTwo
    ? `<div>
               	 <div class="event-title" style="text-align:left; font-weight:750; margin:0 0 15px; font-size:16px;">${eventName}</div>
               	 <div class="rewards-content2">${couponContent.replace(/\n/g, "<br>")}</div>
               	<div class="event-title" style="text-align:left; font-weight:750; margin:10px 0 10px; font-size:16px;">${lang_OPEN_LINK_TITLE}</div>
                     
                       <div class="rewards-content3" style="display:flex; align-items:center; justify-content: center; gap:6px; margin: 5px 0px 5px 0px;">
                       	<span id="couponCode" style="font-size:13px; margin:7px 0px 3px 0px; font-weight:bold;">${no}</span>
                       <button id="copyBtn" style="border:none; background:none; cursor:pointer; padding:0; align-items: center;justify-content: center; margin-top: 5px;">
                          <img src="/img/copy.svg" style="width:18px; height:18px;" alt="${lang_COPY}">
                        </button>
                     	</div>
                     	<div style="display:flex; flex-direction:column; align-items:center;">
                     	<img src="https://k-line.ddukintl.com/images/logo/k_Line_logo.png" alt="K-Line" style="margin-top: 20px; width: 80px; height: auto;"/>
                     	<div class="coupon-infomation2">${lang_GO_KLINE_COUPON}</div>
            </div></div>`
    : `<div>
                	 <div class="event-title" style="text-align:left; font-weight:750; margin:0 0 15px; font-size:16px;">${eventName}</div>
                	 <div class="rewards-content">${couponContent.replace(/\n/g, "<br>")}</div>
                      <div style="display:flex; flex-direction:column; align-items:center;">
                      <div class="rewards-QRimg">
                        <canvas id="qrModalCanvas" style="background:#fff; width:100%; height:100%"></canvas>
             		 </div>
                        <div style="display:flex; align-items:center; gap:6px; margin: 12px 0px 15px 0px;">
                        	<span id="couponCode" style="font-size:16px; margin:7px 0px 3px 0px; font-weight:bold;">${no}</span>
                          <button id="copyBtn" style="border:none; background:none; cursor:pointer; padding:0; align-items: center;justify-content: center; margin-top: 5px;">
                           <img src="/img/copy.svg" style="width:18px; height:18px;" alt="${lang_COPY}">
                         </button>
                      	</div>
                      	${couponPw == "N" ? `<div class="coupon-infomation">${lang_CHECK_QRCODE_EMPLOYEE}</div>` : `<div class="coupon-infomation">${lang_CHECK_QRCODE_USE}</div>`}
              </div></div> `;
  //console.log("edithtml", edithtml);
  Swal.fire({
    html: edithtml,
    showCancelButton: twoButtons, // 두 개 버튼일 때만 취소버튼 생성
    confirmButtonText: confirmLabel,
    cancelButtonText: twoButtons ? `${lang_CLOSE}` : undefined,
    customClass: {
      popup: `common-popup2 swx ${twoButtons ? "two" : "one"} ${linkDivTwo ? "common-popup20" : ""}`,
      confirmButton: twoButtons ? "btn-yes" : "btn-full",
      cancelButton: twoButtons ? "btn-no" : undefined,
      actions: twoButtons ? "split-actions" : "fill-actions",
    },
    buttonsStyling: false,
    allowEscapeKey: true,
    heightAuto: false,
    scrollbarPadding: false,
    willOpen: () => {
      document.body.classList.add("qr-only-hide-sheet");
    },
    didClose: () => {
      document.body.classList.remove("qr-only-hide-sheet");
      // 쿠폰 창 닫으면 T9에서 조회 불가
      couponActiveForT9(no, "N", t9Code);
    },
    didOpen: () => {
      const canvas = document.getElementById("qrModalCanvas");
      new QRious({ element: canvas, value: sid, size: 210, level: "H" });

      const copyBtn = document.getElementById("copyBtn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          const plainCode = no.replace(/-/g, ""); // - 제거
          navigator.clipboard.writeText(plainCode).then(() => {
            Swal.fire({
              toast: true,
              position: "bottom", // 아래쪽 중앙
              backdrop: false, // 투명 장막 제거
              icon: "success",
              title: `${lang_COUPON_NOCOPY}`,
              showConfirmButton: false,
              timer: 1500,
              customClass: {
                popup: "coupon-toast",
              },
            });
          });
        });
      }

      const buttons = document.querySelectorAll(".swal2-popup button");
      console.log(buttons);
      buttons.forEach((btn) => {
        btn.style.setProperty("font-family", fontStack, "important");
      });

      // 쿠폰 창 열면 T9에서 조회 가능하도록
      couponActiveForT9(no, "Y", t9Code);
    },
  }).then((res) => {
    if (!res.isConfirmed) return;

    if (linkDivTwo) {
      const couponNumberCd = no.replace(/-/g, "");
      handleBuyNow(couponNumberCd);
    } else if (needsTwo) {
      openPinModal({ couponName: safeName, couponNo: no, couponSid: sid });
    }
  });
}

function openPinModal({ couponName, couponNo, couponSid }) {
  const wrap = document.getElementById("pinModal");
  //if (!wrap) { console.warn('pinModal가 없습니다. HTML 삽입 확인'); return; }
  wrap.classList.add("show");
  wrap.setAttribute("aria-hidden", "false");
  const titleEl = document.getElementById("pinCouponTitle");
  if (titleEl) titleEl.textContent = couponName || `${lang_COUPON}`;

  const pad = document.getElementById("pinPad");
  pad.innerHTML = "";

  [1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "back"].forEach((v) => {
    const isSpacer = v === "";
    const el = document.createElement(isSpacer ? "div" : "button");

    if (isSpacer) {
      pad.appendChild(el);
      return;
    }

    el.className = "key" + (v === "back" ? " back" : "");

    if (v === "back") {
      el.dataset.action = "back";
      el.innerHTML = `<img src="../../img/key_delete.svg" alt="${lang_DELETE}" style="width:35px; height:35px;" />`;
    } else {
      el.dataset.key = String(v); // 여기서 0도 정상 처리
      el.textContent = String(v);
    }

    pad.appendChild(el);
  });

  __pinArr = [];
  __submitting = false;
  renderPinBoxes();

  pad.onclick = (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement) || __submitting) return;

    const key = t.getAttribute("data-key");
    const act = t.getAttribute("data-action");

    if (key) {
      if (__pinArr.length < 4) {
        __pinArr.push(key);
        renderPinBoxes();
        maybeSubmit({ couponNo, couponSid });
      }
    } else if (act === "back") {
      __pinArr.pop();
      renderPinBoxes();
    }
  };

  wrap.onkeydown = (e) => {
    if (__submitting) return;
    if (/^[0-9]$/.test(e.key)) {
      if (__pinArr.length < 4) {
        __pinArr.push(e.key);
        renderPinBoxes();
        maybeSubmit({ couponNo, couponSid });
      }
    } else if (e.key === "Backspace") {
      __pinArr.pop();
      renderPinBoxes();
    } else if (e.key === "Escape") {
      closePinModal();
    }
  };
}

function handleBuyNow(couponNumberCd) {
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isMac = /macintosh|mac os x/i.test(ua);
  const couponNumber = couponNumberCd; // 전달받은 쿠폰번호

  // 👇 쿠폰번호를 쿼리스트링으로 포함시킬 수 있습니다.
  const appUrl = "https://ulink.ddukintl.com/coupon/ios/" + couponNumber;
  const androidUrl = "intent://coupon_add?coupon=" + couponNumber + "#Intent;scheme=klineapp;package=com.wow.koupang;end";
  const storeUrl = isAndroid ? "market://details?id=com.wow.koupang" : "itms-apps://itunes.apple.com/app/id6747570134";

  if (isAndroid) {
    console.log("확인1", androidUrl);
    window.location.href = androidUrl;
    setTimeout(() => (window.location.href = storeUrl), 1200);
  } else if (isIOS) {
    console.log("확인2", androidUrl);
    window.location.href = appUrl;
    setTimeout(() => (window.location.href = storeUrl), 1200);
  } else if (isMac) {
    window.location.href = storeUrl;
  } else {
    window.location.href = "https://play.google.com/store/apps/details?id=com.wow.koupang";
  }
}

function renderPinBoxes() {
  const boxes = document.querySelectorAll("#pinBoxes .pin-box");
  boxes.forEach((b, i) => {
    b.textContent = __pinArr[i] ? "•" : "";
    b.classList.toggle("filled", !!__pinArr[i]);
  });
}

// 4자리 되면 살짝 딜레이 후 제출
function maybeSubmit({ couponNo, couponSid }) {
  if (__pinArr.length !== 4 || __submitting) return;
  // 마지막 점(•)이 보이도록 아주 짧게 기다림
  setTimeout(() => submitPin({ couponNo, couponSid }), 80);
}

async function submitPin({ couponNo, couponSid }) {
  if (__submitting) return;
  __submitting = true;

  const pin = __pinArr.join("");
  try {
    //관리자 번호 API를 통해 확인하는 곳
    const res = await fetch("/couponUse.do", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponSid, pin, cBrand, cStore }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok || data?.proc_code !== "0000") {
      console.error("PROC_CODE:", data?.proc_code);
      throw new Error(data?.message || `${lang_CODE_INCORRECT}`);
    }

    closePinModal();
    Swal.fire({ toast: true, position: "bottom", backdrop: false, icon: "success", title: `${lang_COUPON_USE_PROCESSING}`, showConfirmButton: false, timer: 1500 });

    refreshMyCoupons();
    // refreshMyCoupons?.();
  } catch (err) {
    const card = document.querySelector("#pinModal .modal-card");
    card?.classList.add("shake");
    setTimeout(() => card?.classList.remove("shake"), 450);

    // 실패 시 초기화(다시 입력받게)
    __pinArr = [];
    __submitting = false;
    renderPinBoxes();

    //Swal.fire({ toast: true, position: "bottom", backdrop: false, icon: "error", title: err.message || `${lang_COUPON_USE_ERROR}`, showConfirmButton: false, timer: 1600 });
  }
}

function closePinModal() {
  const wrap = document.getElementById("pinModal");
  wrap.classList.remove("show");
  wrap.setAttribute("aria-hidden", "true");
  scanningPaused = false;
  __pinArr = [];
  __submitting = false;
}

function logout() {
  fetch("/logout.do", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: memberid }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("로그아웃 결과:", data);
      // 로컬 스토리지 초기화
      localStorage.removeItem("memberid");
      // 페이지 새로고침
      location.reload();
    })
    .catch((err) => {
      console.error("로그아웃 실패:", err);
      localStorage.removeItem("memberid");
      location.reload();
    });
}

function showCouponCreatedAlert() {
  Swal.fire({
    title: `${lang_COUPON_ISSUANCE_COMPLETE}`,
    text: `${lang_COUPON_USE_LOGIN}`,
    icon: "info",
    confirmButtonText: `${lang_DO_LOGIN}`,
    customClass: {
      popup: "common-popup",
      confirmButton: "custom-confirm-btn",
    },
  }).then(() => {
    //location.replace("/login");
    document.getElementById("loginWrap").style.display = "flex";
  });
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
    var checkGmeal = mealSumList[0].SU_GMEAL;
    if (checkGmeal === 0) {
      forceHideBackOverlays();
      const overlay = document.getElementById("startOverlay");
      overlay.classList.remove("hidden");
      overlay.style.display = "flex";
      decideGateAndRender();
      applyGateState();
    }

    updateTokenUI(currentRewardCnt, eventTotalCount, "2");

    var rewardUtilCount = Number(viewMealCnt) - Number(ameal);
    console.log("viewMealCnt", viewMealCnt);
    console.log("ameal", ameal);
    console.log("rewardUtilCount", rewardUtilCount);

    if (rewardUtilCountDiv) {
      if (rewardUtilCountDiv) rewardUtilCountDiv.textContent = rewardUtilCount;
    }
    var rewardUtilCount = Number(viewMealCnt) - Number(ameal);

    if (rewardUtilCountDiv) rewardUtilCountDiv.textContent = rewardUtilCount ?? eventChangeMealCnt;

    stampCounterWrapper.style.display = "flex";
    stampTotalCounterWrapper.style.display = "flex";

    console.log(`viewMealCnt: ${viewMealCnt}`);
    console.log(`ameal: ${ameal}`);
  } else {
    checkChangemeal();
  }

  if (isAni) {
    stampCounter.classList.remove("pulse-effect");
    void stampCounter.offsetWidth;
    stampCounter.classList.add("pulse-effect");
  }
}
async function checkChangemeal() {
  const res = await fetch(`/getUserMeal2.do?userid=${memberid}&brand=${cBrand}&store=${cStore}&code=${cCode}`);
  //const res = await fetch(`/getUser.do?id=${23e23262-ec28-4446-b2a8-b3292d051732}`);
  const resJson = await res.json();
  const stampCounterWrapper = document.getElementById("stampCounterWrapper");
  const stampCounter = document.getElementById("stampCounter");
  const rewardUtilEl = document.getElementById("rewardUtilCount");
  console.log(resJson.mealSumList2);
  viewMealCnt = resJson.mealSumList2[0].MH_VIEW_MEAL_CNT;
  updateTokenUI(currentRewardCnt, eventTotalCount, "2");
  if (rewardUtilEl) rewardUtilEl.textContent = viewMealCnt ?? eventChangeMealCnt;

  stampCounterWrapper.style.display = "flex";
}

function getUserMeal() {
  if (!memberid) return;

  fetch(`/getUserMeal.do?userid=${memberid}&brand=${cBrand}&store=${cStore}&code=${cCode}`)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      setMealSumList(data.mealSumList);
      colletedCnt = data.mealSumList[0].TODAY_CNT;
      console.log("colletedCnt:" + colletedCnt);
    });
}

function startPortalLottie() {
  // 이미 실행 중이면 중복 생성 방지
  console.log("startPortalLottie");
  console.log(portalAnim);
  if (portalAnim) {
    portalAnim.play();
    return;
  }
  var loader = document.getElementById("myapp-ar-loader");
  loader.style.display = "flex";

  portalAnim = lottie.loadAnimation({
    container: document.getElementById("lottie-portal"), // 대상 div
    renderer: "svg",
    loop: false, // 🔁 필요에 따라 true/false
    autoplay: true, // 페이지 진입 시 자동재생
    path: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.7/lottie/portal_ntokozo.json",
  });
}

function stopPortalLottie(isForce) {
  console.log("stopPortalLottie");
  // for Test
  //return;
  if (isForce == null || !isForce) {
    if (!isCameraLoaded) return;
  }

  if (isForce) {
    saveUserLog("PLAY - 로딩 종료");
  } else {
    saveUserLog("PLAY - 로딩 종료");
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
      var totalCnt = Number(webResponse.data?.totalCnt ?? 0);

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
  if (remainMiniEl) remainMiniEl.textContent = remainCnt ?? "-";

  if (changed || div === "2") {
    requestAnimationFrame(() => animateChange(document.getElementById("remainMini")));
  }
  if (remainCnt == 0 || remainCnt == "0") {
    console.log("확인1234", remainCnt);
    //openPromEndOverlay();
    openPromEndOverlay2();
  }
}

function animateChange(el) {
  if (!el) return;
  el.classList.remove("pop-ar");
  void el.offsetWidth;
  el.classList.add("pop-ar");
}

function initAR() {
  console.log("initAR");
  setMemberid();
  getUserMeal();
  checkLogin();
  checkCoupon();
  connectWebSocket();

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
  arScene.setAttribute("touch-action", "none");

  const camera = document.createElement("a-entity");
  camera.setAttribute("camera", "fov: 40;");
  camera.setAttribute("id", "main-camera");
  camera.setAttribute("rotation-reader", "");
  camera.setAttribute("cursor", "rayOrigin: mouse;");
  camera.setAttribute("raycaster", "objects: .clickable; far: 1000; interval: 0");
  camera.setAttribute("look-controls", "touchEnabled: false; mouseEnabled: false;");
  camera.setAttribute("promo-arrow", "targetLat: 37.12345; targetLon: 127.56789; originLat: 37.12300; originLon: 127.56700");

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
  setTimeout(() => {}, 1000);
  currentPositionLoad();
}

function currentPositionLoad() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentPositionLoaded(pos);
    },
    (err) => {
      console.error(err);

      const pos = loadCurrentPosition();
      try {
        const testLat = pos.coords.latitude;
        if (pos) {
          currentPositionLoaded(pos);
        } else {
          currentPositionLoad();
        }
      } catch (e) {
        console.error(e);
        currentPositionLoad();
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 30000,
    },
  );
}

function handleOrientation(event) {
  if (event.webkitCompassHeading) {
    compassHeading = event.webkitCompassHeading;
  } else {
    // 안드로이드 등에서는 alpha 값을 사용 (보정이 필요할 수 있음)
    compassHeading = 360 - event.alpha;
  }
}

function currentPositionLoaded(pos) {
  if (arEventInfo == null) {
    setTimeout(function () {
      currentPositionLoaded(pos);
    }, 1000);
    return;
  }

  originLatPos = pos.coords.latitude;
  originLonPos = pos.coords.longitude;

  if (isIOS) {
    window.addEventListener("deviceorientation", handleOrientation);
  } else {
    window.addEventListener("deviceorientationabsolute", handleOrientation);
  }

  gpsLoaded = true;
  updateProgress("gps");
  saveCurrentPosition(pos);
  decideGateAndRender();
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  console.log(arEventInfo);
  const imgUrl = arEventInfo.eventImg || "/img/logo/logo128.png";
  absUrl = imgUrl;

  if (absUrl != "/img/logo/logo128.png") {
    absUrl = "https://view-admin.beyondt.net/uploaded?fileName=" + imgUrl;
  }

  dispW = IMG_MAX_SIZE;
  dispH = IMG_MAX_SIZE;

  tokenImgLoad();

  console.log("gpsLoading !!!!");
  isMarkerDataLoaded = true;
  updateProgress("markerData");
  document.getElementById("gpsLoading").style.display = "none";
  console.log("TEST0202 - currentPositionLoaded(pos): hide");

  saveUserLog("PLAY - 마커 로딩 완료");
}

function tokenImgLoad() {
  const img = new Image();
  img.src = absUrl;
  //img.crossOrigin = "anonymous";

  img.onload = function () {
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    console.log("img.onload");

    if (w >= h) {
      // 가로가 더 길거나 정사각형 → width = 2, height = 2 * (h/w)
      dispH = IMG_MAX_SIZE;
      dispW = +(IMG_MAX_SIZE * (h / w)).toFixed(3);
    } else {
      // 세로가 더 김 → height = 2, width = 2 * (w/h)
      dispW = IMG_MAX_SIZE;
      dispH = +(IMG_MAX_SIZE * (w / h)).toFixed(3);
    }

    // 이제 여기서부터 루프 실행: dispW/dispH 사용
    const PADDING = 0.2;

    if (isTutorial()) {
      renderTutorialToken();
    } else {
      checkAndInitNXTokens();
    }

    isTokenImgLoaded = true;
  };

  img.onerror = function () {
    console.error("이미지 로드 실패:", img.src);
    console.log("img.onerror");

    setTimeout(function () {
      tokenImgLoad();
    }, 1000);
  };
}

function checkAndInitNXTokens() {
  const pos = loadCurrentPosition();
  console.log(pos);
  console.log(arEventInfo);
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const distance = getDistanceMeter(lat, lng, arEventInfo.eventGpsx, arEventInfo.eventGpsy);
  console.log("현재 거리(m):", distance);
  if (distance > arEventInfo.eventRadius) {
    isInside = false;
    //alert("프로모션 지역 밖입니다");

    updatePromoOverlay(pos, distance);
  } else {
    isInside = true;
    initNXTokens("1");
  }
  watchNXPosition();
}

function onLocationUpdate(lat, lon, accuracy) {
  if (accuracy > 20) return; // GPS 불량 컷
  if (!lastPos) {
    return;
  }

  const dist = haversine(lastPos.lat, lastPos.lon, lat, lon);

  // 순간 이동 필터
  if (dist > 30) return; // 1 tick에 30m 이상 무시

  moveDist += dist;
}

function updateZone(pos, distance) {
  console.log("distance:" + distance);
  console.log("isInside:" + isInside);
  console.log("outCount:" + outCount);
  if (distance <= arEventInfo.eventRadius) {
    inCount++;
    outCount = 0;

    if (!isInside && inCount >= REQUIRED_COUNT) {
      isInside = true;
      console.log("프로모션 지역 진입 확정");
      if (isInitNXTokens) initNXTokens();
      else initNXTokens("1");

      hidePromoOverlay();
    }
  } else {
    outCount++;
    inCount = 0;

    if (isInside && outCount >= REQUIRED_COUNT) {
      isInside = false;
      console.log("프로모션 지역 이탈 확정");
      initNXTokens("2");
      //alert("프로모션 지역 밖입니다");
      updatePromoOverlay(pos, distance);
    }
  }
}

function isJumpPosition(prev, current) {
  if (!prev) return false;

  const dist = getDistanceMeter(prev.lat, prev.lng, current.lat, current.lng);

  const timeDiff = (current.time - prev.time) / 1000; // sec
  const speed = dist / timeDiff; // m/s

  return speed > 15; // 15m/s ≒ 시속 54km (사람 기준 초과)
}

function watchNXPosition() {
  console.log("watchNXPosition");
  lastPos = loadCurrentPosition();
  navigator.geolocation.watchPosition(
    (pos) => {
      console.log(pos);
      if (pos.coords.accuracy > 150) return;

      userPos = pos.coords;

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      lastPos = pos;
      saveCurrentPosition(lastPos);

      const distance = getDistanceMeter(lat, lng, arEventInfo.eventGpsx, arEventInfo.eventGpsy);
      console.log("watchNXPosition distance:" + distance);
      updateZone(pos, distance);
      onLocationUpdate(lat, lng, pos.coords.accuracy);
    },
    (err) => {
      console.error(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    },
  );
}

function isTutorial() {
  return false;
}

function checkCouponCreated() {
  if (couponCreatedYn == "Y") {
    couponCreatedYn = "N";
    const panel = document.getElementById("resultPanel");
    const title = document.getElementById("resultTitle");
    const message = document.getElementById("resultMessage");

    message.innerHTML = `${lang_COUPON_GET}<br>`;
    panel.classList.remove("win", "lose");
    panel.classList.add("win");

    document.getElementById("resultText").textContent = `${lang_CONGRATULATIONS}`;

    document.getElementById("useCouponBtn").style.display = "inline-block";
  }
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
    path: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.7/lottie/gift_box.json",
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
  sparkleContainer.style.overflow = "visible"; 

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
    path: "https://cdn.jsdelivr.net/gh/wowinfotechkr/inspire-view@v1.1.7/lottie/fireworks.json",
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
    showCouponAlert();
  });
}

function showCouponAlert() {
  const panel = document.getElementById("resultPanel");
  const title = document.getElementById("resultTitle");
  const message = document.getElementById("resultMessage");
  //const video = document.getElementById("bgVideo");
  
  var giftContainer = document.getElementById("gift-lottie");
  var sparkleContainer = document.getElementById("sparkle-lottie");
  giftContainer.classList.add("hidden");
  sparkleContainer.classList.add("hidden");
  
  message.innerHTML = `${lang_COUPON_GET}<br>`;
  panel.classList.remove("win", "lose");
  panel.classList.add("win");

  document.getElementById("resultText").textContent = `${lang_CONGRATULATIONS}`;

  //launchConfetti();
  document.getElementById("useCouponBtn").style.display = "inline-block";

  panel.style.display = "block";
  document.getElementById("overlay").classList.add("show");
  //video.currentTime = 0;
  //video.play().catch((err) => console.warn("재생 실패:", err));

  panel.classList.add("show");
}

function handleCollect(model, message, seq, isSound) {
  var soundOn = isSound;
  if (soundOn == null) soundOn = true;
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

  showToast(message);

  mealList = mealList.filter((item) => item.MD_SEQ !== seq);
  fullMealList = fullMealList.filter((item) => item.MD_SEQ !== seq);

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
  }, 2000);
}

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function moveCoords(lat, lng, distanceMeters, bearingDegrees) {
  const R = 6378137;
  const d = distanceMeters;
  const brng = (bearingDegrees * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
  const lng2 = lng1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));
  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lng2 * 180) / Math.PI,
  };
}

function checkBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isLineInApp = /Line\//i.test(ua);
  const isFacebookInApp = /FBAN|FBAV/i.test(ua);
  const isInstagramInApp = /Instagram/i.test(ua);
  const isSamsungBrowser = /SamsungBrowser/i.test(ua); // 삼성 브라우저 추가

  if (isSamsungBrowser) {
    let browserName = "외부 브라우저";

    // OS를 판단하여 브라우저 이름 결정
    if (/Android/i.test(ua)) {
      browserName = "Chrome 브라우저";
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      browserName = "Safari 브라우저";
    }

    swalx({
      mode: "html",
      message: ``,
      showConfirmButton: false,
      backdropColor: "rgba(0, 0, 0, 1)",
      popupOpacity: 0,
    });

    alert(`인앱 브라우저 또는 일부 브라우저에서는 AR 기능을 사용할 수 없습니다. ${browserName}에서 열어주세요.`);
    window.history.back();
  }

  if (isLineInApp || isFacebookInApp || isInstagramInApp || isSamsungBrowser) {
    let browserName = "외부 브라우저";

    // OS를 판단하여 브라우저 이름 결정
    if (/Android/i.test(ua)) {
      browserName = "Chrome 브라우저";
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      browserName = "Safari 브라우저";
    }

    swalx({
      mode: "html",
      message: `<div style="font-weight:bold; padding-top: 4px;">인앱 브라우저 또는 일부 브라우저에서는 AR 기능을 사용할 수 없습니다. ${browserName}에서 열어주세요.</div><br>`,
      showConfirmButton: false,
      backdropColor: "rgba(0, 0, 0, 1)",
    });
  }
}

function enableNXNearestGuide() {
  const scene = document.querySelector("a-scene");
  if (!scene) return;

  // guide tick 시작(핵심)
  if (!scene.hasAttribute("nx-nearest-guide")) {
    scene.setAttribute("nx-nearest-guide", "");
  }

  // HUD 보이기(원하면)
  const hud = document.getElementById("nxGuideHud");
  // if (hud) hud.style.display = "flex";
}

function nxFormatDistance(m) {
  if (!isFinite(m)) return "--";
  if (m < 1000) return `${m.toFixed(2)}m`;
  return `${(m / 1000).toFixed(2)}km`;
}

// Haversine 공식을 사용하여 두 좌표 사이의 거리를 미터 단위로 계산합니다.
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 지구의 반경 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // 미터 단위로 반환
}

function renderTutorialToken() {
  console.log("renderTutorialToken Start");
  //document.getElementById("cornerGiftBtn").style.display = "none";
  document.getElementById("stampCounterWrapper").style.display = "none";
  document.getElementById("stampCounterWrapper2").style.display = "block";
  document.getElementById("stampTotalCounterWrapper").style.display = "none";
  document.getElementById("stampTotalCounterWrapper2").style.display = "block";
  document.getElementById("tutorialOverlay").style.display = "flex";
  document.getElementById("tutorialConfirmBtn").addEventListener("click", () => {
    document.getElementById("tutorialOverlay").style.display = "none";
  });

  document.getElementById("tutorialStep2Confirm").addEventListener("click", () => {
    document.getElementById("tutorialOverlayStep2").style.display = "none";
    document.getElementById("cornerGiftBtn").style.display = "inline-flex";
    document.getElementById("stampCounterWrapper").style.display = "flex";
    document.getElementById("stampCounterWrapper2").style.display = "none";
    document.getElementById("stampTotalCounterWrapper").style.display = "flex";
    document.getElementById("stampTotalCounterWrapper2").style.display = "none";
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
  //hitbox.setAttribute("click-handler", "");

  const image = document.createElement("a-image");
  image.setAttribute("src", absUrl);
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

// 토큰 목록을 화면에 렌더링하는 함수 (플레이스홀더)
// 이 함수 내부에 실제로 HTML 요소를 생성하고 추가하는 로직을 작성해야 합니다.
function renderTokens() {
  console.log("Rendering tokens");
  document.querySelectorAll("a-entity[id^='ar-item-']").forEach((el) => el.remove());

  const scene = document.querySelector("a-scene");

  mealList.forEach((place, index) => {
    //place.model = "chamisul_fresh_soju2.png";
    place.model = absUrl;
    const model = document.createElement("a-entity");
    model.setAttribute("gps-entity-place", `latitude: ${place.MD_GPSX}; longitude: ${place.MD_GPSY}`);
    model.setAttribute("id", `ar-item-${place.MD_SEQ}`);

    if (place.model.endsWith(".glb") || place.model.endsWith(".gltf")) {
      model.setAttribute("gltf-model", `${place.model}`);
      model.setAttribute("scale", "2 2 2");
    } else {
      const hitbox = document.createElement("a-box");
      hitbox.setAttribute("height", `${((dispH + dispW) / 2).toFixed(3)}`);
      hitbox.setAttribute("width", `${((dispH + dispW) / 2).toFixed(3)}`);
      hitbox.setAttribute("material", "opacity: 0");
      //hitbox.setAttribute("material", "color: red; opacity: 0.5;");
      hitbox.setAttribute("position", "0 0 0");
      //hitbox.setAttribute("look-at", "[gps-camera]");
      hitbox.setAttribute("billboard", "");
      hitbox.setAttribute("class", "clickable");

      const image = document.createElement("a-image");
      //image.setAttribute("src", `models/${place.model}`);
      image.setAttribute("src", `${absUrl}`);
      image.setAttribute("height", `${dispH.toFixed(3)}`);
      //image.setAttribute("width", "0.6");
      image.setAttribute("position", "0 0 0");
      //image.setAttribute("look-at", "[gps-camera]");
      //image.setAttribute("billboard", "");
      image.setAttribute("width", `${dispW.toFixed(3)}`);

      hitbox.appendChild(image);
      model.appendChild(hitbox);
    }

    model.setAttribute("proximity-visibility", {
      lat: place.MD_GPSX,
      lng: place.MD_GPSY,
      maxDistance: maxDistance,
    });
    scene.appendChild(model);

    model.addEventListener("click", () => {
      if (!model.object3D.visible) {
        return;
      }
      if (isProcessing) {
        return;
      }
      isProcessing = true;

      console.log(place);
      fetch("/catchMeal.do", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: place.MD_BRAND,
          store: place.MD_STORE,
          code: place.MD_CODE,
          seq: place.MD_SEQ,
          userid: memberid,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            showToast(`${lang_COUPON_USE_ERROR}(${response.status})`);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log(data);
          console.log("data.proc_code: " + data.proc_code);
          alert(`data.proc_code: ${data.proc_code}`);
          if (data.proc_code == "0000") {
            handleCollect(model, `${lang_COLLECTION_COMPLETE}`, place.MD_SEQ);
            setMealSumList(data.mealSumList, true);
            console.log("data.couponCd:" + data.couponCd);
            if (data.couponCd != null && data.couponCd.length == 16) {
              console.log(`${lang_COUPON_ISSUED}`);
              if (!user_demo) {
                checkCoupon();
                //showCouponAlert();
                playGiftSequence(() => showCouponAlert());
              } else {
                showDemoAlert();
              }
            }
          } else if (data.proc_code == "7777") {
            handleCollect(model, `${lang_TOKEN_ALREADY}`, place.MD_SEQ, false);
          } else {
            showToast(`${lang_COLLECTION_ERROR} (${data.proc_code})`);
          }
        })
        .catch((err) => {
          console.error(err);
          showToast(`${lang_COLLECTION_FAIL}
              		  ${lang_COLLECTION_CHECK_INTERNET}`);
        })
        .finally(() => {
          setTimeout(function () {
            isProcessing = false;
          }, 500);
        });
    });
    scene.appendChild(model);
  });
}

function showDemoAlert() {
  swalx({
    kind: "one",
    mode: "html",
    message: `
         			<div style="font-size:15px; text-align:left; padding:0px 10px; color:black;">${lang_DEMO_POPUP1}</div>
         			<br>
         			<div style="font-size:15px; text-align:left; padding:0px 10px; color:black;">${lang_DEMO_POPUP2}</div>
         			<br>
         			<br>
         			<div style="font-weight:600;font-size:17px; text-align:left;padding:0px 10px; color:black;">${lang_DEMO_POPUP3}<div>
         			<br>
               `,
    confirmText: `${lang_CHECK}`,
    onConfirm: () => {},
    allowOutsideClick: true,
  });
}

// Geolocation API를 사용하여 위치 추적 및 목록 정렬을 처리합니다.
function startTrackingAndSorting() {
  if (!navigator.geolocation) {
    console.error("이 브라우저에서는 Geolocation이 지원되지 않습니다.");
    return;
  }

  const options = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000,
  };

  navigator.geolocation.watchPosition(
    (position) => {
      const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // 초기 위치 설정
      if (!initialPosition) {
        initialPosition = userCoords;
        console.log("초기 위치 설정됨:", initialPosition);
        // 초기 50개 목록 렌더링 (서버에서 받은 순서대로)
        renderTokens();
        console.log("renderTokens1");
        return; // 초기 렌더링 후 함수 종료
      }

      // 초기 위치로부터 이동 거리를 계산
      const distanceMoved = getDistanceFromLatLonInMeters(initialPosition.latitude, initialPosition.longitude, userCoords.latitude, userCoords.longitude);

      console.log(`초기 위치로부터 이동 거리: ${distanceMoved.toFixed(2)}m`);

      // 일정 거리 이상 이동했거나, 아직 정렬되지 않은 경우
      if (distanceMoved >= DISTANCE_THRESHOLD_METERS) {
        console.log("일정 거리 이상 이동하여 목록을 재정렬합니다.");
        initialPosition = userCoords;

        // 전체 목록을 현재 위치 기준 가까운 순으로 정렬
        fullMealList = fullMealList.sort((a, b) => {
          const distA = getDistanceFromLatLonInMeters(userCoords.latitude, userCoords.longitude, a.MD_GPSX, a.MD_GPSY);
          const distB = getDistanceFromLatLonInMeters(userCoords.latitude, userCoords.longitude, b.MD_GPSX, b.MD_GPSY);
          return distA - distB;
        });

        // 정렬된 목록에서 상위 50개만 선택하여 렌더링
        mealList = fullMealList.slice(0, 50);
        renderTokens();
        console.log("renderTokens2");

        isListSorted = true;
        //addLogText("재정렬 완료");
      }
    },
    (error) => {
      console.warn(`Geolocation 에러(${error.code}): ${error.message}`);
      // 에러 처리 로직
    },
    options,
  );
}

function goAuth(provider) {
  const returnUrl = sessionStorage.getItem("returnUrl");
  //alert("returnUrl:"+returnUrl)
  const stateObj = {
    //returnUrl: document.referrer,
    returnUrl: returnUrl ? returnUrl : document.referrer,
    couponKey: localStorage.getItem("coupon_result_sid") || null,
    ts: Date.now(),
    referrer: document.referrer,
    memberid: localStorage.getItem("memberid"),
  };
  console.log(stateObj);
  const state = btoa(unescape(encodeURIComponent(JSON.stringify(stateObj))));
  location.href = `/oauth/${provider}/authorize.do?state=${encodeURIComponent(state)}`;
}

function addLogText(logText) {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML += logText + "<br>";
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // bfcache에서 복원된 경우 팝업 강제 실행
    window.location.reload();
  }
});

function updateVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

window.addEventListener("resize", updateVh);
window.addEventListener("orientationchange", updateVh);
document.addEventListener("DOMContentLoaded", updateVh);

function couponActiveForT9(no, activeYn, t9Code) {
  if (t9Code == null || t9Code == "") return;

  var couponNo = no.replace(/-/g, "");
  var userId = localStorage.getItem("memberid");

  fetch("/coupon-active.do", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ couponNo: couponNo, activeYn: activeYn, t9Code: t9Code, userId: userId }),
  })
    .then((response) => {
      if (!response.ok) {
        showToast(`${lang_COUPON_USE_ERROR}(${response.status})`);
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      console.log("data.proc_code: " + data.proc_code);
      if (data.proc_code != "0000") {
        showToast(`${lang_COUPON_USE_ERROR}[${data.proc_code}]`);
      }
    })
    .catch((err) => {
      console.error(err);
      showToast(`${lang_COUPON_USE_ERROR}`);
    });
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

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function gpsDeltaAndStability({ prevPos, nowPos, prevTsMs, nowTsMs }) {
  const dt = (nowTsMs - prevTsMs) / 1000;

  if (!isFinite(dt) || dt < MIN_DT_SEC) {
    return { gpsStable: false, moveDeltaM: 0, reason: "dt_too_small" };
  }

  const d = haversineDistance(prevPos, nowPos); // meters
  const speed = d / dt; // m/s

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

  return r; // 디버깅용 reason 포함
}

function onCollect(state, count = 1) {
  state.collectedToday += count;
}
function calcWeightW({ elapsedSecToday, moveDistTodayM, collectedToday, gpsStableNow }) {
  const timeScore = clamp01(elapsedSecToday / TIME_TARGET_SEC);
  const collectScore = clamp01(1 - collectedToday / COLLECT_TARGET);
  //거리의 최소값잡기
  /* const moveScore = gpsStableNow
     ? clamp01(moveDistTodayM / MOVE_TARGET_M)
     : MOVE_NEUTRAL_SCORE; */
  const moveScore = gpsStableNow ? clamp01(moveDistTodayM / MOVE_TARGET_M) : 0.0;

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
  console.log("W:" + W);

  const b = pickBucket(W);
  //const low = clamp(b.min - JITTER, 1, MAX_TOKENS);
  //const high = clamp(b.max + JITTER, 1, MAX_TOKENS);
  const low = clamp(b.min, 0, MAX_TOKENS);
  const high = clamp(b.max, 0, MAX_TOKENS);

  console.log("b:" + b);
  console.log("low:" + low);
  console.log("high:" + high);

  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function setInfoMapNew(address, eventInfoDateto, eventInfoDatefrom, eventInfoAmt, eventInfoAmtSymbol, eventInfoReward) {
  if (typeof initMap === "function") {
    initMap(eventGpsx, eventGpsy, eventRadius, eventImg);
  }
  const eventDateEl = document.getElementById("event-date");
  //const addrPlaceholder = document.getElementById("addr-placeholder");
  const addrInfo = document.getElementById("addrInfo");

  const arModalInfoDate = document.getElementById("arModalInfoDate");
  const arModalInfolocation = document.getElementById("arModalInfolocation");
  const arModalInfoToken = document.getElementById("arModalInfoToken");
  const arModalInfoAmt = document.getElementById("arModalInfoAmt");
  const arModalInfoCouponInfo = document.getElementById("arModalInfoCouponInfo");

  // 기존의 eventSdate, eventEdate, address 변수를 그대로 쓴다고 가정
  if (typeof eventInfoDateto !== "undefined" && typeof eventInfoDatefrom !== "undefined") {
    arModalInfoDate.classList.remove("hidden");
    eventDateEl.textContent = eventInfoDateto + " ~ " + eventInfoDatefrom;
  }
  console.log("address : ", address);
  if (typeof address !== "undefined" && address != null) {
    arModalInfolocation.classList.remove("hidden");
    addrInfo.textContent = address;
  }

  if (typeof hideScreen === "function") {
    hideScreen("readyScreen");
  }
  if (typeof eventInfoAmt !== "undefined" && eventInfoAmt != null && eventInfoAmt != 0) {
    arModalInfoAmt.classList.remove("hidden");

    var infoRewardAmt = document.getElementById("eventInfoRewardAmt");
    var formattedAmt = Number(eventInfoAmt).toLocaleString();
    infoRewardAmt.innerText = `${eventInfoAmtSymbol}${formattedAmt}`;
  }

  if (typeof eventInfoReward !== "undefined" && eventInfoReward != null) {
    arModalInfoCouponInfo.classList.remove("hidden");

    var infoReward = document.getElementById("eventInfoReward");
    infoReward.textContent = eventInfoReward;
  }

  var changeNumberEl2 = document.getElementById("event-changenumber-new");
  changeNumberEl2.textContent = eventChangeMealCnt;

  var infoTitle = document.getElementById("arModalTitle");
  infoTitle.textContent = `${lang_EVENT_INFO}`;
}

function fitInstructionsToCard() {
  const card = document.querySelector(".arOverlayCard");
  const header = document.querySelector(".arOverlayHeader");
  const map = document.getElementById("global-map-new");
  const count = document.getElementById("arModalInfoCount");
  const inst = document.querySelector(".arModalContent .instructions");

  if (!card || !header || !map || !count || !inst) return;

  const cardMax = Math.floor(window.innerHeight * 0.8);

  const headerH = header.offsetHeight || 0;
  const mapH = map.offsetHeight || 0;
  const countH = count.offsetHeight || 0;

  const extra = 50;

  const available = cardMax - headerH - mapH - countH - extra;

  inst.style.maxHeight = Math.max(90, available) + "px";
  inst.style.overflowY = "auto";
}

window.addEventListener("resize", () => {
  if (!document.getElementById("arModal")?.classList.contains("hidden")) {
    fitInstructionsToCard();
    syncScrollState();
  }

  if (!document.getElementById("authModal")?.classList.contains("hidden")) {
    fitAuthModalScrollArea();
    syncScrollState();
  }
});

function syncScrollState() {
  const inst = document.querySelector(".instructions");
  if (!inst) return;

  // 스크롤이 생겼는지 체크
  const hasScroll = inst.scrollHeight > inst.clientHeight;

  inst.classList.toggle("has-scroll", hasScroll);
  inst.classList.toggle("scroll-always", hasScroll);
}

function syncScrollState2() {
  const inst = document.querySelector(".instructions");
  if (!inst) return;

  // 스크롤이 생겼는지 체크
  const hasScroll = inst.scrollHeight > inst.clientHeight;

  inst.classList.toggle("has-scroll", hasScroll);
  inst.classList.toggle("scroll-always", hasScroll);
}

async function getNowTokenCount() {
  const res = await fetch(`/getNowTokenCount.do?brand=${cBrand}&store=${cStore}&code=${cCode}`);
  const resJson = await res.json();
}

async function getNowTokenCount() {
  const res = await fetch(`/getNowTokenCount.do?brand=${cBrand}&store=${cStore}&code=${cCode}`);
  const resJson = await res.json();
}

function isStartOverlayVisible() {
  var el = document.getElementById("startOverlay");
  return el && el.style.display !== "none" && !el.classList.contains("hidden");
}

function applyGateState() {
  const startVisible = isStartOverlayVisible();

  const gps = document.getElementById("gpsLoading");
  const promo = document.getElementById("promoOverlay");

  if (startVisible) {
    if (gps) gps.style.display = "none";
    if (promo) promo.style.display = "none";
    console.log("TEST0202 - applyGateState(): hide");
    return;
  }

  console.log("TEST0202 - applyGateState() gateState.gpsNeedWait: " + gateState.gpsNeedWait);
  console.log("TEST0202 - applyGateState() gateState.promoNeedShow: " + gateState.promoNeedShow);
  if (gps) gps.style.display = gateState.gpsNeedWait ? "flex" : "none";
  if (promo) promo.style.display = gateState.promoNeedShow ? "block" : "none";
}

function decideGateAndRender() {
  // 1) GPS가 아직 없으면 -> GPS 대기만
  gateState.gpsNeedWait = !gpsLoaded;

  // GPS 없으면 promo는 의미 없음 (숨김)
  if (!gpsLoaded) {
    gateState.promoNeedShow = false;
    applyGateState();
    return;
  }

  // 2) GPS는 있는데 이벤트정보/현재위치가 없으면 -> GPS는 대기 아님, promo도 숨김
  if (!arEventInfo) {
    gateState.gpsNeedWait = false;
    gateState.promoNeedShow = false;
    applyGateState();
    return;
  }

  const pos = loadCurrentPosition && loadCurrentPosition();
  if (!pos || !pos.coords) {
    gateState.gpsNeedWait = true;
    gateState.promoNeedShow = false;
    applyGateState();
    return;
  }

  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  const distance = getDistanceMeter(lat, lng, arEventInfo.eventGpsx, arEventInfo.eventGpsy);
  const out = distance > arEventInfo.eventRadius;

  gateState.gpsNeedWait = false;
  gateState.promoNeedShow = out;

  if (out) updatePromoOverlay(pos, distance);
  else hidePromoOverlay();

  applyGateState();
}

function forceHideBackOverlays() {
  const gps = document.getElementById("gpsLoading");
  const promo = document.getElementById("promoOverlay");
  if (gps) gps.style.display = "none";
  if (promo) promo.style.display = "none";
  console.log("TEST0202 - forceHideBackOverlays(): hide");
}

function showPromoOverlay() {
  const startOverlay = document.getElementById("startOverlay");
  if (!startOverlay) return false;
  if (startOverlay.classList.contains("hidden")) return false;

  return getComputedStyle(startOverlay).display !== "none";
}

function setRowDone(rowId, done) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.classList.toggle("done", !!done);
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

  el_authMidImg.src = "./img/auth/and_camera_1.png";

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
    el_authMidImg.src = "./img/auth/ios_camera_1.png";

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

function setArModal() {
  let isArModalOpen = false;
  let closingByHistory = false;

  const toggleBtn = document.getElementById("toggleInfoBtn");
  const modal = document.getElementById("arModal");
  const closeBtn = document.getElementById("arModalcloseBtn");
  const backdrop = document.getElementById("arModalBackdrop");

  const promEndOverlay = document.getElementById("promEndOverlay");
  const promEndPanel = document.getElementById("promEndPanel");
  const promEndMessage = document.getElementById("promEndMessage");

  const promEndOverlay2 = document.getElementById("promEndOverlay2");
  const promEndPanel2 = document.getElementById("promEndPanel2");
  const promEndMessage2 = document.getElementById("promEndMessage2");

  function openPromEndOverlay(msgHtml) {
    if (msgHtml) {
      document.getElementById("promEndMessage").innerHTML = msgHtml;
    }
    document.querySelectorAll('[id$="Overlay"]').forEach((el) => {
      if (el.id !== "promEndOverlay") {
        el.classList.add("hidden");
      }
    });
    document.getElementById("promEndOverlay").classList.remove("hidden");
  }

  function closePromEndOverlay() {
    document.getElementById("promEndOverlay").classList.add("hidden");
  }

  function openPromEndOverlay2(msgHtml) {
    if (msgHtml) {
      document.getElementById("promEndGuideText2").innerHTML = msgHtml;
    }

    // 기존 overlay 전부 숨기기 (hidden 방식 통일)
    document.querySelectorAll('[id$="Overlay"]').forEach((el) => {
      if (el.id !== "promEndOverlay2") {
        el.classList.add("hidden");
      }
    });

    document.getElementById("promEndOverlay2").classList.remove("hidden");
  }

  function closePromEndOverlay2() {
    document.getElementById("promEndOverlay2").classList.add("hidden");
  }

  function closePromEndOverlay2() {
    promEndPanel2.classList.remove("show");
    promEndOverlay2.classList.add("hidden");
  }

  function openAuthModalOverlay() {
    fitAuthModalScrollArea();
    document.getElementById("authModal").classList.remove("hidden");
  }

  function closeAuthModalOverlay() {
    document.getElementById("authModal").classList.add("hidden");
  }
  window.openAuthModalOverlay = openAuthModalOverlay;
  window.closeAuthModalOverlay = closeAuthModalOverlay;

  const guideInfoBtn = document.getElementById("guideInfoBtnDiv");
  const authModalcloseBtn = document.getElementById("authModalcloseBtn");

  guideInfoBtn.addEventListener("click", openAuthModalOverlay);
  authModalcloseBtn.addEventListener("click", closeAuthModalOverlay);

  let hud2Timer;
  function openPromEndOverlay2For(msg, ms) {
    openPromEndOverlay2(msg);
    clearTimeout(hud2Timer);
    hud2Timer = setTimeout(closePromEndOverlay2, ms || 2000);
  }

  window.openPromEndOverlay = openPromEndOverlay;
  window.closePromEndOverlay = closePromEndOverlay;

  window.openPromEndOverlay2 = openPromEndOverlay2;
  window.closePromEndOverlay2 = closePromEndOverlay2;
  window.openPromEndOverlay2For = openPromEndOverlay2For;

  function openArModal() {
    if (isArModalOpen) return;

    isArModalOpen = true;

    modal.classList.remove("hidden");
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (window.__nxReflowMap) window.__nxReflowMap(24);
      });
    });

    const waitMap = () => {
      if (!mapReady) return requestAnimationFrame(waitMap);

      // ✅ 첫 오픈만 250ms, 이후는 0ms
      const delay = hasOpenedOnce ? 0 : 0;

      setTimeout(() => {
        modal.style.opacity = "1";
        modal.style.pointerEvents = "auto";

        requestAnimationFrame(() => fitInstructionsToCard());
        history.pushState({ arModal: true }, "", location.href);

        hasOpenedOnce = true; // ✅ 여기서 트리거 켜기
      }, delay);
    };

    waitMap();
  }

  function closeArModal(fromPopstate = false) {
    if (!isArModalOpen) return;

    isArModalOpen = false;
    document.body.classList.add("modal-open");
    modal.classList.add("hidden");
  }
  window.openArModal = openArModal;
  window.addEventListener("popstate", () => {
    if (closingByHistory) {
      closingByHistory = false;
      return;
    }
    if (isArModalOpen) closeArModal(true);
  });

  document.getElementById("startConfirmBtn").addEventListener("click", () => {
    const start = document.getElementById("startOverlay");
    start.style.display = "none";
    start.classList.add("hidden");

    decideGateAndRender();
    applyGateState();
  });

  toggleBtn.addEventListener("click", openArModal);
  closeBtn.addEventListener("click", () => closeArModal(false));
  backdrop.addEventListener("click", () => closeArModal(false));
}

function preloadAudio(id) {
  const audio = document.getElementById(id);
  if (!audio) return;

  audio.preload = "auto"; // none → auto
  audio.load(); // 네트워크 요청 시작
}
