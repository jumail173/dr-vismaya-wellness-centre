# Change Log — Dr. Vismaya's Her & Little Wellness Centre

> Every change made so far, saved as a local markdown record (date: 2026-09-17).
> Live site: https://jumail173.github.io/dr-vismaya-wellness-centre/

## Latest sessions

### 2026-09-17 — "Online only" pill green glow
1. Footer "Online only" badge now has a slow green glow/blink (`.hours-list i.pill-online` + `@keyframes onlineGlow`, 2.8s ease-in-out infinite: green text-shadow + box-shadow + border). Respects `prefers-reduced-motion`.

### 2026-09-17 — "online across Kerala" → "online across India"
1. Updated both body copies (hero lead at index.html:680 and footer brand text at index.html:1026) from "online across Kerala" to "online across India". README tagline updated too.

### 2026-09-17 — Footer clinic hours updated
1. Footer "Clinic Hours" replaced: now `Monday – Saturday  9:30 - 6:30  [Online only]` and `Sunday  9:00 - 6:30  [Offline only]` (index.html ~1066). Old text was Mon–Fri 10:00–7:30, Sat 10:00–7:30, Sun Closed.
2. Added `.hours-list .hours-val` (flex group) + `.hours-list i` pill styling for the Online/Offline labels; mobile rule widened to `max-width:320px` and rows wrap.

### 2026-09-17 — Exact address + footer overlap fix
1. Site address text updated everywhere to the exact business address: **Venpakal, Athiyannur, Kerala 695123** (contact card at index.html:931 and footer Reach Us at index.html:1035). Old text was "Venpakal, Neyyattinkara, Thiruvananthapuram, Kerala 695121".
2. Fixed footer overlap: the long email `dr.vismaya.her.little.homoeocare@gmail.com` in the "Reach Us" column could not wrap and overflowed into the "Book & Follow" column, visually colliding with the Instagram/WhatsApp circular icons. Added `.footer-rows a{ overflow-wrap:anywhere; word-break:break-word; }` (index.html:494) so the email wraps inside its own column.

### 2026-09-17 — Map updated to business-name search (was: coords-only pin)
1. User's short link `https://maps.app.goo.gl/VSkcbhKj8TrMyAEY9` resolves to coords 8.382853, 77.066894 (Venpakal Road area) — but a coords-only pin shows a bare marker, not the clinic name.
2. Changed map embed iframe (`index.html:943`) to `https://www.google.com/maps?q=Dr+Vismaya+V+Nair+Homeopathy+Clinic+Neyyattinkara&output=embed` and the "Get Directions / Open in Google Maps" button (`index.html:944`) to `https://www.google.com/maps/search/?api=1&query=Dr+Vismaya+V+Nair+Homeopathy+Clinic+Neyyattinkara` so the business profile name shows instead of coordinates.

### 2026-09-17 — Map location updated
1. Replaced map embed + "Get Directions" link with business-name search query (`Dr+Vismaya+V+Nair+Homeopathy+Clinic+Neyyattinkara`) so the embed shows the clinic name instead of bare coordinates. Short link `https://maps.app.goo.gl/VSkcbhKj8TrMyAEY9` (coords 8.382853, 77.066894) is the underlying location.

### 2026-09-17 — Crisper logo (waifu2x upscale) + header blur fix
1. Old logo was a small 183×137 JPEG (6.6KB, 4:2:0 chroma) → soft/blurry edges.
2. Replaced with `assets/logo.png` — waifu2x (noise level 3) 2× upscale, 366×274, transparent-capable PNG (pixels fully opaque). Sharp, especially on retina screens.
3. Header + footer `<img>` now point to `assets/logo.png`; favicon regenerated from the new file; old `assets/logo.jpg` removed; temp upscale `assets/logo-hq.jpg` removed.
4. README/CONTEXT asset lists updated.

### 2026-09-17 — OWASP Top 10 security audit & fixes
1. Hardened Firebase RTDB rules (A01 Broken Access Control): was wide-open `{ ".read": true, ".write": true }` on the **root**. Now `.read`/`.write` are scoped to the `reviews` node only; reject writes with invalid shape (name 1–60 chars, text 1–600 chars, rating number 1–5). Verified: valid write succeeds, invalid write → `Permission denied`, writes outside `reviews` → `Permission denied`. Deployed via `firebase deploy --only database`.
2. Fixed stored-XSS / attribute-injection (A03 Injection): `escapeHtml` previously used `textContent→innerHTML` which escapes `<>&` but **not quotes**, so a review name could break out of `value="..."` in the inline edit form. Replaced with a character-escaping function covering `& < > " '`.
3. Removed CSS-selector injection: editing/delete previously looked cards up with `document.querySelector('.review-card[data-id="' + escapeHtml(id) + '"]')` (string-concat selector). Now sets `data-id` raw via `setAttribute` (safe — no HTML parsing) and finds cards with the `findReviewCard(id)` helper comparing `getAttribute('data-id')`.
4. Hardened ratings: `starString(parseInt(r.rating,10) || 5)` prevents string/coercion surprises from DB-sourced ratings.
5. Upgraded Firebase compat SDK 9.23.0 → **12.9.0** (A06 Vulnerable & Outdated Components). Verified the compat API still exposes `firebase.database()` and the app's init wiring still matches.
6. Added **SRI** (`integrity="sha384-..." crossorigin="anonymous"`) to both gstatic script tags (A08 Software/Data Integrity). Hashes computed from the exact 12.9.0 gstatic assets.
7. Added a **Content-Security-Policy** meta tag (A05 Security Misconfiguration): `default-src 'self'`; scoped `script-src`/`style-src`/`font-src`/`img-src`/`connect-src`/`frame-src`/`object-src 'none'`/`base-uri`/`form-action`. Allows gstatic scripts, Google Fonts, Firebase RTDB (https + wss + `*.firebaseio.com`), Identity Toolkit, Google Maps iframe. Note: site relies on inline scripts/styles so `'unsafe-inline'` is retained for those.
8. Audited A02 (HTTPS only), A04/A07 (client-token ownership is an acknowledged design tradeoff for public shared reviews; Firebase Auth is intentionally not used), A09 (NA — no server), A10 (NA — no server-side requests).
9. Syntax verified: extracted inline `<script>` block → `node --check` OK.

