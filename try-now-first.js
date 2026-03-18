function preloadAudio(id) {
  return new Promise((resolve, reject) => {
    const audio = document.getElementById(id);
    if (!audio) {
      resolve(); // 없으면 그냥 넘어감
      return;
    }

    audio.preload = "auto";

    const onReady = () => {
      audio.removeEventListener("canplaythrough", onReady);
      resolve();
    };

    audio.addEventListener("canplaythrough", onReady);
    audio.load(); // 네트워크 요청 시작
  });
}

function renderVideo(id, src, readyEvent = "canplay") {
  return new Promise((resolve, reject) => {
    const video = document.getElementById(id);
    if (!video) return resolve(null);

    const onReady = () => {
      cleanup();
      resolve(video);
    };

    const onError = () => {
      console.log("video error", video.error);
      cleanup();
      reject(new Error(`video load failed: ${id}`));
    };

    const cleanup = () => {
      video.removeEventListener(readyEvent, onReady);
      video.removeEventListener("error", onError);
    };

    video.preload = "auto";

    video.addEventListener(readyEvent, onReady, { once: true });
    video.addEventListener("error", onError, { once: true });

    video.src = src;
    video.load();
  });
}

function initTryGameScreen1() {
  const tokenDiv = document.getElementById("tryGameImgDiv");
  const guideDiv = document.getElementById("tryGamediv1");
  if (!tokenDiv || !guideDiv) return;

  tokenDiv.style.display = "none";
  guideDiv.style.display = "none";

  tokenDiv.addEventListener("click", function (e) {
    e.preventDefault();
    collectTryGameToken();
  });
}

function startTryGameTokenIntro() {
  const tokenDiv = document.getElementById("tryGameImgDiv");
  const guideDiv = document.getElementById("tryGamediv1");
  const arrowDiv = document.getElementById("tryGameArrow1"); // 이미 있음
  if (!tokenDiv || !guideDiv) return;

  guideDiv.style.display = "flex";

  if (arrowDiv) arrowDiv.style.display = "none";

  tokenDiv.style.display = "none";

  setTimeout(function () {
    tokenDiv.style.display = "block";
    tokenDiv.classList.add("trygame-token-wiggle");

    if (arrowDiv) arrowDiv.style.display = "block";
    guideDiv.classList.add("trygame-arrow-blink");
  }, 1000);
}



async function collectTryGameToken() {

  const tokenDiv = document.getElementById("tryGameImgDiv");
  const guideDiv = document.getElementById("tryGamediv1");
  const video1 = document.getElementById("tryGameBgVideo");
  const sound = document.getElementById("collect-sound");
 
  if (!tokenDiv || !guideDiv) return;
  if (tokenDiv.classList.contains("trygame-token-collecting")) return;
  try {
    var soundOn = true;
  if (sound && soundOn) {
      sound.currentTime = 0;
      await sound.play();
    }

  
  } catch(e) {
    console.log("Sound play failed", e);
  }

  // 🔴 video play를 다음 frame으로
  requestAnimationFrame(() => {
      primeTryGameStep2Video();
  });

  tokenDiv.classList.remove("trygame-token-wiggle");
  guideDiv.classList.remove("trygame-arrow-blink");

  tokenDiv.classList.add("trygame-token-collecting");

  tokenDiv.addEventListener(
    "animationend",
    function () {
      tokenDiv.style.display = "none";
      guideDiv.style.display = "none";
      saveUserLog("TRY - 체험 1페이지 토큰수집(페이스북)");
      onTryGameTokenCollected();
    },
    { once: true }
  );
}

function onTryGameTokenCollected() {
 
  goTryGameStep2();
}


