/* 굿즈 탭: 스카프가 위쪽에 걸린 채 아래로 갈수록 찰랑거리는 효과 (canvas 로 그림)
   - 화면에 보일 때만 움직임 (배터리 절약), '동작 줄이기' 설정이면 정지 */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 33); };
  var cloths = [];

  function setup(cv) {
    var src = cv.getAttribute("data-src");
    var img = new Image();
    var item = { cv: cv, img: img, ready: false, visible: false, seed: Math.random() * 10 };
    img.onload = function () { item.ready = true; size(item); draw(item, 0); addClass(cv.parentNode.parentNode, "gd-cloth-on"); };
    img.src = src;
    cloths.push(item);
  }
  function addClass(el, c) { if ((" " + el.className + " ").indexOf(" " + c + " ") < 0) el.className += " " + c; }

  function size(item) {
    var r = item.cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (item.cv.width !== w || item.cv.height !== h) { item.cv.width = w; item.cv.height = h; }
  }

  // 위쪽이 고정된 천 한 장이 바람에 크게 팔랑이는 움직임
  function draw(item, t) {
    var cv = item.cv, ctx = cv.getContext("2d"), img = item.img;
    var W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    var side = W * 0.08;                     // 좌우 여유 (흔들려도 잘리지 않게)
    var sw = W - side * 2;                   // 스카프 폭
    var topY = H * 0.04;                     // 위쪽 고정선
    // 세로로 긴 그림은 높이에 맞춰 폭을 줄이고 가운데 정렬 (비율 유지)
    var availH = H - topY - H * 0.02, ratio = img.height / img.width;
    var sh = sw * ratio;
    if (sh > availH) { sh = availH; sw = sh / ratio; side = (W - sw) / 2; }
    var amp = W * 0.055;                     // 아래 끝 흔들림 폭
    var step = Math.max(2, Math.round(H / 200));
    var time = t / 1000 + item.seed;
    var sway = Math.sin(time * 1.05);        // 천 전체가 한쪽으로 쏠렸다 돌아옴
    for (var y = 0; y < sh; y += step) {
      var p = y / sh;                        // 0 = 위(고정), 1 = 아래 끝
      var reach = Math.pow(p, 1.5);
      var ph = p * 2.4 - time * 1.5;         // 긴 물결 한 개가 천을 타고 내려감
      var dx = amp * reach * (0.55 * sway + 0.45 * Math.sin(ph));
      var squeeze = 1 - 0.045 * reach * Math.cos(ph);
      var w2 = sw * squeeze;
      var x = side + (sw - w2) / 2 + dx;
      var sy = p * img.height, sH = img.height * (step / sh) + 1;
      ctx.drawImage(img, 0, sy, img.width, sH, x, topY + y, w2, step + 0.6);
      var shade = Math.cos(ph) * reach;
      ctx.fillStyle = shade > 0 ? "rgba(0,0,0," + (0.11 * shade).toFixed(3) + ")"
                                : "rgba(255,255,255," + (-0.08 * shade).toFixed(3) + ")";
      ctx.fillRect(x, topY + y, w2, step + 0.6);
    }
  }

  function loop(t) {
    for (var i = 0; i < cloths.length; i++) {
      var c = cloths[i];
      if (c.ready && c.visible && !reduce) draw(c, t);
    }
    raf(loop);
  }

  var list = document.querySelectorAll(".gd-cloth");
  for (var i = 0; i < list.length; i++) setup(list[i]);

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      for (var j = 0; j < es.length; j++) {
        for (var k = 0; k < cloths.length; k++) if (cloths[k].cv === es[j].target) {
          cloths[k].visible = es[j].isIntersecting;
          if (es[j].isIntersecting && cloths[k].ready) { size(cloths[k]); draw(cloths[k], Date.now()); }
        }
      }
    });
    for (var m = 0; m < cloths.length; m++) io.observe(cloths[m].cv);
  } else {
    for (var n = 0; n < cloths.length; n++) cloths[n].visible = true;
  }
  window.addEventListener("resize", function () { for (var q = 0; q < cloths.length; q++) if (cloths[q].ready) { size(cloths[q]); draw(cloths[q], Date.now()); } });
  // 굿즈 탭을 처음 열 때 크기를 다시 잼 (숨겨진 탭에서는 크기가 0)
  document.addEventListener("click", function (e) {
    var t = e.target; while (t && t !== document && !(t.getAttribute && t.getAttribute("data-tab"))) t = t.parentNode;
    if (t && t.getAttribute && t.getAttribute("data-tab") === "goods") setTimeout(function () {
      for (var q = 0; q < cloths.length; q++) if (cloths[q].ready) { size(cloths[q]); draw(cloths[q], Date.now()); }
    }, 30);
  });
  if (!reduce) raf(loop);

  // ── 줄마다 좌우로 넘겨 보기: 버튼 클릭 · 손가락 밀기 · 트랙패드 · 마우스로 끌기 ──
  var rows = document.querySelectorAll(".gd-row");
  for (var r = 0; r < rows.length; r++) (function (row) {
    var list = row.querySelector(".gd-list");
    var prev = row.querySelector(".gd-prev"), next = row.querySelector(".gd-next");
    function update() {
      var max = list.scrollWidth - list.clientWidth - 2;
      var nav = row.querySelector(".gd-nav");
      if (nav) nav.style.visibility = max > 2 ? "visible" : "hidden";
      if (prev) prev.disabled = list.scrollLeft <= 2;
      if (next) next.disabled = list.scrollLeft >= max;
    }
    function go(dir) {
      var item = list.querySelector(".gd-item");
      var stepW = item ? item.getBoundingClientRect().width + 24 : list.clientWidth * 0.8;
      var n = Math.max(1, Math.floor(list.clientWidth / stepW));
      list.scrollBy ? list.scrollBy({ left: dir * stepW * n, behavior: "smooth" }) : (list.scrollLeft += dir * stepW * n);
    }
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    list.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    // 마우스로 끌어서 넘기기 (터치·트랙패드는 브라우저 기본 스크롤)
    var down = false, sx = 0, sl = 0, moved = false;
    list.addEventListener("mousedown", function (e) { if (e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = list.scrollLeft; e.preventDefault(); });
    window.addEventListener("mousemove", function (e) {
      if (!down) return;
      var d = e.clientX - sx;
      if (!moved && Math.abs(d) > 4) { moved = true; list.className += " is-drag"; }
      if (moved) list.scrollLeft = sl - d;
    });
    window.addEventListener("mouseup", function () {
      if (!down) return; down = false;
      list.className = list.className.replace(/\s*is-drag/g, "");
      update();
    });
    update();
    document.addEventListener("click", function (e) {
      var t = e.target; while (t && t !== document && !(t.getAttribute && t.getAttribute("data-tab"))) t = t.parentNode;
      if (t && t.getAttribute && t.getAttribute("data-tab") === "goods") setTimeout(update, 40);
    });
  })(rows[r]);
})();
