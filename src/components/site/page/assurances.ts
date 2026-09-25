/**
 * Belegte Zusagen der Website (DESIGN.md § Startseite und Login 2026-09-25).
 * Eigene Datei, damit Client-Komponenten wie der Login sie ohne den gesamten
 * Website-Baukasten importieren können.
 */

/**
 * Belegte Produktfakten für Eigentümer (Preise, Ablauf, Sicherheit). Nur dort einsetzen,
 * wo das Angebot für Eigentümer gilt – nie auf Partnerseiten.
 */
export const OWNER_ASSURANCES = [
  'Hauskonto dauerhaft kostenlos',
  'Kein Auftrag ohne deine Bestätigung',
  'Keine Provision auf deinen Auftrag',
] as const;

/** Belegte Zusagen für Betriebe, Quelle: /partner (FAQ). Nie auf Eigentümerseiten mischen. */
export const PARTNER_ASSURANCES = [
  'Anfragen nach Eignung – ein Tarif kauft keine Position',
  'Du entscheidest, welche Aufträge du annimmst',
  'Du bleibst Rechnungssteller',
] as const;
