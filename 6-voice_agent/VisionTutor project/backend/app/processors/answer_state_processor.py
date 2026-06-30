from __future__ import annotations

from pipecat.frames.frames import (
    Frame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMTextFrame,
    TextFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.learning_tools import extract_quiz_questions
from app.session_state import TutorSessionState


class AnswerStateProcessor(FrameProcessor):
    """Mirrors the final LLM text into the session state for the UI panels."""

    def __init__(self, session_state: TutorSessionState) -> None:
        super().__init__()
        self._state = session_state
        self._parts: list[str] = []
        self._capturing = False

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        if isinstance(frame, LLMFullResponseStartFrame):
            self._capturing = True
            self._parts = []
            self._state.set_last_answer("")

        if isinstance(frame, (TextFrame, LLMTextFrame)):
            text = getattr(frame, "text", "")
            if text:
                self._parts.append(text)
                if not self._capturing:
                    self._finish_answer("".join(self._parts))

        if isinstance(frame, LLMFullResponseEndFrame):
            self._finish_answer("".join(self._parts))
            self._capturing = False

        await self.push_frame(frame, direction)

    def _finish_answer(self, answer: str) -> None:
        answer = answer.strip()
        if not answer:
            return
        self._state.set_last_answer(answer)

        if self._state.last_tool_name == "create_quiz":
            self._state.set_generated_quiz(extract_quiz_questions(answer))
        elif self._state.last_tool_name == "extract_visible_text":
            self._state.set_last_extracted_text(answer)
