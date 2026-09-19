"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

type Ctx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null, session: null, loading: true, signOut: async () => {},
});

// The browser guard is convenience-only: server components and actions remain
// the authorization authority. It therefore protects ONLY the known private
// app surfaces (client-side UX bounce to /login) and never touches unknown
// routes (404s must render, not redirect) or public marketing pages.
// /notfall is a PUBLIC product explainer (no session required); the
// authenticated emergency flow lives at /app/emergency and is protected on
// the server via requireUser('homeowner'). Never bounce public /notfall.
// Legacy-Fragmente (/auftraege, /meine-angebote, /historie, /profil,
// /einstellungen, /benachrichtigungen, /dashboard) und die inzwischen
// weitergeleiteten Routen (/ki-chat, /ansprechpartner, /anfragen-pro) sind
// entfernt: ihre Redirects laufen serverseitig, und auf unknown paths muss
// eine 404 gerendert werden, kein Client-Bounce.
// Keine privaten Client-Bounce-Praefixe mehr: /mein-haus ist ein server-
// seitiger Redirect auf /app/home, /notifications wird serverseitig
// autorisiert (siehe SERVER_AUTH_PREFIXES). Der Browser-Guard darf nie eine
// serverseitig erlaubte Seite sperren.
const PRIVATE_PREFIXES: string[] = [];
// /notifications ist serverseitig per requireUser() autorisiert und gehoert
// nicht zu den /app-// /pro-Praefixen: ohne diesen Eintrag hat der Browser-
// Guard Nutzer ohne Supabase-Client-Session (Local-Dev-Modus, abgelaufene
// Client-Session bei gueltiger Server-Session) auf /login geschickt, obwohl
// der Server den Zugriff erlaubt hat. Genau das Client-vs-Server-Grenzen-
// Verhalten, das T-0168 verbietet — der Bounce ist entfernt.
const SERVER_AUTH_PREFIXES = ["/app", "/pro", "/admin", "/notifications"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;
    // T-0118: the browser Supabase client is lazy (async chunk) — await it.
    // Without Supabase env vars (local preview) the promise rejects; the app
    // degrades to logged-out instead of crashing with an unhandled rejection.
    getSupabase().then((supabase) => {
      if (cancelled) return;
      supabase.auth.getSession().then(({ data }: any) => {
        if (cancelled) return;
        setSession(data.session);
        setLoading(false);
      }).catch(() => {
        // getSession rejection must never leave loading stuck (Befund 5).
        if (cancelled) return;
        setSession(null);
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
        if (cancelled) return;
        setSession(s);
        setLoading(false);
      });
      subscription = sub?.subscription ?? null;
      // Unmount happened while the client promise resolved: clean up now.
      if (cancelled && subscription) {
        try { subscription.unsubscribe(); } catch {}
        subscription = null;
      }
    }).catch(() => {
      if (cancelled) return;
      setSession(null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      if (subscription) {
        try { subscription.unsubscribe(); } catch {}
        subscription = null;
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const usesServerAuth = SERVER_AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (usesServerAuth) return;
    const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (!session && isPrivate) {
      router.replace("/login");
    }
  }, [session, loading, pathname, router]);

  async function signOut() {
    try {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
    } catch {
      // No Supabase client available (e.g. preview without env vars) — still
      // clear the local session so the UI leaves the logged-in state.
    }
    setSession(null);
  }

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
