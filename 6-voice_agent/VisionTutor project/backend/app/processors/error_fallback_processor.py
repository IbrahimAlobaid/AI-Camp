from __future__ import annotations

from pipecat.frames.frames import ErrorFrame, Frame, TextFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor


OPENAI_FALLBACK = "Sorry, I could not answer that right now. Please try again."


class ErrorFallbackProcessor(FrameProcessor):
    """Turns an upstream OpenAI error into a short response that TTS can speak."""

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        if isinstance(frame, ErrorFrame):
            await self.push_frame(TextFrame(OPENAI_FALLBACK), direction)
            return

        await self.push_frame(frame, direction)
