# HANDOFF — read this first

**Current state: 1 Oct 2026. The site works on `http://` but not `https://`. The fix is one dashboard step away and then one DNS record.**

Long history lives in [`CONTEXT.md`](CONTEXT.md) and the git history. This file is the short version, kept current.

---

## The one thing to do next

Create a **Cloudflare Pages** project from the GitHub repo. Then send the `*.pages.dev` URL to whoever is helping and let them verify it.

**Do not change the GoDaddy nameservers.** See "Why Pages, not Workers" below — this is the whole point.

| Setting | Value |
|---|---|
| Framework preset | **None** |
| Build command | `node build.js` |
| Build output directory | `dist` |
| Root directory | *blank* |
| Production branch | `main` |

`https://dash.cloudflare.com/?to=/:account/workers-and-pages` → **Create application** → **Pages** → **Connect to Git** → authorise `jumail173/dr-vismaya-wellness-centre` (select **only** that repo).

**The tell that you got it right:** the URL ends in **`.pages.dev`**, not `.workers.dev`.

There is already a Worker with static assets deployed at
`https://dr-vismaya-wellness-centre.amjumail2004.workers.dev`. **Delete it** — it publishes the entire repo (including `database.rules.json`) and serves an empty 404 instead of `404.html`. Do not attach a custom domain to it. The plan is a Pages project, which does not require a nameserver change.

---

## Why HTTPS is broken, in one paragraph

The custom domain `www.drvismayawellness.com` was set on GitHub Pages on 27 Sep 2026. GitHub issued a certificate for the apex but never for `www` — it has sat in `state: dns_changed` ever since, ~5 days past GitHub's documented 24h. DNS is provably correct, `githubstatus.com` reports Pages operational, and the whole GitHub ladder (apex↔www toggle, full domain remove + re-add) has been tried and burned. **Do not touch the Pages custom domain or GoDaddy DNS again** — `dns_changed` literally means "detected a change to DNS settings", so every attempt restarts the clock. Cert requests cannot be escalated: the account is on GitHub **Free** (`gh api /user --jq .plan` → `null`), and GitHub only shows the support form to paid accounts. Migration to Cloudflare is the way out.

---

## Why Pages, not Workers

Both are free and both work. They differ in the one step that matters right now:

| | Custom domain on `www` | Needs nameserver change? |
|---|---|---|
| **Pages** | one CNAME at GoDaddy → `<project>.pages.dev` | **No** |
| **Workers** | Cloudflare must already own the zone as an active zone | **Yes — full DNS migration** |

From Cloudflare's docs, a Worker custom domain requires *"an active Cloudflare zone"* and *"you cannot create a Custom Domain on a hostname with an existing CNAME DNS record or on a zone you do not own."* A Pages project has no such requirement for a subdomain. GoDaddy DNS and the apex records stay untouched, and the change is reversible by editing one row.

---

## After Pages is live — the DNS step

Only once the gate prints **ALL GREEN**:

1. Pages project → **Custom domains** → **Set up a domain** → `www.drvismayawellness.com` → Continue. It sits at *Pending*.
2. GoDaddy → **DNS** → **Manage DNS** → find the `www` record (**CNAME**, currently `jumail173.github.io`).
3. Edit **only that row's Value** to `<your-project>.pages.dev`. Leave Type = CNAME and Name = `www`.
4. **Leave the 4 apex `A` records and the nameservers alone.** The apex keeps serving its existing GitHub 301 → `www`.

Order matters: adding the CNAME *before* the Pages domain is associated gives a `522`.

**Keep the GitHub Pages custom domain and the `CNAME` file** — that is the rollback until the new host is verified working.

---

## Verifying

```
node build.js                                    # 24 files, ~794 KB -> dist/
node tools\verify-pages.js https://<project>.pages.dev
node tools\verify-live.js http://www.drvismayawellness.com
```

