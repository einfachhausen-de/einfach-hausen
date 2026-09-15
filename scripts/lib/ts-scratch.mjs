// Transitive closure of TypeScript sources for the scratch-copy scripts.
//
// Several regression scripts copy a handful of src/lib/*.ts files into a temp
// directory, strip the types and load them with plain Node. The lists were
// maintained by hand, so every new import inside db.ts broke whichever script
// nobody happened to run - the failure only surfaced once the CI chain in
// front of it finally went green.
//
// tsClosure() walks the relative imports instead, so a script only has to name
// the files it actually imports itself.

import fs from 'node:fs';
import path from 'node:path';

const SPECIFIER = /(?:from|import)\s*['"](\.\.?\/[^'"]+)['"]/g;

/**
 * Returns the given entry files plus every relative import they reach,
 * as repo-relative paths in a stable order. Files that do not exist are
 * skipped - entries are allowed to name optional modules.
 */
export function tsClosure(root, entries) {
  const seen = new Set();
  const order = [];
  const queue = [...entries];
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    seen.add(rel);
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    order.push(rel);
    const src = fs.readFileSync(abs, 'utf8');
    for (const match of src.matchAll(SPECIFIER)) {
      const specifier = match[1];
      const withExt = specifier.endsWith('.ts') ? specifier : `${specifier}.ts`;
      const next = path.normalize(path.join(path.dirname(rel), withExt));
      if (!seen.has(next) && fs.existsSync(path.join(root, next))) queue.push(next);
    }
  }
  return order;
}
