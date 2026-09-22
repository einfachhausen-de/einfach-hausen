import { db } from './db';
import { AFFILIATE_PARTNERS, resolveAffiliate, type AffiliateCategory, type AffiliatePartner } from './affiliate';
import {
  cancellationDeadline, contractKindLabel, deadlineDays, estimateSavings,
  yearlyCents,
} from './contracts';
import { euroExact, statusLabel } from './format';
import { createNotification } from './notifications';

export type OwnerIntelligenceResult = { reply: string; links: Array<{ label: string; href: string }> };
export type OwnerInsight = {
  key: string;
  fingerprint: string;
  title: string;
  body: string;
  href: string;
  priority: number;
};

type ContractRow = {
  id: number;
  kind: string;
  provider: string;
  tariff: string;
  cost_amount: number | null;
  cost_interval: string;
  started_at: string | null;
  term_months: number | null;
  renewal_months: number | null;
  cancellation_days: number | null;
  cancellation_deadline: string | null;
};

type TariffOffer = {
  id: number;
  partner_id: string;
  category: AffiliateCategory;
  provider_name: string;
  tariff_name: string;
  annual_cents: number;
  postcode_prefix: string;
  source_ref: string;
  valid_from: string | null;
  valid_until: string | null;
};

const clean = (value: unknown, max = 160) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const berlinDay = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());

function assertOwner(userId: number) {
  if (!Number.isSafeInteger(userId) || userId <= 0 || !db.prepare("SELECT 1 FROM users WHERE id=? AND role='homeowner'").get(userId)) {
    throw new Error('owner_intelligence_forbidden');
  }
}

function ownerPostcode(userId: number): string {
  const row = db.prepare(`SELECT COALESCE(NULLIF(p.postcode,''),NULLIF(h.postcode,''),'') postcode
    FROM homeowner_profiles h
    LEFT JOIN property_ownerships o ON o.homeowner_id=h.user_id AND o.active=1 AND o.ended_at IS NULL
    LEFT JOIN properties p ON p.id=o.property_id
    WHERE h.user_id=? ORDER BY o.started_at DESC,o.id DESC LIMIT 1`).get(userId) as { postcode?: string } | undefined;
  return clean(row?.postcode, 12);
}

function activeContracts(userId: number, kind?: string | null): ContractRow[] {
  return db.prepare(`SELECT id,kind,provider,tariff,cost_amount,cost_interval,started_at,term_months,renewal_months,cancellation_days,cancellation_deadline
    FROM house_contracts WHERE homeowner_id=? AND status='active' AND (? IS NULL OR kind=?) ORDER BY updated_at DESC,id DESC`)
    .all(userId, kind ?? null, kind ?? null) as ContractRow[];
}

function offerMatchesPostcode(offer: TariffOffer, postcode: string) {
  const prefix = clean(offer.postcode_prefix, 12);
  return !prefix || (!!postcode && postcode.startsWith(prefix));
}

export type TariffOpportunity = {
  contract: ContractRow;
  offer: TariffOffer;
  currentAnnualCents: number | null;
  savingsAnnualCents: number | null;
  partnerName: string;
};

