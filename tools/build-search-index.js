#!/usr/bin/env node
/* =====================================================================
   build-search-index.js
   Crawls the site's static .html pages and writes assets/data/search-index.json
   for assets/js/search.js.  No dependencies; needs Node 16+.

   Usage (from the site root, i.e. the folder that contains index.html):
       node tools/build-search-index.js          # site root = current folder
       node tools/build-search-index.js /path/to/site

   Re-run it whenever page content changes.

   What it indexes
     - Every .html page (outside assets/, node_modules/, tools/):
         each h1-h4 heading becomes a result linking to the nearest
         <section id="..."> anchor; lists with 3+ items also get one result
         per <li> (awards, courses, news items, talks ...).
     - resume.html: every publication <li> (year + Journal/Conference tag
         kept), because the publication lists live there.
     - EXTRA_SOURCES below: hook for data that is not in HTML
         (e.g. the JSON/JS data behind the Research, News and Teaching pages).
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || '.');
const OUT = path.join(ROOT, 'assets', 'data', 'search-index.json');
const SKIP_DIRS = new Set(['node_modules', '.git', 'assets', 'tools']);
const SKIP_FILES = new Set(['404.html', 'resume.html']); // resume.html has its own extractor

/* ---------------------------------------------------------------------
   EXTRA_SOURCES: add entries for content that is rendered by JavaScript.
   Each function must return an array of { t, s, k, u, x }:
     t = title, s = small label (year / section), k = type label shown in
     the result ("Publication", "News", "Course" ...),
     u = URL relative to the site root (may include #anchor), x = searchable text.
   Example (adjust to your real data files):

   () => JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/news.json'), 'utf8'))
         .map(n => ({ t: n.title, s: n.date, k: 'News', u: 'news.html', x: n.text || '' })),
   --------------------------------------------------------------------- */
const EXTRA_SOURCES = [
];

/* ------------------------------ helpers ------------------------------ */
const NAMED = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '\u2019', lsquo: '\u2018',
  ldquo: '\u201C', rdquo: '\u201D', ndash: '\u2013', mdash: '\u2014', middot: '\u00B7', hellip: '\u2026',
  odblac: '\u0151', auml: '\u00E4', ouml: '\u00F6', uuml: '\u00FC', eacute: '\u00E9', egrave: '\u00E8',
  szlig: '\u00DF', times: '\u00D7', laquo: '\u00AB', raquo: '\u00BB'
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => (n in NAMED ? NAMED[n] : m));
}

function textOf(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function readHtml(file) {
  const buf = fs.readFileSync(file);
  let s = buf.toString('utf8');
  // old pages saved as cp1252 -> decode properly; but if the file already holds literal U+FFFD bytes
  // (EF BF BD) it was re-saved as lossy UTF-8, and cp1252 would only turn those into "ï¿½"
  if (s.includes('\uFFFD') && buf.indexOf(Buffer.from([0xEF, 0xBF, 0xBD])) === -1) {
    s = new TextDecoder('windows-1252').decode(buf);
  }
  return s;
}

function shorten(s, n) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.replace(/\s+\S*$/, '') + '\u2026';
}

function removeDivBlock(html, marker) {
  let start;
  while ((start = html.indexOf(marker)) !== -1) {
    const re = /<(\/?)div\b[^>]*>/g;
    re.lastIndex = start;
    let depth = 0, m, end = -1;
    while ((m = re.exec(html))) {
      depth += m[1] ? -1 : 1;
      if (depth === 0) { end = re.lastIndex; break; }
    }
    if (end === -1) end = html.length;
    html = html.slice(0, start) + html.slice(end);
  }
  return html;
}

function cleanPage(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, ' ');
  html = html.replace(/<(script|style|svg|button|nav|header|footer|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
  html = removeDivBlock(html, '<div class="search-overlay"');
  html = removeDivBlock(html, '<div id="site-footer"');
  return html;
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.isDirectory()) {
      if (!SKIP_DIRS.has(name.name)) walk(path.join(dir, name.name), out);
    } else if (/\.html?$/i.test(name.name) && !SKIP_FILES.has(name.name)) {
      out.push(path.join(dir, name.name));
    }
  }
  return out;
}

function pageType(rel, title) {
  if (rel === 'index.html') return 'Home';
  if (rel.startsWith('research/')) return 'Research';
  if (rel.startsWith('people/')) return 'People';
  if (rel.startsWith('teaching/')) return 'Teaching';
  if (/^news/i.test(rel)) return 'News';
  if (/^about/i.test(rel)) return 'About';
  return title || 'Page';
}

