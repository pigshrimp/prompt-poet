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
