import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-v2/AuthShell";
import { DEMO_LOGIN_ENABLED } from "@/lib/demo-accounts";
import { authMode } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Anmelden",
  description: "Melde dich an — als Eigentümer oder Handwerksbetrieb.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  // ?demo=1 / ?demo=handwerker — serverseitiger Direkt-Einstieg fuer die
  // Vorschau (Betreiber-Feedback 23.09.: Formular-Flow im Preview-iframe
  // blieb haengen). Die Seite darf selbst keine Cookies schreiben (nur
  // Actions/Route Handler) — sie leitet auf /api/auth/demo-start, das setzt
  // die Session und springt per 303 weiter. Kill-Switch + local-Auth unten
  // in der Route; Supabase-Setups sehen weiter nur das normale Formular.
  if ((sp.demo === "1" || sp.demo === "handwerker") && DEMO_LOGIN_ENABLED && authMode() === "local") {
    const role = sp.demo === "handwerker" ? "handwerker" : "kunde";
    redirect(`/api/auth/demo-start?role=${role}${sp.next ? `&next=${encodeURIComponent(sp.next)}` : ''}`);
  }
  return <AuthShell
    initialAuthMode="login"
    initialRole={sp.role === "provider" ? "handwerker" : "kunde"}
    nextPath={sp.next}
    // registerAction redirects here with ?error=… (duplicate account, rate
    // limit, Supabase unavailable) and ?notice=… (account created). Both were
    // discarded, so a failed attempt looked like a page that simply did nothing.
    notice={sp.notice}
    error={sp.error}
    demoEnabled={DEMO_LOGIN_ENABLED}
  />;
}