/* ------------------------- generic HTML pages ------------------------- */
function indexHtmlPage(file) {
  const raw = readHtml(file);
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(raw);
  const pageTitle = titleMatch ? textOf(titleMatch[1]).replace(/\s*[-\u2013|]\s*Klaus Mueller.*$/i, '') : rel;
  const type = pageType(rel, pageTitle);
  const html = cleanPage(raw);

  const sectionIds = [];
  const idRe = /<(?:section|article)\b[^>]*\bid="([^"]+)"/gi;
  let im;
  while ((im = idRe.exec(html))) sectionIds.push({ pos: im.index, id: im[1] });

  const headings = [];
  const hRe = /<h([1-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let hm;
  while ((hm = hRe.exec(html))) {
    headings.push({ level: +hm[1], attrs: hm[2], title: textOf(hm[3]), start: hm.index, end: hRe.lastIndex });
  }

  const entries = [];
  headings.forEach((h, i) => {
    if (!h.title) return;
    const block = html.slice(h.end, i + 1 < headings.length ? headings[i + 1].start : html.length);
    const ownId = /\bid="([^"]+)"/.exec(h.attrs);
    let id = ownId ? ownId[1] : null;
    if (!id && h.level > 1) {
      for (const s of sectionIds) if (s.pos < h.start) id = s.id;
    }
    const url = rel + (id ? '#' + id : '');

    const liRe = /<li\b[\s\S]*?<\/li>/gi;
    const items = block.match(liRe) || [];
    const split = items.length >= 3;
    const remainder = textOf(split ? block.replace(liRe, ' ') : block);

    entries.push({ t: h.title, s: '', k: type, u: url, x: shorten(remainder, 900) });

    if (split) {
      items.forEach(li => {
        const txt = textOf(li);
        if (txt.length < 12) return;
        const aHref = /<a\b[^>]*\bhref="([^"#][^"]*)"/i.exec(li);
        const local = aHref && !/^(https?:|mailto:)/i.test(aHref[1]);
        entries.push({
          t: shorten(txt, 90),
          s: h.title,
          k: type,
          u: local ? path.posix.normalize(path.posix.join(path.posix.dirname(rel), aHref[1])) : url,
          x: txt.length > 90 ? shorten(txt, 600) : ''
        });
      });
    }
  });
  return entries;
}

/* ---------------------- resume.html (publications) ---------------------- */
function indexResume(file) {
  let html = readHtml(file);
  const start = html.indexOf('Publications (more info');
  const endMark = html.search(/Dissertation\s*<\/font>/i);
  if (start === -1) return [];
  html = html.slice(start, endMark > start ? endMark : html.length);

  const entries = [];
  let year = null, venue = '';
  const re = /<a\b[^>]*>([\s\S]*?)<\/a>|<strong>\s*(Journal|Conference|Abstracts|Preprints)\s*<\/strong>|<li\b[\s\S]*?<\/li>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) {
      const t = textOf(m[1]);
      const y = /^((?:19|20)\d\d)\b/.exec(t);
      if (y) { year = y[1]; venue = ''; }
      continue;
    }
    if (m[2]) { venue = m[2]; continue; }
    if (!year) continue;
    const txt = textOf(m[0]);
    if (txt.length < 40) continue;
    const q = /[\u201C"\uFFFD]([^\u201D"\uFFFD]{12,}?)[,.]?[\u201D"\uFFFD]/.exec(txt);
    entries.push({
      t: q ? q[1].trim() : shorten(txt, 100),
      s: year + (venue ? ' \u00B7 ' + venue : ''),
      k: 'Publication',
      u: 'resume.html',
      x: txt
    });
  }
  return entries;
}

/* -------------------------------- main -------------------------------- */
let all = [];
for (const f of walk(ROOT, [])) all = all.concat(indexHtmlPage(f));

const resume = path.join(ROOT, 'resume.html');
if (fs.existsSync(resume)) all = all.concat(indexResume(resume));

for (const src of EXTRA_SOURCES) {
  try { all = all.concat(src()); } catch (e) { console.warn('Extra source failed:', e.message); }
}

const seen = new Set();
all = all.filter(e => {
  const key = e.k + '|' + e.u + '|' + e.t;
  if (seen.has(key)) return false;
  seen.add(key);
  return !!e.t;
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(all));

const counts = {};
all.forEach(e => { counts[e.k] = (counts[e.k] || 0) + 1; });
console.log('Wrote ' + all.length + ' entries to ' + path.relative(process.cwd(), OUT) +
  ' (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)');
console.log(counts);
