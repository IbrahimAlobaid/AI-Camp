from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


class ConfigurationError(RuntimeError):
    """Raised when a required application setting is absent."""


@dataclass(frozen=True)
class Settings:
    openai_api_key: str
    openai_stt_model: str
    openai_vision_model: str
    openai_tts_model: str
    openai_tts_voice: str

    @classmethod
    def from_environment(cls) -> "Settings":
        load_dotenv(override=False)
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise ConfigurationError(
                "OPENAI_API_KEY is required. Copy backend/.env.example to backend/.env "
                "and set your OpenAI API key before starting the server."
            )

        return cls(
            openai_api_key=api_key,
            openai_stt_model=os.getenv("OPENAI_STT_MODEL", "gpt-4o-mini-transcribe"),
            openai_vision_model=os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini"),
            openai_tts_model=os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts"),
            openai_tts_voice=os.getenv("OPENAI_TTS_VOICE", "alloy"),
        )
