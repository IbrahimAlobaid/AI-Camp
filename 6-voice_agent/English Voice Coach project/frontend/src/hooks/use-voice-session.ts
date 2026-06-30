import { RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClient,
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  extractCorrection,
  mergeUniqueSentence,
} from "../lib/learning";
import { PIPECAT_API_URL } from "../lib/pipecat-client";
import type {
  AgentPhase,
  ConversationMessage,
  MicrophonePermission,
  SessionSettings,
  TimelineEntry,
} from "../types/voice";
import { useMicrophonePermission } from "./use-microphone-permission";

const CONNECTING_STATES = new Set([
  "authenticating",
  "authenticated",
  "connecting",
  "connected",
]);

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createMessage(
  role: ConversationMessage["role"],
  text: string,
): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    timestamp: timestamp(),
  };
}

export function useVoiceSession(settings: SessionSettings) {
  const client = usePipecatClient();
  const transportState = usePipecatClientTransportState();
  const { permission, setPermission, refreshPermission } =
    useMicrophonePermission();

  const [phase, setPhase] = useState<AgentPhase>("offline");
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const [latestTranscript, setLatestTranscript] = useState("");
  const [latestFeedback, setLatestFeedback] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const botDraftRef = useRef("");
  const lastCommittedBotTextRef = useRef("");

  const isConnected = transportState === "ready";
  const isConnecting = CONNECTING_STATES.has(transportState);
  const isSessionActive = isConnected || isConnecting;

  const addTimeline = useCallback(
    (
      label: string,
      detail: string,
      tone: TimelineEntry["tone"] = "neutral",
    ) => {
      setTimeline((current) =>
        [
          {
            id: crypto.randomUUID(),
            label,
            detail,
            timestamp: timestamp(),
            tone,
          },
          ...current,
        ].slice(0, 8),
      );
    },
    [],
  );

  const commitBotDraft = useCallback(() => {
    const text = botDraftRef.current.trim();
    if (!text || text === lastCommittedBotTextRef.current) return;

    lastCommittedBotTextRef.current = text;
    setLatestFeedback(text);
    setCorrection(extractCorrection(text));
    setHistory((current) => [...current, createMessage("coach", text)]);
  }, []);

  const checkBackend = useCallback(async () => {
    try {
      const response = await fetch(`${PIPECAT_API_URL}/healthz`);
      const online = response.ok;
      setBackendOnline(online);
      return online;
    } catch {
      setBackendOnline(false);
      return false;
    }
  }, []);

  const resetSession = useCallback(() => {
    setHistory([]);
    setTimeline([]);
    setLatestTranscript("");
    setLatestFeedback("");
    setCorrection(null);
    setError(null);
    botDraftRef.current = "";
    lastCommittedBotTextRef.current = "";
  }, []);

  const connect = useCallback(async () => {
    resetSession();
    setPhase("connecting");
    addTimeline("Connection", "Checking the Pipecat backend", "active");

    if (!(await checkBackend())) {
      const message =
        "The Pipecat backend is offline. Start it on port 7860 and try again.";
      setError(message);
      setPhase("error");
      addTimeline("Backend", message, "error");
      return;
    }

    try {
      await client.connect({
        webrtcRequestParams: {
          endpoint: `${PIPECAT_API_URL}/api/offer`,
          requestData: settings,
          timeout: 20_000,
        },
      });
      await refreshPermission();
    } catch (connectionError) {
      const message =
        connectionError instanceof Error
          ? connectionError.message
          : "Could not connect to the voice coach.";
      setError(message);
      setPhase("error");
      addTimeline("Connection failed", message, "error");
      await refreshPermission();
    }
  }, [
    addTimeline,
    checkBackend,
    client,
    refreshPermission,
    resetSession,
    settings,
  ]);

  const disconnect = useCallback(async () => {
    try {
      await client.disconnect();
    } finally {
      setPhase("offline");
      setIsMuted(false);
      addTimeline("Session ended", "WebRTC connection closed", "neutral");
    }
  }, [addTimeline, client]);

  const toggleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    await client.enableMic(!nextMuted);
    setIsMuted(nextMuted);
    addTimeline(
      "Microphone",
      nextMuted ? "Microphone muted" : "Microphone active",
      nextMuted ? "neutral" : "success",
    );
  }, [addTimeline, client, isMuted]);

  useRTVIClientEvent(
    RTVIEvent.TransportStateChanged,
    useCallback(
      (state) => {
        if (state === "ready") {
          setPhase("ready");
          setError(null);
          addTimeline("Coach ready", "The live pipeline is active", "success");
        } else if (CONNECTING_STATES.has(state)) {
          setPhase("connecting");
        } else if (state === "disconnected") {
          setPhase("offline");
        }
      },
      [addTimeline],
    ),
  );

  useRTVIClientEvent(
    RTVIEvent.UserStartedSpeaking,
    useCallback(() => {
      setPhase("listening");
      addTimeline("Microphone", "Learner is speaking", "active");
    }, [addTimeline]),
  );

  useRTVIClientEvent(
    RTVIEvent.UserStoppedSpeaking,
    useCallback(() => {
      setPhase("thinking");
      addTimeline("STT", "Transcribing the completed turn", "active");
    }, [addTimeline]),
  );

  useRTVIClientEvent(
    RTVIEvent.UserTranscript,
    useCallback((data) => {
      if (!data.final || !data.text.trim()) return;
      const text = data.text.trim();
      setLatestTranscript(text);
      setHistory((current) => [...current, createMessage("learner", text)]);
    }, []),
  );

  useRTVIClientEvent(
    RTVIEvent.BotLlmStarted,
    useCallback(() => {
      botDraftRef.current = "";
      setPhase("thinking");
      addTimeline("LLM coach", "Preparing feedback and a follow-up", "active");
    }, [addTimeline]),
  );

  useRTVIClientEvent(
    RTVIEvent.BotOutput,
    useCallback((data) => {
      if (data.aggregated_by !== "sentence" || !data.text.trim()) return;
      botDraftRef.current = mergeUniqueSentence(
        botDraftRef.current,
        data.text,
      );
      setLatestFeedback(botDraftRef.current);
      setCorrection(extractCorrection(botDraftRef.current));
    }, []),
  );

  useRTVIClientEvent(RTVIEvent.BotLlmStopped, commitBotDraft);

  useRTVIClientEvent(
    RTVIEvent.BotTtsStarted,
    useCallback(() => {
      setPhase("speaking");
      addTimeline("TTS", "Synthesizing the coach voice", "active");
    }, [addTimeline]),
  );

  useRTVIClientEvent(
    RTVIEvent.BotStartedSpeaking,
    useCallback(() => {
      setPhase("speaking");
      addTimeline("Speaker", "Playing AI-generated audio", "active");
    }, [addTimeline]),
  );

  useRTVIClientEvent(
    RTVIEvent.BotStoppedSpeaking,
    useCallback(() => {
      commitBotDraft();
      setPhase("ready");
      addTimeline("Turn complete", "Ready for the learner", "success");
    }, [addTimeline, commitBotDraft]),
  );

  useRTVIClientEvent(
    RTVIEvent.DeviceError,
    useCallback(
      (deviceError) => {
        setPermission("denied");
        const message =
          deviceError instanceof Error
            ? deviceError.message
            : "Microphone access is unavailable.";
        setError(message);
        setPhase("error");
        addTimeline("Microphone error", message, "error");
      },
      [addTimeline, setPermission],
    ),
  );

  useRTVIClientEvent(
    RTVIEvent.Error,
    useCallback(
      (message) => {
        const data =
          typeof message.data === "object" && message.data !== null
            ? (message.data as Record<string, unknown>)
            : null;
        const detail =
          typeof data?.message === "string"
            ? data.message
            : "The voice agent reported an error.";
        setError(detail);
        setPhase("error");
        addTimeline("Agent error", detail, "error");
      },
      [addTimeline],
    ),
  );

  const phaseLabel = useMemo(() => {
    const labels: Record<AgentPhase, string> = {
      offline: "Ready to begin",
      connecting: "Connecting",
      ready: "Listening",
      listening: "Listening",
      thinking: "Thinking",
      speaking: "Coach speaking",
      error: "Needs attention",
    };
    return labels[phase];
  }, [phase]);

  return {
    transportState,
    phase,
    phaseLabel,
    history,
    latestTranscript,
    latestFeedback,
    correction,
    timeline,
    error,
    permission: permission as MicrophonePermission,
    isConnected,
    isConnecting,
    isSessionActive,
    isMuted,
    backendOnline,
    connect,
    disconnect,
    toggleMute,
    checkBackend,
  };
}
