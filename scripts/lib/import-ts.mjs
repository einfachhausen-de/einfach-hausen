import fs from 'node:fs';
import path from 'node:path';

// src/lib/*.ts is written for a bundler: relative imports carry no extension
// ("moduleResolution": "bundler" in tsconfig.json). Plain Node resolves
// specifiers literally, so `./contact-directory-schema` inside db.ts is simply
// not found and any script importing db.ts dies at startup with
// ERR_MODULE_NOT_FOUND.
//
// Rewrite the relative specifiers to `.ts` for the duration of the import and
// put the files back afterwards. Rewriting on disk instead of in tsconfig is
// deliberate: allowImportingTsExtensions would also change how Turbopack
// resolves imports across the whole app.
const RELATIVE_SPECIFIER = /(?:from|import)\s*['"](\.\.?\/[^'"]+)['"]/g;
const rewrittenSources = new Map();

// The closure matters, not just the entry file: db.ts pulls in
// contact-directory-schema.ts, which itself imports contact-directory-taxonomy
// without an extension. Rewrite the whole reachable set before importing.
function rewriteRelativeImports(filePath) {
  if (rewrittenSources.has(filePath) || !fs.existsSync(filePath)) return;
  const source = fs.readFileSync(filePath, 'utf8');
  rewrittenSources.set(filePath, source);
  const rewritten = source.replace(
    /(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,
    (_m, open, specifier, close) => `${open}${specifier.endsWith('.ts') ? specifier : `${specifier}.ts`}${close}`,
  );
  if (rewritten === source) return;
  fs.writeFileSync(filePath, rewritten);
  const directory = path.dirname(filePath);
  for (const match of source.matchAll(RELATIVE_SPECIFIER)) {
    const specifier = match[1];
    rewriteRelativeImports(path.resolve(directory, specifier.endsWith('.ts') ? specifier : `${specifier}.ts`));
  }
}

function restoreRewrittenImports() {
  for (const [filePath, source] of rewrittenSources) fs.writeFileSync(filePath, source);
  rewrittenSources.clear();
}

/**
 * Import a TypeScript module from src/ with plain Node. `relativePath` is
 * resolved against the *calling* script's URL, so callers pass the same
 * specifier they would use in a static import (e.g. '../src/lib/db.ts').
 */
export async function importTs(relativePath, callerUrl) {
  const entry = new URL(relativePath, callerUrl).pathname;
  rewriteRelativeImports(entry);
  // Safe to restore immediately: Node caches the module by resolved URL, so a
  // later resolve of './db.ts' from a sibling module hits that instance.
  try {
    return await import(new URL(relativePath, callerUrl).href);
  } finally {
    restoreRewrittenImports();
  }
}
