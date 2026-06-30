import {
  AudioLines,
  Braces,
  BrainCircuit,
  Cable,
  Mic,
  Network,
  Volume2,
} from "lucide-react";

const CONCEPTS = [
  {
    title: "Voice Agent",
    icon: AudioLines,
    text: "A real-time system that listens, understands, responds, and speaks in a continuous conversation loop.",
  },
  {
    title: "Pipecat",
    icon: Network,
    text: "The orchestration framework that moves typed frames through transports, AI services, context, and lifecycle processors.",
  },
  {
    title: "STT",
    icon: Mic,
    text: "Speech-to-text converts the learner's completed audio turn into an inspectable transcript.",
  },
  {
    title: "LLM",
    icon: BrainCircuit,
    text: "The language model reads conversation context, produces a correction, and asks the next question.",
  },
  {
    title: "TTS",
    icon: Volume2,
    text: "Text-to-speech converts the coach response into 24 kHz audio for browser playback.",
  },
  {
    title: "WebRTC",
    icon: Cable,
    text: "The low-latency media connection carrying microphone and speaker audio between browser and backend.",
  },
] as const;

export function LearningSection() {
  return (
    <section id="learn" className="scroll-mt-24 border-y border-white/6 bg-white/[0.018] py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="section-kicker">Learning layer</p>
            <h2 className="section-title">
              Learn the six concepts behind every turn.
            </h2>
            <p className="section-copy">
              The app is both a language tutor and a live systems diagram. Each
              visible state maps to a real component in the repository.
            </p>
          </div>
          <div className="rounded-3xl border border-violet-300/12 bg-violet-300/[0.045] p-6">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-300/12 text-violet-200">
                <Braces size={21} />
              </span>
              <div>
                <p className="font-medium text-white">Why a chained pipeline?</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Separate STT, LLM, and TTS stages make transcripts,
                  corrections, latency, and voice output independently visible.
                  That clarity is ideal for AI coursework and debugging.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONCEPTS.map(({ title, icon: Icon, text }) => (
            <article
              key={title}
              className="rounded-3xl border border-white/8 bg-[#0a1626] p-6 transition hover:-translate-y-1 hover:border-cyan-300/18"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-cyan-300/9 text-cyan-200">
                <Icon size={21} />
              </span>
              <h3 className="mt-5 text-lg font-medium text-white">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
