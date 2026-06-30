export type LearnerLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export type LessonTopic =
  | "daily-life"
  | "travel"
  | "university"
  | "career"
  | "technology";
export type TeachingStyle = "encouraging" | "concise" | "curious";
export type CorrectionStrictness = "gentle" | "balanced" | "detailed";
export type VoiceName = "alloy" | "coral" | "sage" | "verse";

export interface SessionSettings {
  learnerLevel: LearnerLevel;
  lessonTopic: LessonTopic;
  teachingStyle: TeachingStyle;
  correctionStrictness: CorrectionStrictness;
  voice: VoiceName;
}

export type ConversationRole = "learner" | "coach";

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  text: string;
  timestamp: string;
}

export type AgentPhase =
  | "offline"
  | "connecting"
  | "ready"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export type MicrophonePermission =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied";

export interface TimelineEntry {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  tone: "neutral" | "active" | "success" | "error";
}
