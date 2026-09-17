"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginForm, type AuthMode, type Role } from "./LoginForm";
import { LegalModal } from "./LegalModal";
import "./auth-shell.css";

type LegalType = "agb" | "datenschutz" | "impressum" | "sicherheit" | "partnerkriterien";

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
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuthMode);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalType | null>(null);

  return (
    <div className="arena-auth">
      <div className={authMode === "register" ? "arena-card arena-card--register" : "arena-card"}>
        <main className="arena-main">
          <div className="arena-forminner">
            <div className="arena-topbar">
              <Link href="/" aria-label="Zur Startseite" className="arena-topbar-link">
                <img src="/brand/logo-full.png" alt="einfachhausen" width={132} height={36} className="arena-topbar-logo" />
              </Link>
              {role === "kunde" ? (
                <button type="button" id="role-toggle-partner" className="arena-link-btn arena-role-toggle" onClick={() => setRole("handwerker")}>
                  Partner-Login
                </button>
              ) : (
                <button type="button" id="role-toggle-kunde" className="arena-link-btn arena-role-toggle" onClick={() => setRole("kunde")}>
                  Kunden-Login
                </button>
              )}
            </div>

            <LoginForm
              role={role}
              authMode={authMode}
              initialAuthMode={initialAuthMode}
              nextPath={nextPath}
              initialRequest={initialRequest}
              notice={notice}
              error={error}
              onRoleChange={setRole}
              onAuthModeChange={setAuthMode}
            />
          </div>
        </main>

        <aside className="arena-hero" aria-label="Über Einfach Hausen">
          <img
            src="/images/auth-panel.png"
            alt="Modernes Einfamilienhaus mit Holz- und Putzfassade"
            className="arena-hero-photo"
          />
          <div className="arena-hero-card">
            <p>
              Ein Ansprechpartner für alle. Hausakte, Termine und die Menschen, die dein Haus kennen — an einem Ort.
            </p>
            <div className="arena-hero-chips">
              <button type="button" id="link-impressum" className="arena-chip" onClick={() => setActiveLegalModal("impressum")}>
                Impressum
              </button>
              <button type="button" id="link-datenschutz" className="arena-chip" onClick={() => setActiveLegalModal("datenschutz")}>
                Datenschutz
              </button>
            </div>
            <p className="arena-hero-fine">© 2026 Einfach Hausen</p>
          </div>
        </aside>
      </div>

      <LegalModal
        isOpen={activeLegalModal !== null}
        type={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </div>
  );
}
