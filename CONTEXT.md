# Dr. Vismaya's Her & Little Wellness Centre — Project Context (Recovery File)

> This file is a local memory of everything done so far. If context is lost, read this first to reconnect.

## Project Snapshot
- Static single-page website (HTML + CSS + JS inline, no framework, no build step).
- LIVE: **https://www.drvismayawellness.com/** (custom domain, purchased 2026-09-27 at GoDaddy). Old URL `https://jumail173.github.io/dr-vismaya-wellness-centre/` 301-redirects here. Apex `drvismayawellness.com` 301-redirects to `www`.
- Hosting: GitHub Pages, project page, **custom domain = `www.drvismayawellness.com`** (set in repo `CNAME` + Pages settings — both must match). DNS at GoDaddy: 4 `A` @ records (185.199.108–111.153) + `www` CNAME → `jumail173.github.io` (the *user* pages domain, not `drvismayawellness.github.io`).
- Repo: https://github.com/jumail173/dr-vismaya-wellness-centre
- Main file: `index.html` (renamed from `index (12).html`; same content, verified MD5-identical).
- Older duplicate copies kept locally: `index (12).html`, `index (12).md`.
- Full session record for 2026-09-19: `SESSION-LOG-2026-09-19.md` (local, do not commit).
- Assets in `assets/`: `logo.webp` (240×180, 4.9KB — current), `doctor.webp` (700×700, 32KB), `doctor-desk.webp` (880×1173, 95KB), `clinic-signage.webp` (1080×605, 22KB), `cursor.cur`, plus `favicon-32.png` / `apple-touch-icon.png` / `icon-192.png` / `icon-512.png` / `site.webmanifest` and 5 `og-*.jpg` social cards. Unreferenced legacy files kept on disk: `logo.png`, `favicon.jpg`. Original `.jpg` photos are recoverable from git commit `93a00e2`.
- Root stray files NOT referenced by the site (do not commit): `doctor.jpg`, `logo.jpg`.

## Business Details
- Doctor: Dr. Vismaya V Nair (BHMS), Homoeopathic Physician.
- Clinic: "Her & Little Wellness Centre", Venpakal, Athiyannur, Kerala 695123.
- Phone: +91 96774 80825
- WhatsApp number (used in ALL wa.me links): 919677480825
- Email: dr.vismaya.her.little.homoeocare@gmail.com
- Instagram: @dr.vismaya_her.little_homcare
- Clinic hours: Mon–Sat 9:30 – 6:30 (online only), Sun 9:00 – 6:30 (offline only).
- Google Maps embed URL: `https://www.google.com/maps?cid=7978618599063365468&hl=en&output=embed`; "Get Directions / Open in Google Maps" button link: `https://www.google.com/maps/dir/?api=1&destination=8.38389,77.06639` (pinned coordinates).

## Page Structure (section order)
1. `#top` Hero — kicker, h1, lead, credential chip, CTAs (WhatsApp + Online Consult), photo w/ pulse halo.
2. `#about` About — story, quote block, clinic images, trust chips.
3. `#focus` Focus Areas — Women's Health, Child Health, Lifestyle Diseases, Other Conditions (icon list).
4. `#appointment` Book / Manage Appointment (section class `bookappointment`) — form + manage card.
5. `#reviews` Reviews — testimonial grid, star ratings.
6. `#contact` "How to Find Us" (class `contact`) — address + embedded map ONLY.
7. `#faq` FAQs — accordion.
8. `#online` Online Consult (class `consult`) — online CTA + WhatsApp/Instagram links.
9. Footer.

## Booking / Manage Behaviour
- Form fields (in order): Name*, Age*, City*, Phone*, Email (optional), Describe Your Problem (optional); submit button text **Submit**.
- `handleSubmit(e)` builds message `Appointment Request\n\nName/…\nAge/…\nCity/…\nPhone/…\nEmail/…\n\nProblem:/…` → opens `https://wa.me/919677480825?text=<encoded>`.
- On submit: sets `localStorage.vismayaBooked='1'`, shows `#manageAppointment`.
- Cancel/Reschedule card HTML: `<div id="manageAppointment" style="display:none;">` with `.manage-btn-cancel` / `.manage-btn-reschedule` classes and an "OK" toggle.
- On page load, IIFE checks `localStorage.getItem('vismayaBooked')` → shows manage card if set.
- Cancel link: `https://wa.me/919677480825?text=Hi%20Dr.%20Vismaya%2C%20I%20would%20like%20to%20CANCEL%20my%20appointment.%20Please%20let%20me%20know%20if%20you%20need%20any%20details.`
- Reschedule link: `https://wa.me/919677480825?text=Hi%20Dr.%20Vismaya%2C%20I%20would%20like%20to%20RESCHEDULE%20my%20appointment.%20Please%20share%20available%20slots.`
- Manage button hover: `.manage-btn-cancel:hover{ background:#A34A5E; color:#fff; }`, `.manage-btn-reschedule:hover{ background:var(--teal); color:#fff; }`.

