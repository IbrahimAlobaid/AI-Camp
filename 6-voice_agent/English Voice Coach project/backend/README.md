# English Voice Coach Backend

This folder contains the Python and Pipecat side of the application. It owns the
OpenAI credentials, receives browser audio over WebRTC, and runs the chained
STT -> LLM -> TTS pipeline.

## Files

- `main.py` creates services, context aggregators, the pipeline, and the worker.
- `config.py` loads and validates backend environment variables.
- `prompts.py` builds a session-specific English teaching prompt.
- `session_settings.py` validates options sent by the frontend.
- `requirements.txt` pins Pipecat and its required extras.

## Run

From the repository root:

```bash
python -m venv .venv
```

Activate the environment and install dependencies:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env`, add a real `OPENAI_API_KEY`, then run:

```bash
python backend/main.py -t webrtc
```

The server normally starts on `http://localhost:7860`.

## Request flow

```text
POST /api/offer
  requestData:
    learnerLevel
    lessonTopic
    teachingStyle
    correctionStrictness
    voice
        |
        v
SessionSettings.from_payload()
        |
        v
prompt + TTS voice configured for one worker
        |
        v
WebRTC audio session
```

The frontend values are untrusted input. They are validated against allow-lists
before they affect the prompt or TTS configuration.

## Pipeline

```python
pipeline = Pipeline(
    [
        transport.input(),
        stt,
        user_aggregator,
        llm,
        tts,
        transport.output(),
        assistant_aggregator,
    ]
)
```

The user and assistant aggregators keep the LLM conversation history. Silero
VAD helps identify completed learner turns.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Secret used only by the backend |
| `OPENAI_STT_MODEL` | Speech-to-text model |
| `OPENAI_LLM_MODEL` | Conversation and correction model |
| `OPENAI_TTS_MODEL` | Text-to-speech model |
| `OPENAI_TTS_VOICE` | Fallback voice when the client sends no valid voice |

## Educational experiments

- Add another allow-listed lesson topic.
- Adjust prompts for exam preparation or business English.
- Emit structured correction data instead of parsing coach text.
- Persist anonymized session summaries after obtaining user consent.
- Compare VAD settings and observe turn-taking latency.

Do not add the OpenAI key to frontend code or a browser environment variable.

