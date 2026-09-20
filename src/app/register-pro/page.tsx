import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-v2/AuthShell";
import { DEMO_LOGIN_ENABLED } from "@/lib/demo-accounts";

export const metadata: Metadata = {
  title: "Partnerkonto anlegen",
  description: "Lege den Zugang für deinen Handwerksbetrieb bei einfachhausen an.",
  robots: { index: false, follow: false },
};

export default function RegisterProPage() {
  return <AuthShell initialAuthMode="register" initialRole="handwerker" demoEnabled={DEMO_LOGIN_ENABLED} />;
}
