# Kontotarife – Folgeausbau von PR86

> **Historisch / überholt seit 2026-09-21 (Issue #132).** Dieses Dokument beschreibt
> die damalige Eigentümer-Monetarisierung (Mitgliedschaftsstufen, Einzelpakete,
> Pilotrabatt, `/app/plans`). Dieses Modell existiert nicht mehr: Eigentümer nutzen
> einfachhausen kostenlos, `/app/plans` leitet auf `/app/settings` um, und die
> Serveraktionen `startMembershipCheckoutAction`/`purchasePackageAction` wurden
> entfernt. Der Prüfauftrag unten ist damit gegenstandslos; er bleibt nur als
> Nachweis der damaligen Arbeit erhalten. Verbindlich sind `docs/PRODUCT_VISION.md`
> und `README.md`.

Host OCI sin-supabase, selber Branch fix/eh-pricing-clarity-20260910.
Aktuellsten PR-Head übernehmen; frühere SOURCE-Version enthält nur Centkorrektur.

## Frontend geliefert
/app/plans: kanonischer Workspace mit Status und Konditionen oben, getrennte Mitgliedschaften/Einzelpakete/Paketbuchungen.
Status ausschließlich aus gespeicherter Subscription. Query success/processing ist nur Rückkehrhinweis, keine Zahlungsbestätigung.
pending, past_due, cancelled und fehlende Subscription werden ausdrücklich dargestellt.
Pilotprozentsatz kommt aus discount_bps; Preise mit derselben Cent-Rundung wie Checkout. Beispiel 1990 * .85 = 1692 Cent.
Free-Wechsel bei existierender Stripe-Referenz mit expliziter erforderlicher Checkbox; diese ist nur UX, keine Backend-Autorisierung.
Paket-JSON defensiv lesen, sonst nicht die komplette Seite abstürzen lassen; fehlende Beschreibung bleibt über Stammdaten zu korrigieren.
Original-Serveraktionen unverändert; keine Live-Zahlung ausgelöst.

## Vor Freigabe: EH-BILLING-CANCEL-TRUTH
startMembershipCheckoutAction und Partner-Free-Pfad in src/app/actions.ts verschlucken Fehler beim Stripe-Kündigen.
Auch ohne STRIPE_SECRET_KEY kann bei vorhandener Remote-Subscription lokaler Status auf Free wechseln.
Lokaler Agent muss das Backend korrigieren: Remote-Referenz und Status bei nicht bestätigter Kündigung erhalten; Fehler ehrlich anzeigen; Retry sicher gestalten. Keine Test-/Guardlockerung.
Erfolg, Timeout, fehlender Key, schon gekündigte Subscription, Mehrfachklick, paralleler Webhook testen. Keine echten Abos als Testmaterial.
Zusätzlich Downgrade-Zeitpunkt/Restlaufzeit aus Vertragsbedingungen klären. Die neue Checkbox verspricht keinen Stichtag oder Erstattungsbetrag.

## Prüfauftrag
1. Ohne Subscription, active, pending, past_due, cancelled prüfen.
2. ?checkout=success darf bei past_due keinen Erfolg behaupten.
3. Ohne/mit Pilot, 19,90 -> 16,92 und 39,90 -> 33,92 EUR gegen Checkout vergleichen.
4. Free-Wechsel-Checkbox per Keyboard und native validation prüfen.
5. Paketpreis ist einmalig, kein Abo; Bestellstatus verständlich.
6. Browser 390/736/1536 und vorhandene Release-Gates; erst gemeinsam mit Backend-Fix freigeben.

## Lokale Browsergrenze
Der erste Browserlauf mit lokaler Fixture-Session wurde nach erfolgreichem SSR von AuthContext nach /login geschickt, weil der Client Supabase erwartet. Kein Produktions-Authfehler daraus abgeleitet. Separater SSR-Screenshotlauf ohne JavaScript dient nur Layout-/Textprüfung; keine interaktive Auth-/Checkout-Abnahme. Lokaler Agent muss den normalen authentifizierten Browserflow prüfen.

Auch der SSR-Versuch ohne JavaScript lieferte keinen nutzbaren Seiteninhalt (Streaming/Suspense, H1=0). Daher KEINE neuen Kontoseiten-Screenshots oder visuelle Abnahme behauptet. Vorhandene pricing-*.png betreffen ausschließlich die öffentliche Preisseite aus vorheriger Lieferung. Konto: TypeScript/ESLint/diff-check erfolgreich; Browserprüfung offen.
