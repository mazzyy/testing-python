import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const BACKEND_DATA_DIR = path.join(__dirname, '../../backend/data');
const SITEMAP_PATH = path.join(__dirname, '../public/sitemap.xml');

const SITE = 'https://www.uniadvisorai.com';
// Only update this date when content actually changes.
// Google ignores lastmod if it changes without real content updates.
const LAST_MODIFIED = '2026-02-25';

// Convert name to SEO-friendly slug: lowercase, hyphens, no special chars
function toSlug(name) {
    return slugify(name, { lower: true, strict: true });
}

// ──────────────────────────────────────────────
// Only include PUBLIC routes that render unique,
// indexable content. Exclude auth, dashboard,
// admin, and any login-gated pages.
// ──────────────────────────────────────────────
const staticRoutes = [
    { path: '/', priority: '1.0' },
    { path: '/programs', priority: '0.9' },
    { path: '/universities', priority: '0.9' },
    { path: '/scholarships', priority: '0.9' },
    { path: '/tools/survival-guides', priority: '0.8' },
    { path: '/community', priority: '0.8' },
    { path: '/visa-guide', priority: '0.8' },
    { path: '/costofliving', priority: '0.8' },
    { path: '/tools/cv-generator', priority: '0.7' },
    { path: '/tools/sop-generator', priority: '0.7' },
    { path: '/german-grade-calculator', priority: '0.7' },
    { path: '/privacy-policy', priority: '0.3' },
    { path: '/terms-of-service', priority: '0.3' },
];

// Country slugs that actually exist in frontend/src/data/countries.ts
// Only include countries that have real, rendered guide pages.
const countrySlugs = [
    'india', 'pakistan', 'china', 'usa', 'nigeria',
    'iran', 'turkey', 'russia', 'egypt', 'ukraine',
    'indonesia', 'bangladesh', 'germany', 'united-kingdom', 'canada',
];

// Cities from frontend/src/pages/CostOfLiving/CostOfLiving.jsx CITIES_DATA
const costOfLivingCities = [
    'Munich', 'Frankfurt', 'Stuttgart', 'Hamburg', 'Düsseldorf',
    'Berlin', 'Cologne', 'Heidelberg', 'Freiburg', 'Bonn',
    'Aachen', 'Münster', 'Hanover', 'Nuremberg', 'Göttingen',
    'Marburg', 'Tübingen', 'Leipzig', 'Dresden', 'Jena',
    'Halle', 'Magdeburg', 'Greifswald', 'Chemnitz', 'Rostock',
];

