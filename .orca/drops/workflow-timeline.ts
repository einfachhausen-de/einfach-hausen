export type WorkflowPhase = "typing" | "connecting" | "success";

export type WorkflowScene = {
  step: 0 | 1 | 2;
  phase: WorkflowPhase;
  progress: number;
};

const SEGMENTS = [
  { start: 0, end: 8_500, step: 0 as const, phase: "typing" as const },
  { start: 8_500, end: 14_500, step: 1 as const, phase: "connecting" as const },
  { start: 14_500, end: 18_000, step: 2 as const, phase: "success" as const },
];

export const WORKFLOW_LOOP_MS = 18_000;

export function getWorkflowScene(elapsedMs: number): WorkflowScene {
  const t = ((elapsedMs % WORKFLOW_LOOP_MS) + WORKFLOW_LOOP_MS) % WORKFLOW_LOOP_MS;
  const segment =
    SEGMENTS.find((item) => t >= item.start && t < item.end) ?? SEGMENTS[0];

  return {
    step: segment.step,
    phase: segment.phase,
    progress: (t - segment.start) / (segment.end - segment.start),
  };
}
