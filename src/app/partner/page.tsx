import type { Metadata } from 'next';
import { canonical, ogBlock } from '@/lib/seo';
import { BadgeCheck, BriefcaseBusiness, Building2, Handshake, ReceiptText, UsersRound } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/site-shell';
import { Steps } from '@/components/marketing/ui';
import { EHScope, EHSection, EHPageHero, EHFeatureRows, EHPanel, EHList, EHClosing, EHButton, EHActions, EHEyebrow, EHHeading, EHText, EHProse } from '@/design-system';
import { HeroEditorialPhoto } from '@/components/marketing/hero-visuals';

export const metadata: Metadata = { title: 'Für Betriebe', description: 'Partnernetzwerk für regionale Betriebe: passende Anfragen, direkter Kundenkontakt und 0 % Auftragsprovision.' , alternates: { canonical: canonical('/partner') }, openGraph: ogBlock({ url: '/partner', title: 'Für Betriebe · Einfach Hausen', description: 'Regionales Qualitätsnetzwerk: passende Anfragen, direkter Kundenkontakt und 0 % Auftragsprovision.', motiv: 'partner' }) };
export default function Page(){return <MarketingShell>
  <EHScope>
  <EHPageHero eyebrow="Für Betriebe" title="Passende Anfragen. Persönlicher Kundenkontakt. 0 % Provision." text="Einfach Hausen ist kein offener Lead-Marktplatz. Geprüfte und vertraglich gebundene Unternehmen arbeiten in einem regionalen Qualitätsnetzwerk mit planbaren Monatstarifen." actions={<><EHButton href="/register?role=provider" arrow>Als Partner starten</EHButton><EHButton href="/preise" variant="secondary">Partnerpreise</EHButton></>} media={<HeroEditorialPhoto src="/images/premium/story-ansprechpartner.jpg" label="0 % Auftragsprovision" detail="Der ausführende Betrieb bleibt Rechnungssteller." />} />
  <EHSection compact>
    <EHProse>
      <p><strong>Das Modell.</strong> Du bleibst Rechnungssteller. Wir sind deine Organisations-Ebene.</p>
    </EHProse>
  </EHSection>
  <EHSection compact>
    <EHEyebrow>Das Modell</EHEyebrow>
    <EHHeading>Auftragswert bleibt beim Betrieb.</EHHeading>
    <EHText size="lead">Einfach Hausen monetarisiert Partner über Monatsabos, nicht über eine Gebühr pro Auftrag.</EHText>
    <EHFeatureRows items={[{icon:<ReceiptText size={20}/>,title:'0 % Auftragsprovision',text:'Der ausführende Betrieb bleibt Rechnungssteller und behält 100 % des Auftragswertes.'},{icon:<Handshake size={20}/>,title:'Kundenbeziehung statt Lead-Verkauf',text:'Nach einer Verbindung kann ein konkreter Ansprechpartner dauerhaft beim Haus des Kunden gespeichert bleiben.'},{icon:<BriefcaseBusiness size={20}/>,title:'Einfacher Arbeitsbereich',text:'Anfragen, Termine, Team, Dokumentation und Rechnung – mit möglichst wenig Verwaltungsballast.'}]}/>
  </EHSection>
  <EHSection compact>
    <EHEyebrow>Arbeitsweise</EHEyebrow>
    <EHHeading>Vom passenden Anliegen zum dauerhaften Kundenkontakt.</EHHeading>
    <EHText size="lead">Der Partnerbereich ist bewusst kein Mini-ERP. Er zeigt nur, was für den nächsten sinnvollen Schritt nötig ist.</EHText>
    <Steps items={[
      {title:'Passende Anfrage sehen',text:'Neue Anfragen kommen nur dort an, wo Leistung, Region, Verfügbarkeit und Qualitätskriterien zusammenpassen.'},
      {title:'Angebot oder Kontakt übernehmen',text:'Je nach Wunsch des Eigentümers entsteht Beratung ohne Auftrag oder ein konkreter Auftrag mit Preis und Termin.'},
      {title:'Beziehung am Haus behalten',text:'Nach Abschluss bleiben Vorgang, Rechnung und Ansprechpartner beim Haus dokumentiert. Folgeanfragen können an bekannte Kontakte anknüpfen.'},
    ]}/>
  </EHSection>
  <EHSection compact id="qualitaet">
    <EHEyebrow>Qualitätsnetzwerk</EHEyebrow>
    <EHHeading>Nicht jeder Eintrag wird automatisch Partner.</EHHeading>
    <EHText size="lead">Vor aktiver Vermittlung sieht das Produktmodell eine Mindestprüfung und einen aktiven Partnervertrag vor.</EHText>
    <EHPanel title="Mindestprüfung"><EHHeading as="h3" scale="item">Qualifikation und Betrieb müssen zum Einsatz passen.</EHHeading><EHList label="Mindestprüfung" items={['Gewerbe / Unternehmen','Erforderliche Qualifikationen und Zulassungen','Betriebshaftpflicht','Referenzen bzw. vorhandene Bewertungen','Einsatzregion und Kapazität','Kommunikations- und Qualitätsstandard','Aktiver Partnervertrag'].map((b, k) => ({ id: "partner-mindest-" + k, title: b }))} /></EHPanel><EHPanel title="Matching"><EHHeading as="h3" scale="item">Tarife kaufen keine bessere fachliche Position.</EHHeading><EHText>Beim Matching sollen unter anderem Entfernung, Fachgebiet, Qualifikation, Verfügbarkeit, Kapazität, Kundenzufriedenheit und bestehende Kundenbeziehungen berücksichtigt werden.</EHText><EHList label="Matching" items={['Qualität vor Monetarisierung','Regionale Eignung statt Massenverteilung','Bestehende Kundenbeziehungen können berücksichtigt werden'].map((b, k) => ({ id: "partner-matching-" + k, title: b }))} /></EHPanel>
  </EHSection>
  <EHSection compact id="partner-app">
    <EHEyebrow>Team</EHEyebrow>
    <EHHeading>Ein Firmenkonto. Mehrere Menschen. Eine zentrale Berechtigung.</EHHeading>
    <EHText size="lead">Das Partnerprodukt soll in wenigen Minuten verständlich sein und bewusst keine komplexe Rollenmatrix aufbauen.</EHText>
    <EHFeatureRows items={[{icon:<Building2 size={20}/>,title:'Ein professionelles Konto',text:'Ein Anbieter kann mehrere Tätigkeiten und konkrete Leistungen im selben Firmenkonto führen.'},{icon:<UsersRound size={20}/>,title:'Mehrere Ansprechpartner',text:'Mitarbeitende erhalten eigenen App-Zugang und können ihren zugewiesenen Kundenkontakt pflegen.'},{icon:<BadgeCheck size={20}/>,title:'Aufträge verwalten AN / AUS',text:'Die zentrale Berechtigung steuert, ob jemand neue Anfragen und Zuweisungen verwalten darf oder nur eigene Aufträge sieht.'}]}/>
  </EHSection>
  <EHSection compact>
    <EHEyebrow>Tarife</EHEyebrow>
    <EHHeading>FREE bis PREMIUM – ohne Einfluss auf die Matching-Qualität.</EHHeading>
    <EHText size="lead">FREE startet bei 0 €. START, PRO und PREMIUM sind laut Produktmodell monatlich planbar und beginnen mit einer zweimonatigen kostenlosen Testphase.</EHText>
    <EHActions>
      <EHButton href="/preise">Tarife vergleichen</EHButton>
    </EHActions>
  </EHSection>
  <EHClosing title="Partner werden, ohne pro Auftrag abzugeben." text="Starte die Registrierung für deinen Betrieb. Die aktive Vermittlung setzt Prüfung und Partnerstatus voraus." href="/register?role=provider" label="Partnerkonto starten" secondary={<EHButton href="/#anliegen" variant="secondary">Anliegen starten</EHButton>} />
</EHScope>
</MarketingShell>}