### 2026-09-17 — Shared reviews via Firebase + Instagram handle fix
1. Fixed Instagram links across the site to the correct profile handle: `@dr.vismaya_her.little_homcare` (hero button, online-consult link text, footer icon). Old handle `dr.vismaya.her.little.homoeo.care` did not exist on Instagram.
2. Made reviews **shared across all visitors** using **Firebase Realtime Database** (previously reviews lived only in each browser's `localStorage`, so they were invisible to other visitors).
3. Created the Realtime Database instance `dr-vismaya-wellness-centre-default-rtdb` (us-central1) via Firebase Management API.
4. Published **public read + write** security rules so any visitor can read and submit reviews.
5. Added Firebase compat 9.23.0 SDK (gstatic CDN) + filled `FIREBASE_CONFIG` in `index.html` (~line 1085).
6. Review logic now reads/writes the shared `reviews/<id>` node; `localStorage.vismayaReviews` kept only as an offline fallback mirror.
7. `localStorage.vismayaOwnerToken` still marks the device that owns a review, so only the submitter can edit/delete it.
8. New files: `firebase.json` (database rules config) + `database.rules.json` (rules initially `{ ".read": true, ".write": true }`, later hardened by the OWASP session above).
9. First-run behaviour: if the `reviews` node is empty, the 3 seed reviews are written to the DB once.
10. Verified: public read works, anonymous write works, test record cleaned up, JavaScript syntax valid.
11. Git commits: `24e17b6` (Instagram fix), `5876954` (Firebase shared reviews).

### Earlier session — footer & content refinements
1. Added Cancel/Reschedule buttons (WhatsApp pre-filled) + hover styles.
2. Booking form remade → Name/Age/City/Phone/Email(optional)/Problem(optional); WhatsApp submit.
3. Manage card only after booking via `localStorage.vismayaBooked`.
4. Sections reordered; "How to Find Us" trimmed to address+map; FAQ moved after; Consult last.
5. Book/Manage section moved after Focus section.
6. Mobile optimizations (viewport, breakpoints, centering, overflow-x hidden, menu close, iOS font-size).
7. Hero pulse/halo overlap fix + photo enlarged (260→276→290px; 224→240→252px small).
8. Footer upgraded with quick links/address/hours/email/WhatsApp/back-to-top.
9. Footer structure: hours is its own 5th column to the RIGHT of Book & Follow. Grid `2fr 1fr 1.1fr 1.1fr 1fr`.
10. Instagram/WhatsApp buttons → smaller circular SVG icons (30px/16px), side-by-side, cream color like Instagram.
11. Mobile footer also centered.

## Reference (key business details)
- Doctor: Dr. Vismaya V Nair (BHMS), Homoeopathic Physician, Reg. No. 16522.
- Clinic: "Her & Little Wellness Centre", Venpakal, Athiyannur, Kerala 695123.
- Phone: +91 96774 80825 | WhatsApp (all wa.me links): 919677480825
- Email: dr.vismaya.her.little.homoeocare@gmail.com
- Instagram: @dr.vismaya_her.little_homcare
- Hours: Mon–Sat 9:30–6:30 (online only), Sun 9:00–6:30 (offline only).
- Maps embed: `https://www.google.com/maps?q=Dr+Vismaya+V+Nair+Homeopathy+Clinic+Neyyattinkara&output=embed`; "Get Directions / Open in Google Maps" link: `https://www.google.com/maps/search/?api=1&query=Dr+Vismaya+V+Nair+Homeopathy+Clinic+Neyyattinkara`. (Underlying coords from short link: 8.382853, 77.066894.)

## Git / deploy notes
- Repo: `C:\Users\ELCOT\Downloads\vismaya` (own repo; parents live in a huge Downloads repo — never push that).
- Git user: jumail173 / jumail173@users.noreply.github.com.
- Deploy: commit on `main` + `git push`; GitHub Pages rebuilds in ~1–2 min.
- Firebase CLI authed locally; RTDB rules deplowed via `firebase.json` + `database.rules.json`.