import {
  ArrowDown,
  BrainCircuit,
  Mic,
  Monitor,
  Server,
  Volume2,
} from "lucide-react";

const ARCHITECTURE = [
  {
    title: "Browser",
    detail: "React UI, microphone permission, and speaker playback",
    icon: Monitor,
    tone: "cyan",
  },
  {
    title: "WebRTC transport",
    detail: "SmallWebRTC peer connection and RTVI events",
    icon: Mic,
    tone: "cyan",
  },
  {
    title: "Pipecat backend",
    detail: "Pipeline worker, context aggregators, and session lifecycle",
    icon: Server,
    tone: "violet",
  },
  {
    title: "OpenAI model chain",
    detail: "STT transcript → LLM feedback → TTS audio",
    icon: BrainCircuit,
    tone: "violet",
  },
  {
    title: "Browser speaker",
    detail: "AI-generated coach voice and visible learning feedback",
    icon: Volume2,
    tone: "emerald",
  },
] as const;

export function ArchitectureSection() {
  return (
    <section id="architecture" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-kicker">Technical architecture</p>
          <h2 className="section-title">
            A clean boundary between browser experience and AI services.
          </h2>
          <p className="section-copy mx-auto">
            The OpenAI key stays on the Python server. The frontend sends only
            audio, connection data, and learner-selected session settings.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-[30px] border border-white/10 bg-[#0a1626] p-5 shadow-2xl shadow-black/20 sm:p-8">
          <div className="space-y-3">
            {ARCHITECTURE.map(({ title, detail, icon: Icon, tone }, index) => (
              <div key={title}>
                <div className="flex items-center gap-4 rounded-2xl border border-white/7 bg-white/[0.035] p-4">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                      tone === "cyan"
                        ? "bg-cyan-300/10 text-cyan-200"
                        : tone === "violet"
                          ? "bg-violet-300/10 text-violet-200"
                          : "bg-emerald-300/10 text-emerald-200"
                    }`}
                  >
                    <Icon size={21} />
                  </span>
                  <div>
                    <h3 className="font-medium text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {detail}
                    </p>
                  </div>
                </div>
                {index < ARCHITECTURE.length - 1 ? (
                  <div className="grid h-8 place-items-center text-slate-600">
                    <ArrowDown size={17} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/12 bg-amber-300/[0.045] p-4 text-sm leading-6 text-amber-50/80">
            <strong className="text-amber-200">Security boundary:</strong> the
            browser never receives the OpenAI API key. All model calls happen
            inside the Pipecat backend.
          </div>
        </div>
      </div>
    </section>
  );
}