`verify-pages.js` is the pre-DNS gate — it must print **ALL GREEN — safe to add the custom domain and change the GoDaddy nameservers** before you touch GoDaddy. It checks all 5 pages, one `h1` each, JSON-LD, that 9 private paths 404, the sitemap is 997 bytes with no BOM, the Search Console ownership file is served, Firebase reviews load, the branded 404 is really ours, and that `_headers` was actually applied.

`verify-live.js` is the 57-check suite for the final host. Pass it `http://` while TLS is broken; the 5 `https://` sitemap URLs report `SKIP (TLS not ready)`, which is correct at that stage.

Both retry 6 times with backoff. **This is required, not optional** — see "Gotchas".

---

## Gotchas that will waste your time otherwise

- **Do not route anyone to `support.github.com/contact`.** There is no ticket form on a Free account. The category dropdown does not exist for them. Check the plan with the API before asserting any account-level capability.
- **Node `fetch` drops ~3 of 4 connections to this host** (`UND_ERR_CONNECT_TIMEOUT`) while `curl` succeeds every time. Any check script must retry or it reports phantom failures.
- **`_headers` failing to parse is silent.** No build error, no headers on the response. This already happened once — a prose comment sat inside the `/*` rule block where the grammar requires `name: value` lines. If security headers go missing after a deploy, suspect the file format before anything else.
- **GitHub Pages serves the entire repo directory**, so `CONTEXT.md`, `CHANGES.md`, `README.md`, `firebase.json` and `database.rules.json` are all publicly readable on the current host. The `dist/` build closes this. It is not a vulnerability — Firebase rules are enforced server-side — but do not commit anything private.
- **`build.js` uses an allowlist**, so a file is only published if deliberately listed. If you add a public file, add it to `PAGES` or `ROOT_FILES`. Anything unlisted is reported as `NOT copied` at the end of every run.
- **`_headers` asset caching is 1 year.** If you ever replace a photo under the same filename, browsers will keep serving the old one. Change the filename or drop it to `max-age=86400`.

---

## Also outstanding (not blocked on the certificate)

1. **Google Business Profile** — `business.google.com`. Slowest item (postcard/phone verification, days to weeks) and completely independent of TLS, so start it first. NAP is in the JSON-LD: *Her & Little Wellness Centre, Venpakal, Athiyannur, Kerala 695123, +91 96774 80825*, category *Homeopathic Physician*, hours Mon–Sat 9:30–18:30 · Sun 9:00–18:30. **The site's Firebase reviews are invisible to Google** — collect Google reviews separately.
2. **Search Console** — sitemap submitted 28 Sep and confirmed `Success`. Per-URL *Request indexing* for the 5 URLs is still pending; wait until TLS is live, because a red result now is just the certificate.
3. **HSTS** — deliberately off in `_headers`. Enable it only after HTTPS has been stable on the final host for a few weeks.
4. **Instagram** @dr.vismaya_her.little_homcare, 2–3 posts/week.

## Optional clean-up

`assets/logo.png` (87 KB), `assets/favicon.jpg` and `assets/cursor.cur` are unreferenced and drop out of `dist/`, but are still committed. They cost nothing and `logo.png` is a usable fallback. Not a fix, just tidying.

---

## Facts

| | |
|---|---|
| Live (broken TLS) | `http://www.drvismayawellness.com` → 200 |
| Intended final host | `https://www.drvismayawellness.com` |
| Repo | `jumail173/dr-vismaya-wellness-centre`, branch `main` |
| Cloudflare account subdomain | `amjumail2004` |
| Nameservers | `ns57` / `ns58.domaincontrol.com` (GoDaddy) |
| CAA records | **none** — checked, so nothing will block Cloudflare's cert |
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
CNAME               GitHub Pages custom domain - keep until the migration is verified
firebase.json  database.rules.json   never published, never commit secrets
assets/             logo.webp, photos, og cards, icons, webmanifest
tools/              verify-pages.js, verify-live.js, certwatch.ps1
```

Local-only, never committed: `SESSION-LOG-*.md`, `index (12).*`, `dist/`, `doctor.jpg`, `logo.jpg`.
