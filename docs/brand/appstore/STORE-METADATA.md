# Store-Metadaten und Review-Vorbereitung

Stand: 2026-09-21 · Ergänzt `STORE-READINESS.md` (Architektur, Risiken, Toolchain) um
die konkreten Einreichungstexte und die Review-Vorbereitung. Alles hier als „verifiziert“
Bezeichnete ist gegen `main` im Quelltext belegt, nicht angenommen.

## 1. Verifizierte Review-Fakten

Diese fünf Punkte entscheiden, welche Store-Regeln überhaupt greifen. Sie wurden im
Quelltext geprüft, weil eine falsche Annahme hier später eine Ablehnung oder eine
unnötige Nacharbeit bedeutet.

| Frage | Befund | Beleg |
|---|---|---|
| Verkauft die App digitale Güter? | **Nein.** Die Owner-App hat keinen Kauf-, Abo- oder Upgrade-Flow. | Suche nach `checkout\|subscribe\|abo\|kaufen\|upgrade` unter `src/app/app/**` und `src/components/homeowner/**` liefert keine Kaufstrecke |
| Wofür wird Stripe dann genutzt? | **Nur für reale Dienstleistungen**: Auszahlungen an Betriebe (Stripe Connect) und Rechnungen für ausgeführte Arbeiten. | `src/lib/payments.ts` (`stripePaymentsConfigured`, `markPaymentPaid`), `src/app/api/stripe/connect/*`, `src/app/api/stripe/webhook/route.ts` |
| Gibt es Konto-Löschung in der App? | **Ja**, in den Einstellungen. | `src/app/app/settings/account-actions.tsx` („Konto löschen“), `src/lib/account-deletion.ts` |
| Gibt es Drittanbieter- oder Social-Login? | **Nein**, nur E-Mail und Passwort. | `src/app/actions.ts` nutzt `signInWithPassword`; kein OAuth-Provider |
| Gibt es Tracking oder Drittanbieter-Skripte? | **Nein.** Kein Analytics-Tag, kein Werbe-SDK. Der Facebook-Host erscheint nur serverseitig für den WhatsApp-Kanal. | `docs/privacy/DEVICE_STORAGE_INVENTORY.md`; Suche nach `gtag\|googletagmanager\|analytics\|hotjar\|posthog` in `src/` und `public/` ohne Treffer |

### Was daraus folgt

- **Kein In-App-Purchase nötig.** Apples IAP-Pflicht gilt für digitale Güter, die *in der
  App* verkauft werden (Guideline 3.1.1). Handwerkerleistungen am eigenen Haus sind reale
  Dienstleistungen und müssen laut Guideline 3.1.3(e)/3.1.5(a) sogar *außerhalb* von IAP
  abgerechnet werden. Die Owner-App hat zusätzlich gar keine Kaufstrecke. **Damit ist die
  frühere offene Frage „IAP oder Stripe?“ für die Owner-App beantwortet: keins von beidem
  ist nötig.** Für eine spätere **Betriebs-App** gilt das *nicht* — Betriebstarife sind
  digitale Güter und müssten über IAP laufen, wenn sie in einer iOS-App verkauft würden.
  Heute werden sie im Web unter `/pro/plans` verkauft, was davon nicht betroffen ist.
- **Kein ATT-Dialog.** Ohne Tracking ist kein App-Tracking-Transparency-Prompt nötig, und
  `NSPrivacyTracking` bleibt `false` (siehe `STORE-READINESS.md` Abschnitt 5).
- **Guideline 4.8 (Sign in with Apple) greift nicht.** Sie gilt nur, wenn ein
  Drittanbieter-Login angeboten wird.
- **Guideline 5.1.1(v) (Löschung des Kontos) ist erfüllt.**

## 2. Offener Blocker für die Einreichung: Testzugang

**Das ist der einzige harte Blocker in dieser Datei.** Apple verlangt bei Apps mit
Anmeldung einen funktionierenden Demo-Zugang für den Review. Der aktuelle Stand ist
ausdrücklich anders:

> „Login page reachable; the platform has no fixed demo accounts by design (E2E creates
> random credentials), so no demo login check applies.“ — `docs/OPERATIONS.md`

Für den Review braucht es deshalb einen **festen, gültigen Review-Zugang**, der:

1. von der Betreiberin bereitgestellt wird (ich darf keine Zugangsdaten erfinden),
2. mit realistischen, aber unkritischen Daten befüllt ist (Hausakte, ein laufender Auftrag,
   ein Angebot, ein Dokument), damit die App im Review ihre Funktion zeigt,
3. nicht der persönliche Zugang einer echten Nutzerin ist,
4. nach der Freigabe wieder deaktiviert werden kann.

Ohne diesen Zugang ist jede Einreichung formal unvollständig. Das gehört zu Punkt 7 in
`STORE-READINESS.md` und ist **nicht** autonom lösbar.

## 3. App Store — Einreichungstexte (Entwurf)

Alle Angaben folgen `docs/COMPANY_IDENTITY.md`: Inhaberin und Geschäftsführerin ist
**Gina Schulze**; Anschrift, Rechtsform, Register und USt-IdNr. werden **nicht** erfunden
und bleiben leer, bis eine verifizierte Quelle vorliegt.

| Feld | Zeichenlimit | Entwurf |
|---|---|---|
| Name | 30 | `Einfach Hausen` |
| Untertitel | 30 | `Hausakte, Aufträge, Kontakte` |
| Kategorie | — | `Lifestyle` (Sekundär: `Business`) |
| Altersfreigabe | — | `4+` (keine Inhalte, die eine höhere Einstufung auslösen) |
| Copyright | — | `Einfach Hausen` |
| Support-URL | — | `https://einfachhausen.de/kontakt` |
| Datenschutz-URL | — | `https://einfachhausen.de/datenschutz` |
| Marketing-URL | — | `https://einfachhausen.de` |

**Werbebotschaft (max. 170 Zeichen):**

> Hausakte, Aufträge und Dokumente an einem Ort. Verifizierte Fachbetriebe aus deiner
> Region — und nach der Buchung ein fester Ansprechpartner.

**Keywords (max. 100 Zeichen):**

> `Hausakte,Handwerker,Hausmeisterservice,Eigenheim,Immobilie,Wartung,Angebote,Dokumente`

**Beschreibung:**

> **Dein Zuhause, an einem Ort.**
>
> Einfach Hausen ist der persönliche Hausmanager für dein Eigenheim. Statt Notizzettel,
> E-Mail-Verläufe und verstreuter Dateien bekommt dein Haus ein Gedächtnis: die Hausakte.
>
> **Was du in der App machst**
>
> · **Anliegen beschreiben** — erzähl in normalen Worten, was am Haus ansteht. Du wirst
>   durch die wichtigsten Angaben geführt, statt ein Formular auszufüllen.
> · **Angebote vergleichen** — du erhältst Angebote von verifizierten Fachbetrieben aus
>   deiner Region und entscheidest in Ruhe.
> · **Aufträge verfolgen** — Status, Termine und Rückfragen laufen an einer Stelle
>   zusammen, nicht in fünf Chats.
> · **Hausakte pflegen** — Rechnungen, Nachweise, Garantien und Fotos bleiben beim Objekt.
>   Beim nächsten Anliegen ist die Vorgeschichte da.
> · **Ansprechpartner erreichen** — nach der Buchung übernimmt ein fester menschlicher
>   Kontakt und bleibt erreichbar.
> · **Verträge im Blick behalten** — Kündigungsfristen und Jahrestarife für Strom, Gas,
>   Internet und Mobilfunk, mit Verweisen zu Vergleichsmöglichkeiten. Der Abschluss
>   erfolgt beim jeweiligen Anbieter, nicht in dieser App.
>
> **Was die App bewusst nicht macht**
>
> Wir versprechen nichts, was das System nicht hält: Es gibt **keine automatische
> Kontaktaufnahme mit Versicherern**, keine zugesicherte Notfallerreichbarkeit rund um die
> Uhr und **keine Weitergabe deiner Daten an Betriebe ohne deine ausdrückliche Freigabe**.
> Du entscheidest, wer welche Angaben sieht.
>
> **Für wen**
>
> Für Eigentümerinnen und Eigentümer von Einfamilienhäusern und Eigentumswohnungen, die
> ihr Haus erhalten wollen, ohne alles selbst zu koordinieren.
>
> Einfach Hausen ist für Eigentümer dauerhaft kostenlos.

## 4. Google Play — Einreichungstexte (Entwurf)

