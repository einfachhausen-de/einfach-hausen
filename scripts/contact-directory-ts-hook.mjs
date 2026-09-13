/**
 * scripts/contact-directory-ts-hook.mjs
 * Test-only ESM resolve hook: maps extensionless relative imports to their
 * `.ts` source (repo product code uses bundler-style extensionless imports;
 * Node type-stripping does not add resolution). Native node:module only,
 * zero dependencies, never imported by product code.
 * Usage (repo root, approval required before execution):
 *   node --experimental-strip-types --experimental-loader ./scripts/contact-directory-ts-hook.mjs --test scripts/contact-directory-regression.mjs
 * Status: DRAFT packet, UNRUN.
 */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    const retriable = error?.code === 'ERR_MODULE_NOT_FOUND' || error?.code === 'ERR_UNSUPPORTED_DIR_IMPORT';
    if (retriable && specifier.startsWith('.') && !specifier.endsWith('.ts') && !specifier.endsWith('.mjs')) {
      return await next(`${specifier}.ts`, context);
    }
    throw error;
  }
}
