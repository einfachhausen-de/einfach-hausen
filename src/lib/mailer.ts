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
