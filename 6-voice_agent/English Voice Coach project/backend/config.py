"""Environment-based configuration for the English Voice Coach backend."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv


class ConfigurationError(RuntimeError):
    """Raised when required local configuration is missing or invalid."""


@dataclass(frozen=True)
class AppConfig:
    """All settings needed by the Pipecat pipeline."""

    openai_api_key: str
    stt_model: str
    llm_model: str
    tts_model: str
    tts_voice: str

    @classmethod
    def from_env(cls) -> "AppConfig":
        """Load settings from .env and validate the required API key."""

        # Load the local .env file without replacing variables already supplied
        # by the operating system or deployment environment.
        load_dotenv()

        # Read the secret separately so we can return a beginner-friendly error
        # instead of a less useful authentication failure later in the pipeline.
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key or api_key == "sk-your-openai-api-key-here":
            raise ConfigurationError(
                "OPENAI_API_KEY is missing. Copy .env.example to .env, "
                "then add your OpenAI API key."
            )

        # Model names remain configurable so students can experiment without
        # editing the Python pipeline itself.
        return cls(
            openai_api_key=api_key,
            stt_model=os.getenv("OPENAI_STT_MODEL", "gpt-4o-transcribe").strip(),
            llm_model=os.getenv("OPENAI_LLM_MODEL", "gpt-4.1-mini").strip(),
            tts_model=os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts").strip(),
            tts_voice=os.getenv("OPENAI_TTS_VOICE", "coral").strip(),
        )