## Reviews
- Reviews are shared globally via **Firebase Realtime Database** (node `reviews/<reviewId>`), so every visitor sees the same reviews.
- Project `dr-vismaya-wellness-centre`; instance `dr-vismaya-wellness-centre-default-rtdb` (us-central1), URL `https://dr-vismaya-wellness-centre-default-rtdb.firebaseio.com`. RTDB rules are **hardened** (2026-09-17 OWASP fix): `.read` public on `reviews` only, `.write` allowed on `reviews/<id>` only with shape validation (name 1–60, text 1–600, rating 1–5); all other paths denied. Published via `firebase.json` + `database.rules.json`.
- Reviews are read via **plain REST fetch** (no JS SDK): `GET https://dr-vismaya-wellness-centre-default-rtdb.firebaseio.com/reviews.json` on load + every 60s (`loadReviewsDb()`), and local localStorage reconciles into the DB. Writes use REST: `PUT` to `reviews/<id>.json` (add/edit) and `DELETE` (remove).
- **The Firebase JS SDK was REMOVED (2026-09-19)** — compat 12.9.0's `on('value')` listener silently hung (no success, no error) in browsers (verified: value never fired via WebSocket or forced long-polling; DB reachable + 5 reviews via REST but page fell back to 3 seeds). CSP now allows only the REST DB URL; SDK script tags, gstatic script-src, and wss/identitytoolkit connect-src entries were removed.
- `localStorage.vismayaReviews` is kept as an offline/fallback mirror only.
- `localStorage.vismayaOwnerToken` marks the device that owns a review so only the submitter can edit/delete it.
- First-run behavior: if the `reviews` node is empty, the 3 seed reviews are written to the DB once.

## Design System
- CSS vars: `--teal-deep:#0A3B45; --teal:#0F6274; --teal-soft; --cream-text; --rose:#A34A5E; --cream-bg:#F4F1EA;` etc.
- Fonts (from Google Fonts): Fraunces (headings), Inter (body), Caveat (script).
- Constants: `--radius:18px`; buttons `.btn`, `.btn-primary` (rose), `.btn-outline`, `.btn-instagram`, `.btn-wa`.
- Viewport meta: `width=device-width, initial-scale=1.0, viewport-fit=cover`.

## Responsive Breakpoints
- 960px — desktop footer 5 columns.
- 860px — collapse nav to `#mobileMenu`; show hamburger; `#mobileMenu{display:none !important}` above 860px.
- 640px — single-column hero centered; max-width 100%; `html,body{overflow-x:hidden}`; `.section-head` centered; `.btn-row` centered; map height 260px; booking form max-width 100%, submit centered, labels 0.88rem.
- 400px — hero h1 1.62rem; hero photo 252px; `.btn-row{flex-direction:column}`; `.btn{width:100%}`.
- Mobile form inputs forced `font-size:16px !important` to prevent iOS auto-zoom on focus.
- Mobile menu closes on link tap (JS).

## Hero Photo Sizing (mobile)
- ≤640px: img 290px, halo 130%, `.ecg-pulse` 124% `filter:blur(4px)`, `.ecg-ring` 118%, `.hero-photo{margin:14px auto 0}` to avoid overlap with hero buttons.
- ≤400px: img 252px; keyframe `pulseGlowMobile` (opacity 0.3→0.85 scale 1→1.02).

## Footer (current)
- Grid 5 columns on desktop (`2fr 1fr 1.1fr 1.1fr 1fr` @960px, `1.4fr 1fr 1fr` @600px, `1fr` base):
  1. `.footer-brand` — logo, script tagline, about text
  2. Quick Links (nav anchors)
  3. Reach Us — address, tel, mailto
  4. Book & Follow — WhatsApp / Book Appointment / Online Consult + `.footer-social` icon row
  5. Clinic Hours (own column, class `.footer-col` with `h4.footer-hours-title`) — `.hours-list`
