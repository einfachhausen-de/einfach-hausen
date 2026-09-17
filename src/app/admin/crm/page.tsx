import { ArrowLeft, Database, Globe2, Mail, MessageCircle, Phone } from 'lucide-react';
import { requireAdmin } from '@/lib/admin-auth';
import { CRM_LEAD_TYPES, CRM_PERMISSIONS, CRM_SOURCES, CRM_STATUSES, crmCategories, crmStats, listCrmLeads, syncCrmLifecycle } from '@/lib/crm';
import { addCrmLeadAction, syncBusinessResearchAction, updateCrmLeadAction } from './actions';
import { EHActions, EHButton, EHCallout, EHEmptyState, EHField, EHFieldGrid, EHFormFeedback, EHFormSection, EHInput, EHMetricsBar, EHPageHeader, EHRecordList, EHScope, EHSection, EHSelect, EHStatus, EHText, EHTextarea, EHWorkSection, EHWorkspaceGrid, EHWorkflowForm, EHWorkflowStack } from '@/design-system';

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
      <main>
        <EHSection compact>
          <EHWorkflowStack>
            <EHActions>
              <EHButton href="/admin" variant="quiet" size="small"><ArrowLeft size={16} /> Zurück zur Betriebsverwaltung</EHButton>
            </EHActions>

            <EHPageHeader
              title="Leads & Outreach CRM"
              context="Betriebsverwaltung"
              actions={
                <form action={syncBusinessResearchAction}>
                  <EHButton type="submit"><Database size={16} /> Research-Daten synchronisieren</EHButton>
                </form>
              }
            />

            {feedback && <EHFormFeedback kind={sp.error ? 'error' : 'success'}>{feedback}</EHFormFeedback>}

            <EHMetricsBar label="Leads und Outreach" items={[
              { id: 'gesamt', label: 'Leads gesamt', value: compact(stats.total), hint: `${result.total.toLocaleString('de-DE')} in dieser Auswahl` },
              { id: 'faellig', label: 'Fällige Folgekontakte', value: compact(stats.dueFollowUps), hint: 'heute oder überfällig' },
              { id: 'antworten', label: 'Antworten', value: compact(statusCount('replied')), hint: `${statusCount('qualified')} qualifiziert` },
              { id: 'konten', label: 'Plattformkonten', value: compact(statusCount('converted')), hint: `${statusCount('invited')} eingeladen` },
            ]} />

            <EHWorkspaceGrid main={<>
              <EHWorkSection title="Leads filtern">
                <EHWorkflowForm action="/admin/crm">
                  <EHFieldGrid>
                    <EHField id="filter-suche" label="Suche">
                      <EHInput id="filter-suche" name="q" defaultValue={sp.q || ''} placeholder="Firma, Ort, PLZ, E-Mail …" />
                    </EHField>
                    <EHField id="filter-typ" label="Leadtyp">
                      <EHSelect id="filter-typ" name="type" defaultValue={sp.type || ''}>
                        <option value="">Alle Leadtypen</option>
                        {CRM_LEAD_TYPES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                      </EHSelect>
                    </EHField>
                    <EHField id="filter-status" label="Status">
                      <EHSelect id="filter-status" name="status" defaultValue={sp.status || ''}>
                        <option value="">Alle Status</option>
                        {CRM_STATUSES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                      </EHSelect>
                    </EHField>
                    <EHField id="filter-gewerk" label="Gewerk">
                      <EHSelect id="filter-gewerk" name="category" defaultValue={sp.category || ''}>
                        <option value="">Alle Gewerke</option>
                        {categories.map(x => <option key={x.category} value={x.category}>{x.category} · {compact(x.count)}</option>)}
                      </EHSelect>
                    </EHField>
                    <EHField id="filter-folge" label="Folgetermin">
                      <EHSelect id="filter-folge" name="followup" defaultValue={sp.followup || ''}>
                        <option value="">Alle Folgetermine</option>
                        <option value="due">Heute / überfällig</option>
                        <option value="scheduled">Geplant</option>
                        <option value="none">Ohne Folgetermin</option>
                      </EHSelect>
                    </EHField>
                    <div><EHButton type="submit">Filtern</EHButton></div>
                  </EHFieldGrid>
                </EHWorkflowForm>
              </EHWorkSection>

              <EHWorkSection title="Leads">
                <EHActions>
                  <EHText size="meta" muted>{result.total.toLocaleString('de-DE')} Treffer · Seite {result.page} von {result.pages}</EHText>
                  {result.page > 1 && <EHButton href={pageHref(result.page - 1)} variant="secondary" size="small">Zurück</EHButton>}
                  {result.page < result.pages && <EHButton href={pageHref(result.page + 1)} variant="secondary" size="small">Weiter</EHButton>}
                </EHActions>

                {result.rows.length === 0
                  ? <EHEmptyState title="Keine Leads für diese Filter" text="Suche oder Filter anpassen, um wieder Einträge zu sehen." />
                  : <EHWorkflowStack>
                    {result.rows.map(lead => {
                      const canContact = ['allowed', 'consented'].includes(lead.contact_permission) && lead.status !== 'do_not_contact';
                      const place = [lead.address, lead.postcode, lead.locality].filter(Boolean).join(' ');
                      return (
                        <EHWorkflowForm key={lead.id} action={updateCrmLeadAction.bind(null, lead.id)}>
                          <EHFormSection title={lead.company_name || lead.name} description={[lead.category, place].filter(Boolean).join(' · ') || 'Ort nicht hinterlegt'}>
                            <EHActions>
                              <EHStatus tone={lead.lead_type === 'provider' ? 'info' : 'neutral'}>{labels[lead.lead_type] || lead.lead_type}</EHStatus>
                              <EHStatus tone={leadTone(lead.status)}>{labels[lead.status] || lead.status}</EHStatus>
                              {lead.next_follow_up_at && <EHStatus tone="warning">Folgekontakt {new Date(`${lead.next_follow_up_at}T12:00:00`).toLocaleDateString('de-DE')}</EHStatus>}
                              {lead.converted_user_id && <EHStatus tone="success">Plattformkonto aktiv</EHStatus>}
                            </EHActions>

                            <EHActions>
                              {lead.email && (canContact
                                ? <EHButton href={`mailto:${lead.email}`} variant="quiet" size="small"><Mail size={14} />{lead.email}</EHButton>
                                : <EHText size="meta" muted><Mail size={14} /> {lead.email}</EHText>)}
                              {lead.phone && (canContact
                                ? <EHButton href={`tel:${lead.phone}`} variant="quiet" size="small"><Phone size={14} />{lead.phone}</EHButton>
                                : <EHText size="meta" muted><Phone size={14} /> {lead.phone}</EHText>)}
                              {lead.website && <EHButton href={lead.website} variant="quiet" size="small"><Globe2 size={14} />Webseite</EHButton>}
                              {lead.profile_url && <EHButton href={lead.profile_url} variant="quiet" size="small"><MessageCircle size={14} />Profil</EHButton>}
                            </EHActions>

                            <EHText size="meta" muted>Quelle: {labels[lead.source_type] || lead.source_type}{lead.source_detail ? ` · ${lead.source_detail}` : ''}</EHText>

                            <EHFieldGrid>
                              <EHField id={`lead-status-${lead.id}`} label="Status">
                                <EHSelect id={`lead-status-${lead.id}`} name="status" defaultValue={lead.status}>
                                  {CRM_STATUSES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                                </EHSelect>
                              </EHField>
                              <EHField id={`lead-freigabe-${lead.id}`} label="Kontaktfreigabe">
                                <EHSelect id={`lead-freigabe-${lead.id}`} name="permission" defaultValue={lead.contact_permission}>
                                  {CRM_PERMISSIONS.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                                </EHSelect>
                              </EHField>
                              <EHField id={`lead-quelle-${lead.id}`} label="Quelle">
                                <EHSelect id={`lead-quelle-${lead.id}`} name="sourceType" defaultValue={lead.source_type}>
                                  {CRM_SOURCES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                                </EHSelect>
                              </EHField>
                              <EHField id={`lead-quelldetail-${lead.id}`} label="Quellendetail">
                                <EHInput id={`lead-quelldetail-${lead.id}`} name="sourceDetail" defaultValue={lead.source_detail || ''} />
                              </EHField>
                              <EHField id={`lead-folge-${lead.id}`} label="Folgekontakt">
                                <EHInput id={`lead-folge-${lead.id}`} name="nextFollowUpAt" type="date" defaultValue={lead.next_follow_up_at || ''} disabled={lead.status === 'do_not_contact' || lead.contact_permission === 'do_not_contact'} />
                              </EHField>
                              <EHField id={`lead-kanal-${lead.id}`} label="Kanal">
                                <EHSelect id={`lead-kanal-${lead.id}`} name="channel" defaultValue="">
                                  <option value="">Keiner</option>
                                  <option value="email">E-Mail</option>
                                  <option value="phone">Telefon</option>
                                  <option value="social">Social</option>
                                  <option value="website">Website</option>
                                  <option value="other">Sonstiges</option>
                                </EHSelect>
                              </EHField>
                            </EHFieldGrid>

                            <EHField id={`lead-notiz-${lead.id}`} label="Notiz">
                              <EHInput id={`lead-notiz-${lead.id}`} name="notes" defaultValue={lead.notes || ''} placeholder="z. B. Rückruf vereinbart" />
                            </EHField>
                            <div><EHButton type="submit">Änderungen speichern</EHButton></div>
                          </EHFormSection>
                        </EHWorkflowForm>
                      );
                    })}
                  </EHWorkflowStack>}
              </EHWorkSection>
            </>} aside={<>
              <EHWorkSection title="Lead erfassen">
                <EHWorkflowForm action={addCrmLeadAction}>
                  <EHFormSection title="Neuer Lead">
                    <EHFieldGrid>
                      <EHField id="neu-typ" label="Leadtyp">
                        <EHSelect id="neu-typ" name="leadType" defaultValue="provider">
                          {CRM_LEAD_TYPES.map(x => <option key={x} value={x}>{labels[x]}</option>)}
                        </EHSelect>
                      </EHField>
                      <EHField id="neu-quelle" label="Quelle">
                        <EHSelect id="neu-quelle" name="sourceType" defaultValue="manual">
                          {CRM_SOURCES.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                        </EHSelect>
                      </EHField>
                    </EHFieldGrid>
                    <EHField id="neu-name" label="Name / Ansprechpartner" required>
                      <EHInput id="neu-name" name="name" required minLength={2} placeholder="Vor- und Nachname" />
                    </EHField>
                    <EHField id="neu-firma" label="Firma (optional)">
                      <EHInput id="neu-firma" name="companyName" placeholder="Firmenname" />
                    </EHField>
                    <EHField id="neu-gewerk" label="Gewerk / Kernkompetenz">
                      <EHInput id="neu-gewerk" name="category" placeholder="z. B. Sanitär" />
                    </EHField>
                    <EHFieldGrid>
                      <EHField id="neu-plz" label="PLZ">
                        <EHInput id="neu-plz" name="postcode" placeholder="PLZ" />
                      </EHField>
                      <EHField id="neu-ort" label="Ort">
                        <EHInput id="neu-ort" name="locality" placeholder="Ort" />
                      </EHField>
                    </EHFieldGrid>
                    <input type="hidden" name="country" value="DE" />
                    <EHField id="neu-email" label="E-Mail">
                      <EHInput id="neu-email" name="email" type="email" placeholder="name@beispiel.de" />
                    </EHField>
                    <EHField id="neu-telefon" label="Telefon">
                      <EHInput id="neu-telefon" name="phone" placeholder="Telefonnummer" />
                    </EHField>
                    <EHField id="neu-webseite" label="Website">
                      <EHInput id="neu-webseite" name="website" placeholder="https://" />
                    </EHField>
                    <EHField id="neu-profil" label="Profil URL">
                      <EHInput id="neu-profil" name="profileUrl" placeholder="https://" />
                    </EHField>
                    <EHField id="neu-kampagne" label="Quelle / Kampagne">
                      <EHInput id="neu-kampagne" name="sourceDetail" placeholder="z. B. Facebook-Gruppe" />
                    </EHField>
                    <EHField id="neu-folge" label="Folgekontakt">
                      <EHInput id="neu-folge" name="nextFollowUpAt" type="date" />
                    </EHField>
                    <EHField id="neu-freigabe" label="Kontaktfreigabe">
                      <EHSelect id="neu-freigabe" name="permission" defaultValue="unknown">
                        {CRM_PERMISSIONS.map(x => <option key={x} value={x}>{labels[x] || x}</option>)}
                      </EHSelect>
                    </EHField>
                    <EHField id="neu-notiz" label="Notiz">
                      <EHTextarea id="neu-notiz" name="notes" rows={3} placeholder="Interesse, Status, nächste Vereinbarung …" />
                    </EHField>
                    <EHActions><EHButton type="submit">Lead speichern</EHButton></EHActions>
                  </EHFormSection>
                </EHWorkflowForm>
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
          </EHWorkflowStack>
        </EHSection>
      </main>
    </EHScope>
  );
}
