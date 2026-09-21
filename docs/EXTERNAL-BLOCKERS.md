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

9. **Transaktionale E-Mail aktivieren?** Die Infrastruktur ist vollständig gebaut und
   getestet (SMTP-Transport mit Fail-closed-Verhalten, dauerhafte Outbox mit Retry und
   Dead-Letter, registrierter E-Mail-Kanal-Adapter, zwei fertige Vorlagen), aber
   **kein Produktereignis reiht derzeit eine E-Mail ein** — `enqueueNotification` wird
   nirgends mit `channel: 'email'` aufgerufen. Folge: Nutzer erhalten ausschließlich
   In-App-Benachrichtigungen. Das Senden echter E-Mails ist nicht rückholbar und
   berührt die Datenschutzerklärung, deshalb keine stille Aktivierung.
   **Frage:** Sollen für Angebote (Eigentümer) und neue Anfragen (Betrieb) echte
   transaktionale E-Mails versendet werden, sobald SMTP konfiguriert ist?
10. **Browser-Push implementieren oder weiter bewusst nicht anbieten?** Heute gibt es
    bewusst keinen Push: kein VAPID-Schlüssel, kein `PushManager`, keine
    `push_subscriptions`-Tabelle, kein `push`-Listener im Service Worker, und die
    Einstellungen weisen Push ausdrücklich als „Noch nicht verfügbar“ aus, statt einen
    wirkungslosen Schalter zu zeigen. **Frage:** Soll Browser-Push gebaut werden
    (Consent, Subscriptions, Zustellung, Opt-out), oder bleibt es bei „nicht
    verfügbar“?
11. **Native Store-Verteilung jetzt oder PWA-only?** `@capacitor/ios` und
    `@capacitor/android` sind nicht installiert, es gibt kein `ios/`/`android/`
    Verzeichnis, und `webDir: "out"` hat keine Ausgabe, weil kein statischer Export
    konfiguriert ist. **Frage:** Bleibt die PWA der freigegebene Launch-Kanal, oder
    wird die native Verteilung jetzt verfolgt?
12. **Apple Developer-Konto und Bundle-ID.** **Frage:** Existiert ein
    Apple-Developer-Konto (Organisation oder Einzelperson) für Gina Schulze, und ist
    `de.einfachhausen.app` die endgültige Bundle-ID?
13. **IAP oder Stripe für digitale Güter?** **Frage:** Werden digitale Güter in einer
    nativen App über Apple/Google IAP abgerechnet oder weiter über Stripe, und wie
    werden die Store-Regeln dazu erfüllt?
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

