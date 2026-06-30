import {
  CircleStop,
  Mic,
  MicOff,
  Radio,
  ShieldCheck,
  Unplug,
} from "lucide-react";

import type {
  AgentPhase,
  MicrophonePermission,
} from "../types/voice";

interface VoiceStageCardProps {
  phase: AgentPhase;
  phaseLabel: string;
  transportState: string;
  permission: MicrophonePermission;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  backendOnline: boolean | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
}

const PHASE_COPY: Record<AgentPhase, string> = {
  offline: "Choose your lesson settings, then connect your microphone.",
  connecting: "Negotiating a secure browser-to-backend WebRTC session.",
  ready: "Speak naturally. The coach will wait for the end of your turn.",
  listening: "Your voice is flowing to speech-to-text.",
  thinking: "The transcript is moving through the LLM coaching stage.",
  speaking: "OpenAI TTS is streaming the coach response to your speaker.",
  error: "Review the message below, then reconnect when the issue is resolved.",
};

export function VoiceStageCard({
  phase,
  phaseLabel,
  transportState,
  permission,
  isConnected,
  isConnecting,
  isMuted,
  backendOnline,
  error,
  onConnect,
  onDisconnect,
  onToggleMute,
}: VoiceStageCardProps) {
  const isAnimated = ["connecting", "listening", "thinking", "speaking"].includes(
    phase,
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-300/14 bg-gradient-to-b from-cyan-300/[0.075] to-white/[0.025] p-6">
      <div
        className="absolute inset-x-10 top-0 h-32 rounded-full bg-cyan-300/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
              isConnected
                ? "bg-emerald-300/10 text-emerald-200"
                : isConnecting
                  ? "bg-cyan-300/10 text-cyan-200"
                  : "bg-white/6 text-slate-300"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                isConnected
                  ? "bg-emerald-300"
                  : isConnecting
                    ? "animate-pulse bg-cyan-300"
                    : "bg-slate-500"
              }`}
            />
            {transportState}
          </span>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {backendOnline === true ? (
              <ShieldCheck size={15} className="text-emerald-300" />
            ) : backendOnline === false ? (
              <Unplug size={15} className="text-rose-300" />
            ) : (
              <Radio size={15} />
            )}
            Backend {backendOnline === null ? "not checked" : backendOnline ? "online" : "offline"}
          </div>
        </div>

        <div className="my-9 flex flex-col items-center text-center">
          <div
            className={`voice-orb ${isAnimated ? "voice-orb-active" : ""} phase-${phase}`}
            aria-hidden="true"
          >
            <div className="voice-ring voice-ring-one" />
            <div className="voice-ring voice-ring-two" />
            <div className="relative z-10 grid size-24 place-items-center rounded-full bg-[#0b1728] shadow-2xl shadow-cyan-950">
              {isMuted ? (
                <MicOff size={34} className="text-rose-300" />
              ) : (
                <Mic size={34} className="text-cyan-200" />
              )}
            </div>
          </div>

          <p className="mt-8 text-xs font-medium uppercase tracking-[0.24em] text-cyan-300">
            Current state
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{phaseLabel}</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            {PHASE_COPY[phase]}
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-300/15 bg-rose-300/8 px-4 py-3 text-sm leading-6 text-rose-100"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isConnecting}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
              isConnected
                ? "bg-rose-300 text-slate-950 hover:bg-rose-200"
                : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            }`}
          >
            {isConnected ? <CircleStop size={19} /> : <Mic size={19} />}
            {isConnected
              ? "End session"
              : isConnecting
                ? "Connecting..."
                : "Start voice session"}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            disabled={!isConnected}
            aria-pressed={isMuted}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 font-medium text-white transition hover:bg-white/9 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isMuted ? <Mic size={18} /> : <MicOff size={18} />}
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Microphone: {permission}</span>
          <span>AI-generated voice</span>
        </div>
      </div>
    </section>
  );
}
