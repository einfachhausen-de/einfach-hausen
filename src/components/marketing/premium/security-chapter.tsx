import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ProofFact } from "./types";
import styles from "./premium.module.css";

type SecurityChapterProps = {
  eyebrow: string;
  title: string;
  text: string;
  facts: readonly ProofFact[];
  href?: string;
  linkLabel?: string;
};

export function SecurityChapter({
  eyebrow,
  title,
  text,
  facts,
  href = "/sicherheit",
  linkLabel = "Sicherheitsprinzipien ansehen",
}: SecurityChapterProps) {
  return (
    <section className={[styles.premiumRoot, styles.chapterImmersive, styles.securityChapter].join(" ")}>
      <div className={[styles.container, styles.securityLayout].join(" ")}>
        <div className={styles.securityStatement}>
          <span className={styles.securityIcon} aria-hidden="true">
            <ShieldCheck size={30} />
          </span>
          <span className={styles.eyebrowLight}>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{text}</p>
          <a className={styles.lightAction} href={href}>
            {linkLabel}
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
        <dl className={styles.securityFacts}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <LockKeyhole size={18} aria-hidden="true" />
              <dt>{fact.label}</dt>
              <dd>{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
