import Image from "next/image";
import type { StoryStep } from "./types";
import styles from "./premium.module.css";

type StoryStepsProps = {
  eyebrow: string;
  title: string;
  text: string;
  steps: readonly StoryStep[];
};

export function StorySteps({ eyebrow, title, text, steps }: StoryStepsProps) {
  return (
    <section className={[styles.premiumRoot, styles.chapterImmersive, styles.storyChapter].join(" ")}>
      <div className={styles.container}>
        <header className={[styles.chapterHead, styles.storyHead].join(" ")}>
          <div>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <p>{text}</p>
        </header>
        <ol className={styles.storyGrid}>
          {steps.map((step) => (
            <li className={styles.storyCard} key={step.index}>
              <div className={styles.storyImage}>
                <Image
                  src={step.asset.src}
                  alt={step.asset.decorative ? "" : step.asset.alt}
                  aria-hidden={step.asset.decorative || undefined}
                  fill
                  sizes="(max-width: 720px) 100vw, 34vw"
                  className={styles.imageFill}
                  style={{ objectPosition: step.asset.focalPoint ?? "50% 50%" }}
                />
              </div>
              <div className={styles.storyCopy}>
                <span>{step.index}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
