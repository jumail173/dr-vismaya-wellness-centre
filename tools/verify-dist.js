// Offline check of the dist/ payload before it is uploaded to Cloudflare Pages.
// Confirms the build allowlist published nothing private, that every asset the
// HTML references actually landed, and that sitemap.xml keeps the exact bytes
// Google already has indexed. Complements tools/verify-pages.js, which can only
// run once a *.pages.dev URL exists.
//
//   node build.js && node tools/verify-dist.js

const fs=require("fs"),p=require("path");
const D="dist";let fail=0,pass=0;
const ok=(c,m)=>{c?pass++:fail++;console.log((c?"PASS  ":"FAIL  ")+m);};
if(!fs.existsSync(D)){console.error("no dist/ - run: node build.js");process.exit(2);}
const PAGES=["/","/pcod.html","/thyroid.html","/menstrual.html","/child-immunity.html"];
const MUST404=["/database.rules.json","/firebase.json","/CHANGES.md","/CONTEXT.md","/README.md","/CNAME","/build.js","/HANDOFF.md"];
for(const x of MUST404) ok(!fs.existsSync(p.join(D,x)),"leak-check "+x+" absent from dist");
for(const pg of PAGES){
  const f=p.join(D,pg==="/"?"index.html":pg.slice(1));
  ok(fs.existsSync(f),pg+" present");
  const h=fs.readFileSync(f,"utf8");
  ok((h.match(/<h1[\s>]/gi)||[]).length===1,pg+" exactly one h1");
  const ids=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  let good=ids.length>0;for(const j of ids){try{JSON.parse(j)}catch{good=false}}
  ok(good,pg+" JSON-LD parses ("+ids.length+" blocks)");
  const anchors=[...new Set([...h.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]))];
  ok(anchors.every(a=>h.includes('id="'+a+'"')),pg+" "+anchors.length+" anchors resolve");
  const refs=[...new Set([...h.matchAll(/assets\/[A-Za-z0-9._-]+/g)].map(m=>m[0]))];
  const missing=refs.filter(r=>!fs.existsSync(p.join(D,r)));
  ok(missing.length===0,pg+" "+refs.length+" asset refs all in dist"+(missing.length?" missing "+missing:""));
}
const smb=fs.readFileSync(p.join(D,"sitemap.xml"));
ok(smb.length===997,"sitemap.xml 997 bytes (got "+smb.length+")");
ok(!(smb[0]===0xEF&&smb[1]===0xBB&&smb[2]===0xBF),"sitemap.xml no BOM");
ok([...smb].every(b=>b<=127),"sitemap.xml pure ASCII");
const gv=fs.readFileSync(p.join(D,"google469d11d6b2b845ea.html"),"utf8");
ok(/google-site-verification/i.test(gv),"Search Console ownership file intact");
const nf=fs.readFileSync(p.join(D,"404.html"),"utf8");
ok((nf.match(/<h1[\s>]/gi)||[]).length===1&&/noindex/i.test(nf),"branded 404 (one h1 + noindex)");
ok(/noindex/i.test(fs.readFileSync(p.join(D,"index.html"),"utf8"))===false,"index.html not noindex");
ok(fs.existsSync(p.join(D,"_headers")),"_headers present");
let total=0;
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const q=p.join(d,e.name);e.isDirectory()?walk(q):total+=fs.statSync(q).size});
walk(D);ok(true,"dist payload "+(total/1024).toFixed(1)+" KB");
const crlf=allFiles().filter(f=>/\.(html|css|js|json|xml|txt|md)$/.test(f)&&fs.readFileSync(f).includes(13));
ok(crlf.length===0,"no CRLF in any text file"+(crlf.length?" -> "+crlf.join(", "):""));
console.log("\n"+pass+" passed, "+fail+" failed");
console.log(fail===0?"\nDIST IS CLEAN. Safe to upload.":"\nNOT CLEAN. Do not upload.");
process.exit(fail===0?0:1);

function allFiles(){const out=[];(function r(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,e.name);e.isDirectory()?r(q):out.push(q)}})(D);return out}
