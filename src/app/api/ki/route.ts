import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { applyRateLimitLockout, checkRateLimit, consumeRateLimitAttempt } from "@/lib/security/rate-limit";
import { aiQuotaSnapshot, grantAdCreditsOnce, AD_CREDIT_GRANT } from "@/lib/ai-engine";
import { verifyAdReceipt } from "@/lib/ad-receipt";

import { answerAssistant } from '@/lib/assistant-service';
const RATE_LIMITED = "Du hast gerade sehr viele Fragen gestellt. Bitte versuch es später erneut.";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ reply: "Bitte melde dich an, um den Assistenten zu nutzen." }, { status: 401 });
  }

  const key = `u:${user.id}`;
  const limit = checkRateLimit("ki_chat", key);
  if (!limit.allowed) {
    return NextResponse.json({ reply: RATE_LIMITED }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
  }
  const consumed = consumeRateLimitAttempt("ki_chat", key);
  if (!consumed.consumed || consumed.blocked) {
    applyRateLimitLockout("ki_chat", key);
    return NextResponse.json({ reply: RATE_LIMITED }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ reply: "Ungültige Anfrage." }, { status: 400 }); }
  const result = await answerAssistant(user.id, (body as { messages?: unknown } | null)?.messages, req.signal);
  const { status, ...response } = result;
  return NextResponse.json(response, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Quota snapshot + rewarded-ad credit grant for the settings screen.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const snapshot = aiQuotaSnapshot(user.id);
  return NextResponse.json(snapshot);
}

// Grant +10 actions after a rewarded ad (the ad SDK callback hits this).
// The SDK receipt is verified server-side before granting (see
// docs/OPERATIONS.md "KI-Ad-Credits"); replays grant exactly once (409).
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const gate = checkRateLimit("account_mutation", `u:${user.id}`);
  if (!gate.allowed) return NextResponse.json({ error: "Zu viele Versuche." }, { status: 429 });
  consumeRateLimitAttempt("account_mutation", `u:${user.id}`);
  let body: unknown = null;
  try { body = await req.json(); } catch { body = null; }
  const verdict = verifyAdReceipt(body);
  if (!verdict.ok) return NextResponse.json({ error: verdict.reason }, { status: verdict.status });
  const creditId = grantAdCreditsOnce(user.id, AD_CREDIT_GRANT, `rewarded-ad:${verdict.provider}:${verdict.nonce}`);
  if (creditId === null) return NextResponse.json({ error: "Dieser Werbenachweis wurde bereits eingelöst." }, { status: 409 });
  return NextResponse.json({ ok: true, quota: aiQuotaSnapshot(user.id) });
}
