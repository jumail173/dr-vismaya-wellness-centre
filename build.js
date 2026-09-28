// Build a clean dist/ containing only files that should be public.
// Cross-platform (Node built-ins only) so it runs on Cloudflare Pages and on Windows.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

const PAGES = ['index.html', 'pcod.html', 'thyroid.html', 'menstrual.html', 'child-immunity.html', '404.html'];

// Copied verbatim to the site root
const ROOT_FILES = ['robots.txt', 'sitemap.xml', 'google469d11d6b2b845ea.html', '_headers'];

// Never published, even though they live in the repo root
const EXCLUDED = [
  'firebase.json',
  'database.rules.json',
  'CNAME',
  'CHANGES.md',
  'README.md',
  'CONTEXT.md',
  'doctor.jpg',
  'logo.jpg',
];

function log(m) { console.log('  ' + m); }

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyInto(srcRel, outRel) {
  const src = path.join(ROOT, srcRel);
  const dst = path.join(OUT, outRel);
  if (!fs.existsSync(src)) {
    console.log('  SKIP (missing) ' + srcRel);
    return false;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  return true;
}

console.log('Building dist/ ...');
rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

// 1. pages
let copied = 0;
for (const p of PAGES) if (copyInto(p, p)) copied++;
console.log(`pages          : ${copied}/${PAGES.length}`);

// 2. root files
for (const f of ROOT_FILES) copyInto(f, f);

// 3. assets actually referenced by the HTML, so the list self-maintains
const refs = new Set();
for (const p of PAGES) {
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/assets\/[A-Za-z0-9._-]+/g)) refs.add(m[0]);
}
// manifest icons are referenced in the webmanifest, not the HTML
const wm = path.join(ROOT, 'assets', 'site.webmanifest');
if (fs.existsSync(wm)) {
  for (const m of fs.readFileSync(wm, 'utf8').matchAll(/"(icon-[0-9]+\.png|apple-touch-icon\.png|favicon-32\.png)"/g)) {
    refs.add('assets/' + m[1]);
  }
}

let acopied = 0;
const missing = [];
for (const r of [...refs].sort()) {
  if (copyInto(r, r)) acopied++;
  else missing.push(r);
}
console.log(`assets         : ${acopied}/${refs.size} referenced` + (missing.length ? '  MISSING: ' + missing.join(', ') : ''));

// 4. report
const onDisk = fs.readdirSync(ROOT).filter(n => !n.startsWith('.') && fs.statSync(path.join(ROOT, n)).isFile());
const leaked = onDisk.filter(f => !EXCLUDED.includes(f) && !PAGES.includes(f) && !ROOT_FILES.includes(f));
console.log(`\nexcluded from publish: ${EXCLUDED.join(', ')}`);
if (leaked.length) {
  console.log(`\nNOT copied (build-script allowlist): ${leaked.join(', ')}`);
  log('add any that should be public to PAGES/ROOT_FILES in build.js');
}

let bytes = 0, n = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else { bytes += fs.statSync(p).size; n++; }
  }
})(OUT);
console.log(`\ndone: ${n} files, ${(bytes / 1024).toFixed(1)} KB -> dist/`);
