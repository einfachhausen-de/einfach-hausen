import { CalendarClock, Mail, MessageCircle, Phone, Settings, UserCheck } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { getSupportContacts } from '@/config/contacts';
import {
  EHButton, EHMetricsBar, EHPageHeader, EHRecordList, EHStatus, EHText, EHWorkSection,
  EHWorkspaceGrid, type EHRecordEntry,
} from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getProviderContext } from '@/lib/provider';

/**
 * Die Bereiche, die auf dieser Seite nicht schon in der Seitenleiste oder in
 * den Tabs des Profil-Bereichs stehen. Alles andere wäre eine zweite
 * Beschriftung für dasselbe Ziel.
 */
const AREAS: EHRecordEntry[] = [
  { id: 'termine', title: 'Termine', icon: <CalendarClock size={20} />, href: '/pro/calendar' },
  { id: 'leads', title: 'Freigegebene Kontakte', icon: <UserCheck size={20} />, href: '/pro/leads' },
  { id: 'onboarding', title: 'Einrichtung', icon: <Settings size={20} />, href: '/pro/onboarding' },
];

/**
 * Die Fragen, die den Partneralltag aufhalten. Jede Antwort beschreibt nur,
 * was die App bereits tut - dieselbe Zusage wie im Profil, keine zweite.
 */
const TOPICS: EHRecordEntry[] = [
  { id: 'anfragen', title: 'Warum kommen keine neuen Anfragen an?', detail: 'Anfragen gibt es nur bei geprüfter Unternehmensprüfung, aktivem Partnervertrag und vollständig bestätigten Qualitätschecks.' },
  { id: 'zugang', title: 'Wie bekommt ein Ansprechpartner eigenen Zugang?', detail: 'Jede Person im Betrieb bekommt einen eigenen App-Zugang. Wer neue Aufträge annehmen und verteilen darf, entscheidet die Betriebsleitung.' },
  { id: 'vorgang', title: 'Wie wird aus einem Kontakt ein Auftrag?', detail: 'Übernommene Kontakte und gesendete Angebote stehen als Vorgang unter Aufträge.' },
  { id: 'termin', title: 'Wie verschiebe ich einen Termin?', detail: 'Termine hängen am Vorgang. Betriebstermine und eigene Termine stehen im Kalender.' },
  { id: 'kosten', title: 'Was kostet die Teilnahme?', detail: 'Keine Provision pro Auftrag. Die Partner-Tarife stehen im Profilbereich.' },
];

/** Zielzeit aus dem Partnervertrag; dort ist sie in Minuten hinterlegt. */
function responseTarget(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '–';
  return minutes >= 60 ? `${Math.round(minutes / 60)} Std.` : `${minutes} Min.`;
}

export default async function ProHilfe() {
  const u = await requireUser('provider');
  // Die Kontaktwege sind Konfiguration, keine Behauptung: was nicht hinterlegt
  // ist, wird auch nicht angeboten.
  const contacts = getSupportContacts();
  const channelItems: EHRecordEntry[] = [];
  if (contacts.email) channelItems.push({ id: 'email', title: 'E-Mail schreiben', detail: contacts.email.label, icon: <Mail size={20} />, href: contacts.email.href });
  if (contacts.phone) channelItems.push({ id: 'telefon', title: 'Anrufen', detail: contacts.phone.label, icon: <Phone size={20} />, href: contacts.phone.href });
  if (contacts.whatsapp) channelItems.push({ id: 'whatsapp', title: 'WhatsApp', detail: contacts.whatsapp.label, icon: <MessageCircle size={20} />, href: contacts.whatsapp.href });
  const channelNames = [contacts.email && 'E-Mail', contacts.phone && 'Telefon', contacts.whatsapp && 'WhatsApp'].filter(Boolean).join(' · ');
  const ctx = getProviderContext(u.id);
  const contract = ctx
    ? (db.prepare('SELECT response_target_minutes FROM partner_contracts WHERE provider_id=?').get(ctx.providerId) as { response_target_minutes: number | null } | undefined)
    : undefined;
  const target = contract?.response_target_minutes ?? null;
  return (
    <AppShell role="provider" active="/pro/hilfe" title="Hilfe">
      <EHPageHeader title="Hilfe" />
      <EHMetricsBar label="Hilfe" items={[
        { id: 'themen', label: 'Hilfethemen', value: TOPICS.length, hint: 'häufige Fragen dieser Seite' },
        { id: 'bereiche', label: 'Bereiche', value: AREAS.length, hint: 'weitere Bereiche verlinkt' },
        { id: 'kontaktwege', label: 'Kontaktwege', value: channelItems.length, hint: channelNames || 'kein Direktkanal hinterlegt' },
        { id: 'reaktionsziel', label: 'Reaktionsziel', value: responseTarget(target), hint: target ? 'laut Partnervertrag' : 'im Partnervertrag nicht hinterlegt' },
      ]} />
      <EHWorkspaceGrid main={
        <EHWorkSection title="Weitere Bereiche">
          <EHRecordList label="Weitere Bereiche" items={AREAS} />
        </EHWorkSection>
      } aside={<>
        <EHWorkSection title="Direkter Kontakt">
          <EHStatus tone={channelItems.length > 0 ? 'success' : 'neutral'}>{channelItems.length > 0 ? 'Direktkanal hinterlegt' : 'Kein Direktkanal hinterlegt'}</EHStatus>
          <EHText muted>{channelItems.length > 0
            ? 'Der kürzeste Weg bei Fragen zum Partnerzugang. Rückfragen zu einem laufenden Vorgang gehören weiter an den Auftrag.'
            : 'Für den Partnerbereich ist noch kein Support-Kanal hinterlegt. Rückfragen zu einem Vorgang laufen über die Nachrichten am Auftrag.'}</EHText>
          <EHRecordList label="Support-Kanäle" items={channelItems} empty="Noch kein Support-Kanal hinterlegt." />
          <EHButton href="/pro/messages" variant="secondary" arrow>Nachrichten am Auftrag</EHButton>
        </EHWorkSection>
        <EHWorkSection title="Häufige Fragen">
          <EHRecordList label="Häufige Fragen" items={TOPICS} />
        </EHWorkSection>
        <EHWorkSection title="Betriebs-Einstellungen">
          <EHText muted>Firmendaten, Leistungen, Arbeitsgebiet und Teamzugänge pflegst du im Profil. Dort steht auch der Stand der Nachweise und des Partnervertrags.</EHText>
          <EHButton href="/pro/profile" variant="secondary" arrow>Profil &amp; Einstellungen</EHButton>
        </EHWorkSection>
      </>} />
    </AppShell>
  );
}
