/**
 * Demo-Logins fuer die Demo-Phase (befristet!).
 *
 *   Kunden-App:  Benutzername "kunde"      / Passwort aus DEMO_PASSWORD (ENV)
 *   Handwerker:   Benutzername "handwerker" / Passwort aus DEMO_PASSWORD (ENV)
 *   CRM (/admin): Passwort aus DEMO_PASSWORD (ENV, kein Benutzername noetig)
 *
 * Kill-Switch (opt-in, fail-closed): DEMO_LOGIN_ENABLED=1 UND DEMO_PASSWORD
 * gesetzt -> Demo an. Jeder andere Zustand (Flag fehlt, != '1', oder kein
 * Passwort) -> Box versteckt, Mappings + Exception aus.
 * Nach der Demo-Phase: diese Datei + Login-Box + Seed-Script + Doku loeschen
 * (siehe docs/DEMO_ACCOUNTS.md) und die Supabase-Demo-User deaktivieren.
 *
 * WARNUNG: Oeffentliche Demo-Zugangsdaten — jeder kann sich als diese User
 * einloggen. Keine echten Daten mit Demo-Accounts verknuepfen.
 */
export const DEMO_LOGIN_ENABLED =
  process.env.DEMO_LOGIN_ENABLED === '1' && (process.env.DEMO_PASSWORD ?? '').length > 0;
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? '';

export const DEMO_USERS = {
  kunde: {
    username: 'kunde',
    email: 'kunde@demo.einfachhausen.de',
    role: 'homeowner' as const,
    firstName: 'Demo',
    lastName: 'Kunde',
  },
  handwerker: {
    username: 'handwerker',
    email: 'handwerker@demo.einfachhausen.de',
    role: 'provider' as const,
    firstName: 'Demo',
    lastName: 'Handwerker',
  },
} as const;

/** "kunde" -> Demo-E-Mail; echte E-Mails (mit @) passieren unveraendert. */
export function demoEmailFor(login: string): string {
  const name = login.trim().toLowerCase();
  if (name.includes('@')) return login.trim();
  const hit = (Object.values(DEMO_USERS) as Array<{ username: string; email: string }>).find(
    (u) => u.username === name,
  );
  return hit ? hit.email : login.trim();
}

export function isDemoEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return (Object.values(DEMO_USERS) as Array<{ email: string }>).some((u) => u.email === lower);
}
