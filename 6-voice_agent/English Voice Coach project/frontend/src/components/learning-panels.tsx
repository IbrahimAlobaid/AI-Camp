import {
  Bot,
  CheckCircle2,
  MessageSquareText,
  Quote,
  ScrollText,
} from "lucide-react";

import type { ConversationMessage } from "../types/voice";

interface LearningPanelsProps {
  latestTranscript: string;
  latestFeedback: string;
  correction: string | null;
  history: ConversationMessage[];
}

export function LearningPanels({
  latestTranscript,
  latestFeedback,
  correction,
  history,
}: LearningPanelsProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border border-white/8 bg-white/[0.035] p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium text-white">
            <MessageSquareText size={17} className="text-cyan-300" />
            Live transcript
          </h3>
          <span className="rounded-full bg-sky-300/10 px-3 py-1 text-xs text-sky-200">
            OpenAI STT
          </span>
        </div>
        <div
          className="mt-4 min-h-32 rounded-2xl border border-white/6 bg-[#081321] p-4"
          aria-live="polite"
        >
          {latestTranscript ? (
            <p className="text-lg leading-8 text-slate-100">
              “{latestTranscript}”
            </p>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              Your finalized speech-to-text transcript will appear here after
              you finish speaking.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-white/[0.035] p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium text-white">
            <Bot size={17} className="text-violet-300" />
            AI feedback
          </h3>
          <span className="rounded-full bg-violet-300/10 px-3 py-1 text-xs text-violet-200">
            LLM coach
          </span>
        </div>
        <div
          className="mt-4 min-h-32 rounded-2xl border border-white/6 bg-[#081321] p-4"
          aria-live="polite"
        >
          {latestFeedback ? (
            <p className="leading-7 text-slate-200">{latestFeedback}</p>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              The coach response will stream here while it is prepared for
              speech synthesis.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-300/12 bg-emerald-300/[0.045] p-5 xl:col-span-2">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-300/12 text-emerald-200">
            {correction ? <Quote size={19} /> : <CheckCircle2 size={19} />}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              Correction card
            </p>
            {correction ? (
              <>
                <h3 className="mt-2 text-lg font-medium text-white">
                  A more natural sentence
                </h3>
                <p className="mt-2 text-xl leading-8 text-emerald-50">
                  “{correction}”
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-lg font-medium text-white">
                  No correction yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  When the coach says “A more natural sentence is,” the actual
                  correction will be extracted from that response and shown
                  here.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 xl:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium text-white">
            <ScrollText size={17} className="text-amber-300" />
            Conversation history
          </h3>
          <span className="text-xs text-slate-500">{history.length} turns</span>
        </div>

        <div className="conversation-list mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {history.length ? (
            history.map((message) => (
              <article
                key={message.id}
                className={`rounded-2xl border p-4 ${
                  message.role === "learner"
                    ? "border-cyan-300/10 bg-cyan-300/[0.04]"
                    : "border-violet-300/10 bg-violet-300/[0.04]"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={`text-xs font-medium uppercase tracking-[0.16em] ${
                      message.role === "learner"
                        ? "text-cyan-300"
                        : "text-violet-300"
                    }`}
                  >
                    {message.role === "learner" ? "Learner" : "AI coach"}
                  </span>
                  <time className="text-xs text-slate-600">
                    {message.timestamp}
                  </time>
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  {message.text}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm leading-6 text-slate-500">
              Connect and speak to build a real conversation history.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