export function tariffOpportunities(
  userId: number,
  requestedKind?: AffiliateCategory | null,
  partners?: readonly AffiliatePartner[],
): TariffOpportunity[] {
  assertOwner(userId);
  const postcode = ownerPostcode(userId);
  const rows: TariffOpportunity[] = [];
  for (const contract of activeContracts(userId, requestedKind ?? null)) {
    if (!['strom', 'gas', 'dsl', 'mobilfunk', 'versicherung'].includes(contract.kind)) continue;
    const category = contract.kind as AffiliateCategory;
    const availability = resolveAffiliate(category, 'sparcheck', partners ? { partners } : {});
    if (availability.status !== 'available') continue;
    const offers = db.prepare(`SELECT id,partner_id,category,provider_name,tariff_name,annual_cents,postcode_prefix,source_ref,valid_from,valid_until
      FROM tariff_partner_offers
      WHERE active=1 AND category=? AND partner_id=?
        AND (valid_from IS NULL OR date(valid_from)<=date('now'))
        AND (valid_until IS NULL OR date(valid_until)>=date('now'))
      ORDER BY annual_cents ASC,id ASC LIMIT 100`).all(category, availability.partnerId) as TariffOffer[];
    const offer = offers.find((entry) => offerMatchesPostcode(entry, postcode));
    if (!offer) continue;
    const currentAnnualCents = yearlyCents(contract.cost_amount, contract.cost_interval);
    const savingsAnnualCents = currentAnnualCents == null ? null : currentAnnualCents - offer.annual_cents;
    rows.push({ contract, offer, currentAnnualCents, savingsAnnualCents, partnerName: availability.partnerName });
  }
  return rows.sort((a, b) => (b.savingsAnnualCents ?? -1) - (a.savingsAnnualCents ?? -1));
}


export type PartnerTariffOfferInput = {
  providerName:string;
  tariffName:string;
  annualCents:number;
  postcodePrefix?:string;
  sourceRef:string;
  validFrom?:string|null;
  validUntil?:string|null;
};

export function replacePartnerTariffOffers(
  input:{partnerId:string;category:AffiliateCategory;offers:PartnerTariffOfferInput[]},
  partners:readonly AffiliatePartner[]=AFFILIATE_PARTNERS,
):{replaced:number}{
  const availability=resolveAffiliate(input.category,'sparcheck',{partners});
  if(availability.status!=='available'||availability.partnerId!==input.partnerId)throw new Error('tariff_partner_not_approved');
  const date=(value:string|null|undefined)=>{
    if(value==null||value==='')return null;
    if(!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value))throw new Error('invalid_tariff_offer_date');
    return value;
  };
  const cleanOffers=input.offers.map(offer=>{
    const providerName=clean(offer.providerName,120),tariffName=clean(offer.tariffName,120),sourceRef=clean(offer.sourceRef,200);
    const postcodePrefix=clean(offer.postcodePrefix||'',5);
    if(!providerName||!tariffName||!sourceRef)throw new Error('invalid_tariff_offer_text');
    if(!Number.isSafeInteger(offer.annualCents)||offer.annualCents<0||offer.annualCents>100_000_000)throw new Error('invalid_tariff_offer_price');
    if(postcodePrefix&&!/^\d{1,5}$/.test(postcodePrefix))throw new Error('invalid_tariff_offer_postcode');
    const validFrom=date(offer.validFrom),validUntil=date(offer.validUntil);
    if(validFrom&&validUntil&&validFrom>validUntil)throw new Error('invalid_tariff_offer_window');
    return {providerName,tariffName,annualCents:offer.annualCents,postcodePrefix,sourceRef,validFrom,validUntil};
  });
  db.transaction(()=>{
    db.prepare('DELETE FROM tariff_partner_offers WHERE partner_id=? AND category=?').run(input.partnerId,input.category);
    const insert=db.prepare(`INSERT INTO tariff_partner_offers(partner_id,category,provider_name,tariff_name,annual_cents,postcode_prefix,source_ref,valid_from,valid_until,active,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP)`);
    for(const offer of cleanOffers)insert.run(input.partnerId,input.category,offer.providerName,offer.tariffName,offer.annualCents,offer.postcodePrefix,offer.sourceRef,offer.validFrom,offer.validUntil);
  }).immediate();
  return {replaced:cleanOffers.length};
}

function kindFromQuestion(question: string): AffiliateCategory | null {
  const q = question.toLocaleLowerCase('de-DE');
  if (/strom|elektriz/.test(q)) return 'strom';
  if (/\bgas\b/.test(q)) return 'gas';
  if (/dsl|internet|festnetz|glasfaser|kabel/.test(q)) return 'dsl';
  if (/mobilfunk|handyvertrag/.test(q)) return 'mobilfunk';
  if (/versicherung/.test(q)) return 'versicherung';
  return null;
}

