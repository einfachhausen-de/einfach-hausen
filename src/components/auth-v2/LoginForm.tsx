'use client';

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { DEMO_PASSWORD, DEMO_USERS, demoEmailFor } from "@/lib/demo-accounts";
import { loginAction, registerAction } from "@/app/actions";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { LegalModal } from "./LegalModal";

export type Role = "kunde" | "handwerker";
export type AuthMode = "login" | "register";
interface LoginFormProps {
  role?: Role;
  initialRole?: Role;
  initialAuthMode?: AuthMode;
  nextPath?: string;
  /** Anliegen text from a public intake form, carried into the registration. */
  initialRequest?: string;
  /** Server message from a redirect (?notice=…). */
  notice?: string;
  /** Server message from a redirect (?error=…). */
  error?: string;
  onRoleChange?: (role: Role) => void;
}

type LegalType = "agb" | "datenschutz" | "impressum" | "sicherheit" | "partnerkriterien";

export function LoginForm({
  role: propRole,
  initialRole = "kunde",
  initialAuthMode = "login",
  nextPath: _nextPath,
  initialRequest,
  notice,
  error,
  onRoleChange,
}: LoginFormProps = {}) {
  const [internalRole, setInternalRole] = useState<Role>(initialRole);
  const role = propRole ?? internalRole;
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuthMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [trades, setTrades] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // A server redirect (?error=…) arrives as a prop; it seeds the same slot the
  // client-side validation writes to, so the user sees exactly one message.
  const [errorMessage, setErrorMessage] = useState<string | null>(error ?? null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<LegalType | null>(null);

  // Pending lock: no competing role/mode changes while a request is in flight.
  const setRole = (value: Role) => {
    if (isLoading) return;
    if (onRoleChange) onRoleChange(value);
    else setInternalRole(value);
  };

  const switchAuthMode = (mode: AuthMode) => {
    if (isLoading) return;
    setAuthMode(mode);
    setErrorMessage(null);
  };

  async function doLogin(email: string, pw: string) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = new FormData();
      data.set("email", demoEmailFor(email));
      data.set("password", pw);
      // Keep authentication in the server action so local SQLite auth and
      // Supabase auth share one redirect path. Calling the client Supabase
      // SDK here made local preview logins fail before the action could issue
      // the SQLite session cookie, which also caused skipped router transitions.
      await loginAction(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) return;
      setErrorMessage(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
      setIsLoading(false);
    }
  }

  // Fill-only: inserts demo credentials into the fields, never signs in.
  // The user reviews and submits explicitly via "Anmelden".
  const handleFillDemo = (targetRole: Role) => {
    if (isLoading) return;
    const demo = targetRole === "kunde" ? DEMO_USERS.kunde : DEMO_USERS.handwerker;
    setRole(targetRole);
    setAuthMode("login");
    setErrorMessage(null);
    setIdentifier(demo.username);
    setPassword(DEMO_PASSWORD);
  };

  // Explicit demo start: fills AND signs in. Only these clearly labelled
  // buttons may trigger a sign-in without an explicit form submit.
  const handleStartDemo = (targetRole: Role) => {
    if (isLoading) return;
    const demo = targetRole === "kunde" ? DEMO_USERS.kunde : DEMO_USERS.handwerker;
    setRole(targetRole);
    setAuthMode("login");
    setErrorMessage(null);
    setIdentifier(demo.username);
    setPassword(DEMO_PASSWORD);
    void doLogin(demo.email, DEMO_PASSWORD, targetRole);
  };

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    if (!identifier.trim()) {
      setErrorMessage("Bitte gib deine E-Mail-Adresse oder deinen Benutzernamen ein.");
      return;
    }
    if (!password) {
      setErrorMessage("Bitte gib dein Passwort ein.");
      return;
    }
    void doLogin(identifier, password);
  };
  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    setErrorMessage(null);
    if (!firstName.trim() || !lastName.trim() || !identifier.trim() || !password) {
      setErrorMessage("Bitte fülle alle erforderlichen Pflichtfelder aus.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Das Passwort braucht mindestens 8 Zeichen.");
      return;
    }
    if (role === "handwerker" && !businessName.trim()) {
      setErrorMessage("Bitte gib den Namen deines Betriebs an.");
      return;
    }
    setIsLoading(true);
    try {
      const data = new FormData();
      data.set("role", role === "handwerker" ? "provider" : "homeowner");
      data.set("email", identifier.trim());
      data.set("password", password);
      data.set("firstName", firstName.trim());
      data.set("lastName", lastName.trim());
      data.set("postcode", postcode.trim());
      // The sentence a visitor typed into the public intake form travels with
      // the registration. registerAction answers it as a Hausmeister question
      // once the account exists and then lands on /app/hausmeister?answered=1.
      if (initialRequest) data.set("initialRequest", initialRequest.slice(0, 700));
      if (role === "handwerker") {
        data.set("businessName", businessName.trim());
        data.set("trades", trades.trim());
        data.set("streetAddress", address.trim());
      } else {
        data.set("address", address.trim());
      }
      await registerAction(data);
      setIsLoading(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) return;
      setErrorMessage(error instanceof Error ? error.message : "Registrierung fehlgeschlagen.");
      setIsLoading(false);
    }
  };

  const formTitle = authMode === "login"
    ? "Willkommen zurück"
    : role === "kunde"
      ? "Konto erstellen"
      : "Als Handwerksbetrieb registrieren";
  const formText = authMode === "login"
    ? role === "kunde"
      ? "Melde dich an, um Hausakte, Anliegen und Termine zu öffnen."
      : "Melde dich an, um Anfragen, Aufträge und Termine zu bearbeiten."
    : role === "kunde"
      ? "Dein Zugang zur Hausakte und zu allen nächsten Schritten rund um dein Zuhause."
      : "Lege den Zugang für deinen Betrieb an. Die fachliche Prüfung folgt getrennt im Partnerprozess.";

  return (
    <div id="login-card-container">
      {isLoading && (
        <div className="arena-loading" role="status" aria-live="polite">
          <span className="arena-loading-spinner" aria-hidden="true" />
          <span className="arena-loading-text">
            {authMode === "login" ? "Wird angemeldet …" : "Konto wird erstellt …"}
          </span>
        </div>
      )}
      <h1>{formTitle}</h1>
      <p className="arena-lead">{formText}</p>

      {errorMessage && <div className="arena-error" role="alert">{errorMessage}</div>}
      {notice && <div className="arena-notice" role="status">{notice}</div>}

      {authMode === "login" ? (
        <form className="arena-stack" onSubmit={handleLoginSubmit} aria-busy={isLoading}>
          <button id="btn-demo-kunde" type="button" className="arena-social" disabled={isLoading} onClick={() => handleStartDemo("kunde")}>
            Eigentümer-Demo starten
          </button>
          <div className="arena-field">
            <label className="arena-label" htmlFor="login-identifier">E-Mail</label>
            <input
              className="arena-input"
              id="login-identifier"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="name@email.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>
          <div className="arena-field">
            <div className="arena-label-row">
              <label className="arena-label" htmlFor="login-password">Passwort</label>
              <button type="button" id="btn-forgot-password" className="arena-mini-link" disabled={isLoading} onClick={() => setIsForgotModalOpen(true)}>
                Vergessen?
              </button>
            </div>
            <div className="arena-input-wrap">
              <input
                className="arena-input"
                id="login-password"
                name="loginPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="arena-eye"
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                aria-pressed={showPassword}
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <label className="arena-check">
            <input
              type="checkbox"
              id="checkbox-remember-me"
              checked={remember}
              disabled={isLoading}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Angemeldet bleiben
          </label>
          <button id="btn-submit-login" className="arena-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Wird angemeldet …" : "Anmelden"}
          </button>
          <p className="arena-switch">
            Neu bei Einfach Hausen?{" "}
            <button
              id="btn-switch-to-register"
              type="button"
              className="arena-mini-link"
              disabled={isLoading}
              onClick={() => switchAuthMode("register")}
            >
              Konto erstellen
            </button>
          </p>
        </form>
      ) : (
        <form className="arena-stack" onSubmit={handleRegisterSubmit} aria-busy={isLoading}>
          {role === "handwerker" && (
            <div className="arena-field">
              <label className="arena-label" htmlFor="reg-business">Unternehmensname</label>
              <input className="arena-input" id="reg-business" name="businessName" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
            </div>
          )}
          <div className="arena-grid2">
            <div className="arena-field">
              <label className="arena-label" htmlFor="reg-first-name">Vorname</label>
              <input className="arena-input" id="reg-first-name" name="firstName" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
            </div>
            <div className="arena-field">
              <label className="arena-label" htmlFor="reg-last-name">Nachname</label>
              <input className="arena-input" id="reg-last-name" name="lastName" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
            </div>
          </div>
          {role === "handwerker" && (
            <div className="arena-field">
              <label className="arena-label" htmlFor="reg-trades">Gewerke / Leistungen</label>
              <input className="arena-input" id="reg-trades" name="trades" placeholder="z. B. Elektro, SHK, Garten" value={trades} onChange={(event) => setTrades(event.target.value)} required />
            </div>
          )}
          <div className="arena-field">
            <label className="arena-label" htmlFor="reg-email">E-Mail</label>
            <input
              className="arena-input"
              id="reg-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@email.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>
          <div className="arena-grid2">
            <div className="arena-field">
              <label className="arena-label" htmlFor="reg-postcode">Postleitzahl</label>
              <input className="arena-input" id="reg-postcode" name="postcode" inputMode="numeric" autoComplete="postal-code" value={postcode} onChange={(event) => setPostcode(event.target.value)} />
            </div>
            <div className="arena-field">
              <label className="arena-label" htmlFor="reg-password">Passwort</label>
              <input
                className="arena-input"
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                aria-describedby="reg-password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>
          <p id="reg-password-hint" className="arena-hint">Mindestens 8 Zeichen.</p>
          <div className="arena-field">
            <label className="arena-label" htmlFor="reg-address">{role === "kunde" ? "Adresse des Hauses" : "Betriebsadresse"}</label>
            <input
              className="arena-input"
              id="reg-address"
              name={role === "kunde" ? "address" : "streetAddress"}
              autoComplete="street-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>
          <label className="arena-check">
            <input
              type="checkbox"
              id="checkbox-show-register-password"
              checked={showPassword}
              disabled={isLoading}
              onChange={(event) => setShowPassword(event.target.checked)}
            />
            Passwort anzeigen
          </label>
          <button id="btn-submit-register" className="arena-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Konto wird erstellt …" : "Konto erstellen"}
          </button>
          <p className="arena-switch">
            Bereits registriert?{" "}
            <button
              id="btn-switch-to-login"
              type="button"
              className="arena-mini-link"
              disabled={isLoading}
              onClick={() => switchAuthMode("login")}
            >
              Zur Anmeldung
            </button>
          </p>
        </form>
      )}

      <div className="arena-demo" aria-label="Demo-Zugang">
        <div className="arena-demo-top">
          <span>DEMO-ZUGANG</span>
          <button type="button" id="btn-demo-fill" className="arena-mini-link" disabled={isLoading} onClick={() => handleFillDemo(role)}>
            Zugangsdaten einfügen
          </button>
        </div>
        <p className="arena-demo-sub">Öffentliche Vorschau: <strong>kunde · handwerker</strong></p>
        <div className="arena-demo-btns">
          {authMode !== "login" && (
            <button id="btn-demo-kunde" type="button" className="arena-mini-link" disabled={isLoading} onClick={() => handleStartDemo("kunde")}>
              Eigentümer-Demo starten
            </button>
          )}
          <button id="btn-demo-handwerker" type="button" className="arena-mini-link" disabled={isLoading} onClick={() => handleStartDemo("handwerker")}>
            Handwerker-Demo starten
          </button>
        </div>
      </div>

      <p className="arena-ssl">
        <Lock size={14} aria-hidden="true" /> SSL-verschlüsselt · Serverstandort Deutschland
      </p>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultEmail={identifier.includes("@") ? identifier : ""}
      />
      <LegalModal
        isOpen={legalModalType !== null}
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
