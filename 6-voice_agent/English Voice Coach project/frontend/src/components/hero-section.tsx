import { ArrowRight, AudioWaveform, GraduationCap, Sparkles } from "lucide-react";

import { PipelineFlow } from "./pipeline-flow";

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-white/6"
    >
      <div className="hero-grid absolute inset-0 opacity-45" aria-hidden="true" />
      <div
        className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-20 lg:px-8 lg:pb-28 lg:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-sm text-cyan-100">
            <Sparkles size={15} aria-hidden="true" />
            Real-time English practice, explained as it runs
          </div>

          <h1 className="text-balance text-5xl font-semibold tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Speak with confidence.
            <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              Learn how voice AI works.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-300">
            Practice English conversation with an AI voice tutor that listens,
            corrects kindly, explains briefly, and keeps the discussion moving.
            Built as a transparent Pipecat learning project.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#practice"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Start practice
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href="#learn"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 font-medium text-white transition hover:bg-white/9"
            >
              <GraduationCap size={18} aria-hidden="true" />
              Explore the architecture
            </a>
          </div>

          <div className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <AudioWaveform size={16} className="text-cyan-300" />
              Real WebRTC audio
            </span>
            <span>OpenAI STT · LLM · TTS</span>
            <span>No API key in the browser</span>
          </div>
        </div>

        <div className="mt-16 rounded-[28px] border border-white/10 bg-[#0b1728]/75 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">
                The chained voice pipeline
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Every stage is visible, measurable, and replaceable.
              </p>
            </div>
            <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Educational architecture
            </span>
          </div>
          <PipelineFlow />
        </div>
      </div>
    </section>
  );
}
