"use client";
import * as React from "react";
import {ChevronDown} from "lucide-react";
import s from "../styles.module.css";

export function AgentDisclosure({
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  summary,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  summary: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open! : internal;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternal(v);
    onOpenChange?.(v);
  };
  return (
    <details open={isOpen} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)} className={s.agentDisclosure}>
      <summary className={s.agentDisclosureSummary}>
        <span className={s.agentDisclosureSummaryText}>{summary}</span>
        <ChevronDown size={14} className={s.agentDisclosureChevron} aria-hidden="true" data-open={isOpen ? "true" : undefined} />
      </summary>
      <div className={s.agentDisclosureBody}>{children}</div>
    </details>
  );
}
