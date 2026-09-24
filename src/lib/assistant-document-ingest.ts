import { db } from './db';
import { logSecurityEvent } from './security/audit';
import { primaryProperty } from './properties';
import { enqueueDocumentIntelligence, processDocumentIntelligenceSource } from './document-intelligence';
import { recordHausmeisterDocumentUpload } from './orchestrator';
import { savePrivateFile } from './security/private-files';

export type AssistantDocumentUploadResult = { ok: boolean; reply: string; documentId?: number };

/** Dokument (PDF/Bild) in die bestehende Hausakte-Pipeline geben:
 *  private Ablage unter der privaten Wurzel, Eintrag in house_documents,
 *  Texterkennung/Klassifizierung (Laya-Dokumententscheid mit deterministischem
 *  Fallback) und eine ehrliche Textantwort fuer den Chat. Alles tenant-sicher
 *  auf den uebergbenen Owner; das File verlaesst niemals die private Wurzel.
 */
export async function storeAssistantDocument(userId: number, document: File, description = ''): Promise<AssistantDocumentUploadResult> {
  let stored: string;
  try { stored = await savePrivateFile(document, 'house-documents'); }
  catch {
    logSecurityEvent('security_validation_reject', 'hausmeister_document', 'invalid_document');
    return { ok: false, reply: 'Das Dokument konnte nicht sicher übernommen werden. Bitte nutze PDF oder ein Bild bis 12 MB.' };
  }
  const property = primaryProperty(userId);
  const title = (document.name || 'Dokument').slice(0, 180);
  const inserted = db.prepare(`INSERT INTO house_documents(homeowner_id,property_id,title,path,kind) VALUES(?,?,?,?,'other')`).run(userId, property?.id ?? null, title, stored);
  const documentId = Number(inserted.lastInsertRowid);
  enqueueDocumentIntelligence({ homeownerId: userId, sourceType: 'house_document', sourceId: documentId, storedPath: stored, originalName: title, mimeType: document.type });
  const analysis = await processDocumentIntelligenceSource(userId, 'house_document', documentId);
  const labels: Record<string, string> = { invoice: 'Rechnung', offer: 'Angebot', contract: 'Vertrag', warranty: 'Garantie', maintenance: 'Wartungsunterlage', report: 'Beleg oder Bericht', insurance: 'Versicherungsunterlage', energy: 'Energieunterlage', other: 'Dokument' };
  let reply: string;
  if (analysis?.status === 'done') {
    const date = analysis.relevantDate ? ` Als relevantes Datum habe ich ${analysis.relevantDate.split('-').reverse().join('.')} erkannt – bitte kurz prüfen.` : '';
    const excerpt = description && analysis.searchText ? analysis.searchText.replace(/\s+/g, ' ').trim().slice(0, 700) : '';
    const content = excerpt ? ` Aus dem Dokument konnte ich u. a. lesen: „${excerpt}${analysis.searchText.length > 700 ? ' …' : ''}“` : '';
    reply = `Ich habe „${title}“ sicher in deiner Hausakte gespeichert und als ${labels[analysis.kind] || 'Dokument'} erkannt.${date}${content} Du kannst mich weiter dazu fragen oder es unter „Dokumente“ öffnen.`;
  } else if (analysis?.status === 'review') {
    reply = `Ich habe „${title}“ sicher in deiner Hausakte gespeichert. Die automatische Texterkennung oder Zuordnung war nicht eindeutig genug; das Dokument ist deshalb zur kurzen Prüfung markiert. Es geht dabei nichts verloren.`;
  } else {
    reply = `Ich habe „${title}“ sicher in deiner Hausakte gespeichert. Die automatische Auswertung konnte gerade nicht abgeschlossen werden und bleibt für die erneute Verarbeitung vorgemerkt.`;
  }
  recordHausmeisterDocumentUpload(userId, { documentId, name: title, question: description, reply });
  return { ok: true, reply, documentId };
}
