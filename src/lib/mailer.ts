import nodemailer from "nodemailer";

// App base URL for links inside transactional mail. Falls back to the
// production domain; the placeholder domain from the legacy templates is gone.
const APP_URL = () => (process.env.NEXT_PUBLIC_APP_URL || "https://einfachhausen.de").replace(/\/$/, "");

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "",
      port,
      secure: port === 465,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

// Resend-style SMTP bridges use a fixed username with the API key as password;
// MAIL_FROM carries the verified sender address. Without a valid address the
// send fails closed instead of producing an invalid envelope.
function mailFrom(): string {
  const addr = (process.env.MAIL_FROM || process.env.SMTP_USER || "").trim();
  return addr.includes("@") ? addr : "";
}

// MAIL_FROM may already be a full "Name <addr>" header value; wrap bare
// addresses only, and never double-wrap.
function fromHeader(): string {
  const addr = mailFrom();
  return addr.includes("<") ? addr : `"einfachhausen" <${addr}>`;
}

export async function verifyMailTransport(): Promise<boolean> {
  try {
    if (!process.env.SMTP_HOST || !mailFrom()) return false;
    return await getTransporter().verify();
  } catch {
    return false;
  }
}

export async function sendMail(to: string, subject: string, html: string) {
  const from = fromHeader();
  if (!from.includes("@")) { console.error("Mail-Fehler: MAIL_FROM/SMTP_USER fehlt"); return false; }
  try {
    await getTransporter().sendMail({ from, to, subject, html });
    return true;
  } catch (e) {
    console.error("Mail-Fehler:", e instanceof Error ? e.message.slice(0, 200) : "send failed");
    return false;
  }
}

// A configured transport is not the same as a deliverable sender. Resend's shared
// sandbox address (anything @resend.dev) only accepts the Resend account owner's
// own mailbox as recipient; every other recipient is rejected with 403. Treating
// that as "configured" would enqueue mail for real users that can never arrive,
// retry three times and then dead-letter, while the health check kept reporting
// success. Callers use this to stay fail-closed and to say so out loud.
// Fix: replace MAIL_FROM with an address on a domain verified in Resend (or any
// other provider that accepts arbitrary recipients). No code change needed then.
export function mailDeliverability(): { deliverable: boolean; reason: string } {
  if (!process.env.SMTP_HOST) return { deliverable: false, reason: 'no-smtp-host' };
  const raw = mailFrom();
  if (!raw) return { deliverable: false, reason: 'no-sender-address' };
  // MAIL_FROM may be a full header value ("ShopSIN <onboarding@resend.dev>"),
  // so read the address out of the angle brackets before looking at the domain.
  const angle = raw.match(/<([^>]+)>/);
  const addr = (angle ? angle[1] : raw).trim().toLowerCase();
  const domain = addr.slice(addr.lastIndexOf('@') + 1);
  if (!domain || domain === addr) return { deliverable: false, reason: 'no-sender-address' };
  if (domain === 'resend.dev' || domain.endsWith('.resend.dev')) {
    return { deliverable: false, reason: 'sandbox-sender-domain' };
  }
  return { deliverable: true, reason: 'ok' };
}

export const mailTemplates = {
  neuesAngebotFuerOwner: (firma: string, titel: string, preis: number, anfrageId: string) => `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#105258">🎉 Neues Angebot für dich!</h2>
      <p><strong>${firma}</strong> hat ein Angebot zu deinem Auftrag abgegeben:</p>
      <blockquote style="border-left:4px solid #105258;padding-left:14px;color:#33484f">
        <strong>${titel}</strong><br/>Preisvorschlag: <strong>${preis.toLocaleString("de-DE")} €</strong>
      </blockquote>
      <a href="${APP_URL()}/anfrage/${anfrageId}" style="display:inline-block;background:#105258;color:#fff;padding:14px 28px;border-radius:14px;text-decoration:none;font-weight:800;margin-top:16px">Angebot ansehen</a>
      <p style="color:#9aa9ad;font-size:12px;margin-top:28px">Diese E-Mail wurde dir von einfachhausen gesendet.</p>
    </div>`,
  neueAnfrageFuerPro: (titel: string, plz: string, ort: string, dringend: boolean, anfrageId: string) => `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#105258">${dringend ? "⚡ Dringende " : ""}Neue Anfrage in deinem Gebiet!</h2>
      <blockquote style="border-left:4px solid #105258;padding-left:14px;color:#33484f">
        <strong>${titel}</strong><br/>📍 ${plz} ${ort}
      </blockquote>
      <a href="${APP_URL()}/pro/jobs/${anfrageId}" style="display:inline-block;background:#105258;color:#fff;padding:14px 28px;border-radius:14px;text-decoration:none;font-weight:800;margin-top:16px">Anfrage ansehen & Angebot senden</a>
      <p style="color:#9aa9ad;font-size:12px;margin-top:28px">Deine Gebiets-Benachrichtigung von einfachhausen.</p>
    </div>`,
};
