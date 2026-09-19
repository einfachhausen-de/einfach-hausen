import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

// Legacy-Selbstbedienung (Supabase user_metadata). Registrierung laeuft
// kanonisch ueber /register-owner bzw. /register-pro (auth-v2). Wer hier
// ankommt, bekommt die serverseitig richtige Startseite.
export default async function WelcomePage() {
  const u = await requireUser();
  redirect(u.role === "provider" ? "/pro" : "/app");
}
