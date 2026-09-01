import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { PremiumAsset, ProofFact } from "./types";
import styles from "./premium.module.css";

type ImageUICompositeProps = {
  eyebrow: string;
  title: string;
  text: string;
  asset: PremiumAsset;
  facts: readonly ProofFact[];
  href: string;
  linkLabel: string;
  children?: React.ReactNode;
  reverse?: boolean;
};

export function ImageUIComposite({
  eyebrow,
  title,
  text,
  asset,
  facts,
  href,
  linkLabel,
  children,
  reverse = false,
}: ImageUICompositeProps) {
  return (
    <section className={[styles.premiumRoot, styles.chapterImmersive, styles.compositeChapter].join(" ")}>
      <div className={[styles.container, styles.compositeLayout, reverse ? styles.compositeReverse : ""].filter(Boolean).join(" ")}>
        <div className={styles.compositeVisual}>
          <Image
            src={asset.src}
            alt={asset.decorative ? "" : asset.alt}
            aria-hidden={asset.decorative || undefined}
            fill
            sizes="(max-width: 980px) 100vw, 62vw"
            className={styles.imageFill}
            style={{ objectPosition: asset.focalPoint ?? "50% 50%" }}
          />
          {children && <div className={styles.compositeOverlay}>{children}</div>}
        </div>
        <div className={styles.compositeCopy}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{text}</p>
          <dl className={styles.factList}>
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.detail}</dd>
              </div>
            ))}
          </dl>
          <a className={styles.textAction} href={href}>
            {linkLabel}
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
