> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# Einfachhausen · verbindliche Übergabe · Designsystem 1.0.0

Jerry hat Atelier 02 ausdrücklich freigegeben und diese Umsetzung beauftragt. Keine weitere Stilwahl. SIN-EH-design ist Pflicht. Agenten dürfen Inhalte, Reihenfolge, Datenbindungen und dokumentierte Varianten komponieren; eigene Farben, Schriften, Effekte, Rundungen, Logos, CSS-Systeme oder Neugestaltung sind verboten. Fehlende Primitive als konkrete Lücke melden; den Markenkern nicht ändern oder das Prüfsiegel erneuern.

## Quellen und Maschinen

- Kanonisches Repo: https://github.com/Delqhi/einfach-hausen, Branch design/einfachhausen-brand-atelier-20260906, PR https://github.com/Delqhi/einfach-hausen/pull/41.
- OCI: /home/ubuntu/orca/workspaces/einfach-hausen-brand-atelier-20260906.
- Mac i9: /Users/jeremyschulze/orca/workspaces/einfach-hausen-brand-atelier-20260906. Der gemeinsame Entwicklungscheckout bleibt unberührt.
- Normativ: DESIGN.md, packages/eh-design/src/*, packages/eh-design/assets/*. Vollständiger Quelltext aller geänderten Textdateien: SOURCE.md; Binärdateien und Hashes: source-manifest.json. Keine ellipsierten Codeauszüge als Implementierung verwenden.
- Verbindliche Komponenten: 49 Exporte in primitives.tsx, blocks.tsx, app.tsx. Acht vollständige Seitenrezepte in recipes.tsx. Browserbibliothek /design-system mit neun Ansichten.
- Native Worker-HTML: packages/eh-design/src/html.mjs + html-style.mjs. Vollständige CRM-Komposition CRM_RECIPE.mjs. Kein React-Umbau des Workers.
- Originales vollständiges Logo und selbst gehostetes Inter sind Pflicht. Schriftgrößen: Web 17–18, App 16, Label 15, Metadaten mindestens 13, Eingaben 16 px. 12 px nur nicht notwendige Eyebrows.

## Verifikation

```bash
export PATH=/home/ubuntu/.nvm/versions/node/v22.23.0/bin:/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin
cd /home/ubuntu/orca/workspaces/einfach-hausen-brand-atelier-20260906
node scripts/eh-design-check.mjs
node scripts/eh-design-generate.mjs --check
node --test scripts/eh-design-check.test.mjs scripts/eh-design-html.test.mjs
node scripts/public-website-contract.mjs
npm run typecheck
npm run lint
npm run build
```

Erhoben: Build, Typprüfung, bestehender öffentlicher Website-Vertrag; 27 Bibliotheksansichten (9 × 390/736/1440), keine Überläufe, keine Axe-Verstöße, Interaktionen geprüft. 14 echte öffentliche Routenansichten ohne Überlauf/JS-Fehler. Screenshots und JSON in docs/brand/evidence/system. GitNexus lieferte teilweise gekürzte Ablaufgraphen; diese sind keine Vollständigkeitsgarantie. Direkte Aufrufer, Build und Browser wurden zusätzlich geprüft. Authentifizierte Live-Datenflüsse wurden nicht durch künstliche Anmeldungen behauptet.

## Nächste Agenten: strikt begrenzte Migration

| Task | Umfang | Pflicht |
|---|---|---|
| EH-BRAND-05-WEB | Bestehende Themen-/Leistungs-/Hilfe-/Artikel-/Rechtsseiten | Vorhandene Texte, SEO, Routen, Aussagen erhalten; acht Rezepte je Inhalt komponieren; keine identische Onepage-Kopie. |
| EH-BRAND-05-APPS | Owner /app und Handwerker /pro | Auth, Datenzugriff, Berechtigungen und Navigation erhalten; EHAppHeader, EHPanel, EHField, EHTabs, EHDataTable, EHDocumentList, EHComposer verwenden. |
| EH-BRAND-05-CRM | einfachhausen-de/einfach-hausen-crm | Worker-HTML-Adapter; src/ui.js schrittweise migrieren; Sessions/AuthZ/D1/contact_history/Outreach erhalten; keine Nachrichten senden. |
| EH-BRAND-05-HUB | einfachhausen-de/portalhub | Shell, Projekte, Listen, Formulare, Aktivität, Einstellungen mit kanonischen Komponenten; Drizzle/Auth/API erhalten. |

Aufgabenquelle ist sin-gpt-web-state im kanonischen Taskrepo /home/ubuntu/dev/einfach-hausen. EH-BRAND-03 ist abgeschlossen, EH-BRAND-04 enthält diese Lieferung. Restmigration bleibt offen, bis reale Seiten geprüft sind. Keine behauptete Komplettmigration aller historischen Screens.

Jeder Folgeagent muss vor Beginn die aktuellen Commits, AGENTS.md, DESIGN.md und diesen Handoff lesen, Git-Status prüfen und isoliert arbeiten. Keine fremden Änderungen überschreiben, kein reset --hard/clean/force-push. Umsetzung komplett pro Datei liefern, vorhandene APIs bewahren, tatsächliche Screenshots bei 390/736/1440 und 200% Zoom prüfen, Tastatur-/Formularzustände prüfen, diff/check/build dokumentieren. Neue Seiten importieren die Bibliothek. Keine lokale Nachbildung der Komponenten.

## Präsentationsgenerator

Repo einfachhausen-de/einfachhausen-presentation-generator, OCI /home/ubuntu/orca/workspaces/einfachhausen-presentation-brand-20260906, Branch design/atelier-02-brand-system-20260906.
13 SlideRenderer-Layouts und 25 Remotion-Kompositionen nutzen dieselben Token und Original-Assets. Der eigenständige HTML-Export bettet Inter und Logo ein. Bestehende Inhalte und Disclaimer bleiben erhalten. Build/Test/Typprüfung/Lint erfolgreich; 13 Layouts auf Überlauf/Schrift geprüft; alle 25 Kompositionen gelistet, drei repräsentative Frames gerendert und visuell geprüft. Build mit unerreichbarer lokaler Dummy-DATABASE_URL ist kein Live-Datenbanktest. Keine alten Website-Videos erneut einbauen.

## Schutz und Grenzen

EH design consistency ist der kostenlose GitHub-Actions-Check. Er prüft neue Designabweichungen, Token-Generierung, gesiegelten Kern und den vertrauenswürdigen PR-Basisvertrag. Eigenes Neusiegeln erlaubt keine Kernänderung gegen den Basisvertrag. Bestehende lokale Designaltlasten sind exakt begrenzt und dürfen nur sinken. Schutzregeln dürfen nicht durch Agenten abgeschwächt werden.
Öffentliches Hauptrepo unterstützt Branchschutz. Die privaten Repos der Organisation liegen auf GitHub Free; GitHub verweigert dort verpflichtenden Branchschutz (403). CI bleibt möglich, aber nicht technisch merge-verpflichtend. Kein kostenpflichtiger Plan wurde gebucht. Ein Administrator mit denselben Zugangsdaten kann grundsätzlich Regeln ändern; Texte allein können das nicht unmöglich machen. Visuelle Qualität braucht zusätzlich Screenshot-Review.
Separat versionierte Consumer-Manifeste pinnen den Quellcommit und SHA256 jedes Vendor-Files. Nur scripts/eh-design-sync.mjs darf eine bestätigte saubere kanonische Version übertragen. Kein eigenständiges Kopieren/Abändern.

## Dokumentationspflicht

Alle Folgeänderungen müssen Taskstatus, NEXT_AGENT, Handoff, Prüfnachweise, vollständige Source-Blöcke und Hashmanifest aktualisieren. Designentscheidungen in Brain/Memory mit Quellen und Versionsstand festhalten. Alte Stilproben bleiben historische Evidenz. Keine Behauptung einer Installation, eines Merge, Deployments oder Pflichtchecks ohne tatsächlichen Nachweis.


## Lieferstand und letzte Nutzersteuerung

Designsystem und Skills sind versioniert geliefert; EH-BRAND-04 ist abgeschlossen. Beide Skills sind auf OCI und Mac i9 in Codex/OpenCode installiert und lokale AGENTS.md ergänzt. Verbindliche Commit-/PR-/Issue-/Installationspfade: docs/brand/system/delivery.json. PR42 ist als durch PR41 ersetzt geschlossen; sein Branch bleibt erhalten. Weitere Tests und Restmigration sind auf ausdrückliche Nutzeranweisung an lokale Agenten übergeben (EH-BRAND-05-WEB/APPS/CRM/HUB und06). Kein Merge/Deployment/Pflichtstatus wurde als erfolgt behauptet.


### Direkte Übernahme

- Hauptbibliothek: https://github.com/Delqhi/einfach-hausen/pull/41
- Skills (bereits lokal installiert): https://github.com/OpenSIN-Code/wow-my-zsh/pull/101
- Präsentationsgenerator: https://github.com/einfachhausen-de/einfachhausen-presentation-generator/pull/1
- CRM-Vertrag: https://github.com/einfachhausen-de/einfach-hausen-crm/pull/3
- Hub-Vertrag: https://github.com/einfachhausen-de/portalhub/pull/1
- Lokale Folgeaufgaben: Website #43, Apps #44, CRM #4, Hub #2, Regression/Pflichtstatus #45 in den jeweiligen Repos.


## Fachliche Vorlagen · neue Fortsetzung

Der nächste begrenzte Übernahmeauftrag ist DOMAIN_RECIPES_HANDOFF.md. Acht zusätzliche fertig geschriebene Kompositionen; zusammen 16 Seitenrezepte. Edition 2 ist noch nicht auf Consumer oder installierte Skills synchronisiert und noch nicht visuell geprüft. Lokale Agenten übernehmen diesen technischen Schritt mit vollständigem Code und den vorhandenen Regeln.
