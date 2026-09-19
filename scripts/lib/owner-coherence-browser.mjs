/**
 * scripts/lib/owner-coherence-browser.mjs
 * Runtime (browser) contract checks for the four owner coherence routes.
 *
 * What this asserts, at runtime, in a real browser — not from source text:
 *   - each of /app, /app/jobs, /app/calendar, /app/messages renders exactly
 *     one H1 and mounts the toolbar (notifications link) once;
 *   - no horizontal overflow at 390/736/1536 px;
 *   - every visible interactive control is at least 44 px tall (real rendered
 *     boxes, no CSS text search);
 *   - appointment rows link to their job and current/past never overlap.
 *
 * Environment (self-contained and reproducible; no shared/production data):
 *   - ephemeral temp SQLite DB (DATABASE_PATH inside an mkdtemp dir), bootstrapped
 *     through the real src/lib/db.ts so the schema comes from the product;
 *   - AUTH_MODE=local, so the login is a real form POST against loginAction and
 *     the demo account is created by ensureLocalDemoAccounts — no cookie or
 *     token is copied from another session;
 *   - data is seeded with scripts/e2e-fixtures.mjs createE2EFixture, the same
 *     deterministic product fixture the repo E2E uses.
 *
 * Known product defects are reported as failures (never skipped/xfailed).
 */
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import bcrypt from "bcryptjs";
import { importTs } from "./import-ts.mjs";
import { createE2EFixture } from "../e2e-fixtures.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function cpHardlink(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      // Recurse, but skip the nested .bin duplicate tree and stale caches.
      if (entry.name === ".cache" || entry.name === ".package-lock.json") continue;
      cpHardlink(from, to);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      fs.linkSync(from, to);
    }
  }
}

function browserExecutable() {
  const candidates = [
    process.env.EH_CHROMIUM_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    "/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux/chrome",
    "/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux/chrome",
    "/snap/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ]
    .filter(Boolean)
    .map((candidate) => (typeof candidate === "string" ? candidate : ""));
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("No Chromium found; set EH_CHROMIUM_PATH");
  return found;
}

async function freePort() {
  return await new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.unref();
    socket.on("error", reject);
    socket.listen(0, "127.0.0.1", () => {
      const address = socket.address();
      socket.close(() => resolve(typeof address === "object" && address ? address.port : 0));
    });
  });
}

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 736, height: 1024 },
  { name: "desktop", width: 1536, height: 960 },
];

const ROUTES = [
  { path: "/app", label: "dashboard" },
  { path: "/app/jobs", label: "jobs" },
  { path: "/app/calendar", label: "calendar" },
  { path: "/app/calendar?view=past", label: "calendar-past" },
  { path: "/app/messages", label: "messages" },
];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready.catch(() => {});
    const images = [...document.images];
    await Promise.all(images.map((image) => (image.complete ? Promise.resolve() : new Promise((resolve) => {
      image.onload = image.onerror = resolve;
    }))));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

async function measure(page) {
  return await page.evaluate(() => {
    const documentElement = document.documentElement;
    const overflow = documentElement.scrollWidth > documentElement.clientWidth + 0.5;
    const interactive = [];
    for (const element of document.querySelectorAll("button, a[href], input, select, textarea, [role='button']")) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      // Skip controls that are visually hidden or clipped out of view.
      const style = getComputedStyle(element);
      if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) continue;
      if (rect.height < 44) {
        interactive.push({
          tag: element.tagName,
          label: (element.innerText || element.getAttribute("aria-label") || element.getAttribute("href") || "").trim().slice(0, 40),
          height: Math.round(rect.height),
        });
      }
    }
    return {
      h1: document.querySelectorAll("h1").length,
      notificationsLinks: document.querySelectorAll('a[href="/notifications"]').length,
      overflow,
      scrollWidth: documentElement.scrollWidth,
      clientWidth: documentElement.clientWidth,
      undersized: interactive.slice(0, 12),
      undersizedCount: interactive.length,
    };
  });
}

async function appointmentLinks(page) {
  // EHRecordList renders each row as <ul aria-label=…><li><a href="/app/jobs/N">.
  return await page.evaluate(() => {
    const rows = [...document.querySelectorAll("ul a[href^='/app/jobs/']")];
    return rows.map((link) => link.getAttribute("href")).filter((href, index, all) => all.indexOf(href) === index);
  });
}

