# Geschäftsmodell — historische Empfehlung vom 10.09.2026

**Als aktuelle Produktvorgabe abgelöst.** Eigentümer-Kern kostenlos; Erlöse über Handwerkerabos und Affiliate-Tarifabschlüsse. Verbindlich: [PRODUCT_VISION.md](../../PRODUCT_VISION.md) und [PRODUCT_POSITIONING.md](../../PRODUCT_POSITIONING.md), Betreiberkorrektur 21.09.2026.

Die nachfolgende frühere Freemium-/Komforttarif-Hypothese wird nur als Entscheidungsverlauf erhalten. Keine Eigentümer-Abos, 15-%-Rabattprogramme, kostenpflichtige Hausorganisation oder dauerhaft freie Partnervermittlung daraus erneut implementieren. Konkrete Partnerpreise und Trial-Regeln werden separat anhand des aktuellen Bestands geklärt; keine Bestandsabos ändern.

Aktivierung wird fachlich am ersten eingestellten Inserat, Angebot/Beauftragung bzw. begonnenen Tarifvergleich ausgerichtet. „Hausakte eingerichtet“ allein ist kein Kernziel.

## Historische Fassung (keine aktuelle Arbeitsanweisung)

# Geschäftsmodell: Empfehlung mit Prüfgrenzen
Stand 10.09.2026. Keine Aussage über ein universell bestes oder profitables Modell.
Nutzerauftrag: Preisseite deutlich verbessern; sinnvolle Abo-Anpassungen ausdrücklich erlaubt.
Diese Lieferung verändert weder Preise in der DB noch bestehende Stripe-Abos.

## Quellen und Einordnung
- https://www.homezada.com/homeowners/pricing — am 10.09.2026 gelesen: kostenloser Einstieg; Premium 99 USD/Jahr oder 15,95 USD/Monat; Deluxe 189 USD/Jahr, mehrere Immobilien; klar begrenzte KI-Kontingente. US-Produkt, kein direkter Preisanker für deutsche persönliche Betreuung.
- https://consumer.profis.check24.de/portal/cs/willkommen — am 10.09.2026 gelesen: kostenlose Dienstleistersuche/Angebotsvergleich für Verbraucher. Daraus lässt sich keine Profitabilität oder konkrete Nachfrage nach unserem Abo ableiten.

## Urteil
Freemium + bezahlte Hausorganisation + separat abgegrenzte menschliche Leistungen ist plausibel.
Nicht belastbar: unbeschränkte persönliche Betreuung oder pauschales „um nichts kümmern“ für 39,90 EUR.
Keine Belege für Zahlungsbereitschaft, Retention, Betreuungskosten und Nachfragevolumen vorliegend.
Trend ist kein Ersatz für einen messbaren Nutzen und positiven Deckungsbeitrag.

## Zielangebot (Hypothese, nicht live eingeführt)
1. Hauskonto Free: Hausakte, Datenzugang, grundlegende Wartungsübersicht, Anfragen; KI-Kontingent ehrlich zeigen. Hauswissen nicht künstlich wegsperren.
2. Ein klarer Digital-/Komforttarif: wiederkehrenden belegbaren Zusatznutzen bündeln. Nicht vorhandene Basisfunktionen nochmals als exklusiv verkaufen. 19,90 EUR nicht ohne Zahlungsbereitschaftstest als optimal behandeln.
3. Persönliche Leistungen: klarer Umfang je Leistung/Zeitraum, Kapazität, Termine und Ausnahmen. Einmalpaket oder definiertes Betreuungskontingent statt unbegrenzter Menschen-Flatrate.
4. Betriebe: kostenloser Einstieg; bezahlte Stufen durch tatsächlich verfügbare Team-/Arbeitsfunktionen und Support differenzieren. Nicht allein durch versprochene Leads. Kein bezahlter Rankingvorteil.
5. Jahreszahlung erst anbieten, wenn Checkout, anteilige Änderungen/Kündigung, Rechte und Steuerdarstellung vollständig umgesetzt sind. Keine Attrappe eines Monats-/Jahres-Schalters.
6. 15-%-Bestandsversprechen respektieren; keine neue lebenslange Rabattaktion ohne Kalkulation.

## Messbarer Entscheidungsweg
- Planweise Deckungsbeitrag = Erlös nach Steuern/Gebühren minus KI, variable Betreuung, Leistungserfüllung und zurechenbarer Support.
- Tatsächliche Betreuungsminuten und Kosten pro aktivem Kunden erfassen; keine frei erfundenen Margen.
- Aktivierung (Hausakte eingerichtet), 30-/90-Tage-Wiederkehr, Bezahlkonversion, Kündigungsgründe, Rückerstattungen, Kosten pro Betreuungsfall getrennt messen.
- Preisinterviews + transparenter Pilot mit klarer Leistung. Keine fiktive Beliebtheitsmarkierung.
- Erst danach neue Preise bzw. Jahresabo freigeben; bestehende Abos über explizite Migration, nie DB-Seeds als Bestandskundenmigration missbrauchen.

## Konkrete Befunde aus dem Code
- Öffentliche FREE-Vergleichstabelle verneinte Jahresplan; Route /app/year ist bereits für Free nutzbar.
- /app/plans nutzte euro mit maximumFractionDigits:0: 1990 Cent wurden als 20 EUR gezeigt. Auf euroExact korrigiert.
- Öffentlich hardcodierte Preise konnten vom Checkout abweichen; /preise liest nun aktive membership_plans/partner_plans.
- partner_plans: Free 5 / Start 50 / Pro und Premium keine tarifliche Monatsgrenze. Bisherige Tabelle „laufend“ war unpräzise; keine Auftragsgarantie daraus ableiten.
- PLUS/PREMIUM enthalten Marketingbeschreibungen zu Priorität/Hauscheck. Tatsächliche betriebliche Erfüllung muss vor offensiver Bewerbung belegt sein.
- Steuerbasis/Endpreiskennzeichnung ist aus dem geprüften Code nicht verlässlich feststellbar. Keine „inkl. MwSt.“-Behauptung erfunden: verbindliche Endpreis-/B2B-Steuerdarstellung vor Veröffentlichung klären.