- `.footer-social` = two 30px circular SVG icon links (`.social-ico`), same cream color (`var(--cream-text)`), rose hover; WhatsApp uses same color as Instagram (NOT green).
- `.footer-rows a{ overflow-wrap:anywhere; word-break:break-word; }` — keeps long email from overflowing into the Book & Follow (Insta/WhatsApp) column.
- Mobile (≤640px): footer fully centered — `.footer-grid{text-align:center}`, `.footer-col{flex-direction:column;align-items:center}`, headings centered, links/rows centered, social center.
- `.footer-bottom` — copyright + tagline + "Back to top" anchor.

## Files & Git Notes
- Repo root is INSIDE a huge parent repo at `C:\Users\ELCOT\Downloads` (origin = Rizqit.git). Do NOT push the whole Downloads repo. `vismaya/` is its own repo with its own origin.
- Git identity set locally: user.name = `jumail173`, email = `jumail173@users.noreply.github.com`.
- Commit history: initial commit `822d6b7` (site), `8b7d2a3` (README.md), `93a00e2` (security hardening, crisp logo), `85ab122` (SEO structured data, landing pages, WebP, pinned map, sitemap), `db68013` (Firebase SDK → plain REST for reviews).
- GitHub CLI (`gh`) is authed as `jumail173` with permissions including `repo`.
- To push new changes: `git add index.html ...; git commit -m "..." ; git push` from `C:\Users\ELCOT\Downloads\vismaya`.
- GitHub Pages auto-deploys from `main` (root path); live URL will rebuild within ~1–2 min after push.

## Change Log (recent edits)
1. Added Cancel/Reschedule buttons (WhatsApp pre-filled) + hover styles.
2. Booking form remade → Name/Age/City/Phone/Email(optional)/Problem(optional); WhatsApp submit.
3. Manage card only after booking via `localStorage.vismayaBooked`.
4. Sections reordered; "How to Find Us" trimmed to address+map; FAQ moved after; Consult last.
5. Book/Manage section moved after Focus section.
6. Mobile optimizations (viewport, breakpoints, centering, overflow-x hidden, menu close, iOS font-size).
7. Hero pulse/halo overlap fix + photo enlarged (260→276→290px; 224→240→252px small).
8. Footer upgraded with quick links/address/hours/email/WhatsApp/back-to-top.
9. Footer structure attempts: hours standalone column → reverted inside Reach Us → final: hours as its own column to the LEFT of Book & Follow? NO — hours is its own 5th column to the RIGHT of Book & Follow. Grid `2fr 1fr 1.1fr 1.1fr 1fr`.
10. Instagram/WhatsApp buttons → smaller circular SVG icons (30px/16px), side-by-side, cream color like Instagram.
11. Mobile footer also centered.
12. SEO: canonical + OG/Twitter on all pages, `alternateName` aligned, `sameAs` = Instagram + `https://maps.google.com/?cid=7978618599063365468`, keyword H1 + title, `priceRange: "₹₹"` on landing pages.
13. Related landing pages `pcod.html`, `thyroid.html`, `menstrual.html`, `child-immunity.html` (topic FAQs, NAP, pinned map, WebP); `index.html` focus tags link to them.
14. WebP conversion of all photos + logo.png re-encode (85.2KB); old `.jpg` files deleted from assets (in git history).
15. Pinned map: CID embed + coordinate-`destination` directions link.
16. `sitemap.xml` + `robots.txt` added.
17. **Firebase SDK → plain REST** (2026-09-19): SDK `on('value')` silently hung → all browsers stuck on 3 seed reviews. Rewrote to `fetch(reviews.json)` + 60s polling; PUT/DELETE writes. Now 5 reviews render on any page that can reach the DB.
18. **Local + technical SEO pass** (2026-09-27): per-page titles/descriptions (all 49–57 / 148–159 chars), `robots` meta, page-specific 1200×630 JPEG OG/Twitter cards, `MedicalClinic` JSON-LD expanded to 21 fields (`logo`, `hasMap`, `identifier`, `openingHours`, `availableService`, `inLanguage`, `currenciesAccepted`, `paymentAccepted`), `Physician` gains `address`+`image`, directions links, near-me copy, condition-page cross-links. Runtime `updateRatingLd()` injects live `aggregateRating`.
19. **Performance + accessibility** (2026-09-27): fonts trimmed (dropped unused Fraunces italic) and loaded async via `rel=preload as=style crossorigin` + `media="print"` swap + `<noscript>` fallback; hero images get explicit `width`/`height` (match real pixels, no CLS), `loading="eager"`, `fetchpriority="high"`, `decoding="async"`; below-fold images lazy. Rose deepened `#C97B8A` → `#A84E60` (5.35:1 on white), added `--rose-soft:#DB9FA9`; muted text `#5F7172`, star gold `#9C6708`, unselected star/dot `#6E8281` — all WCAG-clean. Tap targets: social 44px, stars ≥40px, slide dots 24px. Footer `h4` → `h2`; all 8 form labels associated with `for`/`id`; star rating exposed as `role="radiogroup"`/`role="radio"` with `aria-checked` kept in sync.
20. **New assets** (2026-09-27): `logo.webp` (240×180, 4.9KB, replaces 87KB `logo.png` in nav+footer), `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, and 5 `og-*.jpg` cards. Photos downscaled: `doctor.webp` 700×700 (72→32KB), `doctor-desk.webp` 880×1173 (125→95KB), `clinic-signage.webp` 1080×605 (25→22KB). `logo.png` / `favicon.jpg` / `cursor.cur` are now unreferenced (kept on disk).
21. Landing pages each gained a "Meet Dr. Vismaya" credentials section (`id="doctor"`) and footer links to the other condition pages.
22. **Hero photo aligned to the h1 line** (2026-09-27): inside `@media(min-width:760px)` only, `.hero .wrap` got `align-items:start` and `.hero-photo` got `align-self:start; margin-top:42px; transform:translateX(16px)`. 42px = kicker line-box (1.5rem × 1.6) + 4px margin, so the photo's top edge is exactly level with the h1. Verified `deltaY: 0` at 761–1600px on all 5 pages; ≤760px untouched.
23. **Custom domain migration** (2026-09-27): `CNAME` added; all 108 `jumail173.github.io` references (canonical, `og:url`, twitter, JSON-LD `@id`s, `sitemap.xml`, `robots.txt`) repointed to `https://www.drvismayawellness.com`. Pages custom domain set to `www.drvismayawellness.com`, so GitHub auto-redirects apex → www.

