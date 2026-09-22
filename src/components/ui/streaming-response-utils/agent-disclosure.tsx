import type { ReactNode } from "react";
import { cn } from "cn";

export function AgentDisclosure({
  id,
  open,
  children,
  className,
}: {
  id: string;
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div id={id} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}
