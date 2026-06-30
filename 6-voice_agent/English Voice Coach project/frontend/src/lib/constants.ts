import type {
  CorrectionStrictness,
  LearnerLevel,
  LessonTopic,
  SessionSettings,
  TeachingStyle,
  VoiceName,
} from "../types/voice";

export const DEFAULT_SETTINGS: SessionSettings = {
  learnerLevel: "B1",
  lessonTopic: "daily-life",
  teachingStyle: "encouraging",
  correctionStrictness: "balanced",
  voice: "coral",
};

export const LEARNER_LEVELS: Array<{
  value: LearnerLevel;
  label: string;
  description: string;
}> = [
  { value: "A1", label: "A1", description: "Beginner" },
  { value: "A2", label: "A2", description: "Elementary" },
  { value: "B1", label: "B1", description: "Intermediate" },
  { value: "B2", label: "B2", description: "Upper intermediate" },
  { value: "C1", label: "C1", description: "Advanced" },
];

export const LESSON_TOPICS: Array<{
  value: LessonTopic;
  label: string;
}> = [
  { value: "daily-life", label: "Daily life" },
  { value: "travel", label: "Travel" },
  { value: "university", label: "University" },
  { value: "career", label: "Career" },
  { value: "technology", label: "Technology" },
];

export const TEACHING_STYLES: Array<{
  value: TeachingStyle;
  label: string;
  description: string;
}> = [
  {
    value: "encouraging",
    label: "Encouraging",
    description: "Warm guidance with positive reinforcement.",
  },
  {
    value: "concise",
    label: "Concise",
    description: "Direct feedback with minimal explanation.",
  },
  {
    value: "curious",
    label: "Curious",
    description: "Conversational coaching with deeper follow-ups.",
  },
];

export const CORRECTION_LEVELS: Array<{
  value: CorrectionStrictness;
  label: string;
  description: string;
}> = [
  {
    value: "gentle",
    label: "Gentle",
    description: "Only correct mistakes that affect meaning.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Correct the most useful mistake each turn.",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "Explain up to two useful language points.",
  },
];

export const VOICES: Array<{ value: VoiceName; label: string }> = [
  { value: "coral", label: "Coral" },
  { value: "alloy", label: "Alloy" },
  { value: "sage", label: "Sage" },
  { value: "verse", label: "Verse" },
];

export const PIPELINE_STAGES = [
  { short: "Mic", label: "Microphone", detail: "Browser audio" },
  { short: "STT", label: "Speech to text", detail: "OpenAI transcription" },
  { short: "LLM", label: "LLM coach", detail: "Correction and response" },
  { short: "TTS", label: "Text to speech", detail: "OpenAI voice" },
  { short: "Play", label: "Speaker", detail: "WebRTC audio" },
] as const;