## Verification (as of 2026-09-27, post-migration)
- Live re-verification against the custom domain: **57/57 checks pass** — 5 pages 200, one `h1` each, canonical + `og:url` + twitter:url correct, JSON-LD parses, all in-page anchors exist, all internal links resolve, zero legacy `github.io` references, `sitemap.xml` (5 URLs) and `robots.txt` served and pointing at the new host.
- Old `jumail173.github.io/dr-vismaya-wellness-centre/` 301s to the custom domain; `http://` apex 301s to `www`.
- 5 reviews still read from Firebase RTDB.
- **Pending:** Let's Encrypt cert for `www.drvismayawellness.com` was still provisioning at last check (GitHub's job can take up to ~1h), so `https://www…` briefly serves the default `*.github.io` cert. A watcher (`%LOCALAPPDATA%\Temp\opencode\certwatch.ps1` + `certwatch.log`) polls the Pages API and turns on `https_enforced` the moment the cert is approved. Verify `cert:approved` in `gh api repos/jumail173/dr-vismaya-wellness-centre/pages` before celebrating.
- Not done (needs the owner's Google login): Search Console property for `www.drvismayawellness.com` + sitemap resubmission.
- PageSpeed Insights API returns `429` without a key, so Lighthouse scores are manual estimates, not measured.
- All 5 pages: tags balanced, exactly one `h1`, no heading-level skips, all internal links/anchors resolve.
- JSON-LD parses on every page; no duplicate `@id`; `escapeHtml` blocks attribute breakout.
- All inline scripts pass `node --check`; rating-LD logic 17/17.
- Contrast pairs 11/11 pass WCAG AA (stars/dots AA Large). Files valid UTF-8, no mojibake.
- 23/23 URLs return 200 on the local server (`python -m http.server 8765`).
- PageSpeed Insights API returns `429` without a key, so Lighthouse scores are manual estimates, not measured.