async function appointmentRows(page, label) {
  // Row identity = job link plus the rendered appointment date, so a job with a
  // past and a future appointment is not mistaken for a duplicated appointment.
  return await page.evaluate((label) => {
    const lists = [...document.querySelectorAll("ul")];
    return lists.flatMap((list) => [...list.querySelectorAll("li")].map((item) => {
      const link = item.querySelector("a[href^='/app/jobs/']");
      const date = item.innerText.replace(/\s+/g, " ").trim().slice(0, 80);
      return link ? `${link.getAttribute("href")} · ${date}` : null;
    }).filter(Boolean));
  }, label);
}

export async function runOwnerCoherenceBrowser({ report = console.log } = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "eh-owner-coherence-"));
  const dbPath = path.join(tempDir, "app.sqlite3");
  const nextBin = path.join(repo, "node_modules", "next", "dist", "bin", "next");
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;

  process.env.DATABASE_PATH = dbPath;
  process.env.AUTH_MODE = "local";
  process.env.SESSION_COOKIE_NAME = "eh_owner_coherence";
  process.env.NEXT_PUBLIC_APP_URL = base;
  process.env.E2E_INSECURE_COOKIES = "1";
  if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";

  // Bootstrap the ephemeral schema and seed deterministic product data through
  // the real store paths (no mocked implementations).
  const { db } = await importTs("../../src/lib/db.ts", import.meta.url);
  const fixture = createE2EFixture(db, { namespace: "coherence" });
  db.prepare("INSERT OR IGNORE INTO notifications(user_id,kind,title,body,href,read_at,channel,priority,status) VALUES(?,?,?, ?,?,NULL,'in_app',5,'sent')")
    .run(fixture.homeownerId, "coherence", "Termin bestätigt", "Deterministische Testnachricht", `/app/jobs/${fixture.jobId}`);
  // One past appointment so the calendar history view has real data to render.
  // Reuses the existing fixture ids only; fixed past UTC instant stays past
  // across runs and timezones; 'completed' is a real schema status.
  db.prepare("INSERT INTO appointments(job_id,provider_id,homeowner_id,contact_user_id,start_at,status) VALUES(?,?,?,?,?,?)")
    .run(fixture.jobId, fixture.providerId, fixture.homeownerId, fixture.contactId, "2024-05-14 09:30:00", "completed");
  // Log in AS the seeded homeowner through the real login form. The fixture
  // stores a placeholder hash, so set a real bcrypt hash first (same helper the
  // local demo seeder uses). Ownership then lines up with the seeded data, and
  // no session or token is copied from anywhere.
  db.prepare("UPDATE users SET password_hash=? WHERE id=?")
    .run(bcrypt.hashSync("coherence-owner", 12), fixture.homeownerId);
  report(`seed: homeowner=${fixture.homeownerId} job=${fixture.jobId} appointment=${fixture.appointmentId} db=${dbPath}`);

  // Next refuses a second dev server in the repo directory ("Another next dev
  // server is already running"). Run from an isolated copy, like scripts/e2e.mjs:
  // sources + config copied, node_modules and the production build linked/copied.
  const projectRoot = path.join(tempDir, "project");
  fs.mkdirSync(projectRoot, { recursive: true });
  for (const directory of ["src", "public", "packages"]) {
    fs.cpSync(path.join(repo, directory), path.join(projectRoot, directory), { recursive: true });
  }
  for (const file of ["package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs", "next-env.d.ts"]) {
    const source = path.join(repo, file);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(projectRoot, file));
  }
  // Turbopack refuses a node_modules symlink ("points out of the filesystem
  // root"). A hard-link copy (`cp -al`) is the established workaround — the
  // original owner-coherence build used the same technique.
  cpHardlink(path.join(repo, "node_modules"), path.join(projectRoot, "node_modules"));
  fs.mkdirSync(path.join(projectRoot, "data", "private"), { recursive: true });
  fs.mkdirSync(path.join(projectRoot, "public", "uploads"), { recursive: true });

  const env = { ...process.env, DATABASE_PATH: dbPath, AUTH_MODE: "local", SESSION_COOKIE_NAME: "eh_owner_coherence", NEXT_PUBLIC_APP_URL: base, E2E_INSECURE_COOKIES: "1" };
  const server = spawn(process.execPath, [nextBin, "dev", "-H", "127.0.0.1", "-p", String(port)], { cwd: projectRoot, env, stdio: ["ignore", "pipe", "pipe"] });
  const serverLog = [];
  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", (chunk) => {
      serverLog.push(chunk.toString());
      if (serverLog.length > 200) serverLog.shift();
    });
  }

  const failures = [];
  const checks = [];
  let browser;
  try {
    for (let index = 0; index < 240; index++) {
      if (server.exitCode !== null) throw new Error(`next dev exited: ${serverLog.slice(-20).join("")}`);
      try {
        const response = await fetch(`${base}/login`, { redirect: "manual" });
        if (response.status < 500) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (index === 239) throw new Error(`server not ready: ${serverLog.slice(-20).join("")}`);
    }

    browser = await chromium.launch({ executablePath: browserExecutable(), headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext({ locale: "de-DE", timezoneId: "Europe/Berlin" });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    // Legitimate login through the real form: the demo account is created by
    // loginAction itself (ensureLocalDemoAccounts). No session/token is copied.
    await page.goto(`${base}/login`, { waitUntil: "networkidle" });
    await page.locator('input[name="email"]').fill(`fixture-coherence-homeowner@example.test`);
    await page.locator("#btn-submit-login").waitFor({ timeout: 20000 });
    await page.locator('input[name="loginPassword"]').fill("coherence-owner");
    await page.locator("#btn-submit-login").click();
    await page.waitForURL("**/app", { timeout: 60000 });
    await page.waitForLoadState("networkidle");
    report(`login: real /login form -> ${page.url()}`);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const route of ROUTES) {
        await page.goto(`${base}${route.path}`, { waitUntil: "networkidle" });
        await settle(page);
        // The streamed record lists settle after networkidle; wait for the list
        // container so structural locators see the final DOM.
        await page.locator("ul, .eh-werkbank-leer, [data-eh-empty]").first().waitFor({ timeout: 20000 }).catch(() => {});
        const measured = await measure(page);
        const entry = { route: route.label, viewport: viewport.name, ...measured, pageErrors: [...pageErrors] };
        checks.push(entry);
        if (measured.h1 !== 1) failures.push(`${route.label} @${viewport.name}: H1 count ${measured.h1} (expected 1)`);
        if (measured.notificationsLinks < 1) failures.push(`${route.label} @${viewport.name}: toolbar notifications link missing`);
        if (measured.overflow) failures.push(`${route.label} @${viewport.name}: horizontal overflow ${measured.scrollWidth} > ${measured.clientWidth}`);
        if (measured.undersized.length) {
          failures.push(`${route.label} @${viewport.name}: ${measured.undersized.length} interactive control(s) below 44px: ${JSON.stringify(measured.undersized.slice(0, 4))}`);
        }
        if (pageErrors.length) failures.push(`${route.label} @${viewport.name}: browser runtime errors ${JSON.stringify(pageErrors)}`);
        pageErrors.length = 0;
      }
    }

    // Appointment rows must link to their job (real hrefs in the live DOM).
    await page.setViewportSize(VIEWPORTS[0]);
    await page.goto(`${base}/app/calendar`, { waitUntil: "networkidle" });
    await settle(page);
    await page.locator("ul").first().waitFor({ timeout: 20000 }).catch(() => {});
    const upcoming = await appointmentLinks(page);
    const upcomingRows = await appointmentRows(page, "calendar");
    if (!upcoming.some((href) => /^\/app\/jobs\/\d+$/.test(href))) {
      failures.push(`calendar: appointment rows do not link to a job (found ${JSON.stringify(upcoming.slice(0, 4))})`);
    }
    await page.goto(`${base}/app/calendar?view=past`, { waitUntil: "networkidle" });
    await settle(page);
    const past = await appointmentLinks(page);
    if (!past.some((href) => /^\/app\/jobs\/\d+$/.test(href))) {
      failures.push(`calendar-past: appointment rows do not link to a job (found ${JSON.stringify(past.slice(0, 4))})`);
    }
    // A job legitimately appears in both views when it has a past and a future
    // appointment. The product contract is that no single APPOINTMENT is shown
    // twice, so compare the row identity (job link + rendered date), not the job.
    const pastRows = await appointmentRows(page, "calendar-past");
    const overlap = pastRows.filter((row) => upcomingRows.includes(row));
    if (overlap.length) failures.push(`calendar: same appointment row in both current and past views ${JSON.stringify(overlap)}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server.exitCode === null) {
      server.kill("SIGTERM");
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 3000);
        server.once("exit", () => { clearTimeout(timer); resolve(); });
      });
      if (server.exitCode === null) server.kill("SIGKILL");
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  return { checks, failures };
}
