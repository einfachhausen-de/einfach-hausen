import type { ProofFact } from "./types";
import styles from "./premium.module.css";

type ProofChapterProps = {
  eyebrow: string;
  title: string;
  text: string;
  facts: readonly ProofFact[];
};

export function ProofChapter({ eyebrow, title, text, facts }: ProofChapterProps) {
  return (
    <section className={[styles.premiumRoot, styles.chapter, styles.proofChapter].join(" ")}>
      <div className={styles.container}>
        <header className={styles.proofIntro}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{text}</p>
        </header>
        <dl className={styles.proofGrid}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
