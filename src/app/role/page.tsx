import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

// Legacy-Rollenwahl. Die Rolle ist an die Identitaet gebunden und wird
// serverseitig aufgeloest (T-0168), nicht im Client ausgewaehlt.
export default async function RolePage() {
  const u = await requireUser();
  redirect(u.role === "provider" ? "/pro" : "/app");
}
