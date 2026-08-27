import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
from xml.dom import minidom
import os
import sys
from datetime import date

# Configuration
API_BASE_URL = os.environ.get("API_BASE_URL", "https://www.uniadvisorai.com/api")  # Reads from env, falls back to production API
SITEMAP_PATH = "frontend/public/sitemap.xml"
BASE_URL = "https://www.uniadvisorai.com"
INDEXNOW_KEY = "your-indexnow-key" # Placeholder - User should update this
INDEXNOW_KEY_LOCATION = "https://www.uniadvisorai.com/your-indexnow-key.txt" # Placeholder

def fetch_json(url):
    """Helper to fetch JSON from a URL."""
    try:
        # print(f"Fetching {url}")
        with urllib.request.urlopen(url) as response:
            if response.status != 200:
                print(f"Error: Status code {response.status} for {url}")
                return None
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def fetch_all_scholarships():
    """Fetch all scholarships from the API."""
    items = []
    page = 1
    page_size = 100
    
    while True:
        try:
            params = urllib.parse.urlencode({"page": page, "page_size": page_size})
            url = f"{API_BASE_URL}/scholarships?{params}"
            data = fetch_json(url)
            
            if not data: break
            
            current_items = data.get("scholarships", [])
            if not current_items: break
            
            items.extend(current_items)
            
            if len(current_items) < page_size: break
            page += 1
        except Exception as e:
            print(f"Error in scholarship loop: {e}")
            break
            
    print(f"Fetched {len(items)} scholarships")
    return items

def fetch_all_programs():
    """Fetch all programs from the API."""
    items = []
    page = 1
    page_size = 100
    
    while True:
        try:
            params = urllib.parse.urlencode({"page": page, "page_size": page_size})
            url = f"{API_BASE_URL}/programs?{params}"
            data = fetch_json(url)
            
            if not data: break
            
            current_items = data.get("programs", [])
            if not current_items: break
            
            items.extend(current_items)
            
            if len(current_items) < page_size: break
            page += 1
        except Exception as e:
            print(f"Error in program loop: {e}")
            break
            
    print(f"Fetched {len(items)} programs")
    return items

def fetch_all_universities():
    """Fetch all universities."""
    # The /programs/universities endpoint returns all universities (or top ones). 
    # It might not be paginated based on current router implementation, 
    # but let's assume it returns a list under "universities".
    url = f"{API_BASE_URL}/programs/universities"
    data = fetch_json(url)
    if data and "universities" in data:
        items = data["universities"]
        print(f"Fetched {len(items)} universities")
        return items
    return []

def fetch_all_posts():
    """Fetch all community posts."""
    items = []
    page = 1
    limit = 100 # API uses 'limit' instead of 'page_size' for posts
    
    while True:
        try:
            params = urllib.parse.urlencode({"skip": (page-1)*limit, "limit": limit})
            url = f"{API_BASE_URL}/community/posts?{params}"
            # This endpoint returns a list directly, not a dict with "posts" key
            current_items = fetch_json(url)
            
            if not current_items: break
            if not isinstance(current_items, list): 
                print("Unexpected response format for posts")
                break
                
            items.extend(current_items)
            
            if len(current_items) < limit: break
            page += 1
        except Exception as e:
            print(f"Error in posts loop: {e}")
            break
            
    print(f"Fetched {len(items)} community posts")
    return items

def ping_indexnow(urls):
    """Ping IndexNow with the updated URLs."""
    if "your-indexnow-key" in INDEXNOW_KEY:
        print("Skipping IndexNow ping: Key not configured.")
        return

    endpoint = "https://api.indexnow.org/indexnow"
    payload = {
        "host": "uniadvisor.ai",
        "key": INDEXNOW_KEY,
        "keyLocation": INDEXNOW_KEY_LOCATION,
        "urlList": urls
    }

    try:
        req = urllib.request.Request(endpoint)
        req.add_header('Content-Type', 'application/json; charset=utf-8')
        jsondata = json.dumps(payload).encode('utf-8')
        req.add_header('Content-Length', len(jsondata))
        
        with urllib.request.urlopen(req, jsondata) as response:
            if response.status == 200:
                print(f"Successfully pinged IndexNow with {len(urls)} URLs")
            else:
                print(f"IndexNow ping failed: {response.status} {response.read().decode()}")
    except Exception as e:
        print(f"Error pinging IndexNow: {e}")