async function generateSitemap() {
    console.log('Generating sitemap...');
    const urls = [];

    // 1. Static pages
    for (const route of staticRoutes) {
        urls.push({ loc: `${SITE}${route.path}`, priority: route.priority });
    }

    // 2. Country guide pages
    for (const slug of countrySlugs) {
        urls.push({
            loc: `${SITE}/study-in-germany/from/${slug}`,
            priority: '0.7',
        });
    }

    // 3. Cost of living city pages
    for (const city of costOfLivingCities) {
        urls.push({
            loc: `${SITE}/cost-of-living/${encodeURIComponent(city.toLowerCase())}`,
            priority: '0.7',
        });
    }

    // 4. Scholarship detail pages — fetch all from API
    try {
        const API_BASE = process.env.API_URL || 'https://www.uniadvisorai.com/api';
        let page = 1;
        let totalScholarships = 0;
        let hasMore = true;

        while (hasMore) {
            const res = await fetch(`${API_BASE}/scholarships?page=${page}&page_size=100`);
            const data = await res.json();
            const items = data.scholarships || [];

            for (const s of items) {
                if (s.id) {
                    urls.push({
                        loc: `${SITE}/scholarships/${s.id}`,
                        priority: '0.6',
                    });
                    totalScholarships++;
                }
            }

            hasMore = items.length === 100 && totalScholarships < (data.total || 0);
            page++;
        }
        console.log(`  ${totalScholarships} scholarships found (from API)`);
    } catch (error) {
        // Fallback: read from JSON file if API is unavailable
        console.warn('API unavailable, falling back to JSON for scholarships');
        try {
            const scholarshipPath = path.join(BACKEND_DATA_DIR, 'daad_scholarships_detailed.json');
            if (fs.existsSync(scholarshipPath)) {
                const scholarships = JSON.parse(fs.readFileSync(scholarshipPath, 'utf-8'));
                if (Array.isArray(scholarships)) {
                    console.log(`  ${scholarships.length} scholarships found (from JSON fallback)`);
                    for (const s of scholarships) {
                        if (s.id) {
                            urls.push({ loc: `${SITE}/scholarships/${s.id}`, priority: '0.6' });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error reading scholarship data:', e.message);
        }
    }

    // 5. Dynamic program + university pages
    // Prefer API (has pre-computed unique slugs) over JSON (needs slugify, may have duplicates)
    try {
        const API_BASE = process.env.API_URL || 'https://www.uniadvisorai.com/api';
        let page = 1;
        let totalPrograms = 0;
        let hasMore = true;
        const uniqueUniversities = new Set();

        while (hasMore) {
            const res = await fetch(`${API_BASE}/programs?page=${page}&page_size=100`);
            const data = await res.json();
            const items = data.programs || [];

            for (const prog of items) {
                if (prog.slug) {
                    urls.push({
                        loc: `${SITE}/programs/${prog.slug}`,
                        priority: '0.6',
                    });
                    totalPrograms++;
                }
                if (prog.university_name) {
                    uniqueUniversities.add(prog.university_name);
                }
            }

            hasMore = items.length === 100 && totalPrograms < (data.total || 0);
            page++;
        }

        console.log(`  ${totalPrograms} programs found (from API)`);

        console.log(`  ${uniqueUniversities.size} unique universities`);
        for (const uniName of uniqueUniversities) {
            urls.push({
                loc: `${SITE}/universities/${toSlug(uniName)}`,
                priority: '0.7',
            });
        }
    } catch (error) {
        // Fallback: read from JSON and generate slugs
        console.warn('API unavailable for programs, falling back to JSON');
        try {
            const dataPath = path.join(BACKEND_DATA_DIR, 'program_details.json');
            if (fs.existsSync(dataPath)) {
                const programs = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
                const uniqueUniversities = new Set();
                const seenSlugs = new Set();

                if (Array.isArray(programs)) {
                    for (const prog of programs) {
                        if (prog.program_name && prog.university_name) {
                            // Include university in slug for uniqueness
                            let slug = toSlug(`${prog.program_name} ${prog.university_name}`);
                            if (seenSlugs.has(slug)) {
                                slug = `${slug}-${prog.program_id || Date.now()}`;
                            }
                            seenSlugs.add(slug);
                            urls.push({ loc: `${SITE}/programs/${slug}`, priority: '0.6' });
                        }
                        if (prog.university_name) {
                            uniqueUniversities.add(prog.university_name);
                        }
                    }
                    console.log(`  ${seenSlugs.size} programs found (from JSON fallback)`);
                    for (const uniName of uniqueUniversities) {
                        urls.push({ loc: `${SITE}/universities/${toSlug(uniName)}`, priority: '0.7' });
                    }
                }
            }
        } catch (e) {
            console.error('Error reading program data:', e.message);
        }
    }

    // Build XML — Google best practices:
    //   • <loc> is required
    //   • <lastmod> is the only optional tag Google actually uses
    //   • <changefreq> and <priority> are ignored by Google, omit them
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const u of urls) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(u.loc)}</loc>\n`;
        xml += `    <lastmod>${LAST_MODIFIED}</lastmod>\n`;
        xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`✅ Sitemap generated: ${urls.length} URLs → ${SITEMAP_PATH}`);
}

// Escape special XML characters in URLs
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

generateSitemap();
