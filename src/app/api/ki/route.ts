import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { applyRateLimitLockout, checkRateLimit, consumeRateLimitAttempt } from "@/lib/security/rate-limit";
import { aiQuotaSnapshot, grantAdCreditsOnce, AD_CREDIT_GRANT } from "@/lib/ai-engine";
import { verifyAdReceipt } from "@/lib/ad-receipt";

import { answerAssistant, kiChatToolFromBody } from '@/lib/assistant-service';
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
  const rohes = body as { messages?: unknown; tool?: unknown; photoPath?: unknown } | null;
  const roh = rohes?.messages;
  // Nur Fragen und Antworten erreichen das Modell; alles andere wird verworfen.
  const messages = Array.isArray(roh) ? roh.filter(m => Boolean(m) && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant')) : [];
  // Bewusst ausgewaehltener Chat-Tool-Button: strikte Allowlist, alles andere
  // ist eine 400 – niemals ein Fallback auf einen Funktionsnamen.
  const tool = kiChatToolFromBody(rohes?.tool);
  if (tool === null) {
    return NextResponse.json({ reply: "Unbekanntes Werkzeug." }, { status: 400 });
  }
  // Nur ein bereits serverseitig abgelegter privater Pfad (kleiner String,
  // kein Binärinhalt); die Zugaenglichkeit prueft der Dienst gegen den Owner.
  const photoPath = typeof rohes?.photoPath === 'string' && rohes.photoPath.length > 0 && rohes.photoPath.length <= 300 ? rohes.photoPath : null;

  // Mit ?stream=1 laeuft die Antwort als Ereignisstrom: jeder Schritt kommt
  // sofort, das Ergebnis am Ende. Ohne Streaming bleibt es beim gewohnten JSON.
  const streamWanted = new URL(req.url).searchParams.get("stream") === "1";
  if (!streamWanted) {
    const result = await answerAssistant(user.id, messages, req.signal, photoPath, undefined, tool);
    const { status, ...response } = result;
    return NextResponse.json(response, { status, headers: { 'Cache-Control': 'no-store' } });
  }

  const encoder = new TextEncoder();
  const rahmen = (payload: unknown) => encoder.encode("data: " + JSON.stringify(payload) + "\n\n");
  const stream = new ReadableStream({
    async start(controller) {
      const sende = (payload: unknown) => {
        try { controller.enqueue(rahmen(payload)); return true; }
        catch { return false; } // Ein geschlossener Kanal beendet den Aufruf nicht.
      };
      try {
        const result = await answerAssistant(user.id, messages, req.signal, photoPath, step => { sende({ type: "step", step }); }, tool);
        const { status, ...response } = result;
        sende({ type: "done", status, ...response });
      } catch {
        sende({ type: "done", status: 503, reply: "Die KI-Anfrage konnte nicht abgeschlossen werden. Dein Kontingent wurde nicht belastet. Bitte versuche es später erneut." });
      }
      try { controller.close(); } catch { /* schon geschlossen */ }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-cache", "X-Accel-Buffering": "no" },
  });
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
