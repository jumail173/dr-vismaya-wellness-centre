// One-command deploy of the site to Cloudflare Pages.
//
// This project uses a Direct Upload Pages project, NOT the GitHub integration:
// deploys do NOT happen automatically on `git push`. Run this instead.
//
//   CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> node tools/deploy-pages.js
//
// Account ID for amjumail2004@gmail.com's Account: 19030ecd277908dc091dc72862970772
//
// It builds dist/, refuses to upload if the offline gate fails, then uploads.
// Never hardcodes the token - read it from the environment.

const { execFileSync, spawnSync } = require('child_process');

const PROJECT = 'dr-vismaya-wellness-centre';
const BRANCH = 'main';
const node = process.execPath;

function step(label, fn) {
  console.log('\n=== ' + label + ' ===');
  return fn();
}

const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID || '19030ecd277908dc091dc72862970772';
if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is not set. See the comment at the top of this file.');
  process.exit(2);
}

step('build', () => execFileSync(node, ['build.js'], { stdio: 'inherit' }));

step('verify dist', () => {
  try {
    execFileSync(node, ['tools/verify-dist.js'], { stdio: 'inherit' });
  } catch {
    console.error('\nBuild failed verification. Nothing was uploaded. Fix and re-run.');
    process.exit(1);
  }
});

let sha = 'local', msg = 'manual deploy';
try {
  sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  msg = execFileSync('git', ['log', '-1', '--pretty=%s'], { encoding: 'utf8' }).trim();
} catch { /* not a git checkout, carry on */ }

step('upload', () => {
  const args = ['wrangler', 'pages', 'deploy', 'dist',
    '--project-name=' + PROJECT, '--branch=' + BRANCH,
    '--commit-hash=' + sha, '--commit-message=' + msg, '--commit-dirty=true'];

  let r;
  if (process.platform === 'win32') {
    // Windows needs shell:true to reach the npx.cmd shim, but that re-joins the
    // args into one command line - so anything containing spaces must be quoted
    // or the command silently fails to upload. (This cost us two deployments.)
    const line = [quoteWin('npx'), ...args.map(quoteWin)].join(' ');
    r = spawnSync(line, {
      stdio: 'inherit', shell: true,
      env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account },
    });
  } else {
    r = spawnSync('npx', args, {
      stdio: 'inherit',
      env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account },
    });
  }
  if (r.error) {
    console.error('\nwrangler failed to start: ' + r.error.message);
    console.error('Is Node/npm on PATH? Try:  npm install wrangler');
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status || 1);
});

function quoteWin(a) {
  return /\s/.test(a) ? '"' + a.replace(/"/g, '\\"') + '"' : a;
}

step('verify live', () => {
  console.log('Run the full suite against the real hostname:');
  console.log('  node tools\\verify-live.js https://www.drvismayawellness.com');
  console.log('Do not enable HSTS in _headers until HTTPS has been stable for a few weeks.');
});