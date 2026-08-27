# UniAdvisorAI: SEO & AEO Strategy Guide

This document outlines the **Search Engine Optimization (SEO)** and **Answer Engine Optimization (AEO)** best practices implemented across the UniAdvisorAI platform. It serves as a reference for how we ensure the platform ranks highly on traditional search engines (Google, Bing) and provides structured data for Answer Engines (ChatGPT, Perplexity, Google AI Overviews).

---

## 🏗️ 1. Client-Side SEO (React / Vite)

Even though UniAdvisorAI is a Client-Side Rendered (CSR) Single Page Application (SPA) built with React and Vite, we have implemented several techniques to ensure search engine crawlers can properly index dynamic content.

### Dynamic Meta Tags (`react-helmet-async`)
Every page injects its own dynamic `<title>` and `<meta>` tags using `react-helmet-async`.
- **Title Tags:** Format is `[Specific Page Name] | UniAdvisorAI` to establish brand authority.
- **Meta Descriptions:** 150-160 character summaries dynamically generated based on content (e.g., specific university requirements or scholarship details).

### Social Graph Optimization
To ensure beautiful link previews when users share programs or guides on social media:
- **Open Graph (Facebook/LinkedIn):** `og:title`, `og:description`, `og:image`, `og:url`, and `og:type` are dynamically populated.
- **Twitter Cards:** `twitter:card="summary_large_image"`, `twitter:title`, `twitter:description`, and `twitter:image`.

### Semantic HTML structure
- Strict use of one `<h1>` tag per page representing the core topic.
- Logical `<h2>` and `<h3>` heading hierarchy for crawler readability.
- `<header>`, `<main>`, `<footer>`, `<article>`, and `<nav>` tags used instead of generic `<div>` wrappers.
- Descriptive `aria-labels` and `alt` tags on all images and interactive elements for accessibility (which directly impacts SEO scores).

### Canonical URLs & Hreflang
- **Canonical Tags:** Self-referencing `<link rel="canonical">` tags prevent duplicate content penalties (e.g., if a page is accessed via URL parameters).
- **Internationalization (Future-proofing):** Architecture supports `hreflang` tags for mapping out localized guides (e.g., English vs German versions of the Visa Guide).

---

## ⚙️ 2. Server-Side SEO (FastAPI / Infrastructure)

The backend and infrastructure provide the foundation for site speed, security, and crawler accessibility.

### Automated Dynamic Sitemaps (`generate_sitemap.py`)
Because our database contains thousands of universities and programs, manual sitemaps are impossible.
- Python script automatically queries the production PostgreSQL database.
- Generates a comprehensive `sitemap.xml` including all static pages (`/`, `/programs`, `/costofliving`) and dynamic routes (`/programs/slug-name`, `/universities/uni-name`).
- Automatically pings search engines when updated.

### Server-Side Compression & Speed
Page load speed is a primary Google Core Web Vitals ranking factor.
- **GZip Middleware:** Implemented in FastAPI (`GZipMiddleware(minimum_size=500)`) to compress API JSON responses.
- **Nginx Compression:** The production Docker Nginx configuration serves the Vite frontend using Gzip/Brotli compression for static assets (`.js`, `.css`, `.html`), massively dropping Time to Interactive (TTI).

### HTTPS Enforcement & Domain Redirection
- **Middleware:** `HTTPSRedirectMiddleware` forces all traffic to secure `https://` protocols in production.
- Search engines penalize non-secure HTTP sites.
- **www vs non-www:** Infrastructure handles 301 Permanent Redirects to ensure only one canonical domain maps to the site, preserving link equity.

### Robots.txt
- Explicit `robots.txt` file served to allow Googlebot indexing of public routes (`/programs`, `/guides`) while specifically disallowing crawling of private application tracking (`/applications/*`) and user API routes (`/api/profile/*`).

---

## 🤖 3. Answer Engine Optimization (AEO)

As users shift to querying LLMs (ChatGPT, Perplexity, Gemini) instead of traditional search engines, UniAdvisorAI is optimized to be cited as a source by AI models.

### JSON-LD Structured Data (Schema.org)
We inject structured JSON data into the `<head>` of our React application to explicitly tell AI engines what our content means without them needing to parse the HTML tree.

Implemented Schemas:
- **`FAQPage` Schema:** On Visa Guides and Country pages. If a user asks ChatGPT "How to get a German student visa from India?", our perfectly formatted Q&A schema makes it highly likely the LLM will use our site as the primary citation.
- **`WebApplication` Schema:** On tools like the SOP Generator, CV Generator, and Application Tracker, defining our software's capabilities.
- **`Course` & `EducationalOrganization` Schema:** (Phase 2) Applied to individual program detail pages describing requirements, tuition, and duration.

### Direct, Conversational Formatting
- AI crawlers look for clear, definitive answers to questions. High-value concept pages (like the Grade Calculator or Blocked Account guide) use "Question → Direct Answer → Detail" paragraph structures.
- Bullet points and tables (like our Cost of Living charts) are favored by LLM extraction algorithms over dense paragraphs.

### High-Density Factual Content
- AEO relies on authority and factual density. Our database-backed approach (providing exact tuition fees, precise application deadline dates, and exact GPA formulas) signals to Answer Engines that we are a high-quality data source, rather than just a narrative blog.

---

## 📈 Future SEO Roadmap
1. **Server-Side Rendering (SSR):** Migrating to Next.js or Remix for instantaneous HTML delivery of dynamic program pages to crawlers that struggle with JavaScript.
2. **Dynamic OG Images:** Generating shareable preview images on-the-fly (e.g., an image that visually displays the Program Name and University Logo specifically for social sharing).
