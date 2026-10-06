# HANDOFF — read this first

**Current state: 6 Oct 2026. THE MIGRATION IS DONE. `https://www.drvismayawellness.com` is live on Cloudflare Pages with a valid Google Trust Services certificate. Live suite passes 62/62 over real HTTPS (re-run 6 Oct).**

The 8-day HTTPS outage caused by GitHub never issuing a `www` certificate is over. Cert: `CN=www.drvismayawellness.com`, issuer `WE1, O=Google Trust Services`, valid to 3 Jan 2027. Full suite passes **62/62 over real HTTPS**.

Long history lives in [`CONTEXT.md`](CONTEXT.md) and the git history. This file is the short version, kept current.

---

## The one thing to do next

**Nothing is blocking deployment any more.** The site is live. Remaining work is all post-launch and none of it is urgent:

1. **Revoke the deploy token** — both tokens used on 5–6 Oct (Pages deploy + Worker delete) have served their purpose. `https://dash.cloudflare.com/profile/api-tokens` → **Revoke**. Create a replacement only when you next need to deploy.
2. **Search Console** — sitemap is already submitted. Per-URL *Request indexing* for the 5 URLs is now worth doing, because TLS finally works.
3. **Google Business Profile** — slowest item, independent of TLS, so start it.

## How to deploy again

This is a **Direct Upload** Pages project, so **`git push` does not deploy.** Run:

```
$env:CLOUDFLARE_API_TOKEN = "<token>"
node tools\deploy-pages.js
```

It builds `dist/`, refuses to upload if `verify-dist.js` fails, then uploads. Account ID is baked in as `19030ecd277908dc091dc72862970772`. To make pushes automatic again, connect the repo in the Cloudflare dashboard (Pages → your project → Settings → Builds → Connect to Git); the build settings in the table above are correct for that. Until you do, use the command above.

---

## Why HTTPS was broken (now resolved)

The custom domain `www.drvismayawellness.com` was set on GitHub Pages on 27 Sep 2026. GitHub issued a certificate for the apex but never for `www` — it sat in `state: dns_changed` for ~8 days, far past GitHub's documented 24h. DNS was provably correct, `githubstatus.com` reported Pages operational, and the whole GitHub ladder (apex↔www toggle, full domain remove + re-add) was tried and burned. Cert requests could not be escalated: the account is on GitHub **Free** (`gh api /user --jq .plan` → `null`), and GitHub only shows the support form to paid accounts. Migrating to Cloudflare Pages resolved it.

**The GitHub Pages custom domain and the `CNAME` file are deliberately still in place** as a rollback. Consequence: GitHub keeps a permanently-`dns_changed` cert request for `www` that will never succeed, because DNS now points at Cloudflare. That is harmless and expected — do not "fix" it.

## Why Pages, not Workers

Both are free and both work. They differ in the one step that mattered:

| | Custom domain on `www` | Needs nameserver change? |
|---|---|---|
| **Pages** | one CNAME at GoDaddy → `<project>.pages.dev` | **No** |
| **Workers** | Cloudflare must already own the zone as an active zone | **Yes — full DNS migration** |

A Worker custom domain requires *"an active Cloudflare zone"* and *"you cannot create a Custom Domain on a hostname with an existing CNAME DNS record or on a zone you do not own."* A Pages project has no such requirement. GoDaddy DNS and the apex records were left untouched, so the change was reversible by editing one row — as it turned out, we needed exactly that.

## Left behind

~~A **Worker** still exists at `https://dr-vismaya-wellness-centre.amjumail2004.workers.dev`.~~ **Deleted 6 Oct 2026** via `DELETE /workers/services/dr-vismaya-wellness-centre` (token with Workers Scripts: Edit). Verified: services list empty, URL now returns 404. It was never attached to the custom domain, so the real site was unaffected while it existed.

## What actually happened on go-live

Worth knowing, because it is not obvious and it will bite again:

1. Pages project created, then `www` added as a custom domain **before** DNS was pointed at Cloudflare. It sat at `CNAME record not set` — Cloudflare had cached a negative answer from before the DNS edit.
2. Changing the GoDaddy CNAME to `dr-vismaya-wellness-centre.pages.dev` propagated instantly (verified on both GoDaddy authoritative nameservers, plus 1.1.1.1 and 8.8.8.8) — but Cloudflare never re-checked. **`www` was live-but-broken: `http` → 409, `https` → no cert at all**, for ~25 minutes, and the apex 301s into it.
3. Fix: **delete the custom domain by name and re-add it.** Note the API quirk — `DELETE .../domains/{domain_name}` takes the **name**, not the id; passing the id returns `8000021 The domain you have requested does not exist`. Re-adding gave a fresh record, and it went `initializing → active` in about 14 minutes.

