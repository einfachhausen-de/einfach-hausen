import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  ChevronDown,
  FileText,
  Home,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { IntakeForm } from "@/components/home/intake-form";
import { MarketingShell } from "@/components/marketing/site-shell";
import { ConsumerHero } from "@/components/marketing/premium/consumer-hero";
import { ImageUIComposite } from "@/components/marketing/premium/image-ui-composite";
import { PartnerChapter } from "@/components/marketing/premium/partner-chapter";
import { ProofChapter } from "@/components/marketing/premium/proof-chapter";
import { SecurityChapter } from "@/components/marketing/premium/security-chapter";
import { StorySteps } from "@/components/marketing/premium/story-steps";
import { VisualCategoryGrid } from "@/components/marketing/premium/visual-category-grid";
import { premiumAssets } from "@/components/marketing/premium/assets";
import type {
  CategoryCard,
  ProofFact,
  StoryStep,
} from "@/components/marketing/premium/types";
import styles from "@/components/marketing/premium/premium.module.css";

const categories = [
  {
    title: "Heizung & Sanitär",
    text: "Wärme, Wasser, Klima und Wartung",
    href: "/leistungen",
    asset: premiumAssets.categoryHeating,
    tone: "cream",
  },
  {
    title: "Elektro & Energie",
    text: "Elektro, Wallbox, PV und Smart Home",
    href: "/leistungen",
    asset: premiumAssets.categoryEnergy,
    tone: "mist",
  },
  {
    title: "Dach & Gebäude",
    text: "Dach, Fenster, Türen und Fassade",
    href: "/leistungen",
    asset: premiumAssets.categoryRoof,
    tone: "mint",
  },
  {
    title: "Bad & Modernisierung",
    text: "Sanitär, Ausbau und neue Wohnqualität",
    href: "/leistungen",
    asset: premiumAssets.categoryBath,
    tone: "cream",
  },
  {
    title: "Ausbau & Renovierung",
    text: "Maler, Boden, Schreiner und Sanierung",
    href: "/leistungen",
    asset: premiumAssets.categoryRenovation,
    tone: "white",
  },
  {
    title: "Garten & Außenbereich",
    text: "Pflege, Baumarbeiten und Pflaster",
    href: "/leistungen",
    asset: premiumAssets.categoryGarden,
    tone: "mint",
  },
  {
    title: "Pflege & Reinigung",
    text: "Reinigung, Dachrinne und Winterdienst",
    href: "/leistungen",
    asset: premiumAssets.categoryCare,
    tone: "mist",
  },
  {
    title: "Weitere Hausdienste",
    text: "Montage, Umzug und Spezialfälle",
    href: "/leistungen",
    asset: premiumAssets.categoryMore,
    tone: "petrol",
  },
] satisfies readonly CategoryCard[];

const storySteps = [
  {
    index: "01",
    title: "Einfach beschreiben",
    text: "Schreib, sprich oder zeig per Foto, was bei deinem Haus ansteht. Du musst das richtige Gewerk nicht schon kennen.",
    asset: premiumAssets.storyDescribe,
  },
  {
    index: "02",
    title: "Passenden Menschen finden",
    text: "Wir ordnen das Anliegen ein und verbinden dich mit einer geeigneten Fachkraft oder einem persönlichen Ansprechpartner.",
    asset: premiumAssets.storyProfessional,
  },
  {
    index: "03",
    title: "Erledigt. Und behalten.",
    text: "Du entscheidest über den Auftrag. Termine, Dokumente und erledigte Arbeiten bleiben danach in deiner Hausakte geordnet.",
    asset: premiumAssets.storyComplete,
  },
] satisfies readonly StoryStep[];

const houseRecordFacts = [
  {
    label: "Technik",
    detail: "Anlagen, Wartungen und wichtige Daten deines Hauses an einem Ort.",
  },
  {
    label: "Dokumente",
    detail: "Rechnungen, Garantien und Belege wiederfinden, wenn sie gebraucht werden.",
  },
  {
    label: "Menschen",
    detail: "Bewährte Ansprechpartner nach Bereichen behalten, statt jedes Mal neu zu suchen.",
  },
] satisfies readonly ProofFact[];

const proofFacts = [
  {
    label: "Geprüfte Partner",
    detail: "Kein offener Lead-Marktplatz. Vertragspartner werden bewusst ins Netzwerk aufgenommen.",
  },
  {
    label: "Du entscheidest",
    detail: "Ohne deine ausdrückliche Entscheidung wird kein Auftrag automatisch beauftragt.",
  },
  {
    label: "0 % Provision",
    detail: "Partner behalten ihren Auftragswert. Einfach Hausen verdient nicht pro ausgeführtem Auftrag mit.",
  },
  {
    label: "Ein Hausgedächtnis",
    detail: "Kontakte, Arbeiten und Unterlagen wachsen langfristig zu einer geordneten Hausakte.",
  },
] satisfies readonly ProofFact[];

