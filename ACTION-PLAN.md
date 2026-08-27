# UniAdvisorAI — SEO Action Plan (prioritized)

Companion to FULL-AUDIT-REPORT.md · July 8, 2026
Priorities: **Critical** = blocks indexing/wastes existing traffic, fix now · **High** = significant ranking impact, fix within 1 week · **Medium** = within 1 month · **Low** = backlog.

---

## CRITICAL — do this week

### C1. Deploy the missing image assets — 30 min
`frontend/public/og-image.png`, `logo.png`, `apple-touch-icon.png` are untracked locally and serve HTML in production.
- [ ] `git add frontend/public/*.png` → commit → deploy
- [ ] Verify: `curl -sI https://www.uniadvisorai.com/og-image.png` returns `image/png`
- [ ] Re-scrape: Facebook Sharing Debugger, then test-paste the URL in Telegram and WhatsApp
- **Payback: immediate — every social share starts showing a preview card**

### C2. Remove the hardcoded homepage canonical — 1 h
`frontend/index.html` ships `<link rel="canonical" href="https://www.uniadvisorai.com/" />` on every route, telling crawlers all 2,969 URLs are duplicates of the homepage.
- [ ] Delete the static canonical (and static og:url / twitter:url) from index.html — Helmet already sets them per route
- [ ] Long-term: per-URL canonical in prerendered HTML (C3)

### C3. Prerender all sitemap URLs — 2–4 days (engineering)
The single highest-leverage fix; unlocks on-page, schema, AI-readiness and internal-linking scores simultaneously.
- [ ] Build-time prerendering via vike / vite-plugin-ssr (react-snap acceptable as v1)
- [ ] Stopgap alternative: Prerender.io free tier (1,000 pages — prioritize programs with fee data, scholarships, cities, countries, tools)
- [ ] Each prerendered page must contain: unique title/description, self-canonical, H1, visible body content, per-page JSON-LD, internal links
- [ ] Verify: `curl -A "Googlebot" https://uniadvisorai.com/programs/<slug>` shows real content; repeat with `-A "GPTBot"`

### C4. Consolidate hosts: 301 non-www → www — 1 h
Both hosts serve 200; the http→https redirect even lands on non-www while canonical/sitemap say www.
- [ ] 301 redirect `uniadvisorai.com/*` → `https://www.uniadvisorai.com/*` (server/router level)
- [ ] Confirm `http://` variants chain to `https://www.` in ≤2 hops

### C5. Enable compression + asset caching — 2 h (or 30 min with Cloudflare)
~800 KB of JS/CSS ships uncompressed with no cache headers.
- [ ] Option A (recommended): put Cloudflare free tier in front of Heroku → brotli, CDN edge cache, HTTP/3, free WAF
- [ ] Option B: compression middleware in the server + `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` (filenames are already hashed)

---

## HIGH — within 1 week

### H1. Real 404s — 2 h
- [ ] Unknown routes return HTTP 404 (server/prerender layer), not 200 + app shell
- [ ] Static-file misses (e.g. missing .png) must not fall through to the HTML catch-all
- [ ] NotFound component gets `<meta name="robots" content="noindex">` as belt-and-braces

### H2. Deploy the pending freshness fixes — 30 min
- [ ] The "2025 → 2026" title updates sit uncommitted in the repo — commit and deploy
- [ ] Align claims with inventory (10,000+ programs vs 2,514 program pages; 200+ scholarships vs 168) — use real numbers; they're impressive enough and AI engines fact-check

### H3. Search engine plumbing — 2 h
- [ ] Google Search Console: verify domain property, submit sitemap, request indexing for top 20 URLs
- [ ] Bing Webmaster: import from GSC; enable IndexNow
- [ ] Get a free PageSpeed Insights API key → baseline CWV, re-measure after C5
- [ ] Ahrefs Webmaster Tools (free) for backlink monitoring — Common Crawl currently shows zero referring domains

