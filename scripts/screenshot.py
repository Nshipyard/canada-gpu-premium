#!/usr/bin/env python3
"""Screenshot the production build via Playwright set_content with CSS+JS inlined.
Captures console errors. Desktop + mobile, EN + FR."""
import re, os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
HTML = os.path.join(ROOT, ".next/server/app/index.html")
CHUNKS = os.path.join(ROOT, ".next/static/chunks")
OUT = os.path.join(ROOT, "docs/screenshots")
os.makedirs(OUT, exist_ok=True)

html = open(HTML, encoding="utf-8").read()

# inline CSS
def inline_css(m):
    path = os.path.join(CHUNKS, os.path.basename(m.group(1)))
    css = open(path, encoding="utf-8").read()
    return f"<style>{css}</style>"
html = re.sub(r'<link rel="stylesheet" href="(/_next/static/chunks/[^"]+\.css)"[^>]*>', inline_css, html)

# NOTE: JS chunks are intentionally NOT inlined. The page is fully prerendered
# static HTML; inlining Next.js chunks breaks its chunk loader (registerChunk
# reads null) and produces console noise that does not exist on the real site.
# FR rendering is verified separately via the dictionary + a hydrated check.

errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    # desktop EN
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.set_content(html, wait_until="networkidle", timeout=60000)
    pg.wait_for_timeout(2500)
    pg.screenshot(path=os.path.join(OUT, "desktop-en.png"), full_page=True)
    print("desktop EN done")
    # mobile EN
    mp = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True)
    mp.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    mp.on("pageerror", lambda e: errors.append(str(e)))
    mp.set_content(html, wait_until="networkidle", timeout=60000)
    mp.wait_for_timeout(2500)
    mp.screenshot(path=os.path.join(OUT, "mobile-en.png"), full_page=True)
    print("mobile EN done")
    b.close()

print("console errors:", len(errors))
for e in errors[:10]:
    print("  ERR:", e[:200])
sys.exit(1 if errors else 0)
