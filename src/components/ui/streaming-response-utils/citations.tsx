"use client";
import {BookOpen, ExternalLink} from "lucide-react";
import {cn} from "cn";

export type CitationItem = {id?: string; title: string; url: string; domain?: string};

export function CitationStack({items, max = 3}: {items: CitationItem[]; max?: number}) {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex -space-x-2">
        {shown.map((item, i) => (
          <span
            key={item.id ?? item.url + i}
            className="grid size-6 place-items-center rounded-md border bg-card text-muted-foreground"
          >
            <BookOpen size={12} aria-hidden="true" />
          </span>
        ))}
      </span>
      {extra > 0 && <span className="text-sm tabular-nums text-muted-foreground">+{extra}</span>}
    </span>
  );
}

export function CitationList({items, className}: {items: CitationItem[]; className?: string}) {
  return (
    <ul className={cn("grid gap-2", className)}>
      {items.map((item, i) => (
        <li key={item.id ?? item.url + i}>
          <a
            href={item.url}
            target={item.url.startsWith("/") ? undefined : "_blank"}
            rel={item.url.startsWith("/") ? undefined : "noreferrer"}
            className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-muted"
          >
            <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
              <BookOpen size={14} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              <span className="block truncate text-sm text-muted-foreground">{item.domain ?? item.url.replace(/^https?:\/\//, "").split("/")[0]}</span>
            </span>
            <ExternalLink size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