function initTryGameScreen2() {
  const tokenDiv = document.getElementById("tryGameImgDiv2");
  const guideDiv = document.getElementById("tryGamediv2");
  if (!tokenDiv || !guideDiv) return;

  tokenDiv.style.display = "none";
  guideDiv.style.display = "none";

  tokenDiv.style.pointerEvents = "auto";

  tokenDiv.addEventListener(
    "pointerdown",
    function (e) {
      e.preventDefault();
      collectTryGameToken2();
    },
    { passive: false }
  );
}

function startTryGameTokenIntro2() {
  const tokenDiv = document.getElementById("tryGameImgDiv2");
  const guideDiv = document.getElementById("tryGamediv2");
  const arrowDiv = document.getElementById("tryGameArrow2");
  if (!tokenDiv || !guideDiv) return;

  // ✅ 텍스트는 영상 시작 시 바로
  guideDiv.style.display = "flex";

  // ✅ 화살표는 나중에
  if (arrowDiv) arrowDiv.style.display = "none";

  // 토큰은 1초 뒤
  tokenDiv.style.display = "none";

  setTimeout(function () {
    tokenDiv.style.display = "block";
    tokenDiv.classList.add("trygame-token-wiggle");

    if (arrowDiv) arrowDiv.style.display = "block";
    guideDiv.classList.add("trygame-arrow-blink");
  }, 500);
}

function collectTryGameToken2() {
  const tokenDiv = document.getElementById("tryGameImgDiv2");
  const guideDiv = document.getElementById("tryGamediv2");
  const sound = document.getElementById("collect-sound");

  if (!tokenDiv || !guideDiv) return;

  if (tokenDiv.classList.contains("trygame-token-collecting")) return;
  var soundOn = true;
  if (sound && soundOn) {
    sound.currentTime = 0;
    sound.play().catch((e) => console.log("Sound play failed", e));
  }

  tokenDiv.classList.remove("trygame-token-wiggle");
  guideDiv.classList.remove("trygame-arrow-blink");

  tokenDiv.classList.add("trygame-token-collecting");

  tokenDiv.addEventListener(
    "animationend",
    function () {
      tokenDiv.style.display = "none";
      guideDiv.style.display = "none";
        saveUserLog("TRY - 체험 2페이지 토큰수집(페이스북)");
      onTryGameToken2Collected();
    },
    { once: true }
  );
}

function onTryGameToken2Collected() {
  openTryGamePopup();
}

function primeTryGameStep2Video() {
  const v2 = document.getElementById("tryGameBgVideo2");
  if (!v2) return;

  if (!v2.src) {
    v2.src = "./img/trynow_video2_260306.mp4";
  }

  v2.preload = "auto";
  v2.muted = true;
  v2.playsInline = true;
  v2.setAttribute("playsinline", "");

  const p = v2.play();

  if (p) {
    p.then(() => {
      v2.pause();
      v2.currentTime = 0;
    }).catch(()=>{});
  }
}

