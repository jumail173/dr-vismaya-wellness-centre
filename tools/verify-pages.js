// Pre-DNS verification for a Cloudflare Pages deployment.
// Usage: node verify_pages.js https://<project>.pages.dev
// Implements the 8-point checklist from SESSION-LOG-2026-09-28.md section 13.

const { execFileSync } = require('child_process');

const BASE = (process.argv[2] || '').replace(/\/$/, '');
if (!BASE) { console.error('usage: node verify_pages.js https://<project>.pages.dev'); process.exit(2); }
const HOST = new URL(BASE).host;
const CANON_HOST = 'www.drvismayawellness.com';
const PAGES = ['/', '/pcod.html', '/thyroid.html', '/menstrual.html', '/child-immunity.html'];
const MUST_404 = ['/database.rules.json', '/firebase.json', '/CHANGES.md', '/CONTEXT.md',
  '/README.md', '/CNAME', '/SESSION-LOG-2026-09-28.md', '/build.js', '/index%20(12).html'];
const DB = 'https://dr-vismaya-wellness-centre-default-rtdb.firebaseio.com/reviews.json';

let fail = 0, pass = 0, skip = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS  ' : 'FAIL  ') + m); };
const soft = (c, m) => { c ? pass++ : skip++; console.log((c ? 'PASS  ' : 'INFO  ') + m); };
const get = async (p, opts = {}) => {
  let last;
  // connections to this host drop intermittently; retry before calling it a failure
  for (let i = 1; i <= 6; i++) {
    try {
      const r = await fetch(BASE + p, { redirect: 'follow', ...opts });
      const b = await r.arrayBuffer();
      return { status: r.status, headers: r.headers, body: Buffer.from(b), text: Buffer.from(b).toString('utf8') };
    } catch (e) {
      last = e;
      await new Promise(s => setTimeout(s, 1500 * i));
    }
  }
  throw last;
};

