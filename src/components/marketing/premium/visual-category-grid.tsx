import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { CategoryCard } from "./types";
import styles from "./premium.module.css";

type VisualCategoryGridProps = {
  eyebrow: string;
  title: string;
  text: string;
  items: readonly CategoryCard[];
};

export function VisualCategoryGrid({ eyebrow, title, text, items }: VisualCategoryGridProps) {
  return (
    <section className={[styles.premiumRoot, styles.chapter, styles.categoryChapter].join(" ")}>
      <div className={styles.container}>
        <header className={styles.chapterHead}>
          <div>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <p>{text}</p>
        </header>
        <div className={styles.categoryGrid}>
          {items.map((item) => (
            <a
              className={[styles.categoryCard, styles["tone_" + item.tone]].join(" ")}
              href={item.href}
              key={item.title}
            >
              <Image
                src={item.asset.src}
                alt={item.asset.decorative ? "" : item.asset.alt}
                aria-hidden={item.asset.decorative || undefined}
                fill
                sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, 25vw"
                className={styles.categoryImage}
                style={{ objectPosition: item.asset.focalPoint ?? "50% 50%" }}
              />
              <span className={styles.categoryShade} aria-hidden="true" />
              <span className={styles.categoryCopy}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </span>
              <span className={styles.categoryArrow} aria-hidden="true">
                <ArrowUpRight size={18} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
