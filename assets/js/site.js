/* =====================================================================
   KLAUS MUELLER — SHARED SCRIPT (all pages)
   Plain JavaScript, no libraries. Contents:
     1. Footer year
     2. Mobile menu
     3. Scroll-reveal
     4. Hero carousel (homepage only)
     5. Site search (reads assets/js/search-index.js)
   Each page sets <html data-root=""> (top level) or data-root="../"
   (one folder down) so search results link correctly.
   ===================================================================== */
(function () {
  "use strict";

  var ROOT = document.documentElement.getAttribute("data-root") || "";

  /* ---- 1. Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- 2. Mobile menu ---- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---- 3. Scroll-reveal ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("vis"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("vis"); });
  }

  /* ---- 4. Hero carousel ---- */
  var carousel = document.getElementById("heroCarousel");
  if (carousel) {
    var slides = carousel.querySelectorAll(".carousel-slide");
    var dotsBox = carousel.querySelector(".carousel-dots");
    var current = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Show slide " + (i + 1));
      b.addEventListener("click", function () { show(i); restart(); });
      dotsBox.appendChild(b);
    });
    var dots = dotsBox.querySelectorAll("button");

    function show(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === current;
        s.classList.toggle("active", on);
        s.setAttribute("aria-hidden", on ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("active", i === current);
        if (i === current) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
      });
    }
    function start() { if (!reduce && slides.length > 1) timer = window.setInterval(function () { show(current + 1); }, 5000); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    carousel.querySelector(".carousel-prev").addEventListener("click", function () { show(current - 1); restart(); });
    carousel.querySelector(".carousel-next").addEventListener("click", function () { show(current + 1); restart(); });
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);
    show(0);
    start();
  }

  /* ---- 5. Site search ---- */
  var overlay = document.getElementById("searchOverlay");
  if (!overlay) return;

  var INDEX = window.SITE_SEARCH_INDEX || [];
  var toggleBtn = document.getElementById("searchToggle");
  var navSearchBtn = document.getElementById("navSearchToggle");
  var input = document.getElementById("searchInput");
  var resultsEl = document.getElementById("searchResults");
  var closeBtn = document.getElementById("searchClose");
  var activeIndex = -1;
  var lastFocused = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (!t) return;
      out = out.replace(new RegExp("(" + escapeRe(escapeHtml(t)) + ")", "gi"), "<mark>$1</mark>");
    });
    return out;
  }
  function isTypingTarget(el) {
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }
  function resolveUrl(u) {
    return /^(https?:|mailto:|#)/i.test(u) ? u : ROOT + u;
  }

  function runSearch(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var terms = q.split(/\s+/).filter(Boolean);
    var scored = [];
    INDEX.forEach(function (item) {
      var title = item.title.toLowerCase();
      var keywords = (item.keywords || "").toLowerCase();
      var body = (item.body || "").toLowerCase();
      var type = item.type.toLowerCase();
      var score = 0, all = true;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        var inT = title.indexOf(t) > -1, inK = keywords.indexOf(t) > -1,
            inB = body.indexOf(t) > -1, inY = type.indexOf(t) > -1;
        if (!inT && !inK && !inB && !inY) { all = false; break; }
        if (inT) score += 5;
        if (inK) score += 3;
        if (inY) score += 2;
        if (inB) score += 1;
      }
      if (all) scored.push({ item: item, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 8).map(function (s) { return s.item; });
  }

  function renderResults(query) {
    activeIndex = -1;
    var terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!query.trim()) {
      resultsEl.innerHTML = '<div class="search-empty">Type to search research, people, teaching and pages.</div>';
      return;
    }
    var items = runSearch(query);
    if (!items.length) {
      resultsEl.innerHTML = '<div class="search-empty">No results for &ldquo;' + escapeHtml(query) + '&rdquo;.</div>';
      return;
    }
    resultsEl.innerHTML = items.map(function (item, i) {
      return '<a class="search-result" href="' + escapeHtml(resolveUrl(item.url)) + '" data-index="' + i + '">' +
        '<span class="result-type">' + escapeHtml(item.type) + '</span>' +
        '<h5>' + highlight(item.title, terms) + '</h5>' +
        (item.body ? '<p>' + highlight(item.body, terms) + '</p>' : "") + '</a>';
    }).join("");
  }

  function openSearch() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    window.requestAnimationFrame(function () { overlay.classList.add("open"); });
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    input.value = "";
    renderResults("");
    input.focus();
  }
  function closeSearch() {
    overlay.classList.remove("open");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    window.setTimeout(function () { overlay.hidden = true; }, 180);
    var back = lastFocused && lastFocused.getClientRects().length ? lastFocused : document.querySelector(".nav-toggle");
    if (back && typeof back.focus === "function") back.focus();
  }
  function moveActive(dir) {
    var items = resultsEl.querySelectorAll(".search-result");
    if (!items.length) return;
    activeIndex = (activeIndex + dir + items.length) % items.length;
    items.forEach(function (el, i) { el.classList.toggle("active", i === activeIndex); });
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  if (toggleBtn) toggleBtn.addEventListener("click", function () { if (overlay.hidden) openSearch(); else closeSearch(); });
  if (navSearchBtn) navSearchBtn.addEventListener("click", function () {
    if (nav) nav.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (overlay.hidden) openSearch();
  });
  closeBtn.addEventListener("click", closeSearch);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeSearch(); });
  input.addEventListener("input", function (e) { renderResults(e.target.value); });
  resultsEl.addEventListener("click", function (e) { if (e.target.closest(".search-result")) closeSearch(); });

  document.addEventListener("keydown", function (e) {
    var cmdK = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
    var slash = e.key === "/" && !isTypingTarget(document.activeElement);
    if (cmdK || slash) {
      e.preventDefault();
      if (overlay.hidden) openSearch(); else input.focus();
      return;
    }
    if (overlay.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeSearch(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
    else if (e.key === "Enter") {
      var active = resultsEl.querySelector(".search-result.active");
      if (active) { e.preventDefault(); active.click(); }
    }
  });

  overlay.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = overlay.querySelectorAll('input, button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
