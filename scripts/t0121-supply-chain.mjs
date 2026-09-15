// T-0121 supply-chain gate: dependency vulnerabilities, lockfile integrity,
// secret scanning, build-artifact hygiene and an SBOM/provenance record.
// Deterministic, fail-closed, offline where possible. Designed to run in CI
// (.github/workflows/quality.yml) and as release evidence on the OCI host.
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
const failures = [];
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  ok  ${name}`); }
  else { failures.push(`${name}${detail ? ` :: ${detail}` : ''}`); console.error(`FAIL  ${name}${detail ? ` :: ${detail}` : ''}`); }
}
function section(title) { console.log(`\n== ${title} ==`); }

// ---------------------------------------------------------------------------
// 1. Dependency vulnerability audit (npm audit --json, moderate threshold)
// ---------------------------------------------------------------------------
function auditDependencies() {
  section('dependency vulnerabilities (npm audit)');
  const allowlist = new Set([
    // GHSA ids with a documented, accepted remediation (override present or
    // no fixed version exists upstream). Each entry must carry a reason.
  ]);
  let report;
  try {
    report = JSON.parse(execFileSync('npm', ['audit', '--json'], { cwd: root, encoding: 'utf8', timeout: 120000 }));
  } catch (error) {
    // npm audit exits non-zero when vulnerabilities exist; stdout still has JSON.
    try { report = JSON.parse(String(error.stdout || '{}')); }
    catch { check('npm audit report parseable', false, String(error.message).slice(0, 200)); return; }
  }
  const vulns = report?.metadata?.vulnerabilities ?? {};
  const critical = vulns.critical ?? 0;
  const high = vulns.high ?? 0;
  const moderate = vulns.moderate ?? 0;
  const low = vulns.low ?? 0;
  const total = (vulns.total ?? 0);
  const advisories = report?.vulnerabilities ?? {};
  const unaccepted = Object.entries(advisories).filter(([, v]) => {
    const ids = [v.via].flat().filter(x => typeof x === 'object' && x?.url?.includes('/advisories/')).map(x => x.url.split('/advisories/')[1]);
    return ids.length > 0 && ids.some(id => !allowlist.has(id));
  });
  check('no critical/high vulnerabilities', critical === 0 && high === 0, `critical=${critical} high=${high}`);
  check('no unaccepted moderate/low vulnerabilities', moderate === 0 && low === 0 && unaccepted.length === 0, `moderate=${moderate} low=${low} unaccepted=${unaccepted.map(([n]) => n).join(',')}`);
  check('npm audit total is zero', total === 0, `total=${total}`);
}

// ---------------------------------------------------------------------------
// 2. Lockfile integrity: package.json <-> package-lock.json consistency
// ---------------------------------------------------------------------------
function lockfileIntegrity() {
  section('lockfile integrity');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  check('lockfile exists and is lockfileVersion 3', lock.lockfileVersion >= 3, `v${lock.lockfileVersion}`);

  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const missing = [];
  for (const [name] of Object.entries(deps)) {
    if (!lock.packages?.[`node_modules/${name}`]) missing.push(name);
  }
  check('every declared dependency exists in the lockfile', missing.length === 0, missing.slice(0, 5).join(','));

  // Overrides must be reflected: every overridden package resolves to the pinned range.
  const overrides = pkg.overrides ?? {};
  const overrideProblems = [];
  for (const [name, pin] of Object.entries(overrides)) {
    const want = typeof pin === 'string' && pin.startsWith('npm:') ? pin.slice(4) : pin;
    const [wantName, wantSpec] = typeof want === 'string' ? [name, want] : [want.name ?? name, want.version];
    for (const [loc, entry] of Object.entries(lock.packages ?? {})) {
      if (loc.endsWith(`node_modules/${wantName}`) && entry.version) {
        const clean = wantSpec.replace(/[^0-9.]/g, '');
        if (!entry.version.startsWith(clean)) overrideProblems.push(`${loc}: ${entry.version} != ${wantSpec}`);
      }
    }
  }
  check('lockfile reflects every package.json override', overrideProblems.length === 0, overrideProblems.slice(0, 3).join('; '));

  // npm ci dry-run consistency: lockfile must satisfy the manifest.
  try {
    execFileSync('npm', ['ci', '--dry-run'], { cwd: root, encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'] });
    check('npm ci --dry-run is consistent with the lockfile', true);
  } catch (error) {
    check('npm ci --dry-run is consistent with the lockfile', false, String(error.stderr || error.message).slice(0, 200));
  }
}

// ---------------------------------------------------------------------------
// 3. Secret scanning: tracked + new files, high-signal patterns only
// ---------------------------------------------------------------------------
function secretScan() {
  section('secret scanning');
  let tracked = '';
  try { tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }); }
  catch { check('git ls-files available', false); return; }
  const files = tracked.split('\n').filter(Boolean).filter(f => {
    if (f === 'package-lock.json') return false;
    if (!/\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|sh|env.example|html|css)$/.test(f) && f !== '.env.example') return false;
    return fs.existsSync(path.join(root, f));
  });

  const patterns = [
    ['private key block', /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY( BLOCK)?-----/],
    ['aws access key id', /AKIA[0-9A-Z]{16}/],
    ['stripe live key', /sk_live_[0-9a-zA-Z]{20,}/],
    ['stripe webhook secret', /whsec_[0-9a-zA-Z]{20,}/],
    ['supabase service role jwt', /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
    ['generic high-entropy assignment', /\b(API_KEY|SECRET|PASSWORD|TOKEN)_?[A-Z_]*\s*[:=]\s*['"][A-Za-z0-9+/_-]{32,}['"]/],
    ['slack token', /xox[baprs]-[0-9A-Za-z]{10,}/],
    ['github token', /gh[pousr]_[A-Za-z0-9]{36,}/],
    ['twilio key', /SK[0-9a-fA-F]{32}/],
    ['private connection string', /postgres(ql)?:\/\/[^:\s]+:[^@\s]+@/],
  ];

  // Files that carry secret-shaped strings on purpose. The redaction
  // regression test needs synthetic live keys to prove that redactDetail()
  // strips them - they are fixtures, not credentials. Keep this list short
  // and specific; never add a whole directory.
  const SECRET_SCAN_EXCEPTIONS = new Set([
    'scripts/t0132-error-tracking-regression.mjs',
  ]);

  let findings = 0;
  for (const file of files) {
    if (SECRET_SCAN_EXCEPTIONS.has(file)) continue;
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [label, re] of patterns) {
      const m = content.match(re);
      if (!m) continue;
      // Placeholder sentences in docs/env.example are fine; look for non-example shapes.
      const isExample = /example|placeholder|your[-_]?key|<[^>]+>|\.\.\.|xxx|^[^'"]*(#|\/\/)/i.test(m[0]) || file.includes('.example') || file.endsWith('.md');
      if (isExample) continue;
      console.log(`SECRET? ${file}: ${label} :: ${m[0].slice(0, 40)}...`);
      findings++;
    }
  }
  check('no committed secrets found', findings === 0, `${findings} candidate(s) — review SECRET? lines`);

  // .env files must never be tracked (only .env.example).
  const trackedEnv = tracked.split('\n').filter(f => /^\.env/.test(f) && f !== '.env.example');
  check('.env files are not tracked in git', trackedEnv.length === 0, trackedEnv.join(','));
}

// ---------------------------------------------------------------------------
// 4. Build-artifact hygiene: .gitignore covers generated trees, no artifacts tracked
// ---------------------------------------------------------------------------
function artifactHygiene() {
  section('build-artifact hygiene');
  const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  const requiredIgnores = ['.next/', 'node_modules/', '.env', 'data/private/', 'public/uploads/'];
  const missing = requiredIgnores.filter(entry => !gitignore.includes(entry.replace(/\/$/, '')));
  check('.gitignore covers generated/persistent trees', missing.length === 0, missing.join(','));

  let tracked = '';
  try { tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }); } catch {}
  const leaked = tracked.split('\n').filter(f =>
    f.startsWith('.next/') || f.startsWith('node_modules/') || /^\.env$/.test(f) ||
    f.startsWith('data/private/') || f.endsWith('.tsbuildinfo') ||
    f === 'package-lock.json.bak' || f.startsWith('.sin-gpt-web/'),
  );
  check('no generated artifacts tracked in git', leaked.length === 0, leaked.slice(0, 5).join(','));

  // Production build must not contain obvious secret-bearing files.
  const buildId = path.join(root, '.next', 'BUILD_ID');
  if (fs.existsSync(buildId)) {
    let bad = 0;
    const serverDir = path.join(root, '.next', 'server');
    const walk = (dir, depth) => {
      if (depth > 4) return;
      let entries = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, depth + 1);
        else if (/\.env($|\.)/.test(e.name) || /secret/i.test(e.name)) { console.log(`ARTIFACT_SECRET? ${p}`); bad++; }
      }
    };
    walk(serverDir, 0);
    check('production build contains no secret-shaped files', bad === 0, `${bad} candidate(s)`);
  } else {
    console.log('  skip  no production build present (.next/BUILD_ID)');
  }
}

// ---------------------------------------------------------------------------
// 5. SBOM + provenance record (CycloneDX-style JSON, written to release evidence)
// ---------------------------------------------------------------------------
function sbomAndProvenance() {
  section('SBOM / provenance record');
  const outDir = path.join(root, '.sin-gpt-web', 'evidence', 'release-gate', 'sbom');
  fs.mkdirSync(outDir, { recursive: true });
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  const components = [];
  for (const [loc, entry] of Object.entries(lock.packages ?? {})) {
    if (!loc.startsWith('node_modules/') || loc.includes('node_modules/')) {
      if (!loc.startsWith('node_modules/')) continue;
    }
    if (entry.dev && entry.dev === true) continue;
    const name = loc === 'node_modules/' ? pkg.name : loc.replace(/^node_modules\//, '').replace(/node_modules\//g, '');
    if (!entry.version) continue;
    components.push({
      type: 'library',
      name,
      version: entry.version,
      purl: `pkg:npm/${name}@${entry.version}`,
      scope: 'required',
    });
  }
  // De-duplicate by purl (nested duplicates resolve to one effective version).
  const byPurl = new Map();
  for (const c of components) if (!byPurl.has(c.purl)) byPurl.set(c.purl, c);

  const lockHash = createHash('sha256').update(fs.readFileSync(path.join(root, 'package-lock.json'))).digest('hex');
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${createHash('sha256').update(lockHash).digest('hex').slice(0, 8)}-0000-4000-8000-${lockHash.slice(0, 12)}`,
    metadata: {
      timestamp: new Date().toISOString(),
      component: { type: 'application', name: pkg.name, version: pkg.version },
      properties: [
        { name: 'eh:lockfile-sha256', value: lockHash },
        { name: 'eh:generator', value: 'scripts/t0121-supply-chain.mjs' },
      ],
    },
    components: [...byPurl.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
  const sbomPath = path.join(outDir, 'sbom.cdx.json');
  fs.writeFileSync(sbomPath, JSON.stringify(sbom, null, 2));
  check(`SBOM written (${sbom.components.length} runtime components)`, sbom.components.length > 0, sbomPath.replace(root, ''));

  const provenance = {
    generated_at: new Date().toISOString(),
    generator: 'scripts/t0121-supply-chain.mjs',
    app: { name: pkg.name, version: pkg.version, node: process.version, host: os.hostname() },
    lockfile_sha256: lockHash,
    dependency_count: sbom.components.length,
    audit: 'npm audit --json: zero critical/high; moderate/low must be zero or explicitly allowlisted with reason',
    secret_scan: '10 high-signal patterns over all tracked text files; .env untracked by contract',
    notes: 'Fail-closed gate: any critical/high, any unaccepted moderate/low, secret finding, tracked artifact or lockfile inconsistency blocks release.',
  };
  const provPath = path.join(outDir, 'provenance.json');
  fs.writeFileSync(provPath, JSON.stringify(provenance, null, 2));
  check('provenance record written', fs.existsSync(provPath), provPath.replace(root, ''));
}

// ---------------------------------------------------------------------------
function main() {
  section('T-0121 supply-chain gate');
  auditDependencies();
  lockfileIntegrity();
  secretScan();
  artifactHygiene();
  sbomAndProvenance();

  console.log(`\nT-0121 supply-chain gate: ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.error('FAILURES:\n' + failures.map(f => '  - ' + f).join('\n'));
    process.exit(1);
  }
}

main();