def load_existing_lastmod():
    """Load existing lastmod dates from current sitemap to preserve them."""
    existing_dates = {}
    if os.path.exists(SITEMAP_PATH):
        try:
            tree = ET.parse(SITEMAP_PATH)
            root = tree.getroot()
            ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            for url_elem in root.findall('sm:url', ns):
                loc = url_elem.find('sm:loc', ns)
                lastmod = url_elem.find('sm:lastmod', ns)
                if loc is not None and lastmod is not None:
                    existing_dates[loc.text] = lastmod.text
            print(f"Loaded {len(existing_dates)} existing lastmod dates")
        except Exception as e:
            print(f"Could not parse existing sitemap: {e}")
    return existing_dates


def update_sitemap():
    """Update the sitemap.xml with all content URLs."""
    # Ensure directory exists
    os.makedirs(os.path.dirname(SITEMAP_PATH), exist_ok=True)
    
    # Load existing lastmod dates to preserve them (Google SEO best practice)
    existing_lastmod = load_existing_lastmod()
    
    # 1. Fetch all data
    scholarships = fetch_all_scholarships()
    programs = fetch_all_programs()
    universities = fetch_all_universities()
    posts = fetch_all_posts()

    # 2. Build XML
    ET.register_namespace('', "http://www.sitemaps.org/schemas/sitemap/0.9")
    root = ET.Element('{http://www.sitemaps.org/schemas/sitemap/0.9}urlset')
    
    # Static Routes
    static_routes = [
        "", "/programs", "/universities", "/scholarships", 
        "/community", "/visa-guide", "/costofliving", 
        "/tools/cv-generator", "/tools/sop-generator",
        "/tools/survival-guides",
        "/german-grade-calculator",
        "/privacy-policy", "/terms-of-service"
    ]
    
    all_urls = []
    new_urls_count = 0

    today = date.today().isoformat()

    def add_url(path, priority="0.5", changefreq="weekly"):
        nonlocal new_urls_count
        url = f"{BASE_URL}{path}"
        all_urls.append(url)
        
        url_elem = ET.SubElement(root, "url")
        loc = ET.SubElement(url_elem, "loc")
        loc.text = url
        
        # Preserve existing lastmod dates (Google SEO best practice)
        # Only set today's date for new URLs
        lastmod_elem = ET.SubElement(url_elem, "lastmod")
        if url in existing_lastmod:
            lastmod_elem.text = existing_lastmod[url]
        else:
            lastmod_elem.text = today
            new_urls_count += 1
        
        if changefreq:
            cf = ET.SubElement(url_elem, "changefreq")
            cf.text = changefreq
            
        if priority:
            p = ET.SubElement(url_elem, "priority")
            p.text = priority

    # Add Static Routes
    for route in static_routes:
        prio = "1.0" if route == "" else "0.9"
        add_url(route, priority=prio, changefreq="daily" if route == "/community" else "weekly")

    # Add Scholarships
    for s in scholarships:
        add_url(f"/scholarships/{s['id']}", priority="0.8", changefreq="weekly")

    # Add Programs
    for p in programs:
        add_url(f"/programs/{p['id']}", priority="0.8", changefreq="weekly")

    # Add Universities
    for u in universities:
        # Assuming university names need to be URL encoded
        safe_name = urllib.parse.quote(u['name'])
        add_url(f"/universities/{safe_name}", priority="0.9", changefreq="weekly")

    # Add Posts
    for p in posts:
        add_url(f"/community/posts/{p['id']}", priority="0.7", changefreq="daily")

    # 3. Write to file
    try:
        xmlstr = minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
        # Clean up empty lines
        xmlstr = '\n'.join([line for line in xmlstr.split('\n') if line.strip()])
        
        with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
            f.write(xmlstr)
        print(f"Successfully generated sitemap with {len(all_urls)} URLs ({new_urls_count} new) at {SITEMAP_PATH}")
        
        # 4. Ping IndexNow only for new URLs (better SEO practice)
        new_urls = [url for url in all_urls if url not in existing_lastmod]
        if new_urls:
            ping_indexnow(new_urls[:10000])  # IndexNow limit per batch
        else:
            print("No new URLs to ping IndexNow")
        
    except Exception as e:
        print(f"Error writing sitemap: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Starting Sitemap Generation...")
    update_sitemap()
    print("Done.")
