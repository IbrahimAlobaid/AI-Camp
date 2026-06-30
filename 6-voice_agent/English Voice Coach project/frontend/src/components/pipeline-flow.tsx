import { ArrowRight } from "lucide-react";

import { PIPELINE_STAGES } from "../lib/constants";

interface PipelineFlowProps {
  activeStage?: number;
  compact?: boolean;
}

export function PipelineFlow({
  activeStage = -1,
  compact = false,
}: PipelineFlowProps) {
  return (
    <div
      className={`grid items-stretch ${
        compact
          ? "grid-cols-1 gap-2 sm:grid-cols-9"
          : "grid-cols-1 gap-3 md:grid-cols-9"
      }`}
      aria-label="Voice agent pipeline"
    >
      {PIPELINE_STAGES.map((stage, index) => (
        <div key={stage.short} className="contents">
          <div
            className={`group relative rounded-2xl border px-4 py-4 transition ${
              index === activeStage
                ? "border-cyan-300/60 bg-cyan-300/12 shadow-lg shadow-cyan-400/10"
                : "border-white/8 bg-white/[0.035]"
            } ${compact ? "sm:col-span-1" : "md:col-span-1"}`}
          >
            <span
              className={`mb-3 grid size-9 place-items-center rounded-xl text-xs font-bold ${
                index === activeStage
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-white/8 text-cyan-100"
              }`}
            >
              {stage.short}
            </span>
            <p className="text-sm font-medium text-white">{stage.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {stage.detail}
            </p>
          </div>
          {index < PIPELINE_STAGES.length - 1 ? (
            <div className="grid place-items-center text-slate-600 sm:rotate-0 md:col-span-1">
              <ArrowRight
                className="rotate-90 sm:rotate-0"
                size={18}
                aria-hidden="true"
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
