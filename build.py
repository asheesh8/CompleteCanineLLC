#!/usr/bin/env python3
"""
Complete Canine — static site builder.

Assembles the pages in _pages/ with the shared chrome (head, nav, drawer,
footer, scripts) and the inline SVG sprite, and writes plain .html files to
the project root. No dependencies — run `python3 build.py`.

Each file in _pages/ starts with a small front-matter block:

    ---
    title: ...
    description: ...
    nav: boarding
    ---
    <main> ... </main>
"""

import os
import re
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGES = os.path.join(ROOT, "_pages")
PARTIALS = os.path.join(ROOT, "_partials")

SITE = "https://completecanineinc.com"

# ---------------------------------------------------------------- business data
BIZ = {
    "name": "Complete Canine",
    "phone": "603-675-5901",
    "tel": "+16036755901",
    "email": "info@completecanineinc.com",
    "street": "593 Route 12A",
    "city": "Plainfield",
    "state": "NH",
    "zip": "03781",
    "landmark": "4.7 miles south of the West Lebanon Walmart",
    "lat": "43.539",
    "lng": "-72.324",
}

NAV_ITEMS = [
    ("home", "Home", "index.html"),
    ("boarding", "Boarding", "boarding.html"),
    ("daycare", "Daycare", "daycare.html"),
    ("grooming", "Grooming", "grooming.html"),
    ("booking", "Book", "booking.html"),
    ("about", "About", "about.html"),
]


def partial(name):
    with open(os.path.join(PARTIALS, name), encoding="utf-8") as fh:
        return fh.read()


# ---------------------------------------------------------------- chrome
def head(title, desc, canonical, robots=""):
    robots_meta = f'<meta name="robots" content="{robots}">\n' if robots else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
{robots_meta}<link rel="canonical" href="{SITE}/{canonical}">
<meta name="theme-color" content="#a8db5a">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Complete Canine">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE}/{canonical}">
<meta property="og:image" content="{SITE}/assets/img/HOMEboarding.jpg">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="assets/img/favicon_completecanine.gif">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
{partial('sprite.html')}
"""


def logo(cls=""):
    return f"""<a class="logo {cls}" href="index.html" aria-label="Complete Canine — home">
  <img class="logo__img" src="assets/img/complete-canine-logo.png" alt="Complete Canine" width="470" height="174">
</a>"""


def nav(active):
    def link(key, label, href):
        cls = ' class="is-active"' if key == active else ""
        return f'    <a href="{href}"{cls}>{label}</a>'

    links = "\n".join(link(*item) for item in NAV_ITEMS)
    return f"""<header class="nav">
  <div class="nav__wrap">
    <div class="nav__inner">
      {logo()}
      <nav class="nav__links" aria-label="Main">
{links}
      </nav>
      <a class="nav__tel" href="tel:{BIZ['tel']}">
        <svg><use href="#i-phone"></use></svg>{BIZ['phone']}
      </a>
      <a class="btn btn--primary btn--sm nav__cta" href="booking.html">
        Book a Stay <span class="btn__ico"><svg><use href="#i-arrow"></use></svg></span>
      </a>
      <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<div class="drawer" id="drawer">
  <a class="drawer__link" href="index.html">Home</a>
  <a class="drawer__link" href="boarding.html">Boarding <span>$28/night</span></a>
  <a class="drawer__link" href="daycare.html">Daycare <span>$18/day</span></a>
  <a class="drawer__link" href="grooming.html">Grooming</a>
  <a class="drawer__link" href="booking.html">Book <span>Request care</span></a>
  <a class="drawer__link" href="about.html">About &amp; Contact</a>
  <div class="drawer__foot">
    <a class="btn btn--primary" href="booking.html">
      Start a booking <span class="btn__ico"><svg><use href="#i-arrow"></use></svg></span>
    </a>
    <a class="btn btn--ghost" href="mailto:{BIZ['email']}">
      Email us <span class="btn__ico"><svg><use href="#i-mail"></use></svg></span>
    </a>
  </div>
