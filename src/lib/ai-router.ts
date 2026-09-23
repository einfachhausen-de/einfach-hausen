/** Laya/Jev classify only. Neither may select SQL, identities or arbitrary tools. */
export const CAPABILITIES = {
  jobs: 'Eigene Aufträge anzeigen, Status und offene Aufträge',
  quotes: 'Eigene Handwerkerangebote und deren Preise anzeigen',
  contracts: 'Eigene Verträge: Anbieter, Kosten, Laufzeit, Kündigungsfrist',
  documents: 'Eigene Dokumente, Rechnungen, Belege suchen oder anzeigen',
  contacts: 'Gespeicherte eigene Ansprechpartner und Kontakte anzeigen',
  calendar: 'Eigene vereinbarte Termine anzeigen',
  house: 'Gespeicherte Hausdaten und Anlagen anzeigen',
  maintenance: 'Pflege, Wartungen und fällige Aufgaben anzeigen',
  search_house: 'Eigene Hausakte durchsuchen: Dokumente mit OCR-Text, Hausdaten, Verträge, Anlagen, Wartungen und Ansprechpartner in einem Schritt',
  create_report: 'Aus eigenen Daten einen Bericht oder eine Zusammenfassung erstellen',
  next_actions: 'Was jetzt Aufmerksamkeit braucht: Fristen, Wartung, Termine, Angebote und nächste Schritte',
  compare_quotes: 'Eigene Handwerkerangebote eines Auftrags nach Preis, Termin, Entfernung und Bewertung gegenüberstellen',
  house_check: 'Hausakte auf fehlende Kernangaben und sinnvolle Ergänzungen prüfen',
  house_event: 'Neue Hausinformation, Dokument, Wartung oder Problem dem passenden Bereich zuordnen',
  find_provider: 'Einen Handwerker oder neuen Ansprechpartner finden',
  create_job: 'Einen Auftrag erstellen, beauftragen oder Arbeit machen lassen',
  compare_tariffs: 'Strom, Gas, Internet oder Versicherungen wechseln/vergleichen',
  help: 'Bedienung der App, Adresse ändern, Dokument hochladen, Einstellungen',
  generative: 'Individuell erklären, begründen, analysieren, formulieren oder fachlich beraten',
  clarify: 'Unklar, mehrere verschiedene Aufgaben oder keine passende Fähigkeit',
} as const;
export type Capability = keyof typeof CAPABILITIES;
export type Decision = { capability: Capability; provider: 'laya' | 'jev'; confidence: number };
type Config = { layaUrl: string; layaKey: string; jevKey: string; timeoutMs: number; cooldownMs: number; maxJev: number; jevModel?: string; confidence?: number };
type Fetcher = typeof fetch;
class Unavailable extends Error { constructor() { super('decision_unavailable'); } }

export function decisionQuestions() {
  return { route: { type: 'choice', instructions: 'Welche einzelne Fähigkeit erfüllt die letzte Nutzerfrage? Daten anzeigen ist nicht generativ. Freie Erklärungen sind generativ. Mehrdeutig: clarify.', criteria: CAPABILITIES } };
}
function validate(raw: unknown, provider: Decision['provider'], threshold: number): Decision {
  const a = (raw as { answers?: { route?: { choice?: unknown; confidence?: unknown } } })?.answers?.route;
  if (!a || typeof a.choice !== 'string' || !Object.hasOwn(CAPABILITIES, a.choice)
      || typeof a.confidence !== 'number' || !Number.isFinite(a.confidence) || a.confidence < threshold || a.confidence > 1) {
    return { capability: 'clarify', provider, confidence: 0 };
  }
  return { capability: a.choice as Capability, provider, confidence: a.confidence };
}
export class DecisionRouter {
  private openUntil = 0;
  private jevActive = 0;
  private config: Config;
  private request: Fetcher;
  constructor(config: Config, request: Fetcher = fetch) { this.config = config; this.request = request; }

