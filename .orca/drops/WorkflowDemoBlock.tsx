"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Link2,
  LoaderCircle,
  MoreVertical,
  Paperclip,
  PenLine,
  Save,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getWorkflowScene,
  type WorkflowPhase,
  type WorkflowScene,
} from "./workflow-timeline";

export type WorkflowDemoStep = {
  title: string;
  description: string;
  icon: "workflow" | "connect" | "review";
};

export type WorkflowDemoBlockProps = {
  className?: string;
  steps?: WorkflowDemoStep[];
  prompt?: string;
  modelLabel?: string;
  processingItems?: string[];
  autoPlay?: boolean;
};

const DEFAULT_STEPS: WorkflowDemoStep[] = [
  {
    title: "Describe your workflow",
    description:
      "Inform the agent about what you wish to automate, ranging from daily team summaries to lead follow-ups, ensuring clarity in your request.",
    icon: "workflow",
  },
  {
    title: "Connect your tools",
    description:
      "Link Gmail, Slack, Notion, or any app your team already uses. The agent syncs data between them and builds context automatically.",
    icon: "connect",
  },
  {
    title: "Review and refine",
    description:
      "Every run is transparent. Approve, edit, or rerun workflows anytime — the agent learns from feedback to perform even better next time.",
    icon: "review",
  },
];

const DEFAULT_PROMPT = "Summarize daily team updates from Slack and email";

const DEFAULT_PROCESSING_ITEMS = [
  "Checking Content",
  "Working on insights",
  "Checking permissions and updates",
];