So: **`www` DNS pointing at Cloudflare is necessary but not sufficient.** Always confirm `status: active` *and* a real `200` over HTTPS before considering the domain done.

---

## Verifying

```
node build.js                                    # 24 files, 788 KB -> dist/
node tools\verify-dist.js                        # offline gate - runs today, no URL needed
node tools\verify-pages.js https://<project>.pages.dev
node tools\verify-live.js http://www.drvismayawellness.com
```

`verify-dist.js` is the pre-flight and the only gate you can run **before** a `*.pages.dev` URL exists. It reads `dist/` off disk and prints `DIST IS CLEAN. Safe to upload.` / `NOT CLEAN. Do not upload.` — **42/42 pass as of 5 Oct.** It covers the leak check (`database.rules.json`, `firebase.json`, `CNAME`, `build.js`, `CONTEXT.md`, `README.md` must be absent), that every `assets/…` reference in every page actually landed, one `h1` per page, JSON-LD parses, in-page anchors resolve, `sitemap.xml` is exactly 997 bytes with no BOM and pure ASCII, the Search Console ownership file is intact, the branded 404 has one `h1` and is `noindex`, and no text file contains CRLF.

`verify-pages.js` is the post-deploy gate — run it against the live `*.pages.dev` URL. It must print **ALL GREEN — safe to add the custom domain and change the GoDaddy nameservers** before you touch GoDaddy. It checks all 5 pages, one `h1` each, JSON-LD, that 9 private paths 404, the sitemap is 997 bytes with no BOM, the Search Console ownership file is served, Firebase reviews load, the branded 404 is really ours, and that `_headers` was actually applied.

`verify-live.js` is the 57-check suite for the final host. **62/62 pass over https as of 5 Oct** (62 not 57 — the 5 `https://` sitemap URLs now genuinely fetch instead of reporting `SKIP (TLS not ready)`).

All three retry 6 times with backoff. **This is required, not optional** — see "Gotchas".

---

## Gotchas that will waste your time otherwise

- **Do not route anyone to `support.github.com/contact`.** There is no ticket form on a Free account. The category dropdown does not exist for them. Check the plan with the API before asserting any account-level capability.
- **Node `fetch` drops ~3 of 4 connections to this host** (`UND_ERR_CONNECT_TIMEOUT`) while `curl` succeeds every time. Any check script must retry or it reports phantom failures. This bit `verify-live.js` until 5 Oct — it aborted on the third check, so add the retry wrapper when you add a fetch.
- **`_headers` failing to parse is silent.** No build error, no headers on the response. This already happened once — a prose comment sat inside the `/*` rule block where the grammar requires `name: value` lines. If security headers go missing after a deploy, suspect the file format before anything else.
- **`core.autocrlf=true` used to corrupt local builds.** It expanded `sitemap.xml` from the committed 997 bytes to 1029 on checkout, so a local `dist/` was never byte-identical to a Cloudflare build. Fixed by `.gitattributes` (`* text=auto eol=lf`). If you ever see CRLF locally, check that file still exists before debugging anything else.
- **GitHub Pages served the entire repo directory**, so `CONTEXT.md`, `CHANGES.md`, `README.md`, `firebase.json` and `database.rules.json` were all publicly readable on the old host. Cloudflare Pages serves only `dist/`, and all 9 of those paths now return 404 — verified. It was never a vulnerability, since Firebase rules are enforced server-side, but the leak is genuinely closed now.
- **`build.js` uses an allowlist**, so a file is only published if deliberately listed. If you add a public file, add it to `PAGES` or `ROOT_FILES`. Anything unlisted is reported as `NOT copied` at the end of every run.
- **`_headers` asset caching is 1 year.** If you ever replace a photo under the same filename, browsers will keep serving the old one. Change the filename or drop it to `max-age=86400`.

---

## Also outstanding (not blocked on the certificate)

