import { BookOpen, ExternalLink, Globe } from "lucide-react";
import { cn } from "cn";

export interface CitationItem {
  id: string;
  title: string;
  domain: string;
  url: string;
}

export function CitationStack({ citations }: { citations: CitationItem[] }) {
  return (
    <span className="inline-flex items-center -space-x-1.5" aria-hidden="true">
      {citations.slice(0, 3).map((c, i) => (
        <span
          key={c.id || i}
          className="inline-grid size-4 place-items-center rounded-md border bg-card text-muted-foreground"
        >
          <BookOpen className="size-2.5" />
        </span>
      ))}
    </span>
  );
}

export function CitationList({
  citations,
  idPrefix,
  className,
}: {
  citations: CitationItem[];
  idPrefix?: string;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1.5 text-sm", className)}>
      {citations.map((c, i) => (
        <li key={c.id || i}>
          <a
            id={idPrefix ? `${idPrefix}-${c.id}` : undefined}
            href={c.url}
            target={c.url.startsWith("http") ? "_blank" : undefined}
            rel={c.url.startsWith("http") ? "noopener noreferrer" : undefined}
            className="flex items-center justify-between gap-2 rounded-md p-1.5 transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2 truncate">
              <Globe className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">{c.title}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 text-muted-foreground">
              <span>{c.domain}</span>
              <ExternalLink className="size-3" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
