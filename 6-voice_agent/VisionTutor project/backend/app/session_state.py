from __future__ import annotations

import base64
import json
import re
import threading
import uuid
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image


LEARNING_MODES = {
    "general": "General Tutor",
    "math": "Math Tutor",
    "code": "Code Explainer",
    "document": "Document Explainer",
    "diagram": "Diagram Explainer",
    "medical": "Medical Study Mode",
}
VALID_LANGUAGES = {"auto", "Arabic", "English"}
VALID_LEVELS = {"beginner", "intermediate", "advanced"}
VALID_STYLES = {"short", "detailed", "step_by_step"}


@dataclass(frozen=True)
class CameraFrame:
    """One in-memory camera frame copied from the WebRTC transport."""

    image: bytes
    size: tuple[int, int]
    format: str


@dataclass
class MemoryProfile:
    preferred_language: str = "auto"
    explanation_level: str = "beginner"
    preferred_style: str = "short"
    weak_topics: list[str] = field(default_factory=list)


@dataclass
class SavedNote:
    id: str
    created_at: str
    mode: str
    text: str


class TutorSessionState:
    """Small single-user MVP state for one local VisionTutor AI session."""

    def __init__(self, storage_path: Path) -> None:
        self._lock = threading.RLock()
        self._storage_path = storage_path
        self.latest_frame: CameraFrame | None = None
        self.frozen_frame: CameraFrame | None = None
        self.use_frozen_frame = False
        self.selected_learning_mode = "general"
        self.last_transcript = ""
        self.last_answer = ""
        self.last_used_frame_preview: str | None = None
        self.last_extracted_text = ""
        self.last_tool_result = ""
        self.last_tool_name = ""
        self.generated_quiz: list[str] = []
        self.memory = MemoryProfile()
        self.saved_notes: list[SavedNote] = []
        self._load()

    def reset_for_call(self) -> None:
        """Clear volatile media state while keeping notes, mode, and preferences."""

        with self._lock:
            self.latest_frame = None
            self.frozen_frame = None
            self.use_frozen_frame = False
            self.last_transcript = ""
            self.last_answer = ""
            self.last_used_frame_preview = None
            self.last_extracted_text = ""
            self.last_tool_result = ""
            self.last_tool_name = ""
            self.generated_quiz = []

    def set_latest_frame(self, frame: CameraFrame) -> None:
        with self._lock:
            self.latest_frame = frame

    def freeze_frame(self) -> bool:
        with self._lock:
            if self.latest_frame is None:
                return False
            self.frozen_frame = self.latest_frame
            self.use_frozen_frame = True
            self.last_used_frame_preview = frame_to_jpeg_data_url(self.frozen_frame)
            return True

    def unfreeze_frame(self) -> None:
        with self._lock:
            self.use_frozen_frame = False

    def get_active_frame(self) -> CameraFrame | None:
        with self._lock:
            if self.use_frozen_frame and self.frozen_frame is not None:
                return self.frozen_frame
            return self.latest_frame

    def mark_frame_used(self, frame: CameraFrame) -> None:
        with self._lock:
            self.last_used_frame_preview = frame_to_jpeg_data_url(frame)

    def set_learning_mode(self, mode: str) -> None:
        if mode not in LEARNING_MODES:
            raise ValueError(f"Unsupported learning mode: {mode}")
        with self._lock:
            self.selected_learning_mode = mode

    def update_memory(self, updates: dict[str, Any]) -> MemoryProfile:
        with self._lock:
            language = updates.get("preferred_language", self.memory.preferred_language)
            level = updates.get("explanation_level", self.memory.explanation_level)
            style = updates.get("preferred_style", self.memory.preferred_style)
            weak_topics = updates.get("weak_topics", self.memory.weak_topics)

            if language not in VALID_LANGUAGES:
                raise ValueError("preferred_language must be auto, Arabic, or English")
            if level not in VALID_LEVELS:
                raise ValueError("explanation_level must be beginner, intermediate, or advanced")
            if style not in VALID_STYLES:
                raise ValueError("preferred_style must be short, detailed, or step_by_step")
            if not isinstance(weak_topics, list) or not all(isinstance(item, str) for item in weak_topics):
                raise ValueError("weak_topics must be a list of strings")

            self.memory = MemoryProfile(
                preferred_language=language,
                explanation_level=level,
                preferred_style=style,
                weak_topics=[topic.strip() for topic in weak_topics if topic.strip()],
            )
            self._persist()
            return self.memory

    def set_last_transcript(self, text: str) -> None:
        with self._lock:
            self.last_transcript = text.strip()

    def set_last_answer(self, text: str) -> None:
        with self._lock:
            self.last_answer = text.strip()

    def set_tool_result(self, tool_name: str, result: str) -> None:
        with self._lock:
            self.last_tool_name = tool_name
            self.last_tool_result = result.strip()

    def clear_tool_result(self) -> None:
        with self._lock:
            self.last_tool_name = ""
            self.last_tool_result = ""

    def set_last_extracted_text(self, text: str) -> None:
        with self._lock:
            self.last_extracted_text = text.strip()

    def set_generated_quiz(self, questions: list[str]) -> None:
        with self._lock:
            self.generated_quiz = questions[:5]

    def save_note(self, text: str | None = None) -> SavedNote:
        with self._lock:
            note_text = (text or self.last_answer or self.last_extracted_text or self.last_tool_result).strip()
            if not note_text:
                note_text = "No explanation has been generated yet."
            note_text = re.sub(r"\s+", " ", note_text)[:900]
            note = SavedNote(
                id=str(uuid.uuid4()),
                created_at=datetime.now(UTC).isoformat(),
                mode=self.selected_learning_mode,
                text=note_text,
            )
            self.saved_notes.insert(0, note)
            self.saved_notes = self.saved_notes[:25]
            self._persist()
            return note

    def prompt_context(self) -> dict[str, Any]:
        with self._lock:
            return {
                "selected_learning_mode": self.selected_learning_mode,
                "selected_learning_mode_label": LEARNING_MODES[self.selected_learning_mode],
                "memory": asdict(self.memory),
                "last_tool_name": self.last_tool_name,
                "last_tool_result": self.last_tool_result,
                "last_extracted_text": self.last_extracted_text,
                "use_frozen_frame": self.use_frozen_frame,
            }

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "product_name": "VisionTutor AI",
                "learning_modes": LEARNING_MODES,
                "selected_learning_mode": self.selected_learning_mode,
                "selected_learning_mode_label": LEARNING_MODES[self.selected_learning_mode],
                "use_frozen_frame": self.use_frozen_frame,
                "has_latest_frame": self.latest_frame is not None,
                "has_frozen_frame": self.frozen_frame is not None,
                "last_transcript": self.last_transcript,
                "last_answer": self.last_answer,
                "last_used_frame_preview": self.last_used_frame_preview,
                "last_extracted_text": self.last_extracted_text,
                "last_tool_result": self.last_tool_result,
                "last_tool_name": self.last_tool_name,
                "generated_quiz": self.generated_quiz,
                "memory": asdict(self.memory),
                "saved_notes": [asdict(note) for note in self.saved_notes],
            }

    def _load(self) -> None:
        if not self._storage_path.exists():
            return
        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return

        memory = payload.get("memory", {})
        self.memory = MemoryProfile(
            preferred_language=memory.get("preferred_language", "auto"),
            explanation_level=memory.get("explanation_level", "beginner"),
            preferred_style=memory.get("preferred_style", "short"),
            weak_topics=memory.get("weak_topics", []),
        )
        self.saved_notes = [
            SavedNote(
                id=str(note.get("id", uuid.uuid4())),
                created_at=str(note.get("created_at", "")),
                mode=str(note.get("mode", "general")),
                text=str(note.get("text", "")),
            )
            for note in payload.get("saved_notes", [])
            if note.get("text")
        ][:25]

    def _persist(self) -> None:
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "memory": asdict(self.memory),
            "saved_notes": [asdict(note) for note in self.saved_notes],
        }
        self._storage_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def frame_to_jpeg_data_url(frame: CameraFrame, max_width: int = 360) -> str | None:
    """Return a small JPEG data URL for debugging/trust UI, never persisted."""

    try:
        image = _frame_to_image(frame)
        image.thumbnail((max_width, max_width), Image.Resampling.LANCZOS)
        output = BytesIO()
        image.convert("RGB").save(output, format="JPEG", quality=72, optimize=True)
        encoded = base64.b64encode(output.getvalue()).decode("ascii")
        return f"data:image/jpeg;base64,{encoded}"
    except Exception:
        return None


def _frame_to_image(frame: CameraFrame) -> Image.Image:
    frame_format = frame.format.lower()
    if frame_format in {"jpeg", "jpg", "png", "webp"}:
        return Image.open(BytesIO(frame.image))

    mode = "RGB"
    if frame_format in {"rgba", "bgra"}:
        mode = "RGBA"
    elif frame_format in {"l", "gray", "grayscale"}:
        mode = "L"

    image = Image.frombytes(mode, frame.size, frame.image)
    if frame_format == "bgr":
        red, green, blue = image.split()
        image = Image.merge("RGB", (blue, green, red))
    if frame_format == "bgra":
        blue, green, red, alpha = image.split()
        image = Image.merge("RGBA", (red, green, blue, alpha))
    return image
