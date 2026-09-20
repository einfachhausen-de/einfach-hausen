import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-v2/AuthShell";
import { DEMO_LOGIN_ENABLED } from "@/lib/demo-accounts";

export const metadata: Metadata = {
  title: "Registrieren",
  description: "Lege dein Eigentümer- oder Partnerkonto bei einfachhausen an.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  return <AuthShell
    initialAuthMode="register"
    initialRole={sp.role === "provider" ? "handwerker" : "kunde"}
    // The public intake forms (home hero, footer band, /leistungen) are GET forms
    // onto this page: `?role=…&request=…`. This page used to read only `role`,
    // so the sentence a visitor typed was dropped on arrival. registerAction
    // already knows the field (`initialRequest`) and answers it as a
    // Hausmeister question, so the value is forwarded unchanged.
    initialRequest={sp.request}
    notice={sp.notice}
    error={sp.error}
    demoEnabled={DEMO_LOGIN_ENABLED}
  />;
}
