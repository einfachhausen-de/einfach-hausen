> **Produktkontext aktualisiert · 21.09.2026:** Maßgeblich sind [Produktvision](../../PRODUCT_VISION.md) und [Positionierung](../../PRODUCT_POSITIONING.md): Handwerkervermittlung und Affiliate-Tarife zuerst, Eigentümer kostenlos, Partnerabo, Hausakte ergänzend. Frühere Prioritäten und „nächste Aktionen“ dieser Lieferung gelten nur für ihren datierten Umfang; aktuelle Fortsetzung unter [NEXT_AGENT](../../NEXT_AGENT.md). Technische und gestalterische Nachweise bleiben historische Belege. 

# iOS App Store — Handoff (Docs-Track)

Stand: 2026-09-10 · Task: EH-APP-01 (implement, backlog, high, owner local-agent)
Branch (Docs): docs/eh-appstore-20260910 · Basis: origin/main @ 0503da3
Code-Track (parallel, fremd): feat/eh-appstore-ios-20260910 · Worktree: /home/ubuntu/orca/workspaces/eh-appstore-20260910

> Rollenbindung: docs/COMPANY_IDENTITY.md — Gina Schulze ist Inhaberin und Geschäftsführerin,
> Jeremy Schulze ist Developer (kein Inhaber/Betreiber/Geschäftsführer). Keine Rechtsform-,
> Adress-, Register-, USt-IdNr.- oder Telefondaten erfinden.

## 1. Stand (verifiziert 2026-09-10 auf OCI sin-supabase)

- `capacitor.config.ts`: appId `de.einfachhausen.app`, appName `einfachhausen`, webDir `out`,
  `server: { androidScheme: https, iosScheme: https }`.
- Pakete: `@capacitor/cli` + `core` + `keyboard` + `status-bar` vorhanden; **`@capacitor/ios` fehlt**.
- **Kein `ios/`-Ordner** im Repo (noch kein `npx cap add ios` gelaufen).
- **Kein statischer Export**: `next.config.ts` enthält kein `output: export`
  (der iOS-WebDir `out` braucht ihn vor dem Capacitor-Sync).
- Taskplan: EH-APP-01 ist kanonisch in `.sin-gpt-web/taskplan.sqlite3` angelegt
  (für den parallelen Code-Agenten read-only; alleiniger Schreiber: Docs-Agent).

## 2. Scope

- **Dieser Branch (Docs-Track)**: nur Taskplan + Docs. Kein Code, kein Deploy.
  Enthält: diesen Handoff + `docs/NEXT_AGENT.md`-Eintrag oben.
- **Code-Track (paralleler Agent)**: Capacitor-Scaffold, statischer Export, iOS-Hülle,
  TestFlight-Pipeline — ausschließlich auf `feat/eh-appstore-ios-20260910`
  im Worktree `/home/ubuntu/orca/workspaces/eh-appstore-20260910`.
- Der Docs-Track fasst Code-Dateien nicht an und löscht keine fremde Arbeit.

## 3. Offene Entscheidungen (mit Owner)

1. **Apple Developer / Org-Status + Bundle-ID-Registrierung** — offen, Owner Gina (Inhaberin).
   Bundle-ID-Kandidat: `de.einfachhausen.app` (aus `capacitor.config.ts`).
2. **Notion-Login-Buttons ohne Credentials** — T-0206 B7 Entscheidung ausstehend.
   Keine Login-Buttons ohne belegte Credentials einbauen.
3. **IAP-vs-Stripe-Entscheidung** — offen. App-Store-Regeln (digitale Güter → IAP)
   vs. bestehende Stripe-Integration: Position vor dem ersten TestFlight-Upload klären.

## 4. Reservierte Pfade und Branches

| Was | Pfad / Name | Wem |
|---|---|---|
| Code-Branch | `feat/eh-appstore-ios-20260910` (nur lokal, noch nicht auf origin) | Code-Agent |
| Code-Worktree | `/home/ubuntu/orca/workspaces/eh-appstore-20260910` | Code-Agent |
| Docs-Branch | `docs/eh-appstore-20260910` (dieser Branch) | Docs-Agent |
| Docs-Worktree | `/home/ubuntu/orca/workspaces/eh-docs-appstore-20260910` | Docs-Agent |
| Handoff | `docs/brand/appstore/HANDOFF.md` (diese Datei) | Docs-Agent |
| Taskplan | `/home/ubuntu/dev/einfach-hausen/.sin-gpt-web/taskplan.sqlite3` (ID EH-APP-01) | Docs-Agent (alleiniger Schreiber) |

## 5. Build- und Transfergrenze

- **TECHNISCH**: `xcodebuild`/Archiv/Signierung braucht **macOS mit Xcode**.
  Regel: Scaffold auf OCI, Build auf Mac.
- **GitHub ist die einzige Mac-OCI-Code-Transfergrenze**; nie einen dirty
  Mac-Working-Tree direkt nach OCI kopieren (AGENTS.md).
- Folge-Build nach diesem Handoff nur via GitHub-Transfergrenze.
- Verbote: kein `reset`/`clean`/`force`, keine fremde Arbeit löschen, keine Secrets.

## 6. Nächste Aktion (genau eine)

Offene Entscheidungen (Abschnitt 3) klären, dann Code-Track auf
`feat/eh-appstore-ios-20260910` weiterführen (Scaffold + statischer Export),
Ergebnis via GitHub-Transfergrenze auf den Mac für den Xcode-Build geben.
