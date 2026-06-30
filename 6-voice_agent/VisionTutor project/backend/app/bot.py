from __future__ import annotations

from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frameworks.rtvi import RTVIObserverParams
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.stt import OpenAISTTService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.workers.runner import WorkerRunner

from app.config import Settings
from app.processors.answer_state_processor import AnswerStateProcessor
from app.processors.error_fallback_processor import ErrorFallbackProcessor
from app.processors.latest_frame_processor import LatestFrameProcessor
from app.processors.tool_router_processor import ToolRouterProcessor
from app.processors.vision_context_processor import VisionContextProcessor
from app.prompting import BASE_TUTOR_SYSTEM_PROMPT
from app.session_state import TutorSessionState


async def run_bot(
    connection: SmallWebRTCConnection,
    settings: Settings,
    session_state: TutorSessionState,
) -> None:
    """Run one isolated Pipecat pipeline for one WebRTC peer connection."""

    session_state.reset_for_call()
    transport = SmallWebRTCTransport(
        webrtc_connection=connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            video_in_enabled=True,
            video_out_enabled=False,
        ),
    )

    latest_frames = LatestFrameProcessor(session_state)
    stt = OpenAISTTService(
        api_key=settings.openai_api_key,
        settings=OpenAISTTService.Settings(model=settings.openai_stt_model),
    )
    llm = OpenAILLMService(
        api_key=settings.openai_api_key,
        settings=OpenAILLMService.Settings(
            model=settings.openai_vision_model,
            system_instruction=BASE_TUTOR_SYSTEM_PROMPT,
        ),
    )
    tts = OpenAITTSService(
        api_key=settings.openai_api_key,
        settings=OpenAITTSService.Settings(
            model=settings.openai_tts_model,
            voice=settings.openai_tts_voice,
        ),
    )

    context = LLMContext()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )

    pipeline = Pipeline(
        [
            transport.input(),
            latest_frames,
            stt,
            user_aggregator,
            ToolRouterProcessor(session_state),
            VisionContextProcessor(session_state),
            llm,
            ErrorFallbackProcessor(),
            AnswerStateProcessor(session_state),
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )
    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(enable_metrics=True, enable_usage_metrics=True),
        # Enables transcript and bot-output events for the Pipecat web client.
        rtvi_observer_params=RTVIObserverParams(),
    )

    @worker.rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi) -> None:
        """Complete the RTVI handshake required by PipecatClient.connect()."""

        await rtvi.set_bot_ready(about={"name": "VisionTutor AI"})

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport, _client) -> None:
        logger.info("VisionTutor AI client connected")

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _client) -> None:
        logger.info("VisionTutor AI client disconnected")
        await worker.cancel()

    runner = WorkerRunner(handle_sigint=False)
    await runner.add_workers(worker)
    await runner.run()
