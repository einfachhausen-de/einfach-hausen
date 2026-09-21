> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Bestehende Chat-Einstiege zusammenführen
Host OCI sin-supabase; Branch fix/eh-legacy-chat-20260910; Basis 390d7e1.
Legacy /ki-chat leitet mit prompt oder q als draft nach /app/hausmeister.
Dort erscheint ein Vorschlag mit bewusster Übernahme/Verwerfen. Vorhandener Entwurf wird beim Übernehmen ergänzt, nicht überschrieben. Kein automatisches Senden.
Vorhandene Hausmeister-Uploads, Sprache und Serveraktion bleiben erhalten. Keine zweite Chatimplementierung oder neue Styles.
TypeScript, gezieltes ESLint, diff --check erfolgreich. GitNexus veraltet; Composer LOW mit zwei bekannten Aufrufern, Route UNKNOWN.
OFFEN vor Release: Browser 390/736/1536, prompt/q/Umlaute/Zeilenumbrüche, kein POST beim Öffnen oder Übernehmen, vorhandener Entwurf bleibt, Verwerfen verändert Entwurf nicht, normales Senden und Fehlerfall; Login-Rückkehr prüfen (requireUser leitet derzeit ohne Return-URL nach /login, anonyme Entwurfübernahme nicht garantiert). Keine Authänderung in dieser Lieferung.
Taskplan nächste Aktion: lokal Browserabnahme und Integration, danach normale Release-Gates. SOURCE.md enthält alle drei Quelldateien vollständig. Keine Behauptung einer Produktionsabnahme.
