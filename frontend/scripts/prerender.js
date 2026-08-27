/**
 * Prerender Script for SEO-critical pages
 * 
 * This script prerenders specific routes after the Vite build,
 * creating static HTML files with full content for search engine crawlers.
 * 
 * Benefits:
 * - Google/Bing see fully rendered HTML (no JS execution needed)
 * - Social media previews work perfectly (OG tags are in HTML)
 * - Faster First Contentful Paint for landing pages
 * - Hydration kicks in for full React interactivity
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes to prerender (SEO-critical public pages)
const ROUTES_TO_PRERENDER = [
  '/',                          // Landing page (highest priority)
  '/programs',                  // Program listing
  '/universities',              // University listing
  '/scholarships',              // Scholarship listing
  '/tools/survival-guides',     // Country survival guides hub
  '/visa-guide',                // Visa guide
  '/costofliving',              // Cost of living
  '/german-grade-calculator',   // Grade calculator tool
  '/community',                 // Community forum
  '/privacy-policy',            // Legal
  '/terms-of-service',          // Legal
];

const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 4173;

// Simple static file server for serving the built SPA
function createStaticServer() {
  return http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // For SPA routing, serve index.html for non-existent paths
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

async function prerender() {
  console.log('🚀 Starting prerender process...\n');

  // Check if dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist directory not found. Run build first.');
    process.exit(1);
  }

  // Start static server
  const server = createStaticServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`📡 Preview server running at http://localhost:${PORT}\n`);

  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let successCount = 0;
  let errorCount = 0;

  for (const route of ROUTES_TO_PRERENDER) {
    const page = await browser.newPage();
    const url = `http://localhost:${PORT}${route}`;
    
    try {
      console.log(`⏳ Prerendering: ${route}`);
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate and wait for network idle (all async data loaded)
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Wait for React to hydrate and render
      await page.waitForSelector('#root > *:not(.app-loader)', { timeout: 15000 });
      
      // Additional wait for animations/lazy content
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Remove the loading spinner from prerendered HTML
      await page.evaluate(() => {
        const loader = document.querySelector('.app-loader');
        if (loader) loader.remove();
      });

      // Get the fully rendered HTML
      let html = await page.content();
      
      // Add prerender indicator comment
      html = html.replace('<head>', '<head>\n  <!-- Prerendered by UniAdvisorAI build process -->');

      // Save the prerendered HTML
      if (route === '/') {
        fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
        console.log(`✅ Prerendered: / → index.html`);
      } else {
        // Create directory structure for clean URLs
        const dirPath = path.join(DIST_DIR, route);
        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(path.join(dirPath, 'index.html'), html);
        console.log(`✅ Prerendered: ${route} → ${route}/index.html`);
      }

      successCount++;
    } catch (error) {
      console.error(`❌ Failed to prerender ${route}:`, error.message);
      errorCount++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  console.log(`\n📊 Prerender Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📁 Output: ${DIST_DIR}\n`);

  if (errorCount > 0 && successCount === 0) {
    process.exit(1);
  }
}

prerender().catch((error) => {
  console.error('Fatal prerender error:', error);
  process.exit(1);
});