| Feld | Zeichenlimit | Entwurf |
|---|---|---|
| App-Name | 30 | `Einfach Hausen` |
| Kurzbeschreibung | 80 | `Hausakte, Aufträge und verifizierte Fachbetriebe — dein Zuhause an einem Ort.` |
| Kategorie | — | `Haus & Garten` |
| Tags | — | Hausverwaltung, Handwerker, Wartung |
| Datenschutz-URL | — | `https://einfachhausen.de/datenschutz` |

Die Langbeschreibung kann den App-Store-Text aus Abschnitt 3 übernehmen. Die
**Data-Safety-Deklaration** ist in `STORE-READINESS.md` Abschnitt 5 vorbereitet.

## 5. Review-Hinweise (Entwurf für das Feld „Notes for Review“)

> Diese App setzt ein Konto voraus. Einen Testzugang finden Sie oben in den
> Review-Zugangsdaten.
>
> Einfach Hausen ist der Hausmanager für Eigenheimbesitzer: Anliegen beschreiben,
> Angebote regionaler Fachbetriebe vergleichen, Aufträge verfolgen und die Hausakte
> pflegen.
>
> **Zur Funktion:** Die App ist keine reine Website-Hülle. Sie lädt die Produktions-Web-App
> in eine native Hülle und ergänzt natives Verhalten (Statusleiste, Tastaturverhalten,
> Offline-Fallback über einen Service Worker). Bitte beachten Sie die offene Einschätzung
> in `STORE-READINESS.md` Abschnitt 3 — dieses Risiko ist bewusst dokumentiert.
>
> **Kein In-App-Purchase:** Die App verkauft keine digitalen Güter. Zahlungen an
> Fachbetriebe sind reale Dienstleistungen und laufen außerhalb der App.
>
> **Konto löschen:** Einstellungen → „Konto löschen“.
>
> **Daten:** Kein Tracking, keine Werbe-SDKs, keine Weitergabe an Dritte ohne
> ausdrückliche Freigabe der Nutzerin.

## 6. Screenshot-Liste (an echte Routen gebunden)

Die Reihenfolge erzählt den Ablauf; die erste Aufnahme entscheidet über den ersten
Eindruck. Alle Routen existieren und sind in der App erreichbar.

| # | Route | Zeigt |
|---|---|---|
| 1 | `/app` | Owner-Dashboard: Überblick über Haus, Aufträge und nächste Schritte |
| 2 | `/app/hausmeister` | Anliegen in eigenen Worten beschreiben |
| 3 | `/app/jobs` | Aufträge mit Status und Terminen |
| 4 | `/app/home` | Hausakte des Objekts |
| 5 | `/app/documents` | Ablage: Rechnungen, Nachweise, Belege mit Ansichtswechsel |
| 6 | `/app/messages` | Nachrichten mit dem festen Ansprechpartner |
| 7 | `/app/contracts` | Verträge und Kündigungsfristen |
| 8 | `/app/profile` | Profil und Konto |

**Erforderliche Größen (Apple):** 6,7" (1290 × 2796) und 6,5" (1242 × 2688) sind Pflicht;
12,9"-iPad (2048 × 2732) nur, wenn iPad unterstützt wird. **Play:** mindestens 2
Telefon-Screenshots, dazu ein Feature-Graphic (1024 × 500).

## 7. Status

| Bestandteil | Status |
|---|---|
| App-Store-Icon 1024 × 1024 | **erledigt** — `public/icons/app-store-1024.png`, quadratisch, opak, ohne Alphakanal, abgeleitet aus `public/brand/einfachhausen-app-icon.svg` über `scripts/generate-store-icons.mjs` |
| Listing-Texte (beide Stores) | **Entwurf fertig** (Abschnitt 3–4), Freigabe durch die Betreiberin offen |
| Review-Hinweise | **Entwurf fertig** (Abschnitt 5) |
| Screenshot-Liste | **fertig** (Abschnitt 6), Aufnahmen offen |
| Review-Testzugang | **offen — Betreiberin** (Abschnitt 2) |
| Splash Screens | **offen** — die Gestaltung wäre eine Komposition und braucht die Designautorität; die Plattformgrößen stehen fest |
| Apple Developer Program, Bundle-ID | **offen — Betreiberin** |
| Datenschutzdeklarationen in den Konsolen | **Entwurf fertig**, Eintragung in Betreiberhand |
