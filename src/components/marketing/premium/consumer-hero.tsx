import Image from "next/image";
import { ArrowRight, CircleCheck } from "lucide-react";
import type { PremiumAsset } from "./types";
import styles from "./premium.module.css";

type ConsumerHeroProps = {
  eyebrow: string;
  title: React.ReactNode;
  text: string;
  visual: PremiumAsset;
  trust: readonly string[];
  children: React.ReactNode;
  visualOverlay?: React.ReactNode;
  promotion?: { label: string; text: string; href: string };
};

export function ConsumerHero({
  eyebrow,
  title,
  text,
  visual,
  trust,
  children,
  visualOverlay,
  promotion,
}: ConsumerHeroProps) {
  return (
    <section className={[styles.premiumRoot, styles.heroChapter].join(" ")}>
      <div className={[styles.container, styles.heroLayout].join(" ")}>
        <div className={styles.heroCopy}>
          {promotion && (
            <a className={styles.promotion} href={promotion.href}>
              <span>{promotion.label}</span>
              {promotion.text}
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          )}
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroText}>{text}</p>
          <div className={styles.heroAction}>{children}</div>
          <ul className={styles.heroTrust} aria-label="Das spricht für Einfach Hausen">
            {trust.map((item) => (
              <li key={item}>
                <CircleCheck size={16} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.heroVisual}>
          <Image
            src={visual.src}
            alt={visual.decorative ? "" : visual.alt}
            aria-hidden={visual.decorative || undefined}
            fill
            priority
            sizes="(max-width: 980px) 100vw, 58vw"
            className={styles.imageFill}
            style={{ objectPosition: visual.focalPoint ?? "50% 50%" }}
          />
          <span className={styles.heroVisualShade} aria-hidden="true" />
          {visualOverlay && <div className={styles.heroVisualOverlay}>{visualOverlay}</div>}
        </div>
      </div>
    </section>
  );
}