export function compareOwnerTariffs(userId: number, question: string): OwnerIntelligenceResult {
  assertOwner(userId);
  const kind = kindFromQuestion(question);
  const contracts = activeContracts(userId, kind);
  if (!contracts.length) {
    return {
      reply: kind
        ? `Für ${contractKindLabel(kind)} ist noch kein aktiver Vertrag mit deinen Kosten hinterlegt. Trag ihn kurz ein; danach kann ich echte Partnerangebote dagegen prüfen.`
        : 'Für einen belastbaren Tarifvergleich brauche ich zuerst den passenden aktiven Vertrag mit deinen Kosten. Danach prüfe ich freigegebene Partnerangebote dagegen.',
      links: [{ label: 'Verträge & Tarife', href: '/app/contracts' }],
    };
  }
  const opportunities = tariffOpportunities(userId, kind);
  const better = opportunities.filter((entry) => (entry.savingsAnnualCents ?? 0) > 0);
  if (better.length) {
    const entry = better[0];
    return {
      reply: `${contractKindLabel(entry.contract.kind)}: In der freigegebenen Partnerdatenbank liegt aktuell ein günstigerer Kandidat vor: ${clean(entry.offer.provider_name)} · ${clean(entry.offer.tariff_name)} · ${euroExact(entry.offer.annual_cents)} pro Jahr. Gegen deine hinterlegten Kosten sind das rechnerisch ${euroExact(entry.savingsAnnualCents!)} weniger pro Jahr. Das ist noch kein Abschluss; Verfügbarkeit und Tarifdetails prüfst du vor deiner Entscheidung im Vergleich.`,
      links: [{ label: 'Tarifvergleich prüfen', href: `/app/contracts?tab=sparcheck&contract=${entry.contract.id}` }],
    };
  }
  const availableWithoutPrice = opportunities[0];
  if (availableWithoutPrice && availableWithoutPrice.currentAnnualCents == null) {
    return {
      reply: `${contractKindLabel(availableWithoutPrice.contract.kind)}: Es gibt ein freigegebenes Partnerangebot, aber deine aktuellen Jahreskosten fehlen. Deshalb behaupte ich nicht, dass es günstiger ist. Ergänze erst den Betrag, dann kann ich sauber vergleichen.`,
      links: [{ label: 'Vertrag ergänzen', href: `/app/contracts?tab=sparcheck&contract=${availableWithoutPrice.contract.id}` }],
    };
  }
  const primary = contracts[0];
  const availability = resolveAffiliate(primary.kind, 'sparcheck');
  const currentAnnual = yearlyCents(primary.cost_amount, primary.cost_interval);
  const estimate = estimateSavings({ kind: primary.kind, yearlyCents: currentAnnual, postcode: ownerPostcode(userId), householdSize: null, hasLoyaltyBonus: false, switchWilling: true });
  const estimateText = estimate && currentAnnual != null
    ? ` Der vorhandene regelbasierte Spar-Check sieht nur ein mögliches Potenzial von ungefähr ${euroExact(estimate.lowCents)} bis ${euroExact(estimate.highCents)} pro Jahr; das ist kein konkretes Angebot.`
    : '';
  return {
    reply: availability.status === 'available'
      ? `Für ${contractKindLabel(primary.kind)} ist ein Vergleichspartner freigegeben, aber in unserer lokalen Partner-Angebotsdatenbank liegt gerade kein passender, verifizierter Preis vor. Deshalb nenne ich keinen erfundenen „besseren Tarif“.${estimateText}`
      : `Für ${contractKindLabel(primary.kind)} ist aktuell kein freigegebener Vergleichspartner mit nutzbaren Angebotsdaten aktiv. Dein bestehender Vertrag bleibt unverändert.${estimateText}`,
    links: [{ label: 'Spar-Check öffnen', href: `/app/contracts?tab=sparcheck&contract=${primary.id}` }],
  };
}

