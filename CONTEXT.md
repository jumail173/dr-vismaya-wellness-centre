# Dr. Vismaya's Her & Little Wellness Centre — Project Context (Recovery File)

> This file is a local memory of everything done so far. If context is lost, read this first to reconnect.

## Project Snapshot
- Static single-page website (HTML + CSS + JS inline, no framework, no build step).
- LIVE: https://jumail173.github.io/dr-vismaya-wellness-centre/
- Repo: https://github.com/jumail173/dr-vismaya-wellness-centre
- Main file: `index.html` (renamed from `index (12).html`; same content, verified MD5-identical).
- Older duplicate copies kept locally: `index (12).html`, `index (12).md`.
- Assets in `assets/`: logo.jpg, favicon.jpg (copy of logo), doctor.jpg, doctor-desk.jpg, clinic-signage.jpg, cursor.cur.
- Root stray files NOT referenced by the site (do not commit): `doctor.jpg`, `logo.jpg`.

## Business Details
- Doctor: Dr. Vismaya V Nair (BHMS), Homoeopathic Physician.
- Clinic: "Her & Little Wellness Centre", Venpakal, Neyyattinkara, Thiruvananthapuram, Kerala 695121.
- Phone: +91 96774 80825
- WhatsApp number (used in ALL wa.me links): 919677480825
- Email: dr.vismaya.her.little.homoeocare@gmail.com
- Instagram: @dr.vismaya_her.little_homcare
- Clinic hours: Mon–Fri 10:00 – 7:30, Sat 10:00 – 7:30, Sun Closed.
- Google Maps embed URL: `https://www.google.com/maps?q=Venpakal+Neyyattinkara+Thiruvananthapuram+Kerala+695121&output=embed`

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
- Project `dr-vismaya-wellness-centre`; instance `dr-vismaya-wellness-centre-default-rtdb` (us-central1), URL `https://dr-vismaya-wellness-centre-default-rtdb.firebaseio.com`. RTDB rules = public read + write (`{ ".read": true, ".write": true }`), published via `firebase.json` + `database.rules.json`.
- Config in `FIREBASE_CONFIG` in `index.html` (~line 1085) is filled in. SDK: Firebase compat 9.23.0 via gstatic.
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
- Mobile (≤640px): footer fully centered — `.footer-grid{text-align:center}`, `.footer-col{flex-direction:column;align-items:center}`, headings centered, links/rows centered, social center.
- `.footer-bottom` — copyright + tagline + "Back to top" anchor.

## Files & Git Notes
- Repo root is INSIDE a huge parent repo at `C:\Users\ELCOT\Downloads` (origin = Rizqit.git). Do NOT push the whole Downloads repo. `vismaya/` is its own repo with its own origin.
- Git identity set locally: user.name = `jumail173`, email = `jumail173@users.noreply.github.com`.
- Commit history: initial commit `822d6b7` (site), `8b7d2a3` (README.md).
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