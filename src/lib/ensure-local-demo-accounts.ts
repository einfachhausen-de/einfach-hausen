import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { DEMO_LOGIN_ENABLED, DEMO_PASSWORD, DEMO_USERS } from '@/lib/demo-accounts';

let seeded = false;

/**
 * Local AUTH_MODE has no Supabase users. The public demo identities must exist
 * as SQLite rows with a real bcrypt hash, otherwise loginAction compares
 * against the dummy hash and locks the account out.
 */
export function ensureLocalDemoAccounts(): void {
  if (!DEMO_LOGIN_ENABLED || seeded) return;
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 12);

  for (const demo of Object.values(DEMO_USERS)) {
    const existing = db.prepare('SELECT id FROM users WHERE lower(email)=lower(?)').get(demo.email) as { id: number } | undefined;
    const userId = existing
      ? existing.id
      : Number(
          db.prepare('INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES(?,?,?,?,?)')
            .run(demo.email, hash, demo.role, demo.firstName, demo.lastName).lastInsertRowid,
        );
    if (existing) {
      db.prepare('UPDATE users SET password_hash=?, role=?, first_name=?, last_name=? WHERE id=?')
        .run(hash, demo.role, demo.firstName, demo.lastName, userId);
    }

    if (demo.role === 'homeowner') {
      db.prepare(`INSERT OR IGNORE INTO homeowner_profiles(user_id,postcode,address,onboarding_step) VALUES(?,?,?,?)`)
        .run(userId, '10115', 'Torstraße 1', 'done');
    } else {
      db.prepare(`INSERT OR IGNORE INTO provider_profiles(user_id,business_name,trades,postcode,radius_km,description,street_address,verified) VALUES(?,?,?,?,?,?,?,1)`)
        .run(userId, 'Gartenbau Müller', 'Garten, Heckenschnitt', '46325', 40, 'Garten- und Landschaftsbau', 'Gartenstraße 12, Borken');
      db.prepare(`INSERT OR IGNORE INTO partner_contracts(provider_id,status,commission_bps) VALUES(?,'active',0)`).run(userId);
      db.prepare(`INSERT OR IGNORE INTO provider_members(provider_id,user_id,job_title,can_manage_jobs,active) VALUES(?,?,'Geschäftsführung',1,1)`).run(userId, userId);
    }

    db.prepare("DELETE FROM auth_rate_limits WHERE kind='login' AND identifier=?").run(demo.email);
  }

  seeded = true;
}
