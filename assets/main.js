/* 프롬프트 포에트 전시 — 로딩 화면 · 등장 모션 · 저장 방지
   작품 페이지와 메인 갤러리 페이지가 같이 쓰는 파일입니다. */
(function () {
  var root = document.documentElement;
  var MIN_LOGO_MS = 1100;   // 로고가 최소한 보이는 시간 (너무 빨리 사라지면 로고가 안 보임)
  var MAX_WAIT_MS = 8000;   // 네트워크가 느려도 이 시간이 지나면 무조건 보여 줌
  var start = Date.now();
  var done = false;

  function hasClass(el, c) { return (" " + el.className + " ").indexOf(" " + c + " ") > -1; }
  function addClass(el, c) { if (!hasClass(el, c)) el.className += " " + c; }
  function each(list, fn) { for (var i = 0; i < list.length; i++) fn(list[i], i); }
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  // ── 로딩 화면 ──
  function ready() {
    if (done) return;
    done = true;
    var wait = Math.max(0, MIN_LOGO_MS - (Date.now() - start));
    setTimeout(function () {
      // 다음 프레임에 클래스를 붙여야 모든 브라우저에서 전환 효과가 확실히 재생됨
      raf(function () { raf(function () { addClass(root, "is-ready"); }); });
    }, wait);
  }

  // 작품 페이지: 작품 이미지 1장 / 메인 갤러리: 첫 화면에 보이는 이미지들(data-wait)이 준비되면 시작
  var waits = document.querySelectorAll(".art, [data-wait]");
  var left = waits.length;
  function oneDone() { left -= 1; if (left <= 0) ready(); }
  function whenLoaded(img) {
    if (img.decode) { img.decode().then(oneDone, oneDone); } else { oneDone(); }  // 미리 그려 둔 뒤 보여서 깜빡임 없음
  }
  if (!left) { ready(); }
  each(waits, function (img) {
    if (img.complete && img.naturalWidth) { whenLoaded(img); }
    else {
      img.addEventListener("load", function () { whenLoaded(img); });
      img.addEventListener("error", oneDone);
    }
  });
  setTimeout(ready, MAX_WAIT_MS);

  // 뒤로가기로 돌아왔을 때(iOS Safari 등) 로딩 화면에 갇히지 않도록
  window.addEventListener("pageshow", function (e) { if (e.persisted) addClass(root, "is-ready"); });

  // ── 이미지 저장 방지: 그림 위에서 우클릭(PC)·끌어서 저장 메뉴가 뜨지 않게 함 ──
  function onArt(el) {
    while (el && el !== document) {
      if (el.className && hasClass(el, "frame")) return true;
      el = el.parentNode;
    }
    return false;
  }
  function block(e) { if (onArt(e.target)) { e.preventDefault(); return false; } }
  document.addEventListener("contextmenu", block);
  document.addEventListener("dragstart", block);

  // ── 영상 페이지: 재생 버튼을 누르면 썸네일 자리에 구글 드라이브 플레이어를 넣음 ──
  //    '크게 보기'는 모든 기기에서 같은 방식: 페이지 안에서 플레이어가 화면을 꽉 채움 (다른 사이트로 넘어가지 않음)
  //    닫기 버튼 · 뒤로가기(안드로이드 뒤로 버튼, 아이폰 밀어서 뒤로) · ESC 로 닫으면 원래 페이지로 돌아옴
  var isPhone = window.matchMedia && window.matchMedia("(pointer:coarse) and (max-width:900px)").matches;
  var box = document.querySelector(".player-box");
  var startLink = box && box.querySelector(".v-start");   // 썸네일+재생 버튼 (닫을 때 되돌리기용)
  function startPlayer() {
    var a = box && box.querySelector(".v-start");
    if (!a) return;
    var f = document.createElement("iframe");
    f.className = "v-frame";
    f.src = a.getAttribute("data-embed");
    f.title = a.getAttribute("data-title") || "영상";
    f.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    a.parentNode.replaceChild(f, a);
  }
  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
  var theater = false, pushed = false;
  function openTheater() {
    if (!box || theater) return;
    theater = true;
    addClass(box, "is-theater");
    addClass(root, "theater-on");
    if (window.history && history.pushState) {   // 뒤로가기를 누르면 '크게 보기'만 닫히도록
      try { history.pushState({ theater: 1 }, ""); pushed = true; } catch (err) {}
    }
    var req = box.requestFullscreen || box.webkitRequestFullscreen;   // 지원하는 기기는 주소창까지 숨김
    if (req) {
      try {
        var p = req.call(box);
        var lock = function () {
          try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape")["catch"](function () {}); } catch (err) {}
        };
        if (p && p.then) p.then(lock, function () {}); else lock();
      } catch (err) {}
    }
  }
  function closeTheater(fromHistory) {
    if (!theater) return;
    theater = false;
    box.className = box.className.replace(/\s*is-theater/g, "");
    root.className = root.className.replace(/\s*theater-on/g, "");
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (err) {}
    if (fsElement()) {
      try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (err) {}
    }
    if (pushed && !fromHistory) { pushed = false; try { history.back(); } catch (err) {} }
    pushed = false;
    // 휴대폰: 작은 화면 안에서는 드라이브 플레이어가 잘려 보이므로, 닫으면 원래 썸네일+재생 버튼으로 되돌림
    if (isPhone && startLink) {
      var f = box.querySelector(".v-frame");
      if (f) box.replaceChild(startLink, f);
    }
  }
  function onFsChange() { if (!fsElement() && theater) closeTheater(false); }
  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);
  window.addEventListener("popstate", function () { if (theater) closeTheater(true); });
  document.addEventListener("keydown", function (e) { if ((e.key === "Escape" || e.keyCode === 27) && theater) closeTheater(false); });

  each(document.querySelectorAll(".v-start"), function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      startPlayer();
      if (isPhone) openTheater();
    });
  });
  each(document.querySelectorAll(".v-full"), function (btn) {
    btn.addEventListener("click", function () { startPlayer(); openTheater(); });
  });
  each(document.querySelectorAll(".v-close"), function (btn) {
    btn.addEventListener("click", function () { closeTheater(false); });
  });

  // ── 메인 갤러리: 이미지 / 영상 탭 (주소 끝 #video 로 영상 탭 기억 → 영상 페이지에서 돌아와도 그대로) ──
  var tabs = document.querySelectorAll(".g-tab");
  if (!tabs.length) return;
  function show(name) {
    each(tabs, function (t) {
      var on = t.getAttribute("data-tab") === name;
      t.className = on ? "g-tab is-on" : "g-tab";
      t.setAttribute("aria-selected", on ? "true" : "false");
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (window.history && history.replaceState) {
      try { history.replaceState(null, "", name === "video" ? "#video" : location.pathname + location.search); } catch (err) {}
    }
  }
  each(tabs, function (t) {
    t.addEventListener("click", function () { show(t.getAttribute("data-tab")); });
  });
  if (location.hash === "#video") show("video");
})();
