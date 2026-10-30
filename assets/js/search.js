(function () {
  // ---- 1. The index. Edit/extend this as content grows. ----
  const INDEX = [
    {
      title: "Visual Analytics",
      type: "Research",
      url: "#",
      keywords: "visual analytics data reasoning decision making interactive",
      body: "Transforming complex data into interactive visual representations to support reasoning and decision making."
    },
    {
      title: "Explainable & Responsible AI",
      type: "Research",
      url: "#",
      keywords: "xai explainable responsible ai trust interpretable",
      body: "Building AI systems that people can understand, trust, and rely on."
    },
    {
      title: "AI for Science & Medicine",
      type: "Research",
      url: "#",
      keywords: "ai science medicine medical imaging discovery",
      body: "Applying visualization and AI to advance discovery in science, medicine, and engineering."
    },
    {
      title: "Agentic AI",
      type: "Research",
      url: "#",
      keywords: "agentic ai agents autonomous perceive reason act",
      body: "Designing autonomous agents that perceive, reason, and act in the real world."
    },
    {
      title: "Five papers accepted at IEEE VIS 2025",
      type: "News",
      url: "https://example.com/news-1",
      keywords: "ieee vis 2025 papers visualization conference",
      body: "Five papers accepted at IEEE VIS 2025."
    },
    {
      title: "MisVisFix: detecting, explaining, and correcting misleading visualizations using LLMs",
      type: "News",
      url: "https://example.com/news-2",
      keywords: "misvisfix misleading visualization llm tvcg dashboard",
      body: "An interactive dashboard for detecting, explaining, and correcting misleading visualizations using LLMs."
    },
    {
      title: "What is the Color of Serendipity? Semantically resonant color generation with language models",
      type: "News",
      url: "https://example.com/news-3",
      keywords: "color serendipity language models tvcg generation",
      body: "Semantically resonant color generation with language models."
    },
    {
      title: "CSE 564 Spring 2025 — student project showcase playlist",
      type: "Teaching",
      url: "https://example.com/news-4",
      keywords: "cse 564 teaching spring 2025 student projects showcase",
      body: "Student project showcase playlist for CSE 564 Spring 2025."
    },
    {
      title: "Introduction to Visualization",
      type: "Teaching",
      url: "https://www3.cs.stonybrook.edu/~mueller/teaching/index.html",
      keywords: "cse visualization course teaching fall 2026",
      body: "Learn how to design, analyze, and build effective visualizations for real-world data. Fall 2026."
    },
    {
      title: "Publications",
      type: "Page",
      url: "https://www3.cs.stonybrook.edu/~mueller/research/index.html",
      keywords: "publications papers research archive scholar",
      body: "300+ peer-reviewed publications from 1993 to present."
    },
    {
      title: "Projects",
      type: "Page",
      url: "https://www3.cs.stonybrook.edu/~mueller/#projects",
      keywords: "projects research grants",
      body: "Funded research projects and collaborations."
    },
    {
      title: "People",
      type: "Page",
      url: "https://www3.cs.stonybrook.edu/~mueller/people/",
      keywords: "people lab students alumni vai",
      body: "Current students and alumni of the VAI Lab."
    },
    {
      title: "About / CV",
      type: "Page",
      url: "#",
      keywords: "about bio cv biography awards appointments",
      body: "Full academic biography, appointments, awards, and service."
    },
    {
      title: "Contact",
      type: "Page",
      url: "mailto:mueller@cs.stonybrook.edu",
      keywords: "contact email mueller stony brook",
      body: "mueller@cs.stonybrook.edu"
    },
    {
      title: "Brookhaven National Laboratory",
      type: "Affiliation",
      url: "https://www.bnl.gov/",
      keywords: "brookhaven national laboratory bnl senior scientist",
      body: "Senior Scientist, Brookhaven National Laboratory."
    },
    {
      title: "Stony Brook University",
      type: "Affiliation",
      url: "https://www.stonybrook.edu/",
      keywords: "stony brook university computer science professor",
      body: "Professor, Department of Computer Science, Stony Brook University."
    }
  ];

  // ---- 2. DOM ----
  const toggleBtn = document.getElementById("searchToggle");
  const navSearchBtn = document.getElementById("navSearchToggle");
  const overlay = document.getElementById("searchOverlay");
  const input = document.getElementById("searchInput");
  const resultsEl = document.getElementById("searchResults");
  const closeBtn = document.getElementById("searchClose");

  let activeIndex = -1;
  let currentItems = [];
  let lastFocused = null;

  // ---- 3. Helpers ----
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function highlight(text, terms) {
    let out = escapeHtml(text);
    terms.forEach((t) => {
      if (!t) return;
      const re = new RegExp("(" + escapeRe(t) + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  function isTypingTarget(el) {
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }

  // ---- 4. Search ----
  function runSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const terms = q.split(/\s+/).filter(Boolean);
    const scored = [];

    for (const item of INDEX) {
      const title = item.title.toLowerCase();
      const keywords = (item.keywords || "").toLowerCase();
      const body = (item.body || "").toLowerCase();
      const type = item.type.toLowerCase();

      let score = 0;
      let matchedAll = true;

      for (const t of terms) {
        const inTitle = title.includes(t);
        const inKeywords = keywords.includes(t);
        const inBody = body.includes(t);
        const inType = type.includes(t);

        if (!inTitle && !inKeywords && !inBody && !inType) {
          matchedAll = false;
          break;
        }
        if (inTitle) score += 5;
        if (inKeywords) score += 3;
        if (inType) score += 2;
        if (inBody) score += 1;
      }

      if (matchedAll) scored.push({ item, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((s) => s.item);
  }

  // ---- 5. Render ----
  function renderResults(query) {
    activeIndex = -1;
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    if (!query.trim()) {
      currentItems = [];
      resultsEl.innerHTML =
        '<div class="search-empty">Type to search research, publications, news, and teaching.</div>';
      return;
    }

    currentItems = runSearch(query);

    if (!currentItems.length) {
      resultsEl.innerHTML =
        `<div class="search-empty">No results for &ldquo;${escapeHtml(query)}&rdquo;.</div>`;
      return;
    }

    resultsEl.innerHTML = currentItems
      .map((item, i) => `
        <a class="search-result" href="${escapeHtml(item.url)}" data-index="${i}">
          <span class="result-type">${escapeHtml(item.type)}</span>
          <h5>${highlight(item.title, terms)}</h5>
          ${item.body ? `<p>${highlight(item.body, terms)}</p>` : ""}
        </a>`)
      .join("");
  }

  // ---- 6. Open / close ----
  function openSearch() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("open"));
    toggleBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    input.value = "";
    renderResults("");
    input.focus();
  }

  function closeSearch() {
    overlay.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    window.setTimeout(() => { overlay.hidden = true; }, 180);
    // If the opener is no longer rendered (e.g. the closed mobile menu), fall back to the hamburger button.
    const back = lastFocused && lastFocused.getClientRects().length
      ? lastFocused
      : document.querySelector(".nav-toggle");
    if (back && typeof back.focus === "function") back.focus();
  }

  // ---- 7. Keyboard nav inside results ----
  function moveActive(dir) {
    const items = resultsEl.querySelectorAll(".search-result");
    if (!items.length) return;
    activeIndex = (activeIndex + dir + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  // ---- 8. Wire up ----
  toggleBtn.addEventListener("click", () => {
    if (overlay.hidden) openSearch(); else closeSearch();
  });

  // Search button inside the mobile menu: close the dropdown, then open the same overlay.
  navSearchBtn.addEventListener("click", () => {
    const mainNav = document.querySelector(".main-nav");
    const menuBtn = document.querySelector(".nav-toggle");
    mainNav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    if (overlay.hidden) openSearch();
  });

  closeBtn.addEventListener("click", closeSearch);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSearch();
  });

  input.addEventListener("input", (e) => renderResults(e.target.value));

  resultsEl.addEventListener("click", (e) => {
    if (e.target.closest(".search-result")) closeSearch();
  });

  // Global shortcuts
  document.addEventListener("keydown", (e) => {
    const cmdK = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
    const slash = e.key === "/" && !isTypingTarget(document.activeElement);

    if (cmdK || slash) {
      e.preventDefault();
      if (overlay.hidden) openSearch();
      else input.focus();
      return;
    }

    if (overlay.hidden) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === "Enter") {
      const active = resultsEl.querySelector(".search-result.active");
      if (active) {
        e.preventDefault();
        active.click();
      }
    }
  });

  // Focus trap while overlay is open
  overlay.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusables = overlay.querySelectorAll(
      'input, button, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
})();
