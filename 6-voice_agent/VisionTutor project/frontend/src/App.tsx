import { useCallback, useEffect, useRef, useState } from "react";
import type { PipecatClient } from "@pipecat-ai/client-js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7860").replace(/\/$/, "");

type CallStatus = "Ready" | "Requesting permissions" | "Connecting" | "Connected" | "Stopped" | "Error";
type LearningMode = "general" | "math" | "code" | "document" | "diagram" | "medical";
type PreferredLanguage = "auto" | "Arabic" | "English";
type ExplanationLevel = "beginner" | "intermediate" | "advanced";
type PreferredStyle = "short" | "detailed" | "step_by_step";

type MemoryProfile = {
  preferred_language: PreferredLanguage;
  explanation_level: ExplanationLevel;
  preferred_style: PreferredStyle;
  weak_topics: string[];
};

type SavedNote = {
  id: string;
  created_at: string;
  mode: LearningMode;
  text: string;
};

type SessionSnapshot = {
  product_name: string;
  learning_modes: Record<LearningMode, string>;
  selected_learning_mode: LearningMode;
  selected_learning_mode_label: string;
  use_frozen_frame: boolean;
  has_latest_frame: boolean;
  has_frozen_frame: boolean;
  last_transcript: string;
  last_answer: string;
  last_used_frame_preview: string | null;
  last_extracted_text: string;
  last_tool_result: string;
  last_tool_name: string;
  generated_quiz: string[];
  memory: MemoryProfile;
  saved_notes: SavedNote[];
};

const DEFAULT_MEMORY: MemoryProfile = {
  preferred_language: "auto",
  explanation_level: "beginner",
  preferred_style: "short",
  weak_topics: [],
};

const LEARNING_MODE_HELP: Record<LearningMode, string> = {
  general: "Simple explanations for anything educational.",
  math: "Step-by-step help for visible problems.",
  code: "Explains code and visible bugs concisely.",
  document: "Reads, summarizes, and explains text.",
  diagram: "Explains relationships, arrows, and labels.",
  medical: "Study-only explanations with medical safety rules.",
};