</div>
"""


def footer():
    """Compact one-line bar. Lives INSIDE .screen so it pins to the
    bottom of the viewport instead of adding page height."""
    return f"""  <footer class="sfoot">
    <div class="sfoot__inner">
      <span>&copy; <span data-year>2026</span> <b>Complete Canine, Inc.</b></span>
      <span class="sfoot__sep">&middot;</span>
      <span>{BIZ['street']}, {BIZ['city']}, {BIZ['state']} {BIZ['zip']}</span>
      <span class="sfoot__right">
        <a href="mailto:{BIZ['email']}">{BIZ['email']}</a>
        <a href="tel:{BIZ['tel']}"><b>{BIZ['phone']}</b></a>
        <span>Mon–Fri 7:30–6:00 &middot; Sat–Sun 8:30–4:00</span>
      </span>
    </div>
  </footer>"""


def schema():
    return f"""<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "AnimalShelter",
  "additionalType": "https://schema.org/LocalBusiness",
  "name": "Complete Canine",
  "url": "{SITE}",
  "telephone": "{BIZ['phone']}",
  "email": "{BIZ['email']}",
  "image": "{SITE}/assets/img/HOMEboarding.jpg",
  "description": "Dog and cat boarding, dog daycare and full-service grooming in Plainfield, New Hampshire, serving the Upper Valley of NH and VT.",
  "address": {{
    "@type": "PostalAddress",
    "streetAddress": "{BIZ['street']}",
    "addressLocality": "{BIZ['city']}",
    "addressRegion": "{BIZ['state']}",
    "postalCode": "{BIZ['zip']}",
    "addressCountry": "US"
  }},
  "geo": {{ "@type": "GeoCoordinates", "latitude": {BIZ['lat']}, "longitude": {BIZ['lng']} }},
  "openingHoursSpecification": [
    {{ "@type": "OpeningHoursSpecification",
       "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
       "opens": "07:30", "closes": "18:00" }},
    {{ "@type": "OpeningHoursSpecification",
       "dayOfWeek": ["Saturday","Sunday"], "opens": "08:30", "closes": "16:00" }}
  ],
  "areaServed": ["Plainfield NH","Lebanon NH","Hanover NH","West Lebanon NH","Cornish NH","Norwich VT","White River Junction VT","Windsor VT"]
}}
</script>"""


def scripts():
    # No scroll libraries by design — the site does not scroll.
    return f"""{schema()}
<script src="assets/js/main.js" defer></script>
</body>
</html>
"""


# ---------------------------------------------------------------- build
def parse(raw):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    if not m:
        raise ValueError("missing front matter")
    meta = {}
    for line in m.group(1).split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta, m.group(2)


def build():
    tokens = {
        "{{HERO_ART}}": partial("hero-art.html"),
        "{{FOOT}}": footer(),
        "{{PHONE}}": BIZ["phone"],
        "{{TEL}}": BIZ["tel"],
        "{{EMAIL}}": BIZ["email"],
    }

    built = []
    for fn in sorted(os.listdir(PAGES)):
        if not fn.endswith(".html"):
            continue
        with open(os.path.join(PAGES, fn), encoding="utf-8") as fh:
            meta, body = parse(fh.read())

        for k, v in tokens.items():
            body = body.replace(k, v)

        out = (
            head(meta["title"], meta["description"], fn, meta.get("robots", ""))
            + nav(meta.get("nav", ""))
            + body
            + scripts()
        )
        with open(os.path.join(ROOT, fn), "w", encoding="utf-8") as fh:
            fh.write(out)
        if meta.get("sitemap", "true").lower() != "false":
            built.append(fn)
        print(f"  built {fn}  ({len(out) // 1024} KB)")

    # legacy URL kept alive so existing links/bookmarks don't 404
    legacy = os.path.join(ROOT, "about_complete_canine.html")
    with open(legacy, "w", encoding="utf-8") as fh:
        fh.write(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
            '<title>Redirecting… — Complete Canine</title>'
            '<link rel="canonical" href="' + SITE + '/about.html">'
            '<meta http-equiv="refresh" content="0; url=about.html">'
            "</head><body><p>This page moved. "
            '<a href="about.html">Continue to About Complete Canine</a>.</p></body></html>'
        )
    print("  built about_complete_canine.html (legacy redirect)")

    # sitemap + robots
    urls = "\n".join(
        f"  <url><loc>{SITE}/{f}</loc><changefreq>monthly</changefreq>"
        f"<priority>{'1.0' if f == 'index.html' else '0.8'}</priority></url>"
        for f in built
    )
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write(
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{urls}\n</urlset>\n"
        )
    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as fh:
        fh.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
    print("  built sitemap.xml, robots.txt")


if __name__ == "__main__":
    print("Building Complete Canine…")
    build()
    print("Done.")
