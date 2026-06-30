from __future__ import annotations

from pipecat.frames.frames import Frame, InputImageRawFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.session_state import CameraFrame, TutorSessionState

LatestFrame = CameraFrame


class LatestFrameProcessor(FrameProcessor):
    """Keeps one current camera frame without forwarding frames to an LLM."""

    def __init__(self, session_state: TutorSessionState) -> None:
        super().__init__()
        self._session_state = session_state

    def get_latest_frame(self) -> LatestFrame | None:
        return self._session_state.latest_frame

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        if isinstance(frame, InputImageRawFrame):
            # Copy the bytes because transports are free to reuse their frame buffers.
            self._session_state.set_latest_frame(CameraFrame(
                image=bytes(frame.image),
                size=frame.size,
                format=frame.format,
            ))

        await self.push_frame(frame, direction)