### H4. Sitemap hygiene — 3 h
- [ ] Real per-URL `lastmod` from database timestamps (currently all 2026-02-25)
- [ ] Split into sitemap-programs.xml, sitemap-universities.xml, sitemap-scholarships.xml, sitemap-pages.xml under a sitemap index → per-type indexation reporting in GSC
- [ ] Regenerate automatically on deploy / weekly cron

### H5. Security & correctness headers — 1 h
- [ ] `Content-Type: text/html; charset=utf-8`
- [ ] `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, CSP with `frame-ancestors 'self'`, `Permissions-Policy` (minimal)

### H6. Real llms.txt — 1 h
- [ ] Serve an actual `/llms.txt` (static file, must bypass the SPA catch-all): what the site is, key data pages, tools, contact — plain text/markdown

---

## MEDIUM — within 1 month

### M1. Schema at scale (server-visible, post-C3) — 2–3 days
- [ ] `Course`/`EducationalOccupationalProgram` on 2,514 program pages (name, provider, fees, language, deadline)
- [ ] `FAQPage` on city, country and scholarship pages (3–6 real Q&As each, from community questions)
- [ ] `HowTo` + `WebApplication` on tool pages; `BreadcrumbList` sitewide
- [ ] Fix Organization.logo (works after C1); validate samples with Google Rich Results Test

### M2. Internal linking modules — 2 days
- [ ] Program page → city cost page, 3 related scholarships, grade calculator, university page
- [ ] Tool results → 3 relevant programs; city page → programs in that city
- [ ] Every page reachable within 3 clicks of home once rendered HTML exists

### M3. Thin-content mitigation on program pages — ongoing
- [ ] Add computed unique data per page: cost context from city data, admission-requirement summary, deadline countdown, "similar programs" — anything that differentiates 2,514 templates
- [ ] `noindex` any page with near-zero unique data until enriched

### M4. Editorial layer — 2 posts/week (marketing playbook Part 2)
- [ ] Launch /blog or /guides targeting the query clusters the database pages can't catch (blocked account, APS, visa checklists, VPD)
- [ ] Each post: answer-first format, FAQ schema, ≥3 internal links, dated "last updated"

### M5. E-E-A-T signals — 1 day
- [ ] Real About page (who built this, why, data sources and update cadence)
- [ ] Author/reviewer attribution on guides; visible "data last updated" stamps on program/scholarship pages

### M6. Backlink acquisition — ongoing (playbook Part 3)
- [ ] From zero referring domains: directories week 1–2 (30–40 links), embeddable calculator, 3 statistics pages, Product Hunt launch month 2 — target 100 referring domains by month 6

---

## LOW — backlog

- [ ] Image alt-text audit (only possible after prerendering ships)
- [ ] OG locale variants and og:image per page type (city pages get city images)
- [ ] hreflang — only if/when localized versions (de, ur, hi) launch; skip for now
- [ ] Organization `sameAs` links once social profiles have content
- [ ] Favicon PNG fallbacks for older devices/apps
- [ ] Web-vitals RUM reporting into GA4 to replace lab-only estimates

---

## Measurement cadence

| Check | Where | Frequency | Target |
|---|---|---|---|
| Indexed pages | GSC → Pages | Weekly | 500+ by end of M2; 1,500+ by M4 |
| Referring domains | Ahrefs WMT | Weekly | 12 (M1) → 38 (M2) → 100 (M6) |
| CWV (mobile) | PSI API | After C5, then monthly | LCP <2.5s, INP <200ms, CLS <0.1 |
| AI citations | Ask ChatGPT/Perplexity 5 test questions | Monthly | First citation by M4 |
| Social preview | Telegram/WhatsApp paste test | After C1, after any head change | Card renders with image |

**Expected score trajectory: 40 → ~64 after Critical items → ~81 after the full plan (week 8).**
