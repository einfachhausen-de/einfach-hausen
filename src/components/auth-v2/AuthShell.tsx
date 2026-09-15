"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LoginForm, type AuthMode, type Role } from "./LoginForm";
import { LegalModal } from "./LegalModal";
import "./auth-shell.css";

type LegalType = "agb" | "datenschutz" | "impressum" | "sicherheit" | "partnerkriterien";

const FEATURES = [
  {
    title: "Hausakte",
    text: "Dokumente, Wartung und Historie bleiben dauerhaft beim Haus – nicht in E-Mail-Postfächern.",
  },
  {
    title: "Termine & Aufträge",
    text: "Angebote nach Preis, Termin und Qualität vergleichen und bewusst buchen.",
  },
  {
    title: "Ansprechpartner",
    text: "Ein konkreter Mensch, der dein Haus kennt – erreichbar auch ohne neuen Auftrag.",
  },
] as const;

export function AuthShell({
  initialAuthMode = "login",
  initialRole = "kunde",
  nextPath,
  initialRequest,
  notice,
  error,
}: {
  initialAuthMode?: AuthMode;
  initialRole?: Role;
  nextPath?: string;
  /** Anliegen text a visitor typed into a public intake form, carried to the registration. */
  initialRequest?: string;
  /** Server message from a redirect (?notice=…), shown as a status line. */
  notice?: string;
  /** Server message from a redirect (?error=…), shown as an alert. */
  error?: string;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalType | null>(null);

  return (
    <div className="arena-auth">
      <aside className="arena-hero" aria-label="Über Einfach Hausen">
        <div className="arena-hero-inner">
          <div>
            <Link href="/" aria-label="Zur Startseite" className="arena-brand-link">
              <img src="/brand/LOGO_white.png" alt="einfachhausen" width={172} height={115} className="arena-brand-logo" />
              <span className="arena-brand-tag">EIN ANSPRECHPARTNER FÜR ALLE</span>
            </Link>
          </div>

          <div>
            <p className="arena-eyebrow"><span className="arena-eyebrow-num">01</span><span>DEIN EINFACHHAUSEN-KONTO</span></p>
            <h1>Du sagst, was dein Haus braucht. Wir kümmern uns um den Rest.</h1>
            <p className="arena-hero-sub">Ein Konto für dein ganzes Zuhause: Hausakte, Termine, Aufträge und die Menschen, die dein Haus kennen – an einem Ort.</p>
          </div>

          <ol className="arena-features">
            {FEATURES.map((item, index) => (
              <li key={item.title}>
                <span className="num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="arena-hero-foot">
            <span>© 2026 Einfach Hausen</span>
            <nav aria-label="Rechtliches">
              <button type="button" id="link-impressum" className="arena-link-btn" onClick={() => setActiveLegalModal("impressum")}>Impressum</button>
              <button type="button" id="link-datenschutz" className="arena-link-btn" onClick={() => setActiveLegalModal("datenschutz")}>Datenschutz</button>
            </nav>
          </div>
        </div>
      </aside>

      <main className="arena-main">
        <div className="arena-topbar">
          <Link href="/" aria-label="Zur Startseite" className="arena-topbar-link">
            <img src="/brand/logo-full.png" alt="einfachhausen" width={120} height={83} className="arena-topbar-logo" />
            <span className="arena-topbar-label">
              <ArrowLeft size={16} aria-hidden="true" /> Zur Website
            </span>
          </Link>
          {role === "kunde" ? (
            <button type="button" id="role-toggle-partner" className="arena-link-btn arena-role-toggle" onClick={() => setRole("handwerker")}>
              Partner-Login <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" id="role-toggle-kunde" className="arena-link-btn arena-role-toggle" onClick={() => setRole("kunde")}>
              <ArrowLeft size={16} aria-hidden="true" /> Kunden-Login
            </button>
          )}
        </div>

        <div className="arena-formcol">
          <div className="arena-forminner">
            <p className="arena-eyebrow"><span className="arena-eyebrow-num">02</span><span>ANMELDUNG</span></p>
            <LoginForm
              role={role}
              initialAuthMode={initialAuthMode}
              nextPath={nextPath}
              initialRequest={initialRequest}
              notice={notice}
              error={error}
              onRoleChange={setRole}
            />
          </div>
        </div>
      </main>

      <LegalModal
        isOpen={activeLegalModal !== null}
        type={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </div>
  );
}
