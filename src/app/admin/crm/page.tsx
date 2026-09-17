import { ArrowLeft, Database, Globe2, Mail, MessageCircle, Phone } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { CRM_LEAD_TYPES, CRM_PERMISSIONS, CRM_SOURCES, CRM_STATUSES, crmCategories, crmStats, listCrmLeads, syncCrmLifecycle } from '@/lib/crm';
import { addCrmLeadAction, syncBusinessResearchAction, updateCrmLeadAction } from './actions';
import { EHAppHeader, EHButton, EHCallout, EHEmptyState, EHMetricsBar, EHRecordList, EHScope, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid } from '@/design-system';

const labels: Record<string, string> = {
  collected: 'Gesammelt',
  contact_ready: 'Kontakt bereit',
  contacted: 'Kontaktiert',
  replied: 'Geantwortet',
  qualified: 'Qualifiziert',
  invited: 'Eingeladen',
  converted: 'Konvertiert',
  not_interested: 'Kein Interesse',
  invalid: 'Ungültig',
  do_not_contact: 'Nicht kontaktieren',
  unknown: 'Ungeklärt',
  allowed: 'Erlaubt',
  consented: 'Einwilligung',
  denied: 'Nicht erlaubt',
  provider: 'Handwerker / Partner',
  homeowner: 'Eigentümer',
  public_intent: 'Öffentliches Bedarfssignal',
  property: 'Objektchance',
  other: 'Sonstiger Lead',
  business_research: 'SIN Business Research',
  business_research_intent: 'Öffentliches Intent-Signal',
  business_research_property: 'Offene Gebäudedaten',
  website: 'Website',
  referral: 'Empfehlung',
  facebook_group: 'Facebook-Gruppe',
  forum: 'Forum',
  community: 'Community',
  campaign: 'Kampagne',
  manual: 'Manuell',
  existing_customer: 'Bestandskunde'
};

