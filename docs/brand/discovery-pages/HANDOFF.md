> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Besucherführung: Leistungen und Ablauf
Host OCI sin-supabase; Branch fix/eh-discovery-pages-20260910; Basis 4638ee2.
Worktree /home/ubuntu/orca/workspaces/eh-discovery-pages-20260910.
Nutzerauftrag: weitere Seiten wie Hausakte/Preise überzeugender machen.

## Geliefert
/so-funktionierts: drei Entscheidungen zuerst, dann nachvollziehbarer Auftragsablauf mit lesbaren Beispielen, Grenzen, persönlicher Kontakt, FAQ. Kein erfundener konkreter Handwerker als Beleg, keine unbelegte Ein-Werktag-Zusage.
/leistungen: konkrete Anliegen als klickbarer Einstieg; alle 12 SERVICE_CATEGORIES und ihre Unterseiten erhalten; SEO-JSON-LD erhalten; Beispieltexte und request-Prefill erhalten. Lesbares Beispiel statt Phone-Miniatur.
Nur zwei Seiten, ausschließlich vorhandene EH-Komponenten. Keine Styles, Tokens, Datenmodelle, Auth oder Serveraktionen geändert.
Anchor #ansprechpartner auf Ablaufseite erhalten. Neue Anker #dein-weg und #leistungsbereiche.

## Nächste Aktion lokal
1. Diff und SOURCE.md prüfen, parallele WIP erhalten.
2. Beide Seiten bei 390/736/1536 visuell abnehmen; FAQ bedienen und Header/Footer kontrollieren.
3. Alle zwölf Leistungsdetail-Links erhalten und erreichbar; sechs Beispiel-Prefills /register?role=homeowner&request=... tatsächlich prüfen.
4. Drei Wege auf Ablaufseite: /beratung bzw. Registrierung mit Text; keine automatische Auftragsauslösung.
5. SEO canonical/Breadcrumb/Service-JSON-LD und bestehende öffentliche Navigations-Gates prüfen.
6. Gemeinsamer Merge/Deploy; Task Evidence render + validate. Keine Conversionverbesserung aus Screenshots allein behaupten.

## Grenzen
TypeScript, gezieltes ESLint und diff --check erfolgreich. GitNexus impact UNKNOWN, veralteter Index; kein Beleg einer vollständigen Graphprüfung.
Kein Produktionsdeploy. Browsernachweise aus isolierter lokaler Vorschau folgen daneben.
Offene Aufgaben Pricing/Billing/Chat/Hausakte bleiben erhalten, diese zwei Seiten erledigen keine Backend-Blocker.