async function goTryGameStep2() {
  const nextBtn = document.getElementById("btn-next");
  if (nextBtn) nextBtn.disabled = false;

  const s1 = document.getElementById("tryGameScreen1");
  const s2 = document.getElementById("tryGameScreen2");
  const v1 = document.getElementById("tryGameBgVideo");
  const v2 = document.getElementById("tryGameBgVideo2");
  if (!s1 || !s2 || !v2) return;

  saveUserLog("TRY - 체험 2페이지 진입(페이스북)");

  s2.classList.remove("hidden");
  s2.style.zIndex = "1002";
  s1.style.zIndex = "1001";
  s2.style.opacity = "0";
  s2.style.pointerEvents = "none";

  v2.preload = "auto";
  v2.muted = true;
  v2.playsInline = true;
  v2.setAttribute("playsinline", "");

  const targetSrc = "./img/trynow_video2_260306.mp4";
  const needNewSrc = !v2.currentSrc || !v2.currentSrc.includes("trynow_video2_260306.mp4");

  await new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("step2 video load failed"));
    };

    const cleanup = () => {
      v2.removeEventListener("loadeddata", onReady);
      v2.removeEventListener("error", onError);
    };

    // 이미 첫 프레임 준비돼 있으면 바로 통과
    if (!needNewSrc && v2.readyState >= 2) {
      resolve();
      return;
    }

    v2.addEventListener("loadeddata", onReady, { once: true });
    v2.addEventListener("error", onError, { once: true });

    // src가 바뀌는 경우에만 새로 load
    if (needNewSrc) {
      v2.src = targetSrc;
      v2.load();
    } else if (v2.readyState < 2) {
      // src는 같은데 아직 덜 준비된 경우만 load
      v2.load();
    }
  });

  s2.style.opacity = "1";
  s2.style.pointerEvents = "auto";

  if (v1) v1.pause();

  try {
    await v2.play();
  } catch (e) {
    const retry = () => {
      v2.play().finally(() => {
        window.removeEventListener("touchend", retry);
        window.removeEventListener("click", retry);
      });
    };
    window.addEventListener("touchend", retry, { once: true });
    window.addEventListener("click", retry, { once: true });
  }

  s1.style.opacity = "0";
  s1.style.pointerEvents = "none";

  initTryGameScreen2();
  startTryGameTokenIntro2();

  setTimeout(() => {
    s1.classList.add("hidden");
  }, 500);
}

function openTryGamePopup() {
  const popup = document.getElementById("permissionScreen");
  if (!popup) return;

  const bg = popup.querySelector(".bg-video");
  if (bg) bg.style.display = "none";
  const isFacebook = /FBAN|FBAV/i.test(ua);
	if(isFacebook){
	    showOverlayForFacebook("permissionScreen");
	  }else{
	  	showOverlay("permissionScreen");
	  }
}

function showOverlayForFacebook(id) {
  const el = document.getElementById(id);
  if (!el) return;
  initPermissionScreenForFacebook();
  el.classList.remove("hidden");
  el.style.zIndex = "20000";
}


function initPermissionScreenForFacebook() {

  const list = document.getElementById("permList");
  list.innerHTML = "";

  
    const currentLang = getLang();
	var text1 = lang[currentLang]["FACEBOOK_INAPP_INFO_TEXT1"]
	var text2 = "";
	var facebooksrc = ""
	if(isIOS){
	    text2 = lang[currentLang]["FACEBOOK_INAPP_INFO_TEXT2_ios"]
		//facebooksrc = "/TRY-NOW/img/facebook_info_ios_img_"+currentLang.toLowerCase()+".png";
		facebooksrc = "/TRY-NOW/img/facebook_info_ios_img_en.jpg";
	}else{
	    text2 = lang[currentLang]["FACEBOOK_INAPP_INFO_TEXT2"]
		facebooksrc = "/TRY-NOW/img/facebook_info_and_img_"+currentLang.toLowerCase()+".jpg";
	}
	list.innerHTML = `
	  <div class="perm-top-box">
	    <div class="perm-top-text">${text1}</div>
	    <div class="perm-top-text">${text2}</div>
	    <div class="perm-top-img-wrap">
	      <img src="${facebooksrc}" class="perm-top-img" />
	    </div>
	  </div>
	`;
	document.getElementById("permDesc").style.display = "none";
	document.getElementById("arNotice").style.display = "none";
	document.getElementById("cameraNoticeText").style.display = "none";
	

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
    const isOpen = arNoticeList.classList.toggle("open");
  });

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
function onFacebookNext(){

            if (isAndroid) {

              const url = new URL(window.location.href);
              url.searchParams.delete("fbclid");
			  url.searchParams.set("fromFacebook", "Y");
			  
              window.location.href = `intent://${url.toString().replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
            }
            if (isIOS) {
              const url = new URL(window.location.href);
              url.searchParams.delete("fbclid");
              url.searchParams.set("fromFacebook", "Y");
              window.open("x-safari-" + url.toString(), "_blank");
            }

}