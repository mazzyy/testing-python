# SEO Setup & Verification Instructions

## 1. Google Search Console & Bing Webmaster Tools

To complete your SEO setup, you need to verify your domain with search engines.

### Google Search Console (GSC)
1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add your property (`https://www.uniadvisorai.com`).
3. Choose **HTML Tag** verification method (or HTML file).
4. If **HTML Tag**:
   - Copy the meta tag (e.g., `<meta name="google-site-verification" content="..." />`).
   - Open `frontend/index.html`.
   - Paste the tag inside the `<head>` section.
5. If **HTML File**:
   - Download the file.
   - Place it in `frontend/public/`.
   - Deploy your site.

### Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add your site.
3. Similar to GSC, use **HTML Meta Tag** or **XML File** verification.
4. Add the code/file to your project as above.

## 2. IndexNow Configuration

IndexNow allows you to instantly notify search engines (Bing, Yandex, etc.) about content changes.

1. Generate an API Key at [Bing IndexNow Key Generator](https://www.bing.com/indexnow).
2. Download the key file (e.g., `your-api-key.txt`).
3. Rename it if you like, and place it in `frontend/public/`.
4. Update `generate_sitemap.py`:
   ```python
   INDEXNOW_KEY = "your-generated-key"
   INDEXNOW_KEY_LOCATION = "https://www.uniadvisorai.com/your-api-key.txt"
   ```

## 3. Generating the Sitemap

Run the sitemap generation script periodically (e.g., daily cron job) or after content updates.

1. Ensure your backend is running (`localhost:8000`).
2. Run the script:
   ```bash
   python generate_sitemap.py
   ```
3. This will create/update `frontend/public/sitemap.xml`.
4. Commit and push the `sitemap.xml` (or generate it during build/deploy).

## 4. Verification

After deployment:
1. Visit `https://www.uniadvisorai.com/robots.txt` to verify it loads.
2. Visit `https://www.uniadvisorai.com/sitemap.xml` to verify it lists your pages.
3. Submit `https://www.uniadvisorai.com/sitemap.xml` to GSC and Bing Webmaster Tools.
