"use client";
import {BookOpen, ExternalLink} from "lucide-react";
import s from "../styles.module.css";

export type CitationItem = {id?: string; title: string; url: string; domain?: string};

export function CitationStack({items, max = 3}: {items: CitationItem[]; max?: number}) {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <span className={s.citationStack}>
      <span className={s.citationStackIcons}>
        {shown.map((item, i) => (
          <span key={item.id ?? item.url + i} className={s.citationStackIcon} aria-hidden="true">
            <BookOpen size={12} />
          </span>
        ))}
      </span>
      {extra > 0 && <span className={s.citationStackExtra}>+{extra}</span>}
    </span>
  );
}

export function CitationList({items}: {items: CitationItem[]}) {
  return (
    <ul className={s.citationList}>
      {items.map((item, i) => (
        <li key={item.id ?? item.url + i}>
          <a className={s.citationItem} href={item.url} target={item.url.startsWith("/") ? undefined : "_blank"} rel={item.url.startsWith("/") ? undefined : "noreferrer"}>
            <span className={s.citationIcon} aria-hidden="true"><BookOpen size={14} /></span>
            <span className={s.citationMeta}><strong>{item.title}</strong><span>{item.domain ?? item.url.replace(/^https?:\/\//, "").split("/")[0]}</span></span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
