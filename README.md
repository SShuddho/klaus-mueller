# Klaus Mueller — Academic Website

Personal academic website for **Prof. Dr. Klaus Mueller**, Professor of Computer Science at Stony Brook University and Senior Scientist at Brookhaven National Laboratory.

> **Status:** Work in progress. This repository is shared with Prof. Mueller for review via GitHub Pages.

**Live preview:** `https://sshuddho.github.io/klaus-mueller/`

---

## Overview

A fast, dependency-free static site built with plain HTML, CSS, and vanilla JavaScript. There is no framework, no build step, and no database, so it can be hosted anywhere and edited with any text editor.

| Page | Purpose |
|---|---|
| `index.html` | Homepage with bio, research cards, and live News and Teaching previews |
| `research/` | Publications browsable by research area |
| `people/` | Students, alumni, and lab events |
| `teaching/` | Courses |
| `news.html` | News items |
| `about.html` | Biography, education, appointments, awards, service, and talks |
| `resume.html` | CV with publications by year |

## Project structure

```
├── index.html, about.html, news.html, resume.html
├── research/
├── people/
├── teaching/
├── partials/footer.html                # shared footer
└── assets/
    ├── css/style.css                   # all styling
    ├── img/                            # images
    └── js/
        ├── research.js                 # all publication data
        ├── recent-news.js              # homepage news box (reads news.html)
        ├── teaching-preview.js         # homepage teaching box (reads teaching/index.html)
        ├── footer.js                   # injects the footer on every page
        └── site.js                     # navigation and shared behavior
```

## How it works

- **Single source of truth.** Publications live only in `assets/js/research.js`. The homepage News box pulls the top 3 items from `news.html`, the Teaching box pulls the first 4 courses from `teaching/index.html`, and the footer comes from `partials/footer.html`.
- **Responsive.** Works from phone to desktop, with a collapsible navigation menu.
- **Accessible and SEO-ready.** Semantic HTML, ARIA labels, and per-page meta descriptions.

## Run locally

The homepage and footer load content with JavaScript, so opening files by double-click will not work. Use a local server instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or use the **Live Server** extension in VS Code.

## Editing the site

Prof. Mueller can update everything without programming knowledge by following **[WEBSITE_EDITING_GUIDE.md](WEBSITE_EDITING_GUIDE.md)**. It covers adding publications, news, courses, and people, changing roles and text, handling images, testing, and troubleshooting.

The key rule: copy an existing block, change the words, and never rename `id`s, `class`es, or `<script>` tags.

## Deployment

The site is deployed with **GitHub Pages** from the `main` branch (root). Any push to `main` updates the live site within a minute or two. For another host, upload the folder contents as they are.

---

**Developed by *Safius Sakib Shuddho* for Prof. Dr. Klaus Mueller.**
