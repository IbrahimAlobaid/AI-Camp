from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from pipecat.frames.frames import Frame, LLMContextFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.learning_tools import detect_tool_intent
from app.session_state import TutorSessionState


class ToolRouterProcessor(FrameProcessor):
    """Small intent router that adds tool-like results to the next LLM turn."""

    def __init__(self, session_state: TutorSessionState) -> None:
        super().__init__()
        self._state = session_state

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        if isinstance(frame, LLMContextFrame):
            transcript = self._latest_user_text(frame.context.get_messages()) or ""
            self._state.set_last_transcript(transcript)
            self._state.clear_tool_result()

            intent = detect_tool_intent(transcript, self._state.selected_learning_mode)
            if intent is not None:
                tool_name, result = intent
                if tool_name == "save_learning_note":
                    note = self._state.save_note()
                    result = f"Saved this learning note: {note.text}"
                self._state.set_tool_result(tool_name, result)

        await self.push_frame(frame, direction)

    @staticmethod
    def _latest_user_text(messages: list[Any]) -> str | None:
        for message in reversed(messages):
            if not isinstance(message, Mapping) or message.get("role") != "user":
                continue
            content = message.get("content")
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                text_parts = [
                    str(part.get("text", ""))
                    for part in content
                    if isinstance(part, Mapping) and part.get("type") in {"text", "input_text"}
                ]
                text = " ".join(part for part in text_parts if part).strip()
                if text:
                    return text
        return None
