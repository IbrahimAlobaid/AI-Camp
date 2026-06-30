from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from pipecat.frames.frames import Frame, LLMContextFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.prompting import NO_CAMERA_INSTRUCTION, build_developer_prompt, is_session_instruction
from app.session_state import TutorSessionState


class VisionContextProcessor(FrameProcessor):
    """Attaches one latest frame to each completed user turn, never a video stream."""

    def __init__(self, session_state: TutorSessionState) -> None:
        super().__init__()
        self._session_state = session_state

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        if isinstance(frame, LLMContextFrame):
            context = frame.context
            # Keep text history, but discard the prior request's image and any stale
            # no-camera instruction. Therefore each LLM request has at most one image.
            clean_messages = [
                message
                for message in context.get_messages()
                if not self._contains_image(message)
                and message != NO_CAMERA_INSTRUCTION
                and not is_session_instruction(message)
            ]
            context.set_messages(clean_messages)
            context.add_message(
                {
                    "role": "developer",
                    "content": build_developer_prompt(self._session_state.prompt_context()),
                }
            )

            latest_frame = self._session_state.get_active_frame()
            if latest_frame is None:
                context.add_message(NO_CAMERA_INSTRUCTION)
            else:
                self._session_state.mark_frame_used(latest_frame)
                question = self._latest_user_text(clean_messages)
                frame_kind = "frozen frame" if self._session_state.use_frozen_frame else "latest live frame"
                await context.add_image_frame_message(
                    format=latest_frame.format,
                    size=latest_frame.size,
                    image=latest_frame.image,
                    text=(
                        f"Use this {frame_kind} to answer the student's question: "
                        f"{question or 'Please describe what you see.'}"
                    ),
                )

        await self.push_frame(frame, direction)

    @staticmethod
    def _contains_image(message: Any) -> bool:
        if not isinstance(message, Mapping):
            return False
        content = message.get("content")
        return isinstance(content, list) and any(
            isinstance(part, Mapping)
            and part.get("type") in {"image_url", "input_image"}
            for part in content
        )

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
