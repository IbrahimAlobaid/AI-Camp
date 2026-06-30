"""Run the Pipecat backend for the full-stack English Voice Coach."""

import sys

from loguru import logger

# Pipecat's local runner prints Unicode status symbols. Some Windows terminals
# still default to a legacy code page, so opt into UTF-8 before startup output.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.stt import OpenAISTTService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.workers.runner import WorkerRunner

from config import AppConfig, ConfigurationError
from prompts import build_coach_system_prompt, build_start_conversation_prompt
from session_settings import SessionSettings


# The tutorial uses Pipecat's local WebRTC transport. It supports both the
# custom React frontend and Pipecat's ready-made development client.
TRANSPORT_PARAMS = {
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
    )
}


async def run_voice_coach(
    transport: BaseTransport,
    runner_args: RunnerArguments,
    config: AppConfig,
    session_settings: SessionSettings,
) -> None:
    """Build and run one English-coaching conversation session."""

    logger.info("Starting the English voice coach pipeline")

    # STT means speech-to-text. This service receives a completed speech segment
    # and asks OpenAI to return the learner's English transcript.
    stt = OpenAISTTService(
        api_key=config.openai_api_key,
        settings=OpenAISTTService.Settings(
            model=config.stt_model,
            language="en",
            prompt=(
                "This is an English-learning conversation. Preserve the learner's "
                "actual grammar and wording instead of silently correcting it."
            ),
        ),
    )

    # The LLM reads the conversation transcript, follows the teaching prompt,
    # and streams a concise correction plus a natural conversational response.
    llm = OpenAILLMService(
        api_key=config.openai_api_key,
        settings=OpenAILLMService.Settings(
            model=config.llm_model,
            system_instruction=build_coach_system_prompt(session_settings),
            temperature=0.5,
            max_completion_tokens=220,
        ),
    )

    # TTS means text-to-speech. It turns the LLM's text into 24 kHz audio that
    # Pipecat can stream back to the learner's browser.
    # TODO: Try another supported voice in .env and compare clarity and tone.
    tts = OpenAITTSService(
        api_key=config.openai_api_key,
        settings=OpenAITTSService.Settings(
            model=config.tts_model,
            voice=session_settings.voice,
            instructions=(
                "Speak like a patient, friendly English teacher. Use clear "
                "pronunciation, a warm tone, and a slightly slow pace."
            ),
        ),
    )

    # Conversation context stores previous learner and coach turns. The user
    # aggregator also runs voice activity detection (VAD), which helps Pipecat
    # decide when the learner has stopped speaking and completed a turn.
    context = LLMContext()
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )

    # Frames move through this list in order. This is the central teaching idea:
    # microphone -> STT -> conversation context -> LLM -> TTS -> speaker.
    pipeline = Pipeline(
        [
            transport.input(),  # Receive microphone audio from the browser.
            stt,  # Convert the learner's speech into text.
            user_aggregator,  # Add the learner's completed turn to context.
            llm,  # Generate a correction and conversational response.
            tts,  # Convert the response text into speech.
            transport.output(),  # Send speech audio to the browser speaker.
            assistant_aggregator,  # Save the coach's spoken turn in context.
        ]
    )

    # The worker owns this live pipeline session. OpenAI TTS produces 24 kHz
    # audio, so the output sample rate is set explicitly to match the service.
    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            audio_out_sample_rate=24000,
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        idle_timeout_secs=runner_args.pipeline_idle_timeout_secs,
    )

    # When the learner connects, add a one-time instruction and run the LLM so
    # the coach speaks first instead of waiting silently for microphone input.
    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client) -> None:
        logger.info("Learner connected")
        context.add_message(
            {
                "role": "developer",
                "content": build_start_conversation_prompt(session_settings),
            }
        )
        await worker.queue_frames([LLMRunFrame()])

    # Cancel the worker when the browser disconnects so network and audio
    # resources are released cleanly.
    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client) -> None:
        logger.info("Learner disconnected")
        await worker.cancel()

    # WorkerRunner keeps the pipeline alive and handles Ctrl+C during local use.
    runner = WorkerRunner(handle_sigint=runner_args.handle_sigint)
    await runner.add_workers(worker)
    await runner.run()


async def bot(runner_args: RunnerArguments) -> None:
    """Pipecat runner entry point, called once for each browser session."""

    # Load configuration for this session and create the WebRTC transport selected
    # by the local development runner.
    config = AppConfig.from_env()
    session_settings = SessionSettings.from_payload(
        runner_args.body,
        default_voice=config.tts_voice,
    )
    logger.info(
        "Session settings: level={}, topic={}, style={}, strictness={}, voice={}",
        session_settings.learner_level,
        session_settings.lesson_topic,
        session_settings.teaching_style,
        session_settings.correction_strictness,
        session_settings.voice,
    )
    transport = await create_transport(runner_args, TRANSPORT_PARAMS)
    await run_voice_coach(transport, runner_args, config, session_settings)


def validate_startup_configuration() -> None:
    """Fail before starting the server when the API key is not configured."""

    try:
        AppConfig.from_env()
    except ConfigurationError as exc:
        logger.error(str(exc))
        raise SystemExit(1) from exc


if __name__ == "__main__":
    # Check .env first, then let Pipecat start its local browser-based runner.
    validate_startup_configuration()

    from pipecat.runner.run import app, main

    # A small health endpoint helps the custom frontend distinguish an offline
    # backend from microphone or WebRTC errors.
    @app.get("/healthz")
    async def healthz() -> dict[str, str]:
        return {"status": "ok", "service": "english-voice-coach"}

    main()