  private async call(provider: Decision['provider'], text: string, signal?: AbortSignal): Promise<Decision> {
    signal?.throwIfAborted();
    const timeout = AbortSignal.timeout(this.config.timeoutMs);
    const bounded = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const local = provider === 'laya';
    const response = await this.request(local ? this.config.layaUrl.replace(/\/$/, '') + '/decide' : 'https://api.typesafe.ai/v1/systemone', {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (local ? this.config.layaKey : this.config.jevKey) },
      body: JSON.stringify({ state: text.slice(-4000), questions: decisionQuestions(), ...(local ? {} : { model: this.config.jevModel || 'jev-latest' }) }),
      signal: bounded,
    });
    if (!response.ok) {
      // Only capacity/availability errors cause overflow, not auth/config errors.
      if ([429, 502, 503, 504].includes(response.status)) throw new Unavailable();
      return { capability: 'clarify', provider, confidence: 0 };
    }
    try { return validate(await response.json(), provider, this.config.confidence ?? .9); }
    catch (e) { if (bounded.aborted) throw e; return { capability: 'clarify', provider, confidence: 0 }; }
  }

  async decide(text: string, signal?: AbortSignal): Promise<Decision> {
    signal?.throwIfAborted();
    if (Date.now() >= this.openUntil) {
      try { return await this.call('laya', text, signal); }
      catch {
        signal?.throwIfAborted(); // A closed tab is not a reason to buy Jev.
        this.openUntil = Date.now() + this.config.cooldownMs;
      }
    }
    if (!this.config.jevKey || this.jevActive >= this.config.maxJev) throw new Unavailable();
    this.jevActive++;
    try { return await this.call('jev', text, signal); }
    catch { signal?.throwIfAborted(); throw new Unavailable(); }
    finally { this.jevActive--; }
  }
}
function boundedInt(value: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(value); return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}
export const assistantRouter = new DecisionRouter({
  layaUrl: process.env.LAYA_URL || 'http://127.0.0.1:8097',
  layaKey: process.env.LAYA_API_KEY || '',
  jevKey: process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY || '',
  jevModel: process.env.JEV_MODEL || 'jev-latest',
  timeoutMs: boundedInt(process.env.LAYA_TIMEOUT_MS, 3000, 100, 15000),
  cooldownMs: 2000,
  maxJev: boundedInt(process.env.JEV_MAX_CONCURRENT, 4, 1, 32),
});

/** Narrow explicit commands, not a second general-purpose language model. */
export function explicitCapability(question: string): Capability | null {
  const q = question.toLocaleLowerCase('de-DE').trim();
  if (/angebote?.{0,45}(vergleich|gegenüber|gegenueber)|vergleich.{0,30}angebote?|welches angebot|angebote? prüfen|angebote? pruefen/.test(q)) return 'compare_quotes';
  if (/was .{0,40}(aufmerksamkeit|ansteht|fällig|faellig)|was muss ich (jetzt|als nächstes|als naechstes)|nächste schritte|naechste schritte|erinnerungen|was ist überfällig|was ist ueberfaellig/.test(q)) return 'next_actions';
  if (/hausakte.{0,30}(vollständig|vollstaendig|prüfen|pruefen|fehlt)|was fehlt.{0,30}(haus|hausakte)|hausdaten.{0,30}(vollständig|vollstaendig)/.test(q)) return 'house_check';
  if (/wo gehört .{0,60}hin|wo gehoert .{0,60}hin|einordnen|welcher bereich.{0,30}(dokument|rechnung|vertrag|wartung|problem)/.test(q)) return 'house_event';
  if (/\b(günstig\w*|guenstig\w*|besser\w*|sparen|wechseln|vergleichen)\b/u.test(q) && /anbieter|tarif|strom|gas|dsl|internet|festnetz|mobilfunk|versicherung/.test(q)) return 'compare_tariffs';
  if (/\b(beauftragen|auftrag .{0,40}erstellen|neuen auftrag|machen lassen|reparieren lassen)\b/.test(q) || /\b(kaputt|defekt|tropft|ausgefallen)\b/.test(q)) return 'create_job';
  if (/\b(erklär\w*|erlaeuter\w*|erläuter\w*|analysier\w*|begründe\w*|bewerte\w*|formulier\w*|schreib\w*)\b/u.test(q) || /vor- und nachteile|ausführlich|ausfuehrlich/.test(q)) return 'generative';
  if (/wie .{0,50}(hochlad|lade .{0,30}hoch|adresse .{0,15}änder|ändere .{0,20}adresse)|einstellungen|passwort|profil bearbeiten/.test(q)) return 'help';
  if (/\b(suche|finden)\b/.test(q) && /handwerker|elektriker|klempner|maler|neuen ansprechpartner/.test(q)) return 'find_provider';
  if (/(?:wer ist|zeige|mein\w*|unsere?\w*).{0,35}(elektriker|klempner|sanitär|sanitaer|heizung|maler|dachdecker|handwerker|ansprechpartner|kontakt)/.test(q)) return 'contacts';
  const lookup = /\b(mein\w*|zeige?\w*|welche\w*|wann|was zahle|wie viel|wieviel|wo finde)\b/.test(q);
  if (!lookup) return null;
  const matches: Capability[] = [];
  if (/auftrag|aufträge|auftraege/.test(q)) matches.push('jobs');
  if (/angebote?\b/.test(q)) matches.push('quotes');
  if (/vertrag|verträge|vertraege/.test(q)) matches.push('contracts');
  if (/rechnung|dokument|beleg/.test(q)) matches.push('documents');
  if (/ansprechpartner|kontakte/.test(q)) matches.push('contacts');
  if (/termine?|kalender/.test(q)) matches.push('calendar');
  if (/baujahr|wohnfläche|hausdaten|anlagen/.test(q)) matches.push('house');
  if (/wartung|pflege/.test(q)) matches.push('maintenance');
  return matches.length === 1 ? matches[0] : matches.length > 1 ? 'clarify' : null;
}
