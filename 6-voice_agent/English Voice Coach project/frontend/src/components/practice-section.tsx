import { useEffect } from "react";

import { useSessionSettings } from "../hooks/use-session-settings";
import { useVoiceSession } from "../hooks/use-voice-session";
import { LearningPanels } from "./learning-panels";
import { PipelineFlow } from "./pipeline-flow";
import { SettingsPanel } from "./settings-panel";
import { StatusTimeline } from "./status-timeline";
import { VoiceStageCard } from "./voice-stage-card";

export function PracticeSection() {
  const { settings, updateSetting } = useSessionSettings();
  const voice = useVoiceSession(settings);
  const { checkBackend } = voice;

  useEffect(() => {
    void checkBackend();
  }, [checkBackend]);

  const activeStage =
    voice.phase === "listening"
      ? 0
      : voice.phase === "thinking"
        ? 2
        : voice.phase === "speaking"
          ? 4
          : -1;

  return (
    <section id="practice" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="section-kicker">Live practice workspace</p>
          <h2 className="section-title">
            One interface for speaking and understanding the pipeline.
          </h2>
          <p className="section-copy">
            Select a lesson, start the session, and watch real Pipecat events
            move from microphone input through STT, the LLM coach, and TTS.
          </p>
        </div>

        <div className="mb-5 rounded-3xl border border-white/8 bg-white/[0.025] p-4">
          <PipelineFlow activeStage={activeStage} compact />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <VoiceStageCard
            phase={voice.phase}
            phaseLabel={voice.phaseLabel}
            transportState={voice.transportState}
            permission={voice.permission}
            isConnected={voice.isConnected}
            isConnecting={voice.isConnecting}
            isMuted={voice.isMuted}
            backendOnline={voice.backendOnline}
            error={voice.error}
            onConnect={() => void voice.connect()}
            onDisconnect={() => void voice.disconnect()}
            onToggleMute={() => void voice.toggleMute()}
          />
          <SettingsPanel
            settings={settings}
            disabled={voice.isSessionActive}
            onChange={updateSetting}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <LearningPanels
            latestTranscript={voice.latestTranscript}
            latestFeedback={voice.latestFeedback}
            correction={voice.correction}
            history={voice.history}
          />
          <StatusTimeline entries={voice.timeline} />
        </div>
      </div>
    </section>
  );
}
