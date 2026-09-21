# Externe Blocker — verifizierte Fakten

Stand: 2026-09-10 (Repo-HEAD `0503da3`, Vorgänger `a25ae3f`; T-0131 Convergence vom 2026-09-03 ist historisch)

T-Nummern unten sind historische Task-Referenzen als Verifikationsbeleg, keine offenen Tasks.

Technischer Abschluss (historische Wellen A-E, T-0129/T-0130/T-0131, Supabase-, Demo-, GSC-, Blog/Lexikon-Stände) ist durch diese Liste
nicht blockiert. Die folgenden Punkte sind externe Betriebs-/Rechts-Faktoren, die
der technische Abschluss weder erfinden noch erledigen kann:

1. **Domain/DNS-Härtung (STRATO DNSSEC)** — geerbt aus früheren akzeptierten
   Übergaben (Issue-Referenz #16). In dieser Welle nicht neu verifiziert; vor
   scharfer DNS-Umstellung vom Domain-Verantwortlichen zu prüfen.
2. **Rechtstexte (Impressum/Datenschutz/AGB final freigegeben)** — geerbt (#11).
   Die App liefert Platzhalter-konforme Rechtstexte-Seiten aus; eine juristische
   Freigabe ist extern.
3. **Zahlungen live schalten (SEPA/Stripe)** — geerbt (#14). Stripe-Integration
   ist im Code vorhanden (Webhook/Connect-Routen), der scharfe Live-Betrieb mit
   echten Lastschriften ist eine externe Geschäftsfreigabe.
4. **Offsite-Backup-Ziel (T-0204)** — die verifizierte Nächtlich-Sicherung liegt
   same-host im Supabase-Bucket. Eine Zweitkopie außerhalb der VM (z. B. OCI
   Object Storage) braucht eine Tenancy-Entscheidung/Credentials des
   Betreibers; OCI-CLI ist installiert, aber unkonfiguriert.
5. **E-Mail-Postfach-Nachweis (T-0201)** — SMTP-Versand ist live verifiziert
   (Handshake + selbst adressierter Sende-Nachweis via Resend). Der Empfang in
   einem echten Postfach (z. B. Antwort-Handling) benötigt ein betreibereitens
   gepflegtes Postfach und ist deshalb nicht agentenseitig beweisbar.

6. **GitHub Actions für dieses private Repo nicht nutzbar (T-0157, 2026-08-31 verifiziert)** —
   alle 90 letzten Runs `startup_failure` mit 0 Jobs (Actions-Minuten/Plan-Sache des Accounts).
   Der einheitliche Release-Gate greift deshalb repo-seitig als Pflichtschritt in
   `deploy/update-on-oci.sh`; `quality.yml` ist vorbereitet (inkl. Supabase-Secrets) und
   startet automatisch, sobald Actions aktiviert ist.

7. **Geteilter Supabase-Gateway: fremde Projekte können Auth-User löschen (2026-09-01 verifiziert)** —
   `auth.users` wurde von `service_role` mit Referer `shopsin.delqhi.com` vollständig geleert (Logs
   `supabase-auth`: `user_deleted` x N, actor `service_role`). Die Demo-/Test-Identities von
   einfach-hausen waren dadurch weg; Benutzer-Logins am geteilten Gateway sind strukturell nicht
   gegen fremde Projekte geschützt, solange Projekte dieselbe Instanz/Keys teilen. Betreiber-
   Entscheidung nötig: eigenes Supabase-Projekt/Keys für einfach-hausen (empfohlen) oder
   Aufteilung der admin-Rechte. Demo-Logins wurden 2026-09-01 neu erstellt (Passwörter wie
   zuvor, auth_subject neu gebunden).

Nicht-Blocker, aber grenzwertig erwähnt: App-Store-Auslieferung (Capacitor) ist
Teil historischer Planung (T-0167, nie ausgeführt) und nicht Teil des aktuellen
Taskplans.

Pflege-Regel: Nur verifizierte Fakten eintragen. Technische Abschlusswellen
autorisiert keine Legal-/Business-Fakten.
8. **Google/Apple-SSO in den App-Registrierungen (T-0206 B7)** — die
   Notion-Referenz zeigt „Mit Google/Apple anmelden"-Buttons. Echte
   OAuth-Credentials (Google Cloud + Apple Developer, verifizierte Domains) sind
   Betreibervollmacht; Fake-Buttons ohne funktionierendes Backend sind
   verboten. Erst nach Credential-Bereitstellung umsetzbar.

---

## Offene Betreiberentscheidungen (Stand 2026-09-21)

Diese Liste sammelt Fragen, die **kein Agent** beantworten darf, weil sie Produkt-,
Rechts- oder Geschäftsentscheidungen sind. Jede Frage ist so formuliert, dass eine
kurze Antwort die Arbeit sofort freigibt.

### Aus Issue #12 (App-Verteilung & Benachrichtigungen)

9. **Transaktionale E-Mail: Absenderdomain verifizieren (letzter Schritt).**
   **Entscheidung vom 2026-09-21: E-Mail ist aktiviert** — für Angebote an Eigentümer
   und neue Anfragen an Betrieb. Der Code ist fertig und getestet: Fan-out an einem
   einzigen Choke-Point (`EMAIL_EVENT_KINDS` in `src/lib/notifications.ts`), eine
   eigene Outbox-Zeile pro Ereignis, In-App-Ansichten lesen ausschließlich
   `channel='in_app'` (keine Doppelanzeige), 37/37 Benachrichtigungstests grün.

   **Der Versand ist noch blockiert — durch eine Konfiguration, die nur der Betreiber
   ändern kann.** `MAIL_FROM` in `/etc/einfach-hausen.env` lautet
   `ShopSIN <onboarding@resend.dev>`: Resends geteilte Sandbox-Adresse. Sie akzeptiert
   **ausschließlich das eigene Postfach des Resend-Kontoinhabers** als Empfänger; jeder
   andere Empfänger wird mit 403 abgelehnt. Zusätzlich lautet der Absendername
   `ShopSIN`, und `resend.dev` ist keine für dieses Projekt verifizierte Domain (kein
   SPF-/DKIM-Alignment). Ein Versand an echte Nutzer wäre damit ein stiller Ausfall.

   Damit daraus keine stillen Fehlschläge werden, ist der Fan-out **fail-closed**:
   `mailDeliverability()` erkennt eine Sandbox-Absenderdomain und reiht dann **gar
   keine** E-Mail ein; der In-App-Kanal läuft unverändert weiter. Der Healthcheck meldet
   in diesem Fall `smtp: sandbox_sender` mit `smtp_reason: sandbox-sender-domain` statt
   `configured` — der Zustand ist also sichtbar, nicht geraten.
   **Sobald `MAIL_FROM` auf eine in Resend verifizierte Adresse zeigt, beginnt der
   Versand ohne Codeänderung.**

   **Schritte (Betreiber):** (a) in Resend die Domain `einfachhausen.de` verifizieren und
   die angezeigten SPF-/DKIM-Einträge bei STRATO/Cloudflare setzen, (b) `MAIL_FROM` auf
   zum Beispiel `"Einfach Hausen <noreply@einfachhausen.de>"` ändern und den Dienst neu
   starten, (c) einen Testversand an ein eigenes Postfach bestätigen. Danach ist dieser
   Punkt erledigt.
10. **Browser-Push implementieren oder weiter bewusst nicht anbieten?** Heute gibt es
    bewusst keinen Push: kein VAPID-Schlüssel, kein `PushManager`, keine
    `push_subscriptions`-Tabelle, kein `push`-Listener im Service Worker, und die
    Einstellungen weisen Push ausdrücklich als „Noch nicht verfügbar“ aus, statt einen
    wirkungslosen Schalter zu zeigen. **Frage:** Soll Browser-Push gebaut werden
    (Consent, Subscriptions, Zustellung, Opt-out), oder bleibt es bei „nicht
    verfügbar“?
11. **Native Store-Verteilung: entschieden, aber an Vorleistungen gebunden.**
    Entscheidung vom 2026-09-21: native Verteilung wird angegangen. Vorbereitet ist:
    korrigierte `capacitor.config.ts` (Remote-URL-Wrapper, vom Capacitor-CLI selbst
    geparst), `capacitor-www/index.html` als Offline-Fallback,
    `docs/brand/appstore/STORE-READINESS.md` mit Architekturentscheidung,
    Datenschutzdeklarationen und Checkliste, sowie seit dem 2026-09-21
    `docs/brand/appstore/STORE-METADATA.md` mit Einreichungstexten, Review-Hinweisen
    und Screenshot-Liste. Das **App-Store-Icon 1024×1024** liegt bereit
    (`public/icons/app-store-1024.png`, quadratisch, opak, ohne Alphakanal, abgeleitet
    aus dem kanonischen Marken-SVG über `scripts/generate-store-icons.mjs`).
    **Wichtigstes Risiko:** ein reiner Wrapper ist nach Apples Guideline 4.2
    („Minimum Functionality“) ein erhebliches Ablehnungsrisiko; Statusleiste und
    Tastaturstil genügen dafür nicht. Push ist der wirksamste zusätzliche native
    Hebel und hängt an Punkt 10.
    **Harter Blocker für die Einreichung:** Apple verlangt bei Apps mit Anmeldung einen
    funktionierenden Testzugang. Die Plattform hat **bewusst keine festen Demo-Konten**
    (`docs/OPERATIONS.md`), und Zugangsdaten dürfen nicht erfunden werden. Ohne einen von
    der Betreiberin bereitgestellten Review-Zugang mit realistischen Daten ist jede
    Einreichung formal unvollständig.
    **Toolchain, hier geprüft:** Xcode 26.5 und iOS-18.3-Simulator vorhanden;
    **CocoaPods, Java und Android SDK fehlen**. Deshalb wurde bewusst kein
    halb erzeugtes `ios/`-/`android/`-Projekt committet.
    **Frage/Schritte (Betreiber):** Apple-Developer-Konto für Gina Schulze, Team-ID,
    endgültige Bundle-ID bestätigen, Review-Testzugang bereitstellen, CocoaPods sowie
    JDK + Android SDK installieren. Danach können Plattformen, Splash-Screens und
    `PrivacyInfo.xcprivacy` erzeugt werden. Die IAP-Frage ist für die Owner-App
    beantwortet (siehe Punkt 13).
12. **Apple Developer-Konto und Bundle-ID.** **Frage:** Existiert ein
    Apple-Developer-Konto (Organisation oder Einzelperson) für Gina Schulze, und ist
    `de.einfachhausen.app` die endgültige Bundle-ID?
13. **IAP oder Stripe für digitale Güter? — für die Owner-App beantwortet: keins von
    beidem.** Am 2026-09-21 im Quelltext geprüft und in
    `docs/brand/appstore/STORE-METADATA.md` Abschnitt 1 belegt:
    - Die Owner-App hat **keinen** Kauf-, Abo- oder Upgrade-Flow (Suche nach
      `checkout|subscribe|abo|kaufen|upgrade` unter `src/app/app/**` und
      `src/components/homeowner/**` ohne Treffer).
    - Stripe wird ausschließlich für **reale Dienstleistungen** genutzt:
      Auszahlungen an Betriebe (Stripe Connect) und Rechnungen für ausgeführte
      Arbeiten (`src/lib/payments.ts`, `src/app/api/stripe/**`).
    - Handwerkerleistungen am eigenen Haus sind keine digitalen Güter; Apples
      Guideline 3.1.3(e)/3.1.5(a) verlangt für reale Dienstleistungen sogar die
      Abrechnung **außerhalb** von IAP. Eine IAP-Pflicht entsteht dadurch nicht.
    **Konsequenz:** Für die Owner-App ist keine Store-Abrechnung nötig, es gibt keine
    Marge an Apple/Google, und es ist kein IAP-Produkt anzulegen.
    **Offen bleibt bewusst:** Für eine spätere **Betriebs-App** gilt das *nicht*.
    Betriebstarife sind digitale Güter und müssten in einer iOS-App über IAP laufen.
    Heute werden sie im Web unter `/pro/plans` verkauft, was davon nicht betroffen ist.
    **Frage:** Soll überhaupt je eine Betriebs-App in die Stores, oder bleibt der
    Betriebsbereich im Web?
14. **Self-Service-Passwort-Reset freigeben?** Der automatische Reset ist im Code
    ausdrücklich als nicht freigegeben markiert; Nutzer werden auf `/kontakt`
    verwiesen. Er braucht einen Mailpfad und ein betreiberseitig gepflegtes Postfach.
    **Frage:** Soll der Self-Service-Reset aktiviert werden?
15. **Marketing-Mails überhaupt gewünscht?** Es existiert heute **kein** Marketing-/
    Newsletter-Pfad und **keine** getrennte Einwilligungslogik. **Frage:** Sollen
    jemals Marketing-Mails versendet werden, und wenn ja, mit welcher getrennten
    Einwilligung?

### Aus Issue #11 (Legal & Datenschutz)

16. **Juristische Freigabe der Datenschutzerklärung.** Die technische Inventur ist
    vollständig und belegt (`docs/privacy/DEVICE_STORAGE_INVENTORY.md`), und die
    Erklärung wurde am 2026-09-21 auf den tatsächlichen technischen Stand korrigiert.
    Offen ist die rechtliche Bewertung: Art. 13 Abs. 2 DSGVO, Auftragsverarbeitung mit
    Oracle, Formulierung zur Drittlandübermittlung bei BYOK sowie die Bewertung der
    Bedienpräferenzen (`sidebar_state`, localStorage-Entwurf) nach § 25 TDDDG.
    **Frage:** Wer führt die anwaltliche Prüfung durch und bis wann?
17. **Verifizierte Betreiber-/Kontakt-/Unternehmensdaten.** Impressum, AGB und
    Datenschutzerklärung nennen bewusst keine erfundenen Register-, USt-ID- oder
    Telefonangaben. **Frage:** Welche geprüften Angaben dürfen eingetragen werden?

### Aus Issue #33 (Visual-Baselines)

18. **GitHub Actions für dieses private Repo.** Alle Läufe enden als
    `startup_failure` mit 0 Jobs (Abrechnungs-/Plansache des Kontos). Die
    Baseline-Regeneration ist **nicht** mehr blockiert: `tests/visual-baselines/`
    wurde seit PR #32 mehrfach neu erzeugt (`a91a44d`, `1e31800`, `e31d217`,
    `eda7a40`, `f00d198`, `cd0be2c`, `7a3788e`, `5289d1e`), und `npm run test:visual`
    läuft lokal **72/72 grün**. Offen ist nur, dass CI nicht selbst prüfen kann.
    **Frage:** Soll Actions für dieses Repo aktiviert werden, oder bleibt der
    Release-Gate in `deploy/update-on-oci.sh` der verbindliche Prüfschritt?