const securityFacts = [
  {
    label: "Kontrollierte Zugriffe",
    detail: "Private Hausdaten bleiben rollenbasiert geschützt und werden nicht frei im Netzwerk verteilt.",
  },
  {
    label: "Keine versteckten Aufträge",
    detail: "Du siehst den nächsten Schritt und entscheidest selbst, bevor etwas beauftragt wird.",
  },
  {
    label: "Verständliche Prinzipien",
    detail: "Sicherheit und Datenschutz werden konkret erklärt – ohne erfundene Siegel oder leere Versprechen.",
  },
] satisfies readonly ProofFact[];

const faqs = [
  [
    "Was kostet Einfach Hausen?",
    "Das Hauskonto für Eigentümer startet kostenlos. Du bezahlst keine Provision auf Aufträge. Planbare Zusatzleistungen und Partnertarife findest du unter Preise.",
  ],
  [
    "Wird automatisch ein Auftrag beauftragt?",
    "Nein. Du wählst bewusst: erst die Frage klären, einen passenden Menschen sprechen oder einen Auftrag organisieren lassen. Ohne deine Entscheidung passiert nichts.",
  ],
  [
    "Wer arbeitet an meinem Haus?",
    "Geprüfte Vertragspartner aus deiner Region. Das Matching folgt fachlicher Eignung und Qualität – nicht dem höchsten Tarif.",
  ],
  [
    "Was ist die digitale Hausakte?",
    "Das dauerhafte Gedächtnis deines Hauses: Technik, Dokumente, Garantien, Wartungen, Kontakte und Historie – geordnet an einem Ort.",
  ],
] as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "provider" ? "/pro" : "/app");

  return (
    <MarketingShell>
      <ConsumerHero
        eyebrow="Einfach Hausen"
        title={
          <>
            Du hast ein Haus. <mark>Wir kümmern uns um den Rest.</mark>
          </>
        }
        text="Ein Anliegen, ein verlässlicher nächster Schritt: Wir helfen beim Einordnen, finden passende Menschen und behalten das Wissen über dein Haus."
        visual={premiumAssets.homeownerHero}
        trust={[
          "Geprüfte Vertragspartner",
          "Kein Auftrag ohne deine Entscheidung",
          "Hauskonto kostenlos",
        ]}
        promotion={{
          label: "Pilotphase",
          text: "Die ersten 1.000 Haushalte sichern sich 15 % Dauer-Vorteil",
          href: "/pilotphase",
        }}
        visualOverlay={
          <div className={styles.heroProofCard}>
            <div className={styles.heroProofHead}>
              <span className={styles.heroProofIcon}>
                <Home size={20} aria-hidden="true" />
              </span>
              <span>
                <small>Mein Haus</small>
                <strong>Alles bleibt geordnet.</strong>
              </span>
              <span className={styles.heroProofStatus}>bereit</span>
            </div>
            <div className={styles.heroProofItems}>
              <span>
                <CalendarCheck2 size={17} aria-hidden="true" />
                <span><strong>Wartung eingeplant</strong><small>Heizung · Oktober</small></span>
              </span>
              <span>
                <FileText size={17} aria-hidden="true" />
                <span><strong>Rechnung abgelegt</strong><small>Dach · Hausakte</small></span>
              </span>
              <span>
                <UserRound size={17} aria-hidden="true" />
                <span><strong>Ansprechpartner behalten</strong><small>Elektro · Region</small></span>
              </span>
            </div>
          </div>
        }
      >
        <IntakeForm />
      </ConsumerHero>

      <VisualCategoryGrid
        eyebrow="Womit wir helfen"
        title="Alles rund ums Haus. Ohne Gewerke-Raten."
        text="Starte bei deinem Anliegen. Wir helfen dir, daraus den passenden nächsten Schritt zu machen."
        items={categories}
      />

      <StorySteps
        eyebrow="So funktioniert’s"
        title="Vom ersten Gedanken bis zum geordneten Ergebnis."
        text="Weniger suchen, weniger hinterherlaufen und trotzdem bei jeder Entscheidung die Kontrolle behalten."
        steps={storySteps}
      />

      <ImageUIComposite
        eyebrow="Deine digitale Hausakte"
        title="Dein Haus vergisst nichts."
        text="Mit jedem erledigten Thema entsteht ein besseres Gedächtnis deiner Immobilie – nützlich heute, wertvoll über Jahre."
        asset={premiumAssets.houseRecord}
        facts={houseRecordFacts}
        href="/hausakte"
        linkLabel="Die Hausakte kennenlernen"
      >
        <div className={styles.recordStack}>
          <article>
            <span className={styles.recordIcon}><Wrench size={18} aria-hidden="true" /></span>
            <span><small>Heizung</small><strong>Wartung dokumentiert</strong></span>
            <Check size={17} aria-hidden="true" />
          </article>
          <article>
            <span className={styles.recordIcon}><FileText size={18} aria-hidden="true" /></span>
            <span><small>Dach</small><strong>Garantie gespeichert</strong></span>
            <Check size={17} aria-hidden="true" />
          </article>
        </div>
      </ImageUIComposite>

      <ProofChapter
        eyebrow="Darauf kannst du dich verlassen"
        title="Vertrauen entsteht durch klare Regeln – nicht durch erfundene Sterne."
        text="Einfach Hausen setzt auf konkrete Produktprinzipien, sichtbare Ansprechpartner und bewusste Entscheidungen."
        facts={proofFacts}
      />

      <PartnerChapter
        eyebrow="Für Betriebe"
        title="Gute Arbeit verdient echte Partnerschaft."
        text="Partner erhalten passende Anfragen, bleiben als Menschen sichtbar und behalten 100 % ihres Auftragswertes."
        asset={premiumAssets.partnerProfessional}
        facts={[
          "0 % Auftragsprovision",
          "Matching nach Eignung statt gekauftem Ranking",
          "Anfragen, Termine und Dokumente an einem Ort",
        ]}
        href="/partner"
        linkLabel="Partner-Modell ansehen"
      />

      <section className={[styles.premiumRoot, styles.pricingChapter].join(" ")}>
        <div className={styles.container}>
          <header className={styles.pricingIntro}>
            <span className={styles.eyebrow}>Einfach starten</span>
            <h2>Kostenlos fürs Haus. Planbar für Betriebe.</h2>
            <p>Kein kompliziertes Paket-Raten: Eigentümer starten mit dem Hauskonto für 0 €. Partner wählen bei Bedarf einen planbaren Tarif.</p>
          </header>
          <div className={styles.pricingGrid}>
            <article className={styles.priceCardPrimary}>
              <span>Für Eigenheimbesitzer</span>
              <div className={styles.priceFigure}><strong>0 €</strong><small>pro Monat</small></div>
              <h3>Dein Hauskonto</h3>
              <p>Anliegen starten, Aufträge organisieren und deine digitale Hausakte Schritt für Schritt aufbauen.</p>
              <a href="/register?role=homeowner">Kostenlos starten <ArrowRight size={17} aria-hidden="true" /></a>
            </article>
            <article className={styles.priceCardSecondary}>
              <span>Für Betriebe</span>
              <div className={styles.priceFigure}><strong>0 %</strong><small>Auftragsprovision</small></div>
              <h3>Planbare Zusammenarbeit</h3>
              <p>FREE beginnt bei 0 €. Bezahlte Partner-Tarife starten laut Produktmodell bei 29 € im Monat.</p>
              <a href="/preise">Tarife vergleichen <ArrowRight size={17} aria-hidden="true" /></a>
            </article>
          </div>
        </div>
      </section>

      <SecurityChapter
        eyebrow="Sicherheit & Privatsphäre"
        title="Dein Haus ist privat. Seine Daten sind es auch."
        text="Wir bauen Organisation und Vertrauen so, dass du jederzeit weißt, wer was sehen darf und wann etwas passiert."
        asset={premiumAssets.securityHome}
        facts={securityFacts}
      />

      <section className={[styles.premiumRoot, styles.faqChapter].join(" ")}>
        <div className={[styles.container, styles.faqLayout].join(" ")}>
          <header>
            <span className={styles.eyebrow}>Häufige Fragen</span>
            <h2>Klare Antworten, bevor du startest.</h2>
            <p>Die wichtigsten Punkte zu Ablauf, Kosten, Partnern und Hausakte – ohne Kleingedrucktes.</p>
            <a className={styles.textAction} href="/hilfe">Alle Fragen ansehen <ArrowRight size={17} aria-hidden="true" /></a>
          </header>
          <div className={styles.faqList}>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  <span>{question}</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={[styles.premiumRoot, styles.finalCta].join(" ")}>
        <div className={styles.finalCtaInner}>
          <span className={styles.eyebrowLight}>Einfach Hausen</span>
          <h2>Beim nächsten Thema nicht wieder von vorne anfangen.</h2>
          <p>Beschreibe, was bei deinem Haus ansteht. Der Einstieg ist kostenlos und unverbindlich.</p>
          <div>
            <a className={styles.finalCtaPrimary} href="/register?role=homeowner">Hauskonto erstellen <ArrowRight size={17} aria-hidden="true" /></a>
            <a className={styles.finalCtaSecondary} href="/so-funktionierts">So funktioniert’s</a>
          </div>
          <span className={styles.finalCtaTrust}><ShieldCheck size={16} aria-hidden="true" /> Kein Auftrag ohne deine Entscheidung</span>
        </div>
      </section>
    </MarketingShell>
  );
}
