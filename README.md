# Complete Canine — website

Rebuild of [completecanineinc.com](https://completecanineinc.com) for Complete Canine, Inc.
(593 Route 12A, Plainfield, NH 03781 · 603-675-5901).

Static HTML/CSS/JS. No build tooling required to *serve* it — the `.html` files in
the project root are the site. `build.py` only exists so the shared header, nav and
footer live in one place instead of being copy-pasted five times.

## Run it locally

```bash
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>. (Open the files directly via `file://` and
everything works except the Google Maps embed on the About page.)

## Rebuild after editing

```bash
python3 build.py
```

Regenerates the five root `.html` files, `sitemap.xml`, `robots.txt` and the legacy
`about_complete_canine.html` redirect.

## Layout

```
index.html  boarding.html  daycare.html  grooming.html  about.html   ← generated, deploy these
booking.html  admin.html                                             ← booking flow + local admin board
about_complete_canine.html                                           ← redirect to about.html (old URL)
sitemap.xml  robots.txt                                              ← generated
build.py                    assembles pages from _pages + _partials
_pages/                     page content only (front matter + <main>)
_partials/
  sprite.html               inline SVG icon set + logo mark
  hero-art.html             the hand-drawn homepage illustration
  fitcheck.html             dev harness — see "One screen" below
_source/                    archived copy of the original site (HTML, CSS, photos)
assets/
  css/style.css             the whole design system
  js/main.js                tabs, mobile menu, booking form + local admin board
  img/                      photos, carried over from the original site
```

Edit page copy in `_pages/*.html`, not in the root `.html` files — the root files
are overwritten on every build. Phone, email and address live in the `BIZ` dict at
the top of `build.py`; change them there and they update everywhere, including the
structured data.

The booking form currently writes requests to browser `localStorage` under
`ccBookingRequests`. `admin.html` reads the same queue and updates local statuses;
replace that storage layer with Supabase when the database is ready.

## One screen, no scrolling

Every page is designed to fit in a single viewport. There is deliberately **no**
page scrolling, no smooth-scroll library, no parallax and no scroll-triggered
animation. Content that would have been "further down the page" sits behind the tab
strip on each page instead.

How it holds together:

- `body { overflow: hidden }` and `.screen { height: 100dvh }`.
- Spacing and type scale off `--u: min(1vw, 1.42vh)`, so a short window compresses
  the same way a narrow one does.
- Below ~840px tall, a media query drops decoration (price-card icons, hero
  breathing room) before it drops information.
- **Fallback:** under 900px wide or 620px tall, normal scrolling is restored. On a
  phone a headline plus an illustration plus three cards genuinely cannot share one
  screen, and clipping content out of reach would be worse than a scrollbar.

### Checking the fit after you edit

Adding a bullet or a longer sentence can push a panel past the bottom of the
screen. With the server running, open:

<http://127.0.0.1:4173/_partials/fitcheck.html>

It loads all five pages at six viewport sizes, clicks through every tab, and reports
the slack in pixels for each. Green/positive = fits. It should say
**PASS — 102 panel/viewport combinations**. If something goes red, either shorten the
copy or use the compact `.card--row` variant instead of `.card`.

## Design

- Lime `#a8db5a` / moss `#5f7f33`, evolved from the original site's `#97b962`.
  Navy `#1f4165` and the pewter greys are kept as heritage accents.
- Display face **Bricolage Grotesque**, body **DM Sans**, both from Google Fonts.
- Icons are an inline `<symbol>` sprite (`_partials/sprite.html`) so they work from
  `file://` and need no network request.
- The homepage illustration is hand-authored SVG in `_partials/hero-art.html`.

## Content

All copy, pricing, hours, policies and staff names are taken from the existing
completecanineinc.com pages — nothing about the business was invented. The archived
originals are in `_source/` if you need to check wording.

There is no testimonials section. The original site had no reviews, and inventing
them for a real business would be misrepresentation. If Complete Canine wants to
add real ones, the card styles are already in the stylesheet.

## Before going live

- Point `SITE` in `build.py` at the production URL if it ever changes (it is
  currently `https://completecanineinc.com`) and rebuild — it feeds `<link rel=canonical>`,
  Open Graph tags, the sitemap and the JSON-LD.
- The `geo` latitude/longitude in the JSON-LD is approximate; replace with the exact
  coordinates if you have them.
- Confirm the About page map embed renders on the live domain.
- Photos are the original site's and are fairly low-resolution. New photography is
  the single biggest available upgrade.