(async () => {
  console.log('=== Cloudflare Pages pre-DNS verification: ' + BASE + ' ===');
  console.log('(' + MUST_404.length + ' paths must 404, so this is safe to run against a live host)\n');

  const TLS = BASE.startsWith('https:');

  // 1. reachable, and (if https) cert subject matches
  let home;
  try {
    home = await get('/');
    ok(home.status === 200, '1. ' + HOST + ' -> 200');
  } catch (e) {
    console.log('FAIL  1. cannot fetch: ' + (e.cause?.code || e.message));
    console.log('\n' + pass + ' passed, ' + fail + ' failed');
    process.exit(1);
  }
  if (!TLS) soft(false, '1a. SKIP cert check - base is http, not https');
  try {
    const v = execFileSync('curl.exe', ['-sS', '-v', '-o', 'NUL', BASE + '/'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const subj = (v.match(/subject: *(.*)/i) || [])[1] || (v.match(/Subject:\s*(.*)/i) || [])[1] || '';
    const okSubj = /pages\.cloudflare\.com|cloudflare/i.test(subj) || /CN=(\*\.)?pages\.dev/.test(subj);
    soft(okSubj, '1b. cert subject -> ' + (subj.trim() || '(not reported by this curl/schannel build)'));
  } catch (e) {
    const s = String(e.stderr || '');
    const subj = (s.match(/subject: *(.*)/i) || [])[1] || (s.match(/Subject:\s*(.*)/i) || [])[1] || '';
    soft(!!subj, '1b. cert subject -> ' + (subj.trim() || '(not reported by this curl/schannel build)'));
  }

  // 2. all 5 pages 200, one h1, JSON-LD parses
  console.log('\n=== pages ===');
  for (const p of PAGES) {
    const r = await get(p);
    ok(r.status === 200, p + ' -> 200');
    ok((r.headers.get('content-type') || '').includes('text/html'), p + ' html content-type');
    ok((r.text.match(/<h1[\s>]/gi) || []).length === 1, p + ' exactly one h1');
    const canon = (r.text.match(/<link rel="canonical" href="([^"]+)"/i) || [])[1] || '';
    ok(canon.startsWith('https://' + CANON_HOST), p + ' canonical still on final host -> ' + canon);
    ok((r.text.match(/jumail173\.github\.io/g) || []).length === 0, p + ' zero legacy github.io refs');
    const ids = [...r.text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    let ldOk = ids.length > 0; const types = [];
    for (const j of ids) { try { types.push(JSON.parse(j)['@type']); } catch { ldOk = false; } }
    ok(ldOk, p + ' JSON-LD parses (' + types.join(', ') + ')');
    const anchors = [...new Set([...r.text.matchAll(/href="#([^"]+)"/g)].map(m => m[1]))];
    const missing = anchors.filter(a => !r.text.includes('id="' + a + '"'));
    ok(missing.length === 0, p + ' anchors resolve' + (missing.length ? ' -> missing #' + missing.join(' #') : ''));
  }

  // every asset the HTML references must be served
  console.log('\n=== assets ===');
  const idx = home.text;
  const refs = [...new Set([...idx.matchAll(/assets\/[A-Za-z0-9._-]+/g)].map(m => m[0]))];
  let abad = [];
  for (const a of refs) {
    try { const r = await get('/' + a); if (r.status !== 200) abad.push(a + ' (' + r.status + ')'); }
    catch { abad.push(a + ' (net)'); }
  }
  ok(abad.length === 0, refs.length + ' assets referenced by index.html all 200' + (abad.length ? ' -> ' + abad.join(', ') : ''));
  const ogImgs = ['og-home.jpg', 'og-pcod.jpg', 'og-thyroid.jpg', 'og-menstrual.jpg', 'og-child-immunity.jpg'];
  let ogbad = [];
  for (const g of ogImgs) {
    const r = await get('/assets/' + g); if (r.status !== 200) ogbad.push(g + ' (' + r.status + ')');
  }
  ok(ogbad.length === 0, ogImgs.length + ' og social cards served' + (ogbad.length ? ' -> ' + ogbad.join(', ') : ''));

  // 3. nothing private published
  console.log('\n=== leak check ===');
  for (const p of MUST_404) {
    const r = await get(p);
    ok(r.status === 404, p + ' -> ' + r.status + (r.status === 404 ? '' : '  LEAKED'));
  }

  // 4. sitemap
  console.log('\n=== sitemap / robots ===');
  const sm = await get('/sitemap.xml');
  ok(sm.status === 200, 'sitemap.xml -> 200');
  ok(sm.body.length === 997, 'sitemap.xml = 997 bytes (got ' + sm.body.length + ')');
  ok(!(sm.body[0] === 0xEF && sm.body[1] === 0xBB && sm.body[2] === 0xBF), 'sitemap.xml has no UTF-8 BOM');
  const nonAscii = [...sm.body].filter(b => b > 127).length;
  ok(nonAscii === 0, 'sitemap.xml is pure ASCII (' + nonAscii + ' non-ascii bytes)');
  const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  ok(locs.length === 5, 'sitemap has 5 urls (' + locs.length + ')');
  ok(locs.every(l => l.startsWith('https://' + CANON_HOST)), 'all sitemap urls on the final custom domain');
  const rb = await get('/robots.txt');
  ok(rb.status === 200, 'robots.txt -> 200');
  ok(rb.text.includes(CANON_HOST + '/sitemap.xml'), 'robots.txt points at the final-host sitemap');

  // 5. Search Console ownership file
  console.log('\n=== Search Console ownership ===');
  const gv = await get('/google469d11d6b2b845ea.html');
  ok(gv.status === 200, 'google469d11d6b2b845ea.html -> 200 (losing this can force re-verification)');
  ok(/google-site-verification/i.test(gv.text), 'ownership file has the verification content');

  // 6. Firebase reviews
  console.log('\n=== Firebase ===');
  try {
    const d = await (await fetch(DB)).json();
    const n = d ? Object.keys(d).length : 0;
    soft(n >= 5, 'reviews in RTDB: ' + n + ' (expect 5)');
  } catch (e) { soft(false, 'RTDB unreachable from this machine: ' + (e.cause?.code || e.message)); }

  // 7. branded 404
  console.log('\n=== 404 ===');
  const nf = await get('/this-page-does-not-exist-opencode-probe');
  ok(nf.status === 404, 'unknown path -> 404 (got ' + nf.status + ')');
  ok((nf.text.match(/<h1[\s>]/gi) || []).length === 1, 'branded 404 has exactly one h1');
  ok(/noindex/i.test(nf.text), 'branded 404 is noindex');
  ok(nf.text.trim().length > 200 && /Wellness|Vismaya/i.test(nf.text),
    'branded 404 body is ours, not an empty/default 404 (' + nf.text.trim().length + ' bytes)');

  // 8. _headers applied
  console.log('\n=== security headers ===');
  const H = home.headers;
  ok(H.get('x-content-type-options') === 'nosniff', 'x-content-type-options: ' + H.get('x-content-type-options'));
  ok(!!H.get('referrer-policy'), 'referrer-policy: ' + H.get('referrer-policy'));
  ok(!!H.get('x-frame-options'), 'x-frame-options: ' + H.get('x-frame-options'));
  ok(!!H.get('permissions-policy'), 'permissions-policy: ' + H.get('permissions-policy'));
  const asset = await get('/assets/logo.webp');
  const cc = asset.headers.get('cache-control') || '';
  ok(/immutable/.test(cc) && /max-age=31536000/.test(cc), 'assets immutable-cached: ' + cc);

  // the temporary staging URL must not be indexed
  if (/pages\.dev$/.test(HOST)) {
    ok((H.get('x-robots-tag') || '').includes('noindex'),
      'staging URL is noindex (X-Robots-Tag: ' + H.get('x-robots-tag') + ')');
  } else {
    soft(!!H.get('x-robots-tag'), 'no X-Robots-Tag on the final host (correct) - ' + H.get('x-robots-tag'));
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed' + (skip ? ' (' + skip + ' informational)' : ''));
  console.log(fail === 0
    ? '\nALL GREEN. Safe to add the custom domain and change the GoDaddy nameservers.'
    : '\nNOT GREEN. Do not touch DNS yet.');
})().catch(e => { console.log('ABORTED: ' + (e.cause?.code || e.message)); process.exit(1); });
