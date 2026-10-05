# Change Log — Dr. Vismaya's Her & Little Wellness Centre

> Every change made so far, saved as a local markdown record.
> Live site: **https://www.drvismayawellness.com/** (Cloudflare Pages)
> Staging: `https://dr-vismaya-wellness-centre.pages.dev` (noindex)
> Current state and next steps: [`HANDOFF.md`](HANDOFF.md)

## Latest sessions

### 2026-10-05 — Migrated to Cloudflare Pages; HTTPS is live

The custom domain `www.drvismayawellness.com` was set on GitHub Pages on 27 Sep 2026, but GitHub issued a certificate only for the apex and never for `www`. It sat in `state: dns_changed` for ~8 days, far past GitHub's documented 24h window, and could not be escalated (the account is on GitHub **Free**, and GitHub only shows the support form to paid accounts). Migrated to Cloudflare Pages instead.

1. **Live now** at `https://www.drvismayawellness.com` — valid cert `CN=www.drvismayawellness.com`, issuer `WE1, O=Google Trust Services`, valid to 3 Jan 2027. The 8-day outage is over.
2. Cloudflare Pages project `dr-vismaya-wellness-centre` created as a **Direct Upload** project (account `19030ecd277908dc091dc72862970772`), `dist/` uploaded, production branch `main`.
3. DNS: only the `www` CNAME changed, `jumail173.github.io` → `dr-vismaya-wellness-centre.pages.dev`. **The 4 apex `A` records and the GoDaddy nameservers were never touched** — this is why Pages was chosen over Workers, which would have required a full nameserver migration.
4. Full suite passes **62/62 over real HTTPS** (`node tools\verify-live.js https://www.drvismayawellness.com`). It is 62 rather than 57 because the 5 `https://` sitemap URLs now genuinely fetch instead of reporting `SKIP (TLS not ready)`.
5. **Repo leak closed.** GitHub Pages served the entire repo directory; `database.rules.json`, `firebase.json`, `CONTEXT.md`, `README.md`, `CNAME` and `build.js` were all publicly readable. The `dist/` allowlist build means all 9 checked paths now return 404.
6. `tools/verify-live.js` was fixed — it had no retry wrapper despite the docs requiring one, so it aborted on check 3 with `UND_ERR_CONNECT_TIMEOUT` (this host drops ~3 of 4 Node connections while `curl` succeeds).
7. `.gitattributes` added with `eol=lf`. `core.autocrlf=true` was re-expanding `sitemap.xml` from the committed 997 bytes to 1029 on checkout, so a local `dist/` could never be byte-identical to a Cloudflare build.
8. New `tools/verify-dist.js` — offline pre-deploy gate (42 checks: leak check, asset refs, `h1` count, JSON-LD, anchors, sitemap bytes/BOM/ASCII, ownership file, branded 404, no CRLF). Refuses to be wrong quietly; exits non-zero.
9. New `tools/deploy-pages.js` — one-command deploy: build, verify, upload. **`git push` no longer deploys**, because this is a Direct Upload project. Connect the repo in the Cloudflare dashboard for automatic deploys.
10. `tools/certwatch.ps1` is now **dead code** — it polled GitHub's Pages cert state and approved `https_enforced`. GitHub's cert is no longer in the path. The file is still committed but does nothing useful; safe to delete whenever.
11. GitHub Pages custom domain + `CNAME` **kept** as a rollback. Consequence: GitHub will retry its `www` cert forever and stay `dns_changed`. Expected — do not "fix" it.
12. Full detail, including a ~25-minute go-live outage and its cause, is in `SESSION-LOG-2026-10-05.md` (local, gitignored).

**Incident worth remembering:** the custom domain was attached to Pages *before* DNS pointed at Cloudflare. Cloudflare cached the resulting `CNAME record not set` negative and never re-checked, leaving `www` serving HTTP 409 with no certificate for ~25 minutes while the apex 301'd into it. Fixed by `DELETE /accounts/{id}/pages/projects/{project}/domains/{domain_name}` — **by name, not by id** — then re-adding. DNS pointing at Cloudflare is necessary but not sufficient: only trust `status: active` *and* a real 200 over HTTPS.

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
- **Deploy: `node tools\deploy-pages.js` with `CLOUDFLARE_API_TOKEN` set.** Pushing to `main` no longer deploys — the Pages project is Direct Upload, not Git-connected. To restore automatic deploys, connect the repo in the Cloudflare dashboard with: preset **None**, build command `node build.js`, output directory `dist`, root directory **blank**, production branch `main`.
- Firebase CLI authed locally; RTDB rules deployed via `firebase.json` + `database.rules.json`.

## Remaining work
- [ ] Revoke the Cloudflare API token used for the 5 Oct migration (`dash.cloudflare.com/profile/api-tokens`).
- [ ] Delete the leftover Worker `dr-vismaya-wellness-centre.amjumail2004.workers.dev` — it publishes the whole repo and returns an empty 404. Not attached to the custom domain. Needs Workers permission.
- [ ] Search Console: per-URL *Request indexing* for the 5 URLs (sitemap already submitted 28 Sep, confirmed `Success`).
- [ ] Google Business Profile — slowest item (verification takes days to weeks) and the main remaining lever for local search. Firebase reviews are invisible to Google.
- [ ] HSTS — deliberately off until HTTPS has been stable for a few weeks.