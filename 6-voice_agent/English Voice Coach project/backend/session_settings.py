"""Validated learner settings supplied by the browser for one voice session."""

from dataclasses import dataclass
from typing import Any


LEARNER_LEVELS = {"A1", "A2", "B1", "B2", "C1"}
LESSON_TOPICS = {
    "daily-life",
    "travel",
    "university",
    "career",
    "technology",
}
TEACHING_STYLES = {"encouraging", "concise", "curious"}
CORRECTION_LEVELS = {"gentle", "balanced", "detailed"}
OPENAI_VOICES = {"alloy", "coral", "sage", "verse"}


@dataclass(frozen=True)
class SessionSettings:
    """Settings that customize one learner's coaching session."""

    learner_level: str = "B1"
    lesson_topic: str = "daily-life"
    teaching_style: str = "encouraging"
    correction_strictness: str = "balanced"
    voice: str = "coral"

    @classmethod
    def from_payload(
        cls,
        payload: Any,
        *,
        default_voice: str = "coral",
    ) -> "SessionSettings":
        """Create safe settings from optional WebRTC request data."""

        data = payload if isinstance(payload, dict) else {}

        return cls(
            learner_level=_allowed(
                data.get("learnerLevel"),
                LEARNER_LEVELS,
                "B1",
            ),
            lesson_topic=_allowed(
                data.get("lessonTopic"),
                LESSON_TOPICS,
                "daily-life",
            ),
            teaching_style=_allowed(
                data.get("teachingStyle"),
                TEACHING_STYLES,
                "encouraging",
            ),
            correction_strictness=_allowed(
                data.get("correctionStrictness"),
                CORRECTION_LEVELS,
                "balanced",
            ),
            voice=_allowed(
                data.get("voice"),
                OPENAI_VOICES,
                default_voice if default_voice in OPENAI_VOICES else "coral",
            ),
        )


def _allowed(value: Any, allowed: set[str], fallback: str) -> str:
    """Return a normalized allow-listed string or a safe fallback."""

    normalized = str(value).strip() if value is not None else ""
    return normalized if normalized in allowed else fallback