const ICONS = {
  workflow: Workflow,
  connect: Link2,
  review: PenLine,
} as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function useWorkflowClock(autoPlay: boolean, reducedMotion: boolean | null) {
  const [scene, setScene] = useState<WorkflowScene>(() => getWorkflowScene(0));

  useEffect(() => {
    if (!autoPlay || reducedMotion) {
      setScene({ step: 2, phase: "success", progress: 1 });
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      setScene(getWorkflowScene(now - startedAt));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoPlay, reducedMotion]);

  return scene;
}

function StepIcon({ type }: { type: WorkflowDemoStep["icon"] }) {
  const Icon = ICONS[type];
  return <Icon aria-hidden="true" className="h-[18px] w-[18px] stroke-[1.7]" />;
}

function WorkflowSteps({
  steps,
  scene,
}: {
  steps: WorkflowDemoStep[];
  scene: WorkflowScene;
}) {
  return (
    <div className="grid min-h-[444px] grid-rows-3 bg-white">
      {steps.map((step, index) => {
        const active = scene.step === index;
        const progress = active ? scene.progress * 100 : scene.step > index ? 100 : 0;

        return (
          <div
            key={step.title}
            className="relative flex flex-col justify-center border-b border-black/[0.07] px-6 py-7 last:border-b-0 sm:px-8 lg:px-9"
          >
            <div
              className={`flex items-center gap-3 transition-colors duration-500 ${
                active ? "text-neutral-950" : "text-neutral-500"
              }`}
            >
              <StepIcon type={step.icon} />
              <h3 className="text-[17px] font-medium tracking-[-0.02em] sm:text-[18px]">
                {step.title}
              </h3>
            </div>

            <p className="mt-4 max-w-[520px] text-[13px] leading-[1.65] text-neutral-500 sm:text-[14px]">
              {step.description}
            </p>

            <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px overflow-hidden">
              <motion.div
                className="h-full bg-neutral-950"
                animate={{ width: `${progress}%`, opacity: active ? 1 : 0 }}
                transition={{ duration: 0.12, ease: "linear" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModelRow({
  modelLabel,
  phase,
}: {
  modelLabel: string;
  phase: WorkflowPhase;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-neutral-900">
        <span className="grid h-[16px] w-[16px] place-items-center rounded-full text-emerald-500">
          <Sparkles aria-hidden="true" className="h-[15px] w-[15px] stroke-[2]" />
        </span>
        <span className="truncate">{modelLabel}</span>
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-neutral-500" />
      </div>

      <span className="h-4 w-px bg-neutral-200" />

      <button
        type="button"
        aria-label="Attach file"
        className="grid h-7 w-7 place-items-center rounded-md bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
      >
        <Paperclip aria-hidden="true" className="h-4 w-4" />
      </button>

      <div className="ml-auto">
        {phase === "typing" && (
          <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-neutral-950 text-white shadow-sm">
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </div>
        )}
        {phase === "connecting" && (
          <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-neutral-950 text-white shadow-sm">
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          </div>
        )}
        {phase === "success" && (
          <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-neutral-950 text-white shadow-sm">
            <Check aria-hidden="true" className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

function ToolItem({ index, label }: { index: number; label: string }) {
  const badge = index === 0 ? "N" : index === 1 ? "M" : "✓";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2 text-[12px] text-neutral-500"
    >
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border border-neutral-200 bg-white text-[8px] font-semibold text-neutral-600 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        {badge}
      </span>
      <span>
        {index + 1}. {label}
      </span>
    </motion.div>
  );
}

function AgentCard({
  scene,
  prompt,
  modelLabel,
  processingItems,
}: {
  scene: WorkflowScene;
  prompt: string;
  modelLabel: string;
  processingItems: string[];
}) {
  const isTyping = scene.phase === "typing";
  const isConnecting = scene.phase === "connecting";
  const isSuccess = scene.phase === "success";

  const typingProgress = clamp((scene.progress - 0.14) / 0.66);
  const visibleCharacters = Math.floor(prompt.length * typingProgress);
  const typedPrompt = prompt.slice(0, visibleCharacters);
  const showPlaceholder = scene.progress < 0.14;

  const visibleItems = isConnecting
    ? Math.min(processingItems.length, Math.max(1, Math.ceil(scene.progress * 3.3)))
    : 0;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } }}
      className="relative w-[min(360px,calc(100vw-48px))] overflow-hidden rounded-[13px] border border-black/[0.12] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.07),0_2px_5px_rgba(0,0,0,0.06)]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {(isConnecting || isSuccess) && (
          <motion.div
            key={isSuccess ? "success-header" : "connecting-header"}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 36 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center justify-between px-3 text-[11px] font-medium ${
              isSuccess
                ? "bg-emerald-200/80 text-emerald-700"
                : "bg-sky-200/90 text-sky-700"
            }`}
          >
            <span>{isSuccess ? "Execution Summary" : "Connecting tools"}</span>
            <MoreVertical aria-hidden="true" className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="p-4">
        <AnimatePresence initial={false} mode="wait">
          {isSuccess ? (
            <motion.div
              key="success-body"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32 }}
            >
              <p className="mb-5 text-[15px] font-medium tracking-[-0.015em] text-neutral-950">
                Workflow completed successfully
              </p>
              <ModelRow modelLabel={modelLabel} phase={scene.phase} />
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-1.5 text-[12px] text-neutral-500 transition hover:text-neutral-800"
              >
                Save <Save aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={isConnecting ? "connecting-body" : "typing-body"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28 }}
            >
              <div className="min-h-[28px] pr-2 text-[15px] leading-[1.5] tracking-[-0.015em] text-neutral-900">
                {showPlaceholder && isTyping ? (
                  <span className="text-neutral-500">What can i do for you?</span>
                ) : (
                  <span>
                    {isConnecting ? prompt : typedPrompt}
                    {isTyping && typedPrompt.length < prompt.length && (
                      <motion.span
                        aria-hidden="true"
                        className="ml-[1px] inline-block h-[15px] w-px translate-y-[2px] bg-neutral-700"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.7, repeat: Infinity }}
                      />
                    )}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <ModelRow modelLabel={modelLabel} phase={scene.phase} />
              </div>

              <AnimatePresence>
                {isConnecting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2">
                      <AnimatePresence initial={false}>
                        {processingItems.slice(0, visibleItems).map((item, index) => (
                          <ToolItem key={item} index={index} label={item} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function WorkflowDemoBlock({
  className = "",
  steps = DEFAULT_STEPS,
  prompt = DEFAULT_PROMPT,
  modelLabel = "GPT-5-mini",
  processingItems = DEFAULT_PROCESSING_ITEMS,
  autoPlay = true,
}: WorkflowDemoBlockProps) {
  const reducedMotion = useReducedMotion();
  const scene = useWorkflowClock(autoPlay, reducedMotion);

  const normalizedSteps = useMemo(() => {
    if (steps.length === 3) return steps;
    return DEFAULT_STEPS;
  }, [steps]);

  return (
    <section
      className={`overflow-hidden border-y border-black/[0.07] bg-white ${className}`}
      aria-label="Animated workflow demo"
    >
      <div className="mx-auto grid w-full max-w-[1180px] lg:grid-cols-[1fr_1fr]">
        <div className="border-black/[0.07] lg:border-r">
          <WorkflowSteps steps={normalizedSteps} scene={scene} />
        </div>

        <div className="relative grid min-h-[390px] place-items-center overflow-hidden px-6 py-14 lg:min-h-[444px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(17, 24, 39, 0.115) 0.8px, transparent 0.9px)",
              backgroundSize: "14px 14px",
              WebkitMaskImage:
                "radial-gradient(circle at center, black 22%, rgba(0,0,0,.82) 47%, transparent 82%)",
              maskImage:
                "radial-gradient(circle at center, black 22%, rgba(0,0,0,.82) 47%, transparent 82%)",
            }}
          />

          <div className="relative z-10">
            <AgentCard
              scene={scene}
              prompt={prompt}
              modelLabel={modelLabel}
              processingItems={processingItems}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkflowDemoBlock;
