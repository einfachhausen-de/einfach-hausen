/**
 * scripts/eh-owner-coherence-browser.test.mjs
 * Runner for the owner coherence browser contract (scripts/lib/owner-coherence-browser.mjs).
 * Fails loudly on any real UI gate defect; never silently passes when the
 * browser environment is missing.
 */
import { runOwnerCoherenceBrowser } from "./lib/owner-coherence-browser.mjs";

const report = (message) => console.log(message);
const { checks, failures } = await runOwnerCoherenceBrowser({ report });

console.log(`\n# owner coherence browser: ${checks.length} route/viewport measurements`);
for (const check of checks) {
  console.log(`${check.route}@${check.viewport}: h1=${check.h1} toolbar=${check.notificationsLinks} overflow=${check.overflow} undersized=${check.undersizedCount}`);
}
if (failures.length) {
  console.error(`\n# FAIL ${failures.length}`);
  for (const failure of failures) console.error(`not ok - ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\n# ok - all owner coherence browser gates green");
}
