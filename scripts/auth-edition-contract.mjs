#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// The auth edition contract describes the ACCEPTED auth screen, so it has to be
// kept in sync with it. Its first version (2026-09-08) described the
// design-system shell that existed then. On 2026-09-17 the screen was rebuilt
// onto the `arena-` composition (50f7162, PR #120) and NEXT_AGENT.md marks that
// implementation as protected: `src/components/auth-v2/` (AuthShell, LoginForm,
// auth-shell.css) plus the four routes /login /register /register-owner
// /register-pro, canonical checkbox EHCheckbox, Inter via `.arena-auth`.
//
// The old token list therefore asserted a design that no longer exists - it
// demanded EHScope/EHPageHero/EHPanel in the shell and forbade the file the
// shell is built on. What follows asserts the protected implementation instead,
// and keeps every guarantee that still applies: one shell, one form, no second
// style family, no client-side Supabase session (T-0168), fail-closed demo
// entry points.

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const has = (source, token, label) => { if (!source.includes(token)) failures.push(`${label}: missing ${token}`); };
const lacks = (source, token, label) => { if (source.includes(token)) failures.push(`${label}: forbidden ${token}`); };
const count = (source, pattern) => (source.match(pattern) ?? []).length;

// Every class name in the auth edition belongs to the single accepted `arena-`
// family. A second family - a Tailwind utility list, a renamed block, a
// hand-written style - is exactly what this guard stops: the shell and the form
// are one composition, not a place to grow a parallel style system.
function foreignClassNames(source) {
  const literals = [];
  for (const match of source.matchAll(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/g)) {
    const raw = match[1] ?? match[2] ?? '';
    // A conditional className holds comparison operands next to the class
    // strings (`authMode === "register" ? "arena-a" : "arena-b"`). Drop the
    // operands first, otherwise "register" would read as a class name.
    const cleaned = raw.replace(/[=!]==?\s*("[^"]*"|'[^']*')/g, '');
    const quoted = [...cleaned.matchAll(/"([^"]*)"|'([^']*)'/g)].map((part) => part[1] ?? part[2] ?? '');
    literals.push(...(quoted.length ? quoted : [cleaned]));
  }
  return [...new Set(
    literals.flatMap((value) => value.split(/\s+/))
      .filter((token) => token && !token.startsWith('arena-')),
  )];
}
const arenaOnly = (source, label) => {
  const foreign = foreignClassNames(source);
  if (foreign.length) failures.push(`${label}: foreign class family ${foreign.join(', ')} (auth edition stays on arena-)`);
};

const routeFiles = [
  'src/app/login/page.tsx',
  'src/app/register/page.tsx',
  'src/app/register-owner/page.tsx',
  'src/app/register-pro/page.tsx',
];
for (const file of routeFiles) {
  const source = read(file);
  has(source, 'AuthShell', file);
  lacks(source, 'auth-convergence.module.css', file);
  lacks(source, 'auth.authConverged', file);
  lacks(source, '<svg', file);
  lacks(source, 'linear-gradient', file);
  lacks(source, 'className=', file);
}

const loginPage = read('src/app/login/page.tsx');
has(loginPage, 'nextPath={sp.next}', 'login route');
lacks(loginPage, 'safeNextPath(', 'login route');
has(loginPage, 'initialAuthMode="login"', 'login route');
const registerPage = read('src/app/register/page.tsx');
has(registerPage, 'initialAuthMode="register"', 'register route');

const ownerRoute = read('src/app/register-owner/page.tsx');
has(ownerRoute, 'initialAuthMode="register"', 'owner registration route');
has(ownerRoute, 'initialRole="kunde"', 'owner registration route');
const providerRoute = read('src/app/register-pro/page.tsx');
has(providerRoute, 'initialAuthMode="register"', 'provider registration route');
has(providerRoute, 'initialRole="handwerker"', 'provider registration route');

// The shell owns the composition, the role switch and the legal entry points.
const shell = read('src/components/auth-v2/AuthShell.tsx');
for (const token of ['./LoginForm', './auth-shell.css', 'arena-auth', 'arena-card', 'arena-main', 'arena-hero', 'LoginForm', 'LegalModal']) {
  has(shell, token, 'AuthShell');
}
for (const token of ['role-toggle-partner', 'role-toggle-kunde', 'link-impressum', 'link-datenschutz']) {
  has(shell, token, 'AuthShell');
}
for (const token of ['motion/react', 'linear-gradient', '<svg', 'shadow-', 'rounded-', 'getSupabase']) {
  lacks(shell, token, 'AuthShell');
}
arenaOnly(shell, 'AuthShell');

const form = read('src/components/auth-v2/LoginForm.tsx');
// The form is mounted by the shell and keeps the one design-system piece the
// accepted screen adopted: EHCheckbox is the canonical checkbox.
for (const token of ['@/design-system', 'EHCheckbox', './ForgotPasswordModal', './LegalModal']) {
  has(form, token, 'LoginForm');
}
// T-0168: the browser is not a security boundary. Authentication runs in the
// server actions, so a client-side Supabase session must not come back.
for (const token of ['loginAction', 'registerAction']) has(form, token, 'LoginForm auth behavior');
for (const token of ['getSupabase', 'signInWithPassword', 'supabase.auth', 'createBrowserClient']) {
  lacks(form, token, 'LoginForm auth behavior');
}
has(form, 'safeNextPath', 'LoginForm auth behavior');
// Icons come from the app's canonical set; hand-rolled markup does not.
has(form, 'lucide-react', 'LoginForm icons');
for (const token of ['<svg', 'motion/react', 'linear-gradient', 'shadow-', 'rounded-', 'style={{']) {
  lacks(form, token, 'LoginForm');
}
arenaOnly(form, 'LoginForm');

// The demo entry points still exist, but they are fail-closed: both handlers
// bail out and both entry points render only on the server page's explicit
// opt-in (security fix 88431f0).
for (const token of ['DEMO_USERS', 'DEMO_PASSWORD', 'demoEmailFor', 'btn-demo-kunde', 'btn-demo-handwerker']) {
  has(form, token, 'LoginForm demo behavior');
}
if (count(form, /if \(isLoading \|\| !demoEnabled\) return/g) < 2) {
  failures.push('LoginForm demo behavior: both demo handlers must bail out unless demoEnabled');
}
if (count(form, /\{demoEnabled && \(/g) < 2) {
  failures.push('LoginForm demo behavior: both demo entry points must be gated by demoEnabled');
}

const forgot = read('src/components/auth-v2/ForgotPasswordModal.tsx');
for (const token of ['@/design-system', 'EHDialog', 'EHButton', 'EHText']) has(forgot, token, 'ForgotPasswordModal');
for (const token of ['className=', 'lucide-react', 'rounded-', 'shadow-', '#']) lacks(forgot, token, 'ForgotPasswordModal');

const legal = read('src/components/auth-v2/LegalModal.tsx');
for (const token of ['@/design-system', 'EHDialog', 'EHButton', 'EHHeading', 'EHText']) has(legal, token, 'LegalModal');
for (const token of ['className=', 'lucide-react', 'rounded-', 'shadow-', '#']) lacks(legal, token, 'LegalModal');
has(legal, 'Gina Schulze', 'LegalModal company identity');
has(legal, 'Jeremy Schulze', 'LegalModal company identity');

if (failures.length) {
  console.error(`AUTH EDITION CONTRACT: RED (${failures.length} failures)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('AUTH EDITION CONTRACT: GREEN — protected arena- auth edition, one shell + one form, server-action auth, fail-closed demo entry points');