function readableMediaError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Camera or microphone permission was denied. Allow both permissions, then try again.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No camera or microphone was found on this device.";
  }
  return error instanceof Error ? error.message : "Unable to start the call.";
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      detail = payload.detail ?? detail;
    } catch {
      // Keep the generic detail.
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export default function App() {
  const clientRef = useRef<PipecatClient | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const botAudioRef = useRef<HTMLAudioElement | null>(null);
  const answerBufferRef = useRef("");
  const [status, setStatus] = useState<CallStatus>("Ready");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [lastTranscript, setLastTranscript] = useState("Waiting for a spoken learning question.");
  const [lastAnswer, setLastAnswer] = useState("Your spoken explanation will appear here.");

  const refreshSession = useCallback(async () => {
    try {
      const snapshot = await apiJson<SessionSnapshot>("/session");
      setSession(snapshot);
      if (snapshot.last_transcript) setLastTranscript(snapshot.last_transcript);
      if (snapshot.last_answer) setLastAnswer(snapshot.last_answer);
    } catch {
      // The backend may not be running yet; keep the UI usable.
    }
  }, []);

  const attachLocalPreview = useCallback((client: PipecatClient) => {
    const videoTrack = client.tracks().local.video;
    if (videoRef.current && videoTrack) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
    }
  }, []);

  const attachBotAudioTrack = useCallback((audioTrack: MediaStreamTrack) => {
    const audioElement = botAudioRef.current;
    if (!audioElement || !audioTrack) return;

    audioElement.muted = false;
    audioElement.volume = 1;
    const currentStream = audioElement.srcObject as MediaStream | null;
    const currentTrack = currentStream?.getAudioTracks()[0];
    if (!currentTrack || currentTrack.id !== audioTrack.id) {
      audioElement.srcObject = new MediaStream([audioTrack]);
    }

    void audioElement.play().catch(() => {
      setError("Browser audio playback was blocked. Click Start Call again, then check your speaker volume.");
    });
  }, []);

  const stopCall = useCallback(async () => {
    const client = clientRef.current;
    clientRef.current = null;
    if (client) {
      await client.disconnect();
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (botAudioRef.current) {
      botAudioRef.current.srcObject = null;
    }
    setStatus("Stopped");
    void refreshSession();
  }, [refreshSession]);

  const startCall = useCallback(async () => {
    if (clientRef.current) return;

    setError(null);
    setLastAnswer("Your spoken explanation will appear here.");
    answerBufferRef.current = "";
    setStatus("Requesting permissions");

    const [{ PipecatClient, RTVIEvent }, { SmallWebRTCTransport }] = await Promise.all([
      import("@pipecat-ai/client-js"),
      import("@pipecat-ai/small-webrtc-transport"),
    ]);
    const transport = new SmallWebRTCTransport();
    const client = new PipecatClient({
      transport,
      enableMic: true,
      enableCam: true,
      callbacks: {
        onTransportStateChanged: (transportState) => {
          if (transportState === "connected" || transportState === "ready") {
            setStatus("Connected");
          }
        },
        onDisconnected: () => setStatus("Stopped"),
      },
    });

    client.on(RTVIEvent.TrackStarted, (track, participant) => {
      if (!participant?.local && track.kind === "audio") {
        attachBotAudioTrack(track);
      }
    });
    client.on(RTVIEvent.UserTranscript, (data: { text: string }) => {
      const transcript = data.text.trim();
      if (!transcript) return;
      answerBufferRef.current = "";
      setLastTranscript(transcript);
      setLastAnswer("Thinking through the frame...");
    });
    client.on(RTVIEvent.BotLlmText, (data: { text: string }) => {
      if (!data.text.trim()) return;
      answerBufferRef.current += data.text;
      setLastAnswer(answerBufferRef.current);
    });

    try {
      clientRef.current = client;
      await client.initDevices();
      attachLocalPreview(client);
      setStatus("Connecting");
      await client.connect({
        webrtcRequestParams: { endpoint: `${API_BASE_URL}/offer` },
      });
      const botAudioTrack = client.tracks().bot?.audio;
      if (botAudioTrack) attachBotAudioTrack(botAudioTrack);
      setStatus("Connected");
      void refreshSession();
    } catch (caughtError) {
      await client.disconnect();
      clientRef.current = null;
      setStatus("Error");
      setError(readableMediaError(caughtError));
    }
  }, [attachBotAudioTrack, attachLocalPreview, refreshSession]);

  const updateMode = useCallback(async (mode: LearningMode) => {
    setError(null);
    setSession((current) => current && { ...current, selected_learning_mode: mode });
    try {
      setSession(await apiJson<SessionSnapshot>("/session/mode", {
        method: "PATCH",
        body: JSON.stringify({ mode }),
      }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update mode.");
    }
  }, []);

  const updateMemory = useCallback(async (updates: Partial<MemoryProfile>) => {
    setError(null);
    const currentMemory = session?.memory ?? DEFAULT_MEMORY;
    const nextMemory = { ...currentMemory, ...updates };
    setSession((current) => current && { ...current, memory: nextMemory });
    try {
      setSession(await apiJson<SessionSnapshot>("/session/memory", {
        method: "PATCH",
        body: JSON.stringify(nextMemory),
      }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update preferences.");
    }
  }, [session?.memory]);

  const toggleFreeze = useCallback(async () => {
    setError(null);
    try {
      const path = session?.use_frozen_frame ? "/session/unfreeze" : "/session/freeze";
      setSession(await apiJson<SessionSnapshot>(path, { method: "POST" }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update the frame mode.");
    }
  }, [session?.use_frozen_frame]);

  const saveCurrentNote = useCallback(async () => {
    setError(null);
    try {
      setSession(await apiJson<SessionSnapshot>("/notes", { method: "POST" }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save a note.");
    }
  }, []);

  const createQuiz = useCallback(async () => {
    setError(null);
    try {
      setSession(await apiJson<SessionSnapshot>("/quiz", { method: "POST" }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create a quiz.");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshSession();
    }, status === "Connected" ? 1200 : 3000);
    return () => window.clearInterval(interval);
  }, [refreshSession, status]);

  useEffect(() => () => {
    void clientRef.current?.disconnect();
  }, []);

  const active = status === "Connected" || status === "Connecting" || status === "Requesting permissions";
  const selectedMode = session?.selected_learning_mode ?? "general";
  const learningModes = session?.learning_modes ?? {
    general: "General Tutor",
    math: "Math Tutor",
    code: "Code Explainer",
    document: "Document Explainer",
    diagram: "Diagram Explainer",
    medical: "Medical Study Mode",
  };
  const memory = session?.memory ?? DEFAULT_MEMORY;
  const notes = session?.saved_notes ?? [];
  const quiz = session?.generated_quiz ?? [];

  return (
    <main className="page-shell">
      <audio ref={botAudioRef} autoPlay playsInline aria-label="Assistant audio" />

      <section className="hero">
        <p className="eyebrow">OPENAI + PIPECAT EDUCATION MVP</p>
        <h1>VisionTutor AI</h1>
        <p className="lede">Talk to your camera and learn from anything you see.</p>
        <div className="steps" aria-label="How it works">
          <span>1. Start a video call</span>
          <span>2. Point at learning material</span>
          <span>3. Ask by voice</span>
          <span>4. Hear an explanation</span>
        </div>
      </section>

      <section className="call-grid" aria-label="VisionTutor AI call">
        <article className="camera-card">
          <div className="card-heading">
            <span className={`status-dot ${status.toLowerCase().replaceAll(" ", "-")}`} />
            <span>{status}</span>
            <span className="frame-pill">{session?.use_frozen_frame ? "Frozen frame" : "Live latest frame"}</span>
          </div>
          <video ref={videoRef} autoPlay muted playsInline aria-label="Your local camera preview" />
          {!active && <div className="camera-placeholder">Your camera preview will appear here.</div>}
        </article>

        <aside className="side-panel">
          <label className="field-label" htmlFor="learning-mode">Learning mode</label>
          <select
            id="learning-mode"
            value={selectedMode}
            onChange={(event) => void updateMode(event.target.value as LearningMode)}
          >
            {(Object.keys(learningModes) as LearningMode[]).map((mode) => (
              <option key={mode} value={mode}>{learningModes[mode]}</option>
            ))}
          </select>
          <p className="mode-help">{LEARNING_MODE_HELP[selectedMode]}</p>

          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => void startCall()} disabled={active}>
              Start Call
            </button>
            <button className="secondary-button" type="button" onClick={() => void stopCall()} disabled={!active}>
              Stop Call
            </button>
          </div>
          <button className="wide-button" type="button" onClick={() => void toggleFreeze()} disabled={!active && !session?.has_latest_frame}>
            {session?.use_frozen_frame ? "Unfreeze Frame" : "Freeze Frame"}
          </button>

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="transcript-card">
            <p className="label">LATEST USER TRANSCRIPT</p>
            <p>{lastTranscript}</p>
          </div>
          <div className="answer-card">
            <p className="label">LAST EXPLANATION</p>
            <p>{lastAnswer}</p>
          </div>
        </aside>
      </section>

      <section className="learning-grid" aria-label="Learning workspace">
        <article className="panel frame-panel">
          <p className="label">FRAME USED FOR THIS ANSWER</p>
          {session?.last_used_frame_preview ? (
            <img src={session.last_used_frame_preview} alt="Frame used for the latest answer" />
          ) : (
            <p className="empty-state">Ask a question to see the selected frame preview here.</p>
          )}
        </article>

        <article className="panel settings-panel">
          <p className="label">STUDENT SETTINGS</p>
          <div className="settings-grid">
            <label>
              Language
              <select
                value={memory.preferred_language}
                onChange={(event) => void updateMemory({ preferred_language: event.target.value as PreferredLanguage })}
              >
                <option value="auto">Auto</option>
                <option value="Arabic">Arabic</option>
                <option value="English">English</option>
              </select>
            </label>
            <label>
              Level
              <select
                value={memory.explanation_level}
                onChange={(event) => void updateMemory({ explanation_level: event.target.value as ExplanationLevel })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>
              Style
              <select
                value={memory.preferred_style}
                onChange={(event) => void updateMemory({ preferred_style: event.target.value as PreferredStyle })}
              >
                <option value="short">Short</option>
                <option value="detailed">Detailed</option>
                <option value="step_by_step">Step by step</option>
              </select>
            </label>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading-row">
            <p className="label">SAVED NOTES</p>
            <button className="mini-button" type="button" onClick={() => void saveCurrentNote()}>Save</button>
          </div>
          {notes.length ? (
            <ul className="note-list">
              {notes.slice(0, 4).map((note) => (
                <li key={note.id}>{note.text}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">Say “save this as a note” or press Save after an explanation.</p>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading-row">
            <p className="label">QUIZ</p>
            <button className="mini-button" type="button" onClick={() => void createQuiz()}>Make quiz</button>
          </div>
          {quiz.length ? (
            <ol className="quiz-list">
              {quiz.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          ) : (
            <p className="empty-state">Say “make a quiz” or press Make quiz after an explanation.</p>
          )}
        </article>
      </section>

      <p className="hint">
        Try: “Solve this step by step”, “Read the visible text”, “Explain this code”, “Summarize this page”, or
        “Explain this medical paragraph for study.”
      </p>
    </main>
  );
}
