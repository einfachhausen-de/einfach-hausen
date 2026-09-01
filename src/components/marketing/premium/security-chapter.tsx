import Image from "next/image";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import type { PremiumAsset, ProofFact } from "./types";
import styles from "./premium.module.css";

type SecurityChapterProps = {
  eyebrow: string;
  title: string;
  text: string;
  asset: PremiumAsset;
  facts: readonly ProofFact[];
  href?: string;
  linkLabel?: string;
};

export function SecurityChapter({
  eyebrow,
  title,
  text,
  asset,
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
        <div className={styles.securityProof}>
          <div className={styles.securityVisual}>
            <Image
              src={asset.src}
              alt={asset.decorative ? "" : asset.alt}
              aria-hidden={asset.decorative || undefined}
              fill
              sizes="(max-width: 980px) 100vw, 44vw"
              className={styles.imageFill}
              style={{ objectPosition: asset.focalPoint ?? "50% 50%" }}
            />
            <span aria-hidden="true" />
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
      </div>
    </section>
  );
}
