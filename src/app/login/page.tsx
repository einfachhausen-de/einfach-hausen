import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-v2/AuthShell";

export const metadata: Metadata = {
  title: "Anmelden",
  description: "Melde dich an — als Eigentümer oder Handwerksbetrieb.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return <AuthShell
    initialAuthMode="login"
    initialRole={sp.role === "provider" ? "handwerker" : "kunde"}
    nextPath={sp.next}
    // registerAction redirects here with ?error=… (duplicate account, rate
    // limit, Supabase unavailable) and ?notice=… (account created). Both were
    // discarded, so a failed attempt looked like a page that simply did nothing.
    notice={sp.notice}
    error={sp.error}
  />;
}
