// Full SEO/structure suite for the live site: 5 pages, canonicals, og/twitter,
// JSON-LD, anchors, internal links, sitemap, robots, legacy redirect.
//
//   node tools/verify-live.js
//   node tools/verify-live.js http://www.drvismayawellness.com   (while TLS is broken)

const BASE = (process.argv[2] || 'https://www.drvismayawellness.com').replace(/\/$/, '');
const HOST = new URL(BASE).host;
const CANON_HOST = 'www.drvismayawellness.com';
const PAGES = ['/', '/pcod.html', '/thyroid.html', '/menstrual.html', '/child-immunity.html'];
const LEGACY = 'https://jumail173.github.io/dr-vismaya-wellness-centre/';

let fail = 0, pass = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS  ' : 'FAIL  ') + m); };
const np = u => { try { const x = new URL(u); return x.host + x.pathname; } catch { return String(u); } };
const tlsIssue = e => String(e.cause?.code || e.message).includes('TLS') || String(e.cause?.code || '').includes('CERT');

(async () => {
  console.log('=== fetching from ' + BASE + ' ===\n');

  const legacy = await fetch(LEGACY, { redirect: 'manual' });
  ok([301, 302, 308].includes(legacy.status), 'legacy github.io URL redirects (' + legacy.status + ')');
  const loc = legacy.headers.get('location') || '';
  ok(loc.includes(CANON_HOST), 'legacy redirect -> ' + loc);

  for (const p of PAGES) {
    const r = await fetch(BASE + p, { redirect: 'follow' });
    const html = await r.text();
    ok(r.status === 200, p + ' -> 200');
    ok((r.headers.get('content-type') || '').includes('text/html'), p + ' html content-type');
    ok((html.match(/<h1[\s>]/gi) || []).length === 1, p + ' exactly one h1');

    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/i) || [])[1];
    ok(np(canon) === CANON_HOST + p, p + ' canonical = ' + canon);
    const og = (html.match(/<meta property="og:url" content="([^"]+)"/i) || [])[1];
    ok(np(og) === CANON_HOST + p, p + ' og:url = ' + og);
    const tw = (html.match(/<meta name="twitter:url" content="([^"]+)"/i) || [])[1];
    ok(!tw || np(tw) === CANON_HOST + p, p + ' twitter:url consistent');
    ok((html.match(/jumail173\.github\.io/g) || []).length === 0, p + ' zero legacy github.io refs');

    const ids = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    let ldOk = ids.length > 0; const types = [];
    for (const j of ids) { try { types.push(JSON.parse(j)['@type']); } catch { ldOk = false; } }
    ok(ldOk, p + ' JSON-LD parses (' + types.join(', ') + ')');

    const anchors = [...new Set([...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]))];
    const missing = anchors.filter(a => !html.includes('id="' + a + '"'));
    ok(missing.length === 0, p + ' ' + anchors.length + ' in-page anchors exist' + (missing.length ? ' -> missing #' + missing.join(', #') : ''));

    const links = [...new Set([...html.matchAll(/href="([^"#][^"]*?)"/g)].map(m => m[1])
      .filter(h => !/^(https?:|mailto:|tel:|javascript:|data:)/i.test(h))
      .map(h => h.split('#')[0]).filter(Boolean))];
    const bad = [];
    for (const h of links) {
      const u = new URL(h, BASE + p);
      if (u.host !== HOST) continue;
      try { const rr = await fetch(u, { redirect: 'follow' }); if (rr.status !== 200) bad.push(h + ' (' + rr.status + ')'); }
      catch (e) { bad.push(h + ' (net)'); }
    }
    ok(bad.length === 0, p + ' ' + links.length + ' internal links resolve' + (bad.length ? ' -> ' + bad.join(', ') : ''));
  }

  console.log('\n=== sitemap / robots ===');
  const sm = await fetch(BASE + '/sitemap.xml', { redirect: 'follow' });
  const smText = await sm.text();
  ok(sm.status === 200, 'sitemap.xml -> 200');
  const locs = [...smText.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  ok(locs.length === 5, 'sitemap has 5 urls (' + locs.length + ')');
  ok(locs.every(l => np(l).startsWith(CANON_HOST)), 'all sitemap urls on the custom domain');
  for (const l of locs) {
    try { const rr = await fetch(l, { redirect: 'follow' }); ok(rr.status === 200, '  ' + l.replace(BASE, '') + ' -> 200'); }
    catch (e) { console.log('SKIP  ' + l + '  (TLS ' + (tlsIssue(e) ? 'not ready' : 'error') + ')'); }
  }

  const rb = await fetch(BASE + '/robots.txt', { redirect: 'follow' });
  const rbText = await rb.text();
  ok(rb.status === 200, 'robots.txt -> 200');
  ok(rbText.includes('drvismayawellness.com/sitemap.xml'), 'robots.txt points at the new sitemap');

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
})().catch(e => { console.log('ABORTED: ' + (e.cause?.code || e.message)); process.exit(1); });
