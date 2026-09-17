import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database(process.env.DATABASE_PATH || 'data/einfach-hausen.db');
const hash = bcrypt.hashSync('admin', 12);

const demos = [
  {
    email: 'kunde@demo.einfachhausen.de',
    role: 'homeowner',
    firstName: 'Demo',
    lastName: 'Kunde',
  },
  {
    email: 'handwerker@demo.einfachhausen.de',
    role: 'provider',
    firstName: 'Demo',
    lastName: 'Handwerker',
  },
];

for (const demo of demos) {
  let user = db.prepare('SELECT id FROM users WHERE email=?').get(demo.email);
  if (!user) {
    const result = db.prepare(
      'INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES(?,?,?,?,?)',
    ).run(demo.email, hash, demo.role, demo.firstName, demo.lastName);
    user = { id: Number(result.lastInsertRowid) };
  } else {
    db.prepare('UPDATE users SET password_hash=?, role=?, first_name=?, last_name=? WHERE id=?')
      .run(hash, demo.role, demo.firstName, demo.lastName, user.id);
  }

  if (demo.role === 'homeowner') {
    const profile = db.prepare('SELECT user_id FROM homeowner_profiles WHERE user_id=?').get(user.id);
    if (!profile) {
      db.prepare('INSERT INTO homeowner_profiles(user_id,postcode,address,onboarding_step) VALUES(?,?,?,?)')
        .run(user.id, '10115', 'Torstraße 1', 'done');
    }
  } else {
    const profile = db.prepare('SELECT user_id FROM provider_profiles WHERE user_id=?').get(user.id);
    if (!profile) {
      db.prepare('INSERT INTO provider_profiles(user_id,business_name,trades,postcode,radius_km,description,street_address) VALUES(?,?,?,?,?,?,?)')
        .run(user.id, 'Gartenbau Müller', 'Garten, Heckenschnitt', '46325', 40, 'Garten- und Landschaftsbau', 'Gartenstraße 12, Borken');
    }
  }

  console.log(`${demo.email} ready (id=${user.id}, role=${demo.role})`);
}

try {
  db.prepare("DELETE FROM auth_rate_limits WHERE key LIKE '%demo.einfachhausen.de%' OR key LIKE 'ip:%'").run();
} catch {
  // Rate-limit table is optional in older local DBs.
}

db.close();