export function compareOwnerQuotes(userId: number, question: string): OwnerIntelligenceResult {
  assertOwner(userId);
  const explicitId = Number(question.match(/(?:Auftrag\s*(?:#|Nr\.?\s*)?|#)(\d+)\b/i)?.[1]) || null;
  const job = explicitId
    ? db.prepare('SELECT id,title,status FROM jobs WHERE id=? AND homeowner_id=?').get(explicitId, userId)
    : db.prepare(`SELECT j.id,j.title,j.status FROM jobs j
        WHERE j.homeowner_id=? AND EXISTS(SELECT 1 FROM quotes q WHERE q.job_id=j.id AND q.status!='withdrawn')
        ORDER BY j.updated_at DESC,j.id DESC LIMIT 1`).get(userId);
  if (!job) return { reply: 'Ich finde bei deinen Aufträgen noch keine Angebote zum Vergleichen.', links: [{ label: 'Aufträge', href: '/app/jobs' }] };
  const j = job as { id: number; title: string; status: string };
  const quotes = db.prepare(`SELECT q.id,q.amount,q.available_at,q.status,p.business_name,p.rating,p.rating_count,d.distance_km
    FROM quotes q JOIN provider_profiles p ON p.user_id=q.provider_id
    LEFT JOIN job_dispatches d ON d.job_id=q.job_id AND d.provider_id=q.provider_id
    WHERE q.job_id=? AND q.status!='withdrawn' ORDER BY q.amount ASC,q.id ASC LIMIT 10`).all(j.id) as Array<Record<string, unknown>>;
  if (!quotes.length) return { reply: `Für „${clean(j.title)}“ ist noch kein Angebot eingegangen.`, links: [{ label: 'Auftrag öffnen', href: `/app/jobs/${j.id}` }] };
  const cheapest = quotes[0];
  const dated = quotes.filter((q) => q.available_at && !Number.isNaN(new Date(String(q.available_at)).getTime()))
    .sort((a, b) => new Date(String(a.available_at)).getTime() - new Date(String(b.available_at)).getTime());
  const earliest = dated[0];
  const lines = quotes.map((q) => {
    const rating = Number(q.rating) > 0 ? ` · ${Number(q.rating).toFixed(1)}/5` : '';
    const when = q.available_at ? ` · Termin ${clean(q.available_at, 40)}` : '';
    const distance = Number.isFinite(Number(q.distance_km)) ? ` · ${Math.round(Number(q.distance_km))} km` : '';
    return `• ${clean(q.business_name)} · ${euroExact(Number(q.amount))}${when}${rating}${distance}`;
  });
  const notes = [`Niedrigster Preis: ${clean(cheapest.business_name)} (${euroExact(Number(cheapest.amount))}).`];
  if (earliest && earliest.id !== cheapest.id) notes.push(`Frühester hinterlegter Termin: ${clean(earliest.business_name)} (${clean(earliest.available_at, 40)}).`);
  return {
    reply: `Angebote für „${clean(j.title)}“:\n${lines.join('\n')}\n${notes.join(' ')} Ich entscheide nicht für dich; du kannst Preis, Termin, Entfernung und Bewertung direkt vergleichen.`,
    links: [{ label: 'Angebote ansehen', href: `/app/jobs/${j.id}` }],
  };
}

export function ownerHouseCheck(userId: number): OwnerIntelligenceResult {
  assertOwner(userId);
  const property = db.prepare(`SELECT p.* FROM properties p JOIN property_ownerships o ON o.property_id=p.id
    WHERE o.homeowner_id=? AND o.active=1 AND o.ended_at IS NULL ORDER BY o.started_at DESC,o.id DESC LIMIT 1`).get(userId) as Record<string, unknown> | undefined;
  const missing: string[] = [];
  if (!property) missing.push('Haus/Immobilie');
  else {
    if (!clean(property.address)) missing.push('Adresse');
    if (!clean(property.postcode)) missing.push('Postleitzahl');
    if (!Number(property.build_year)) missing.push('Baujahr');
    if (!Number(property.living_area)) missing.push('Wohnfläche');
  }
  const counts = {
    contracts: Number((db.prepare("SELECT COUNT(*) c FROM house_contracts WHERE homeowner_id=? AND status='active'").get(userId) as { c: number }).c),
    assets: Number((db.prepare('SELECT COUNT(*) c FROM house_assets WHERE homeowner_id=?').get(userId) as { c: number }).c),
    contacts: Number((db.prepare('SELECT COUNT(*) c FROM homeowner_contact_entries WHERE homeowner_id=?').get(userId) as { c: number }).c),
    history: Number((db.prepare('SELECT COUNT(*) c FROM house_history_entries WHERE homeowner_id=?').get(userId) as { c: number }).c),
  };
  const optional: string[] = [];
  if (!counts.contracts) optional.push('noch keine Verträge hinterlegt');
  if (!counts.assets) optional.push('noch keine Anlagen/Haustechnik hinterlegt');
  if (!counts.contacts) optional.push('noch keine Ansprechpartner gespeichert');
  if (!counts.history) optional.push('noch keine erledigten Arbeiten in der Hausgeschichte');
  const core = missing.length ? `Für bessere automatische Zuordnung fehlen noch: ${missing.join(', ')}.` : 'Die wichtigsten Hausdaten sind vorhanden.';
  const extra = optional.length ? ` Zusätzlich: ${optional.slice(0, 3).join('; ')}.` : ' Verträge, Anlagen, Ansprechpartner und Hausgeschichte sind bereits befüllt.';
  return {
    reply: core + extra,
    links: [
      { label: 'Hausdaten', href: '/app/home' },
      { label: 'Verträge', href: '/app/contracts' },
      { label: 'Ansprechpartner', href: '/app/partners' },
    ],
  };
}

export function ownerJobOverview(userId: number): OwnerIntelligenceResult {
  assertOwner(userId);
  const rows = db.prepare(`SELECT j.id,j.title,j.status,j.updated_at,
    (SELECT COUNT(*) FROM quotes q WHERE q.job_id=j.id AND q.status='pending') pending_quotes
    FROM jobs j WHERE j.homeowner_id=? ORDER BY j.updated_at DESC,j.id DESC LIMIT 12`).all(userId) as Array<{ id: number; title: string; status: string; pending_quotes: number }>;
  if (!rows.length) return { reply: 'Du hast aktuell noch keine Aufträge. Wenn etwas ansteht, kannst du direkt einen Entwurf vorbereiten.', links: [{ label: 'Auftrag starten', href: '/app/hausmeister' }] };
  const decision = rows.filter((r) => Number(r.pending_quotes) > 0);
  const active = rows.filter((r) => ['accepted', 'in_progress'].includes(r.status));
  const waiting = rows.filter((r) => ['open', 'quoted'].includes(r.status) && !decision.includes(r));
  const parts = [
    decision.length ? `${decision.length} ${decision.length === 1 ? 'Auftrag wartet' : 'Aufträge warten'} auf deine Angebotsentscheidung.` : '',
    active.length ? `${active.length} ${active.length === 1 ? 'Auftrag läuft' : 'Aufträge laufen'} bereits.` : '',
    waiting.length ? `${waiting.length} ${waiting.length === 1 ? 'Auftrag wartet' : 'Aufträge warten'} noch auf Rückmeldungen.` : '',
  ].filter(Boolean);
  const lines = rows.slice(0, 6).map((r) => `• #${r.id} ${clean(r.title)} · ${statusLabel(r.status)}${r.pending_quotes ? ` · ${r.pending_quotes} Angebot${r.pending_quotes === 1 ? '' : 'e'}` : ''}`);
  return { reply: `${parts.join(' ')}\n${lines.join('\n')}`, links: [{ label: 'Aufträge', href: '/app/jobs' }] };
}

export function prepareOwnerJobDraft(userId: number, question: string): OwnerIntelligenceResult {
  assertOwner(userId);
  const q = clean(question, 800);
  const concrete = q.length >= 16 && !/^(ich )?(will|möchte|brauche) (einen )?(handwerker|auftrag)( beauftragen| erstellen)?[.!]?$/i.test(q);
  const postcode = ownerPostcode(userId);
  const missing = [!concrete ? 'kurz beschreiben, was gemacht werden soll' : '', !postcode ? 'Adresse/PLZ' : ''].filter(Boolean);
  return {
    reply: concrete
      ? `Ich habe deine Beschreibung als Auftragsentwurf vorbereitet. ${missing.length ? `Es fehlt noch ${missing.join(' und ')}.` : 'Deine Hausadresse ist bereits bekannt; der Hausmeister fragt nur noch genau das ab, was für den Auftrag wirklich fehlt.'} Es wird noch nichts an Handwerker versendet, bevor du den Ablauf fortsetzt.`
      : `Für den Auftrag brauche ich nur noch einen kurzen Satz dazu, was kaputt ist oder erledigt werden soll${postcode ? '' : ', plus deine Adresse/PLZ'}. Danach fragt der Hausmeister höchstens die wirklich fehlende Angabe ab.`,
    links: [{ label: 'Auftragsentwurf öffnen', href: concrete ? `/app/hausmeister?draft=${encodeURIComponent(q)}` : '/app/hausmeister' }],
  };
}

export function classifyHouseEvent(question: string): OwnerIntelligenceResult {
  const q = question.toLocaleLowerCase('de-DE');
  if (/rechnung|angebot|garantie|beleg|dokument|pdf|datei/.test(q)) return { reply: 'Das gehört in die Dokumente/Hausakte. Bei einem vorhandenen Auftrag wird es dort zugeordnet; allgemeine Hausunterlagen bleiben in der Hausakte.', links: [{ label: 'Dokumente', href: '/app/documents' }] };
  if (/vertrag|tarif|stromanbieter|gasanbieter|dsl|internet|versicherung/.test(q)) return { reply: 'Das gehört zu Verträge & Tarife. Dort kann der Hausmanager Fristen und Vergleichschancen daraus ableiten.', links: [{ label: 'Verträge & Tarife', href: '/app/contracts' }] };
  if (/wartung|prüfung|pflege|fällig|erneuern/.test(q)) return { reply: 'Das ist eine Wartungs- oder Pflegeinformation und gehört in „Mein Jahr“ beziehungsweise zur passenden Anlage.', links: [{ label: 'Mein Jahr', href: '/app/year' }] };
  if (/erledigt|repariert|saniert|eingebaut|ausgetauscht/.test(q)) return { reply: 'Das klingt nach Hausgeschichte: eine erledigte Arbeit, die später als Historie und Nachweis wiedergefunden werden soll.', links: [{ label: 'Hausakte', href: '/app/home' }] };
  if (/kaputt|defekt|tropft|ausfall|problem|reparier/.test(q)) return { reply: 'Das klingt nach einem neuen Problem bzw. Auftrag. Ich kann daraus direkt einen Auftragsentwurf vorbereiten.', links: [{ label: 'Hausmeister', href: `/app/hausmeister?draft=${encodeURIComponent(clean(question, 800))}` }] };
  return { reply: 'Ich kann das sicher einordnen, sobald klar ist, ob es ein Vertrag, Dokument, erledigte Arbeit, Wartung oder ein neues Problem ist.', links: [{ label: 'Hausakte', href: '/app/documents' }] };
}

function buildOwnerInsights(userId: number): OwnerInsight[] {
  assertOwner(userId);
  const insights: OwnerInsight[] = [];
  const today = berlinDay();
  const jobs = db.prepare(`SELECT j.id,j.title,COUNT(q.id) quotes,MIN(q.amount) min_amount,MAX(q.amount) max_amount
    FROM jobs j JOIN quotes q ON q.job_id=j.id AND q.status='pending'
    WHERE j.homeowner_id=? AND j.status IN ('open','quoted') GROUP BY j.id,j.title HAVING COUNT(q.id)>=2
    ORDER BY MAX(q.created_at) DESC LIMIT 5`).all(userId) as Array<{ id: number; title: string; quotes: number; min_amount: number; max_amount: number }>;
  for (const row of jobs) insights.push({
    key: `quotes:${row.id}`,
    fingerprint: `${row.quotes}:${row.min_amount}:${row.max_amount}`,
    title: 'Angebote vergleichen',
    body: `Für „${clean(row.title)}“ liegen ${row.quotes} Angebote vor. Preis und Termin kannst du jetzt direkt vergleichen.`,
    href: `/app/jobs/${row.id}`,
    priority: 2,
  });

  for (const contract of activeContracts(userId)) {
    const deadline = cancellationDeadline(contract);
    const days = deadlineDays(deadline);
    if (days == null || days > 90) continue;
    insights.push({
      key: `contract:${contract.id}`,
      fingerprint: `${deadline?.toISOString().slice(0, 10)}:${days < 0 ? 'overdue' : days <= 30 ? '30d' : '90d'}`,
      title: days < 0 ? 'Kündigungsfrist prüfen' : 'Vertrag rechtzeitig prüfen',
      body: `${contractKindLabel(contract.kind)} · ${clean(contract.provider)}: ${days < 0 ? 'Die hinterlegte Kündigungsfrist ist vorbei.' : `Noch ${days} Tage bis zur hinterlegten Kündigungsfrist.`}`,
      href: `/app/contracts?tab=sparcheck&contract=${contract.id}`,
      priority: days < 0 || days <= 30 ? 1 : 3,
    });
  }

  const maintenance = db.prepare(`SELECT id,title,due_date FROM maintenance_tasks
    WHERE homeowner_id=? AND status='open' AND date(due_date)<=date(?,'+30 days') ORDER BY date(due_date),id LIMIT 8`)
    .all(userId, today) as Array<{ id: number; title: string; due_date: string }>;
  for (const task of maintenance) {
    const overdue = task.due_date.slice(0, 10) < today;
    insights.push({
      key: `maintenance:${task.id}`,
      fingerprint: `${task.due_date}:${overdue ? 'overdue' : 'soon'}`,
      title: overdue ? 'Pflege ist überfällig' : 'Pflege steht an',
      body: `${clean(task.title)} · ${overdue ? 'überfällig' : `fällig am ${task.due_date.slice(0, 10)}`}.`,
      href: '/app/year',
      priority: overdue ? 1 : 3,
    });
  }

  const appointments = db.prepare(`SELECT a.id,a.start_at,j.title FROM appointments a JOIN jobs j ON j.id=a.job_id
    WHERE a.homeowner_id=? AND j.homeowner_id=? AND a.status='confirmed'
      AND datetime(a.start_at)>=datetime('now') AND datetime(a.start_at)<=datetime('now','+2 days')
    ORDER BY datetime(a.start_at) LIMIT 5`).all(userId, userId) as Array<{ id: number; start_at: string; title: string }>;
  for (const appointment of appointments) insights.push({
    key: `appointment:${appointment.id}`,
    fingerprint: appointment.start_at,
    title: 'Termin steht an',
    body: `${clean(appointment.title)} · ${clean(appointment.start_at, 50)}.`,
    href: '/app/calendar',
    priority: 2,
  });

  for (const opportunity of tariffOpportunities(userId).filter((entry) => (entry.savingsAnnualCents ?? 0) > 0).slice(0, 3)) {
    insights.push({
      key: `tariff:${opportunity.contract.id}`,
      fingerprint: `${opportunity.offer.id}:${opportunity.currentAnnualCents}:${opportunity.offer.annual_cents}`,
      title: 'Tarifchance gefunden',
      body: `${contractKindLabel(opportunity.contract.kind)}: Ein freigegebenes Partnerangebot liegt rechnerisch ${euroExact(opportunity.savingsAnnualCents!)} pro Jahr unter deinen hinterlegten Kosten.`,
      href: `/app/contracts?tab=sparcheck&contract=${opportunity.contract.id}`,
      priority: 3,
    });
  }

  const profile = db.prepare(`SELECT h.onboarding_step,p.id property_id,p.address,p.postcode,p.build_year,p.living_area
    FROM homeowner_profiles h LEFT JOIN property_ownerships o ON o.homeowner_id=h.user_id AND o.active=1 AND o.ended_at IS NULL
    LEFT JOIN properties p ON p.id=o.property_id WHERE h.user_id=? ORDER BY o.started_at DESC,o.id DESC LIMIT 1`).get(userId) as Record<string, unknown> | undefined;
  if (profile?.onboarding_step === 'done') {
    const missing = [!profile.property_id ? 'Haus' : '', !clean(profile.address) ? 'Adresse' : '', !clean(profile.postcode) ? 'PLZ' : '', !Number(profile.build_year) ? 'Baujahr' : '', !Number(profile.living_area) ? 'Wohnfläche' : ''].filter(Boolean);
    if (missing.length) insights.push({
      key: 'house-completeness',
      fingerprint: missing.join('|'),
      title: 'Hausakte vervollständigen',
      body: `Für bessere automatische Zuordnung fehlen noch: ${missing.slice(0, 4).join(', ')}.`,
      href: '/app/home',
      priority: 6,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority || a.key.localeCompare(b.key));
}

export function ownerNextActions(userId: number): OwnerIntelligenceResult {
  const insights = buildOwnerInsights(userId).slice(0, 6);
  if (!insights.length) return { reply: 'Aktuell sehe ich nichts, das sofort deine Aufmerksamkeit braucht.', links: [{ label: 'Startseite', href: '/app' }] };
  return {
    reply: `Das braucht aktuell deine Aufmerksamkeit:\n${insights.map((item) => `• ${item.title}: ${item.body}`).join('\n')}`,
    links: [...new Map(insights.map((item) => [item.href, { label: item.title, href: item.href }])).values()].slice(0, 5),
  };
}

export function syncOwnerAttentionNotifications(userId: number): { created: number; checked: number } {
  const insights = buildOwnerInsights(userId);
  let created = 0;
  const get = db.prepare('SELECT fingerprint FROM owner_ai_insight_state WHERE user_id=? AND insight_key=?');
  const upsert = db.prepare(`INSERT INTO owner_ai_insight_state(user_id,insight_key,fingerprint,notified_at)
    VALUES(?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(user_id,insight_key) DO UPDATE SET fingerprint=excluded.fingerprint,notified_at=excluded.notified_at`);
  for (const item of insights) {
    const previous = get.get(userId, item.key) as { fingerprint?: string } | undefined;
    if (previous?.fingerprint === item.fingerprint) continue;
    createNotification(userId, item.title, item.body, item.href, 'assistant');
    upsert.run(userId, item.key, item.fingerprint);
    created += 1;
  }
  return { created, checked: insights.length };
}

export function syncOwnerAttentionBatch(limit = 80): { users: number; created: number; checked: number } {
  const bounded = Math.max(1, Math.min(500, Math.trunc(limit) || 80));
  const users = db.prepare(`SELECT u.id FROM users u
    LEFT JOIN owner_ai_user_state s ON s.user_id=u.id
    WHERE u.role='homeowner'
    ORDER BY COALESCE(s.last_scanned_at,'') ASC,u.id ASC LIMIT ?`).all(bounded) as Array<{ id: number }>;
  const touch = db.prepare(`INSERT INTO owner_ai_user_state(user_id,last_scanned_at) VALUES(?,CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET last_scanned_at=CURRENT_TIMESTAMP`);
  let created = 0;
  let checked = 0;
  for (const user of users) {
    try {
      const result = syncOwnerAttentionNotifications(user.id);
      created += result.created;
      checked += result.checked;
    } finally {
      touch.run(user.id);
    }
  }
  return { users: users.length, created, checked };
}
