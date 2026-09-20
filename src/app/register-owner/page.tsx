import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-v2/AuthShell";
import { DEMO_LOGIN_ENABLED } from "@/lib/demo-accounts";

export const metadata: Metadata = {
  title: "Eigentümer-Konto anlegen",
  description: "Lege dein Hauskonto bei einfachhausen an.",
  robots: { index: false, follow: false },
};

export default function RegisterOwnerPage() {
  return <AuthShell initialAuthMode="register" initialRole="kunde" demoEnabled={DEMO_LOGIN_ENABLED} />;
}
