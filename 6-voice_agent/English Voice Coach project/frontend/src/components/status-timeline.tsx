import { Activity, Check, Circle, TriangleAlert } from "lucide-react";

import type { TimelineEntry } from "../types/voice";

interface StatusTimelineProps {
  entries: TimelineEntry[];
}

export function StatusTimeline({ entries }: StatusTimelineProps) {
  return (
    <section className="rounded-3xl border border-white/8 bg-white/[0.035] p-5">
      <div>
        <h3 className="flex items-center gap-2 font-medium text-white">
          <Activity size={17} className="text-cyan-300" />
          Agent status timeline
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Real events emitted by the Pipecat client and RTVI protocol.
        </p>
      </div>

      <ol className="mt-5 space-y-1" aria-live="polite">
        {entries.length ? (
          entries.map((entry, index) => (
            <li key={entry.id} className="relative flex gap-3 pb-4">
              {index < entries.length - 1 ? (
                <span className="absolute left-[11px] top-6 h-full w-px bg-white/8" />
              ) : null}
              <span
                className={`relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                  entry.tone === "success"
                    ? "bg-emerald-300/12 text-emerald-300"
                    : entry.tone === "error"
                      ? "bg-rose-300/12 text-rose-300"
                      : entry.tone === "active"
                        ? "bg-cyan-300/12 text-cyan-300"
                        : "bg-white/7 text-slate-500"
                }`}
              >
                {entry.tone === "success" ? (
                  <Check size={13} />
                ) : entry.tone === "error" ? (
                  <TriangleAlert size={12} />
                ) : (
                  <Circle size={8} fill="currentColor" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-200">
                    {entry.label}
                  </p>
                  <time className="shrink-0 text-[11px] text-slate-600">
                    {entry.timestamp}
                  </time>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {entry.detail}
                </p>
              </div>
            </li>
          ))
        ) : (
          <li className="rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-6 text-slate-500">
            The timeline will show connection, STT, LLM, TTS, and speaker
            events during a session.
          </li>
        )}
      </ol>
    </section>
  );
}
