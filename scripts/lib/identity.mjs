// Supabase test identities for the Node-based acceptance scripts.
//
// All of these scripts sign in real users against the project's Supabase
// gateway. The e-mail addresses come from the deterministic fixture DB, and
// they have to stay deterministic: several scripts take screenshots, so a
// random address would invalidate the baselines on every run.
//
// The consequence is the reason this file exists: when a run is cancelled or
// the runner kills the job, its finally-block never executes and the identity
// stays behind. The next run then dies with "email_exists" - a failure that
// looks like a product bug but is only an orphan from an earlier run.

export async function adminCreateUser(cfg, email, password, metadata = {}) {
  const response = await fetch(`${cfg.supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: cfg.serviceKey,
      Authorization: `Bearer ${cfg.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
  });
  return response.json();
}

export async function deleteIdentity(cfg, id) {
  await fetch(`${cfg.supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}` },
  });
}

/**
 * Finds a leftover identity by e-mail and removes it. The admin API has no
 * "get by e-mail" endpoint, so the user list is paged until the address shows
 * up or the pages run out.
 */
export async function removeOrphanIdentity(cfg, email) {
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(`${cfg.supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}` },
    });
    if (!response.ok) return false;
    const data = await response.json();
    const users = Array.isArray(data.users) ? data.users : [];
    const hit = users.find((user) => user.email === email);
    if (hit) {
      await deleteIdentity(cfg, hit.id);
      return true;
    }
    if (users.length < perPage) return false;
  }
  return false;
}

/**
 * Creates the identity, clearing an orphan first if the address is still
 * taken from an earlier run. Returns the new user id.
 */
export async function createIdentity(cfg, email, password, metadata = {}) {
  let data = await adminCreateUser(cfg, email, password, metadata);
  if (!data.id && data.error_code === 'email_exists') {
    await removeOrphanIdentity(cfg, email);
    data = await adminCreateUser(cfg, email, password, metadata);
  }
  if (!data.id) throw new Error(`identity create failed: ${JSON.stringify(data).slice(0, 200)}`);
  return data.id;
}