const compact = (n: number) => new Intl.NumberFormat('de-DE', { notation: n > 9999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);

/** Der Zustand eines Leads reist als ARIA-taugliche Statusfarbe, nicht als Klasse. */
function leadTone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'error' {
  if (status === 'converted') return 'success';
  if (status === 'replied' || status === 'qualified' || status === 'invited') return 'info';
  if (status === 'do_not_contact' || status === 'invalid') return 'error';
  if (status === 'not_interested') return 'warning';
  return 'neutral';
}

export default async function CrmPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Number(sp.page || 1) || 1;
  syncCrmLifecycle();
  const stats = crmStats();
  const result = listCrmLeads({ q: sp.q, status: sp.status, type: sp.type, category: sp.category, followup: sp.followup, page, limit: 60 });
  const categories = crmCategories();

  // Dieselbe Quelle wie die Liste darunter: die Kennzahl zaehlt die Zeilen der Pipeline.
  const statusCount = (status: string) => stats.byStatus.find(x => x.status === status)?.count || 0;
  const feedback = sp.error
    ? (sp.error === 'contact-permission'
      ? 'Kontaktaktionen erfordern ausdrückliche Freigabe. „Nicht kontaktieren“ darf keinen Folgetermin haben.'
      : 'Aktion fehlgeschlagen. Bitte Eingaben prüfen.')
    : sp.sync
      ? `${sp.sync} neue Datensätze importiert, ${sp.updated || 0} aktualisiert.`
      : sp.updated
        ? 'Lead aktualisiert.'
        : sp.created
          ? 'Lead erfolgreich angelegt.'
          : '';

  const pageHref = (next: number) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([key, value]) => { if (value) params.set(key, value); });
    params.set('page', String(next));
    return `/admin/crm?${params.toString()}`;
  };

  return (
    <EHScope app>
      <main className="admin-page">
        <div className="mb-4">
          <EHButton href="/admin" variant="quiet" size="small"><ArrowLeft size={16} /> Zurück zur Betriebsverwaltung</EHButton>
        </div>

        <EHAppHeader
          eyebrow="Betriebsverwaltung"
          title="Leads & Outreach CRM"
          text="Pipeline für Handwerkspartner, Eigentümer-Anfragen und Marktpotenziale."
          actions={
            <form action={syncBusinessResearchAction}>
              <EHButton type="submit"><Database size={16} /> Research-Daten synchronisieren</EHButton>
            </form>
          }
        />

        {feedback && (
          <div className="mb-6">
            <div className={sp.error ? 'alert error' : 'alert success'} role={sp.error ? 'alert' : 'status'}>{feedback}</div>
          </div>
        )}

        <div className="mb-6">
          <EHMetricsBar label="Leads und Outreach" items={[
            { id: 'gesamt', label: 'Leads gesamt', value: compact(stats.total), hint: `${result.total.toLocaleString('de-DE')} in dieser Auswahl` },
            { id: 'faellig', label: 'Fällige Folgekontakte', value: compact(stats.dueFollowUps), hint: 'heute oder überfällig' },
            { id: 'antworten', label: 'Antworten', value: compact(statusCount('replied')), hint: `${statusCount('qualified')} qualifiziert` },
            { id: 'konten', label: 'Plattformkonten', value: compact(statusCount('converted')), hint: `${statusCount('invited')} eingeladen` },
          ]} />
        </div>

        <div className="mb-6">
          <form method="get" className="admin-card grid gap-3 bg-[color:var(--eh-color-white)] md:grid-cols-2 xl:grid-cols-6">
            <label>Suche
              <input name="q" defaultValue={sp.q || ''} placeholder="Firma, Ort, PLZ, E-Mail …" />
            </label>
            <label>Leadtyp
              <select name="type" defaultValue={sp.type || ''}>
                <option value="">Alle Leadtypen</option>
                {CRM_LEAD_TYPES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
              </select>
            </label>
            <label>Status
              <select name="status" defaultValue={sp.status || ''}>
                <option value="">Alle Status</option>
                {CRM_STATUSES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
              </select>
            </label>
            <label>Gewerk
              <select name="category" defaultValue={sp.category || ''}>
                <option value="">Alle Gewerke</option>
                {categories.map(x => <option key={x.category} value={x.category}>{x.category} · {compact(x.count)}</option>)}
              </select>
            </label>
            <label>Folgetermin
              <select name="followup" defaultValue={sp.followup || ''}>
                <option value="">Alle Folgetermine</option>
                <option value="due">Heute / überfällig</option>
                <option value="scheduled">Geplant</option>
                <option value="none">Ohne Folgetermin</option>
              </select>
            </label>
            <div className="flex items-end">
              <EHButton type="submit">Filtern</EHButton>
            </div>
          </form>
        </div>

        <EHWorkspaceGrid main={
          <EHWorkSection title="Leads">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <EHText size="meta" muted>{result.total.toLocaleString('de-DE')} Treffer · Seite {result.page} von {result.pages}</EHText>
              <div className="flex flex-wrap gap-2">
                {result.page > 1 && <EHButton href={pageHref(result.page - 1)} variant="secondary" size="small">Zurück</EHButton>}
                {result.page < result.pages && <EHButton href={pageHref(result.page + 1)} variant="secondary" size="small">Weiter</EHButton>}
              </div>
            </div>

            {result.rows.length === 0
              ? <EHEmptyState title="Keine Leads für diese Filter" text="Suche oder Filter anpassen, um wieder Einträge zu sehen." />
              : <div className="stack">
                {result.rows.map(lead => {
                  const canContact = ['allowed', 'consented'].includes(lead.contact_permission) && lead.status !== 'do_not_contact';
                  const place = [lead.address, lead.postcode, lead.locality].filter(Boolean).join(' ');
                  return (
                    <article key={lead.id} className="admin-card grid gap-4 bg-[color:var(--eh-color-white)] lg:grid-cols-[minmax(240px,1fr)_minmax(300px,1fr)]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <EHStatus tone={lead.lead_type === 'provider' ? 'info' : 'neutral'}>{labels[lead.lead_type] || lead.lead_type}</EHStatus>
                          <EHStatus tone={leadTone(lead.status)}>{labels[lead.status] || lead.status}</EHStatus>
                        </div>

                        <p className="mt-2 truncate text-base font-bold">{lead.company_name || lead.name}</p>
                        <div className="mt-1">
                          <EHText size="meta" muted>{[lead.category, place].filter(Boolean).join(' · ') || 'Ort nicht hinterlegt'}</EHText>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                          {lead.email && (canContact ? (
                            <a className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--eh-color-petrol)] underline" href={`mailto:${lead.email}`}><Mail size={14} />{lead.email}</a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[color:var(--eh-muted)]"><Mail size={14} />{lead.email}</span>
                          ))}
                          {lead.phone && (canContact ? (
                            <a className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--eh-color-petrol)] underline" href={`tel:${lead.phone}`}><Phone size={14} />{lead.phone}</a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[color:var(--eh-muted)]"><Phone size={14} />{lead.phone}</span>
                          ))}
                          {lead.website && (
                            <a className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--eh-color-petrol)] underline" href={lead.website} target="_blank" rel="noreferrer"><Globe2 size={14} />Webseite</a>
                          )}
                          {lead.profile_url && (
                            <a className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--eh-color-petrol)] underline" href={lead.profile_url} target="_blank" rel="noreferrer"><MessageCircle size={14} />Profil</a>
                          )}
                        </div>

                        <div className="mt-3">
                          <EHText size="meta" muted>Quelle: {labels[lead.source_type] || lead.source_type}{lead.source_detail ? ` · ${lead.source_detail}` : ''}</EHText>
                        </div>
                        {lead.next_follow_up_at && (
                          <div className="mt-2">
                            <EHStatus tone="warning">Folgekontakt {new Date(`${lead.next_follow_up_at}T12:00:00`).toLocaleDateString('de-DE')}</EHStatus>
                          </div>
                        )}
                        {lead.converted_user_id && (
                          <div className="mt-2">
                            <EHStatus tone="success">Plattformkonto aktiv</EHStatus>
                          </div>
                        )}
                      </div>

                      <form action={updateCrmLeadAction.bind(null, lead.id)} className="admin-card grid gap-3 bg-[color:var(--eh-color-paper)] md:grid-cols-2">
                        <label>Status
                          <select name="status" defaultValue={lead.status}>
                            {CRM_STATUSES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                          </select>
                        </label>
                        <label>Kontaktfreigabe
                          <select name="permission" defaultValue={lead.contact_permission}>
                            {CRM_PERMISSIONS.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                          </select>
                        </label>
                        <label>Quelle
                          <select name="sourceType" defaultValue={lead.source_type}>
                            {CRM_SOURCES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                          </select>
                        </label>
                        <label>Quellendetail
                          <input name="sourceDetail" defaultValue={lead.source_detail || ''} />
                        </label>
                        <label>Folgekontakt
                          <input name="nextFollowUpAt" type="date" defaultValue={lead.next_follow_up_at || ''} disabled={lead.status === 'do_not_contact' || lead.contact_permission === 'do_not_contact'} />
                        </label>
                        <label>Kanal
                          <select name="channel" defaultValue="">
                            <option value="">Keiner</option>
                            <option value="email">E-Mail</option>
                            <option value="phone">Telefon</option>
                            <option value="social">Social</option>
                            <option value="website">Website</option>
                            <option value="other">Sonstiges</option>
                          </select>
                        </label>
                        <label className="md:col-span-2">Notiz
                          <input name="notes" defaultValue={lead.notes || ''} placeholder="z. B. Rückruf vereinbart" />
                        </label>
                        <div className="md:col-span-2"><EHButton type="submit">Änderungen speichern</EHButton></div>
                      </form>
                    </article>
                  );
                })}
              </div>}
          </EHWorkSection>
        } aside={<>
          <EHWorkSection title="Lead erfassen">
            <form action={addCrmLeadAction} className="grid gap-3">
              <div className="two">
                <label>Leadtyp
                  <select name="leadType" defaultValue="provider">
                    {CRM_LEAD_TYPES.map(x => <option key={x} value={x}>{labels[x]}</option>)}
                  </select>
                </label>
                <label>Quelle
                  <select name="sourceType" defaultValue="manual">
                    {CRM_SOURCES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                  </select>
                </label>
              </div>
              <label>Name / Ansprechpartner
                <input name="name" required minLength={2} placeholder="Vor- und Nachname" />
              </label>
              <label>Firma (optional)
                <input name="companyName" placeholder="Firmenname" />
              </label>
              <label>Gewerk / Kernkompetenz
                <input name="category" placeholder="z. B. Sanitär" />
              </label>
              <div className="two">
                <label>PLZ
                  <input name="postcode" placeholder="PLZ" />
                </label>
                <label>Ort
                  <input name="locality" placeholder="Ort" />
                </label>
              </div>
              <input type="hidden" name="country" value="DE" />
              <label>E-Mail
                <input name="email" type="email" placeholder="name@beispiel.de" />
              </label>
              <label>Telefon
                <input name="phone" placeholder="Telefonnummer" />
              </label>
              <label>Website
                <input name="website" placeholder="https://" />
              </label>
              <label>Profil URL
                <input name="profileUrl" placeholder="https://" />
              </label>
              <label>Quelle / Kampagne
                <input name="sourceDetail" placeholder="z. B. Facebook-Gruppe" />
              </label>
              <label>Folgekontakt
                <input name="nextFollowUpAt" type="date" />
              </label>
              <label>Kontaktfreigabe
                <select name="permission" defaultValue="unknown">
                  {CRM_PERMISSIONS.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                </select>
              </label>
              <label>Notiz
                <textarea name="notes" rows={3} placeholder="Interesse, Status, nächste Vereinbarung …" />
              </label>
              <EHButton type="submit">Lead speichern</EHButton>
            </form>
          </EHWorkSection>

          <EHWorkSection title="Pipeline-Verteilung">
            <EHRecordList label="Leads nach Status" empty="Keine Leads vorhanden." items={stats.byStatus.map(x => ({
              id: `status-${x.status}`,
              title: labels[x.status] || x.status,
              value: x.count.toLocaleString('de-DE'),
            }))} />
          </EHWorkSection>

          <EHCallout title="Datenschutz & Kontaktfreigabe">
            <EHText>Jeder Datensatz trennt Recherche von Outreach. Direktkontakte sind nur bei expliziter Erlaubnis zulässig.</EHText>
          </EHCallout>
        </>} />
      </main>
    </EHScope>
  );
}
