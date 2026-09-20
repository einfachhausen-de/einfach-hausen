#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const seed = fs.readFileSync(path.join(root, 'scripts/seed-demo-users.mjs'), 'utf8');
const accounts = fs.readFileSync(path.join(root, 'src/lib/demo-accounts.ts'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'src/lib/auth.ts'), 'utf8');
const form = fs.readFileSync(path.join(root, 'src/components/auth-v2/LoginForm.tsx'), 'utf8');
const loginRoute = fs.readFileSync(path.join(root, 'src/app/login/page.tsx'), 'utf8');

for (const token of ['kunde@demo.einfachhausen.de', 'handwerker@demo.einfachhausen.de']) {
  if (!accounts.includes(token)) failures.push(`demo account contract missing ${token}`);
}
// Opt-in fail-closed (88431f0): kein Klartext-Passwort mehr im Code, ENV-only.
for (const token of ["process.env.DEMO_LOGIN_ENABLED === '1'", 'process.env.DEMO_PASSWORD']) {
  if (!accounts.includes(token)) failures.push(`demo opt-in contract missing ${token}`);
}
if (accounts.includes("= 'admin'")) failures.push('demo password must not be hardcoded');
for (const token of ['DEMO_LOGIN_ENABLED', 'ensureDemoAppRow', 'isDemoEmail']) {
  if (!auth.includes(token)) failures.push(`server demo binding missing ${token}`);
}
for (const token of ['btn-demo-kunde', 'btn-demo-handwerker', 'demoEmailFor', 'DEMO_PASSWORD']) {
  if (!form.includes(token)) failures.push(`auth UI demo behavior missing ${token}`);
}
for (const token of [
  'safeNextPath(nextPath, loginRole === "handwerker" ? "/pro" : "/app")',
  'doLogin(demo.email, DEMO_PASSWORD, targetRole)',
]) {
  if (!form.includes(token)) failures.push(`role-aware demo redirect missing ${token}`);
}
if (!loginRoute.includes('nextPath={sp.next}')) {
  failures.push('login route must preserve an absent next value so LoginForm can choose the role-aware fallback');
}
if (loginRoute.includes('nextPath={safeNextPath(sp.next)}')) {
  failures.push('login route must not pre-default an absent next value to /app');
}
for (const token of ['per_page=', 'verifyCredentials', '/auth/v1/token?grant_type=password']) {
  if (!seed.includes(token)) failures.push(`demo seeder missing ${token}`);
}
if (failures.length) {
  console.error(`DEMO ACCOUNT CONTRACT: RED (${failures.length} failures)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('DEMO ACCOUNT CONTRACT: GREEN');
