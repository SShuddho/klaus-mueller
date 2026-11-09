/* =====================================================================
   search.js  -  site-wide search overlay
   Place at assets/js/search.js and include on every page:
       <script src="./assets/js/search.js" defer></script>      (root pages)
       <script src="../assets/js/search.js" defer></script>     (pages in subfolders)
   Reads assets/data/search-index.json (built by tools/build-search-index.js).

   - Opens from #searchToggle, #navSearchToggle, [data-search-open], Ctrl/Cmd+K, or "/"
   - Injects the overlay markup itself if the page doesn't contain it
   - Accent/case-insensitive, every word must match, ranked by where it matches
   - Arrow keys + Enter, Esc closes, click outside closes
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------- pure search core ------------------------- */
  var MARKS = /[\u0300-\u036f]/g;
  var MAX_RESULTS = 30;

  function fold(s) { return String(s).normalize('NFD').replace(MARKS, '').toLowerCase(); }

  // folded string + map from folded index -> original index (folding can change length)
  function foldWithMap(str) {
    var out = '', map = [];
    for (var i = 0; i < str.length; i++) {
      var f = fold(str.charAt(i));
      for (var j = 0; j < f.length; j++) { out += f.charAt(j); map.push(i); }
    }
    return { s: out, map: map };
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function prepare(data) {
    return data.map(function (e, i) {
      return {
        i: i, t: e.t, s: e.s || '', k: e.k || '', u: e.u, x: e.x || '', c: !!e.c,
        ft: fold(e.t), fs: fold(e.s || ''), fx: fold(e.x || ''), fk: fold(e.h || '')
      };
    });
  }

  // Hand-written entries (window.SITE_SEARCH_INDEX in search-index.js):
  // title/type/url/keywords/body -> t/k/u/h(hidden keywords)/x(snippet), flagged as curated
  function curatedToEntries(list) {
    return (list || []).map(function (c) {
      return { t: c.title, k: c.type || '', u: c.url, x: c.body || '', h: c.keywords || '', c: true };
    });
  }

  function tokenize(q) { return fold(q).trim().split(/\s+/).filter(Boolean); }

  function wordStart(str, idx) { return idx === 0 || /[^a-z0-9]/.test(str.charAt(idx - 1)); }

  // indexOf, except 1-2 letter tokens ("ct", "vr", "ai") must match a whole word, not any substring
  function find(str, tok, from) {
    var i = str.indexOf(tok, from || 0);
    if (tok.length > 2) return i;
    while (i !== -1) {
      var after = str.charAt(i + tok.length);
      if (wordStart(str, i) && (after === '' || /[^a-z0-9]/.test(after))) return i;
      i = str.indexOf(tok, i + 1);
    }
    return -1;
  }

  function score(e, tokens, phrase) {
    var total = 0;
    for (var n = 0; n < tokens.length; n++) {
      var tok = tokens[n], s = 0;
      var it = find(e.ft, tok);
      if (it >= 0) { s += 6; if (wordStart(e.ft, it)) s += 4; }
      if (find(e.fs, tok) >= 0) s += 3;
      if (find(e.fk, tok) >= 0) s += 3;   // hidden keywords from the curated index
      var ix = find(e.fx, tok);
      if (ix >= 0) { s += 1; if (wordStart(e.fx, ix)) s += 1; }
      if (!s) return 0;           // every word must match somewhere
      total += s;
    }
    if (tokens.length > 1) {
      if (e.ft.indexOf(phrase) >= 0) total += 8;
      else if (e.fx.indexOf(phrase) >= 0) total += 4;
    }
    if (e.k !== 'Publication') total += 1; // page content wins ties against long citation lists
    if (e.c) total += 14;                  // hand-picked entries rank above auto-indexed ones
    return total;
  }

  function search(entries, query) {
    var tokens = tokenize(query);
    if (!tokens.length) return { tokens: tokens, results: [] };
    var phrase = tokens.join(' ');
    var hits = [];
    for (var i = 0; i < entries.length; i++) {
      var sc = score(entries[i], tokens, phrase);
      if (sc) hits.push({ e: entries[i], sc: sc });
    }
    hits.sort(function (a, b) { return b.sc - a.sc || a.e.i - b.e.i; });
    return { tokens: tokens, results: hits.slice(0, MAX_RESULTS).map(function (h) { return h.e; }), total: hits.length };
  }

  function highlight(str, tokens) {
    var f = foldWithMap(str), ranges = [];
    tokens.forEach(function (tok) {
      var i = 0;
      while ((i = find(f.s, tok, i)) !== -1) {
        ranges.push([f.map[i], f.map[i + tok.length - 1] + 1]);
        i += tok.length;
      }
    });
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    ranges.forEach(function (r) {
      var last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push([r[0], r[1]]);
    });
    var html = '', pos = 0;
    merged.forEach(function (r) {
      html += esc(str.slice(pos, r[0])) + '<mark>' + esc(str.slice(r[0], r[1])) + '</mark>';
      pos = r[1];
    });
    return html + esc(str.slice(pos));
  }

  function snippet(e, tokens) {
    if (!e.x) return '';
    var f = foldWithMap(e.x), first = -1;
    tokens.forEach(function (tok) {
      var p = find(f.s, tok);
      if (p !== -1 && (first === -1 || p < first)) first = p;
    });
    var start = first === -1 ? 0 : Math.max(0, f.map[first] - 50);
    if (start > 0) { var sp = e.x.indexOf(' ', start); if (sp !== -1 && sp - start < 20) start = sp + 1; }
    var end = Math.min(e.x.length, start + 180);
    return (start > 0 ? '\u2026' : '') + highlight(e.x.slice(start, end), tokens) + (end < e.x.length ? '\u2026' : '');
  }

  var core = { fold: fold, prepare: prepare, curatedToEntries: curatedToEntries, search: search, highlight: highlight, snippet: snippet };
  if (typeof module === 'object' && module.exports) { module.exports = core; return; } // Node test hook
  if (typeof document === 'undefined' || window.__siteSearchInit) return;
  window.__siteSearchInit = true;

  /* ------------------------------ UI ------------------------------ */
  var script = document.currentScript;
  var ROOT = script && script.src ? new URL('../../', script.src) : new URL('./', location.href);
  var INDEX_URL = new URL('assets/data/search-index.json', ROOT).href;
  // Hand-written index; override with <script ... data-curated="path/from/site/root.js">
  var CURATED_URL = new URL((script && script.getAttribute('data-curated')) || 'assets/js/search-index.js', ROOT).href;

  var overlay, input, resultsEl, entries = null, loading = null, opener = null, timer = null, activeIdx = -1;

  function ensureOverlay() {
    overlay = document.getElementById('searchOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'search-overlay';
      overlay.id = 'searchOverlay';
      overlay.hidden = true;
      overlay.innerHTML =
        '<div class="search-panel" role="dialog" aria-modal="true" aria-label="Site search">' +
        '<div class="search-bar">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
        '<input type="search" id="searchInput" placeholder="Search publications, research, news\u2026" autocomplete="off" spellcheck="false" aria-controls="searchResults" />' +
        '<button class="search-close" id="searchClose" type="button" aria-label="Close search">Esc</button>' +
        '</div>' +
        '<div class="search-results" id="searchResults" role="listbox" aria-live="polite"></div>' +
        '<div class="search-hint" aria-hidden="true"><span><kbd>\u2191</kbd><kbd>\u2193</kbd> navigate</span><span><kbd>\u21B5</kbd> open</span><span><kbd>Esc</kbd> close</span></div>' +
        '</div>';
      document.body.appendChild(overlay);
    }
    input = overlay.querySelector('#searchInput');
    resultsEl = overlay.querySelector('#searchResults');
    overlay.querySelector('#searchClose').addEventListener('click', close);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 80); });
    resultsEl.addEventListener('click', function (e) { if (e.target.closest('.search-result')) close(true); });
  }

  function isOpen() { return overlay && !overlay.hidden; }

  function setToggles(expanded) {
    document.querySelectorAll('#searchToggle, #navSearchToggle, [data-search-open]').forEach(function (b) {
      b.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  function open(from) {
    if (isOpen()) { input.focus(); return; }
    opener = from || document.activeElement;
    var nav = document.querySelector('.main-nav.open');
    if (nav) { nav.classList.remove('open'); var t = document.querySelector('.nav-toggle'); if (t) t.setAttribute('aria-expanded', 'false'); }
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { overlay.classList.add('open'); });
    setToggles(true);
    input.focus();
    input.select();
    if (!entries) { message('Loading\u2026'); load().then(run, function () { fail(); }); } else run();
  }

  function close(skipFocus) {
    if (!isOpen()) return;
    overlay.classList.remove('open');
    setToggles(false);
    document.body.style.overflow = '';
    setTimeout(function () { overlay.hidden = true; }, 180);
    if (skipFocus !== true && opener && opener.focus) opener.focus();
  }

  function load() {
    if (entries) return Promise.resolve(entries);
    if (loading) return loading;
    var generated = fetch(INDEX_URL).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function () { return null; });   // the curated list still works if this fails

    loading = Promise.all([loadCurated(), generated]).then(function (res) {
      var curated = curatedToEntries(res[0]), auto = res[1] || [];
      if (!curated.length && !res[1]) throw new Error('no index');
      entries = prepare(curated.concat(auto));
      return entries;
    }).catch(function (err) { loading = null; throw err; });
    return loading;
  }

  // search-index.js assigns window.SITE_SEARCH_INDEX; load it on demand (works on file:// too)
  function loadCurated() {
    if (window.SITE_SEARCH_INDEX) return Promise.resolve(window.SITE_SEARCH_INDEX);
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = CURATED_URL;
      s.onload = function () { resolve(window.SITE_SEARCH_INDEX || []); };
      s.onerror = function () { resolve([]); };
      document.head.appendChild(s);
    });
  }

  function message(text) {
    resultsEl.innerHTML = '<div class="search-empty"></div>';
    resultsEl.firstChild.textContent = text;
    activeIdx = -1;
  }

  function fail() {
    message('The search index could not be loaded. (If you opened the page as a file, serve the site over http:// instead.)');
  }

  function run() {
    var q = input.value;
    if (!q.trim()) { message('Start typing to search publications, research, news and more.'); return; }
    if (!entries) { message('Loading\u2026'); return; }
    var res = search(entries, q);
    if (!res.results.length) { message('No results for \u201C' + q.trim() + '\u201D'); return; }
    resultsEl.innerHTML = res.results.map(function (e, i) {
      var href = new URL(e.u, ROOT).href;
      var meta = e.k + (e.s ? ' \u00B7 ' + e.s : '');
      var snip = snippet(e, res.tokens);
      return '<a class="search-result" role="option" id="sr-' + i + '" href="' + esc(href) + '">' +
        '<span class="result-type">' + esc(meta) + '</span>' +
        '<h5>' + highlight(e.t, res.tokens) + '</h5>' +
        (snip ? '<p>' + snip + '</p>' : '') + '</a>';
    }).join('');
    setActive(0);
  }

  function setActive(i) {
    var items = resultsEl.querySelectorAll('.search-result');
    if (!items.length) { activeIdx = -1; return; }
    activeIdx = (i + items.length) % items.length;
    items.forEach(function (el, n) {
      el.classList.toggle('active', n === activeIdx);
      el.setAttribute('aria-selected', n === activeIdx ? 'true' : 'false');
    });
    input.setAttribute('aria-activedescendant', items[activeIdx].id);
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function init() {
    ensureOverlay();

    // Capture phase: also stops any older click handlers on the same buttons from toggling twice
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('#searchToggle, #navSearchToggle, [data-search-open]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      if (isOpen()) close(); else open(btn);
    }, true);

    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); isOpen() ? close() : open(); return; }
      if (e.key === '/' && !typing && !isOpen() && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); return; }
      if (!isOpen()) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === 'Enter' && activeIdx >= 0) {
        var a = resultsEl.querySelectorAll('.search-result')[activeIdx];
        if (a) { e.preventDefault(); close(true); location.href = a.href; }
      } else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
