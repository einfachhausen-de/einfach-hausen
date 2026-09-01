import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import type { PremiumAsset } from "./types";
import styles from "./premium.module.css";

type PartnerChapterProps = {
  eyebrow: string;
  title: string;
  text: string;
  asset: PremiumAsset;
  facts: readonly string[];
  href: string;
  linkLabel: string;
};

export function PartnerChapter({
  eyebrow,
  title,
  text,
  asset,
  facts,
  href,
  linkLabel,
}: PartnerChapterProps) {
  return (
    <section className={[styles.premiumRoot, styles.chapterImmersive, styles.partnerChapter].join(" ")}>
      <div className={[styles.container, styles.partnerLayout].join(" ")}>
        <div className={styles.partnerVisual}>
          <Image
            src={asset.src}
            alt={asset.decorative ? "" : asset.alt}
            aria-hidden={asset.decorative || undefined}
            fill
            sizes="(max-width: 980px) 100vw, 52vw"
            className={styles.imageFill}
            style={{ objectPosition: asset.focalPoint ?? "50% 50%" }}
          />
        </div>
        <div className={styles.partnerCopy}>
          <span className={styles.eyebrowLight}>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{text}</p>
          <ul>
            {facts.map((fact) => (
              <li key={fact}>
                <Check size={17} aria-hidden="true" />
                {fact}
              </li>
            ))}
          </ul>
          <a className={styles.lightAction} href={href}>
            {linkLabel}
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
