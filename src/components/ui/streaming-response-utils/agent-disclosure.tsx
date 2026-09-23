"use client";
import * as React from "react";
import {ChevronDown} from "lucide-react";
import {cn} from "cn";

export function AgentDisclosure({
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  summary,
  className,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  summary: React.ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open! : internal;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternal(v);
    onOpenChange?.(v);
  };
  return (
    <details
      open={isOpen}
      onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}
      className={cn("overflow-hidden rounded-lg border bg-card", className)}
    >
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-2">{summary}</span>
        <ChevronDown size={14} className={cn("shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
      </summary>
      <div className="border-t bg-card p-2">{children}</div>
    </details>
  );
}
