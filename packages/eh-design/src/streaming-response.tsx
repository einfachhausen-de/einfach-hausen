"use client";
import * as React from "react";
import {Check, ChevronDown, Copy, RotateCcw, ThumbsDown, ThumbsUp} from "lucide-react";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {CitationList, CitationStack, type CitationItem} from "./streaming-response-utils/citations";
import {EASE_OUT, SPRING_PRESS, SPRING_SWAP} from "./streaming-response-utils/ease";
import s from "./styles.module.css";

export type StreamingResponseStatus = "streaming" | "complete" | "error";
export type StreamingResponseFeedback = "up" | "down" | null;

function ResponseAction({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={label === "Hilfreich" || label === "Nicht hilfreich" ? active : undefined}
      onClick={onClick}
      whileTap={reduce ? undefined : {scale: 0.9}}
      transition={SPRING_PRESS}
      className={s.streamingActionBtn}
      data-active={active ? "true" : undefined}
    >
      {children}
    </motion.button>
  );
}

export function StreamingResponse({
  children,
  status = "complete",
  copyText,
  onCopy,
  onRetry,
  sources = [],
  sourcesOpen,
  defaultSourcesOpen = false,
  onSourcesOpenChange,
  feedback,
  defaultFeedback = null,
  onFeedbackChange,
  announce = true,
  showActions = true,
  className,
}: {
  children: React.ReactNode;
  status?: StreamingResponseStatus;
  copyText?: string;
  onCopy?: () => void | Promise<void>;
  onRetry?: () => void;
  sources?: CitationItem[];
  sourcesOpen?: boolean;
  defaultSourcesOpen?: boolean;
  onSourcesOpenChange?: (open: boolean) => void;
  sourceIdPrefix?: string;
  feedback?: StreamingResponseFeedback;
  defaultFeedback?: StreamingResponseFeedback;
  onFeedbackChange?: (feedback: StreamingResponseFeedback) => void;
  announce?: boolean;
  showActions?: boolean;
  className?: string;
  contentClassName?: string;
  actionsClassName?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const baseId = React.useId();
  const [copied, setCopied] = React.useState(false);
  const [internalFeedback, setInternalFeedback] = React.useState<StreamingResponseFeedback>(defaultFeedback);
  const [internalSourcesOpen, setInternalSourcesOpen] = React.useState(defaultSourcesOpen);
  const copyTimer = React.useRef<number | undefined>(undefined);
  const currentFeedback = feedback ?? internalFeedback;
  const currentSourcesOpen = sourcesOpen ?? internalSourcesOpen;
  const streaming = status === "streaming";
  const complete = status === "complete";
  const canCopy = Boolean(copyText || onCopy);
  const hasSources = sources.length > 0;
  const shouldShowActions = showActions && !streaming && (canCopy || onRetry || complete || hasSources);
  const sourcesContentId = `${baseId}-sources`;
  const resolvedSourcePrefix = `${baseId.replace(/:/g, "")}`;

  React.useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    []
  );

  const handleCopy = React.useCallback(async () => {
    if (onCopy) await onCopy();
    else if (copyText) await navigator.clipboard?.writeText(copyText);
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1600) as unknown as number;
  }, [copyText, onCopy]);

  const setFeedback = (next: Exclude<StreamingResponseFeedback, null>) => {
    const value = currentFeedback === next ? null : next;
    if (feedback === undefined) setInternalFeedback(value);
    onFeedbackChange?.(value);
  };
  const setSourcesOpen = React.useCallback(
    (next: boolean) => {
      if (sourcesOpen === undefined) setInternalSourcesOpen(next);
      onSourcesOpenChange?.(next);
    },
    [onSourcesOpenChange, sourcesOpen]
  );

  return (
    <div data-state={status} aria-busy={streaming} className={`${s.streamingResponse} ${className ?? ""}`}>
      <div className={s.streamingContent}>
        {children}
        {streaming && <span className={s.streamingDot} aria-hidden="true" />}
      </div>

      <AnimatePresence initial={false}>
        {shouldShowActions ? (
          <motion.div
            initial={reduce ? {opacity: 0} : {opacity: 0, y: 4}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0}}
            transition={{duration: reduce ? 0.12 : 0.22, ease: EASE_OUT}}
          >
            <div className={s.streamingActions}>
              {canCopy ? (
                <ResponseAction label={copied ? "Kopiert" : "Antwort kopieren"} onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </ResponseAction>
              ) : null}
              {onRetry ? (
                <ResponseAction label="Erneut versuchen" onClick={onRetry}>
                  <RotateCcw size={14} />
                </ResponseAction>
              ) : null}
              {complete ? (
                <>
                  <ResponseAction label="Hilfreich" active={currentFeedback === "up"} onClick={() => setFeedback("up")}>
                    <ThumbsUp size={14} />
                  </ResponseAction>
                  <ResponseAction label="Nicht hilfreich" active={currentFeedback === "down"} onClick={() => setFeedback("down")}>
                    <ThumbsDown size={14} />
                  </ResponseAction>
                </>
              ) : null}
              {hasSources ? (
                <button
                  type="button"
                  aria-expanded={currentSourcesOpen}
                  aria-controls={sourcesContentId}
                  onClick={() => setSourcesOpen(!currentSourcesOpen)}
                  className={s.streamingActionBtn}
                  style={{marginLeft: 6, gap: 6, fontSize: 12}}
                >
                  <CitationStack items={sources} />
                  <span style={{fontVariantNumeric:"tabular-nums"}}>{sources.length} {sources.length === 1 ? "Quelle" : "Quellen"}</span>
                  <motion.span aria-hidden="true" animate={{rotate: currentSourcesOpen ? 180 : 0}} transition={reduce ? {duration: 0} : SPRING_SWAP} style={{display:"inline-flex"}}>
                    <ChevronDown size={12} />
                  </motion.span>
                </button>
              ) : null}
            </div>
            {hasSources && currentSourcesOpen ? (
              <div id={sourcesContentId} style={{marginTop: 8}}>
                <CitationList items={sources} />
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {announce && <span className={s.srOnly} role="status" aria-live="polite">{typeof children === "string" ? children : ""}</span>}
    </div>
  );
}
export type {CitationItem};
