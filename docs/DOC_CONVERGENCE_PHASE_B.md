# Dokumentations-Konvergenz EH-DOC-CONVERGENCE-20260911

**Zweck:** Ein einziges Register für den Übergang von Phase A (parallel-sicher) zu Phase B (Konsolidierung nach Integration des Owner-Dashboard-Branches). Keine zweite Roadmap; die kanonische Steuerung bleibt `.sin-gpt-web/taskplan.sqlite3`.

**Status Phase A (2026-09-11):** abgeschlossen, ohne Berührung gesperrter Pfade.

---

## 1. Gesperrte Pfade (Parallel-Agent `design/owner-dashboard-20260911`)

Die folgenden Pfade sind bis zur Integration/Rebase des Branches **read-only für alle anderen Agenten**:

- `DESIGN.md`
- `AGENTS.md`
- `README.md`
- `docs/NEXT_AGENT.md`
- `docs/ARCHITECTURE.md`
- `docs/PRODUCTION_HANDOVER.md`
- `packages/eh-design/*`
- `src/app/*` (Owner-Dashboard), `src/app/jobs/*`

## 2. Konfliktmarker-Bestand (ungelöst, auf `main` working tree)

Diese Markern liegen ausschließlich in gesperrten Dateien und werden **nur in Phase B** aufgelöst — auf Basis des integrierten Branches, nicht des lokalen HEAD:

| Datei | Marker-Zeilen |
|---|---|
| `AGENTS.md` | `<<<<<<< HEAD` :697, `=======` :850, `>>>>>>> origin/main` :903 |
| `docs/ARCHITECTURE.md` | :757 / :910 / :960 |
| `README.md` | :878 / :1031 / :1081 |
| `docs/NEXT_AGENT.md` | :3 / :11 / :13 und :144 / :333 / :335 |
| `docs/PRODUCTION_HANDOVER.md` | Dirty; keine `<<<<<<<`-Marker, aber uncommittete Überschneidung mit derselben Welle |

**Regel:** Kein Agent darf die Marker lokal „weglösen", um Builds/Checks grün zu bekommen. Die Auflösung passiert einmalig in Phase B gegen den integrierten Branch-Stand.

## 3. Dokumenten-Hierarchie (gültig ab sofort)

| Ebene | Dokument | Aussagekraft |
|---|---|---|
| Task-Steuerung | `.sin-gpt-web/taskplan.sqlite3` / `.sin-gpt-web/TASKPLAN.md` | Einziger Statusautorität |
| Fortsetzung | `docs/NEXT_AGENT.md` | Genau ein Kontinuationspunkt (Phase B: bereinigen) |
| Workflow-Regeln | `AGENTS.md` | Verbindlich; Feature-Blocks (nextjs-agent-rules, gitnexus, handover) sind maschinell gepflegt — nicht manuell umbauen |
| Produktdefinition | `docs/PRODUCT_VISION.md`, `docs/PRODUCT_POSITIONING.md` | Bindend, inhaltlich stabil |
| Design | `DESIGN.md` + `packages/eh-design/` | Einzige visuelle Quelle. `docs/DESIGN_SYSTEM.md` ist nur noch historische Visionslinie (Banner gesetzt 2026-09-11) |
| Produktion | `docs/PRODUCTION_HANDOVER.md`, `docs/OPERATIONS.md` | Ops; Live-Status vor Mutation immer frisch verifizieren |
| Berichte | `docs/WAVE-REPORT-*`, `docs/evidence/*`, `docs/brand/evidence/*` | Evidenz, nie aktuelle Anweisung |

## 4. Registrierte Widersprüche (außerhalb gesperrter Dateien, in Phase A entschärft)

| Widerspruch | Ort | Phase-A-Maßnahme |
|---|---|---|
| „verbindliche visuelle Richtung" an zweiter Stelle | `docs/DESIGN_SYSTEM.md` (von `README.md` referenziert) | Banner ergänzt: nur noch `DESIGN.md` bindend |
| Zwei parallele NEXT_AGENT-Statusblöcke (Welle 2 vs. Welle 3) | `docs/NEXT_AGENT.md` — **gesperrt** | Phase B: genau ein Statusblock |
| Drei parallele Marken-Statusvarianten (HEAD vs. origin/main) | `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md` — **gesperrt** | Phase B |

## 5. Phase-B-Checkliste (erst nach Merge/Rebase `design/owner-dashboard-20260911`)

1. `git fetch` + lokalen Stand gegen integrierten Branch verifizieren; dirty Tree nicht wegwerfen (`git reset --hard` verboten).
2. Konfliktmarker gemäß Tabelle 2 auflösen: Branch-Stand gewinnt bei Design-/Dashboard-Themen, origin/main-Handover-Blöcke bleiben als Evidenz-Kommentare erhalten (nur ein Statusblock pro Datei).
3. `AGENTS.md`-Handover-Kommentarblöcke (`SIN-GPT-WEB-HANDOVER`) konsolidieren: keine duplizierten Task-Einträge mehr.
4. `docs/NEXT_AGENT.md`: genau ein „Aktueller Kontinuationspunkt"-Block, genau eine nächste Aktion.
5. `README.md`: Verweis „verbindliche visuelle Richtung" prüfen — muss auf `DESIGN.md` zeigen, nicht auf `docs/DESIGN_SYSTEM.md`.
6. `docs/DESIGN_SYSTEM.md`-Banner und ggf. weitere Historisierung mit neuem Stand abgleichen.
7. Verification: `npm run lint`, `npm run build`, `sin verify`; visuelle Checks nur gemäß `DESIGN.md`-Regeln (keine Baseline-Updates in dieser Aufgabe).