1. **Google Business Profile** — `business.google.com`. Slowest item (postcard/phone verification, days to weeks) and completely independent of TLS, so start it first. NAP is in the JSON-LD: *Her & Little Wellness Centre, Venpakal, Athiyannur, Kerala 695123, +91 96774 80825*, category *Homeopathic Physician*, hours Mon–Sat 9:30–18:30 · Sun 9:00–18:30. **The site's Firebase reviews are invisible to Google** — collect Google reviews separately.
2. **Search Console** — sitemap submitted 28 Sep and confirmed `Success`. Per-URL *Request indexing* for the 5 URLs is still pending, and is now worth doing because TLS finally works.
3. **HSTS** — deliberately off in `_headers`, and there is deliberately no `Strict-Transport-Security` header on the live host. Enable it (un-comment the two lines in `_headers`, redeploy) only after HTTPS has been stable for a few weeks.
4. **Instagram** @dr.vismaya_her.little_homcare, 2–3 posts/week.

## Done 6 Oct 2026

- Live suite re-run over HTTPS: **`verify-live.js` 62/62**, `verify-dist.js` 42/42 (repo tree was clean before changes).
- Dead code removed: `tools/certwatch.ps1` (GitHub cert no longer in the path) and the stale `certwatch5.ps1` temp copy.
- Unreferenced assets removed from the repo: `assets/logo.png`, `assets/favicon.jpg`, `assets/cursor.cur` (all recoverable from git history; none were ever in `dist/`).
- `README.md` asset table and live URL refreshed (it still described `.jpg` photos and the old `github.io` URL).

No redeploy was needed — none of these files were published (the build uses an allowlist).

## Optional clean-up

Done 6 Oct — `assets/logo.png`, `assets/favicon.jpg`, `assets/cursor.cur` and the dead `tools/certwatch.ps1` were deleted from the repo (still in git history). Nothing else is known to be unreferenced.

---

## Facts

| | |
|---|---|
| Live | `https://www.drvismayawellness.com` → 200, valid cert |
| Hosting | Cloudflare Pages, project `dr-vismaya-wellness-centre` (Direct Upload) |
| Staging URL | `https://dr-vismaya-wellness-centre.pages.dev` (noindex) |
| Cloudflare account ID | `19030ecd277908dc091dc72862970772` |
| Certificate | `CN=www.drvismayawellness.com`, issuer `WE1, O=Google Trust Services`, to 3 Jan 2027 |
| `www` DNS | `CNAME` → `dr-vismaya-wellness-centre.pages.dev` (was `jumail173.github.io`) |
| Apex DNS | untouched — 4× `A` to `185.199.108–111.153`, still GitHub |
| Redirects | apex → `https://www…` (301) · `http://www…` → `https://www…` (301) |
| Rollback | GitHub Pages custom domain + `CNAME` still in place |
| Repo | `jumail173/dr-vismaya-wellness-centre`, branch `main` |
| Cloudflare account subdomain | `amjumail2004` |
| Nameservers | `ns57` / `ns58.domaincontrol.com` (GoDaddy) — never changed |
| CAA records | **none** |
| Doctor / clinic | Dr. Vismaya V Nair (BHMS) · Her & Little Wellness Centre, Venpakal, Athiyannur, Kerala 695123 |
| Phone / WhatsApp | +91 96774 80825 · `919677480825` |
| Email | dr.vismaya.her.little.homoeocare@gmail.com |
| Instagram | @dr.vismaya_her.little_homcare |
| Hours | Mon–Sat 9:30–18:30 (online only) · Sun 9:00–18:30 (offline only) |
| Firebase | RTDB `dr-vismaya-wellness-centre-default-rtdb`, plain REST reads, 5 reviews |

## Repo layout

```
index.html  pcod.html  thyroid.html  menstrual.html  child-immunity.html  404.html
build.js            builds dist/ from an allowlist
_headers            Cloudflare Pages security headers + cache rules
sitemap.xml  robots.txt  google469d11d6b2b845ea.html   (Search Console ownership)
.gitattributes      pins LF line endings so local and Cloudflare builds match
CNAME               GitHub Pages custom domain - the rollback, keep it
firebase.json  database.rules.json   never published, never commit secrets
assets/             logo.webp, photos, og cards, icons, webmanifest
tools/              deploy-pages.js, verify-dist.js, verify-pages.js, verify-live.js
```

Local-only, never committed: `SESSION-LOG-*.md`, `index (12).*`, `dist/`, `doctor.jpg`, `logo.jpg`.
