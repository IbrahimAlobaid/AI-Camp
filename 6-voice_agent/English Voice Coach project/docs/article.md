# Build an English-Learning Voice Agent with Pipecat

A voice agent can look complicated because audio, network connections, language
models, and conversation state all happen at once. Pipecat makes the design
easier to understand by representing the application as an ordered pipeline.

In this tutorial, we build a friendly English conversation coach. A learner
speaks into a browser microphone. OpenAI transcribes the speech, an OpenAI
language model corrects and answers the learner, and OpenAI text-to-speech reads
the answer aloud.

This article targets Python 3.11+ and Pipecat 1.4.0. The project is an
educational MVP, not a production deployment.

## 1. The mental model: audio becomes frames

Pipecat processors receive and emit frames. A frame may contain microphone
audio, a transcript, generated text, synthesized audio, or a control event such
as "the user started speaking."

Our processors are arranged like this:

```text
microphone -> STT -> context -> LLM -> TTS -> speaker
```

The transport is responsible for the two ends:

- `transport.input()` receives microphone audio from the browser.
- `transport.output()` sends generated audio back to the browser.

Everything between those points explains how the agent thinks and speaks.

## 2. STT, LLM, and TTS

### Speech-to-text

STT converts audio into words. This project uses `OpenAISTTService`, which sends
a completed speech segment to OpenAI's transcription API.

Voice activity detection, usually shortened to VAD, helps determine where the
speech segment ends. Without turn detection, the application would not know
when to stop collecting audio and request a transcript.

### Large language model

The LLM receives the transcript and the previous conversation. Its system prompt
defines the teaching method:

1. Understand what the learner meant.
2. Correct important mistakes.
3. Explain the correction briefly.
4. Continue naturally.
5. Ask one follow-up question.

The prompt also tells the model to avoid markdown and long explanations because
the answer will be heard, not read.

### Text-to-speech

TTS converts the coach's text into audio. `OpenAITTSService` streams 24 kHz PCM
audio through Pipecat and back to the browser.

The application provides a voice instruction asking for clear pronunciation, a
warm teaching tone, and slightly slow pacing.

## 3. Why this tutorial uses three models

OpenAI also provides direct speech-to-speech systems. They can reduce latency
and preserve more vocal information. This tutorial deliberately uses separate
STT, LLM, and TTS stages.

The chained architecture gives students three useful controls:

- Inspect or save the exact transcript.
- Change the teaching prompt without changing audio code.
- Change the synthesized voice without changing language-model behavior.

The main cost is additional latency because the learner's turn passes through
three separate model stages.

## 4. Configure the project

The `.env.example` file documents every environment variable:

```dotenv
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_STT_MODEL=gpt-4o-transcribe
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=coral
```

Copy it to `.env` and replace the API key. The real `.env` file is ignored by
Git so the secret is not committed accidentally.

`backend/config.py` loads these values into an immutable `AppConfig` dataclass. It also
checks the key before the local server starts:

```python
api_key = os.getenv("OPENAI_API_KEY", "").strip()
if not api_key or api_key == "sk-your-openai-api-key-here":
    raise ConfigurationError(...)
```

Failing early is educationally useful. The learner sees a direct setup message
instead of a long authentication traceback after connecting the microphone.

## 5. Create the local audio transport

The project uses Pipecat's local WebRTC development runner:

```python
TRANSPORT_PARAMS = {
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
    )
}
```

When `python backend/main.py -t webrtc` runs, Pipecat starts a local server and provides
a browser interface. The browser handles microphone permission and speaker
playback. This avoids adding a custom JavaScript frontend to a Python pipeline
tutorial.

WebRTC is the transport technology; it is not the AI. Its job is to move audio
between the browser and the server with low delay.

## 6. Configure OpenAI speech-to-text

The STT processor is created with explicit settings:

```python
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
```

The transcription prompt matters. An English coach needs to see the learner's
original grammar. If transcription silently rewrites the sentence, the LLM may
lose the mistake it was supposed to explain.

The transcript is still an estimate. STT may normalize punctuation or
misunderstand strongly accented or noisy speech.

## 7. Configure the English coach LLM

The system prompt lives in `backend/prompts.py`, separate from pipeline mechanics:

```python
llm = OpenAILLMService(
    api_key=config.openai_api_key,
    settings=OpenAILLMService.Settings(
        model=config.llm_model,
        system_instruction=ENGLISH_COACH_SYSTEM_PROMPT,
        temperature=0.5,
        max_completion_tokens=220,
    ),
)
```

A moderate temperature allows natural variation while keeping corrections
focused. The completion limit discourages voice responses from becoming long
lectures.

Separating prompts from `backend/main.py` gives students a safe experiment surface.
They can change the tutor personality without touching transport or streaming
code.

## 8. Configure text-to-speech

The TTS processor uses a configurable model and voice:

```python
tts = OpenAITTSService(
    api_key=config.openai_api_key,
    settings=OpenAITTSService.Settings(
        model=config.tts_model,
        voice=config.tts_voice,
        instructions=(
            "Speak like a patient, friendly English teacher. Use clear "
            "pronunciation, a warm tone, and a slightly slow pace."
        ),
    ),
)
```

The voice instruction affects presentation, not grammar decisions. This is a
good example of separation of concerns: the LLM decides what to say, and TTS
decides how it sounds.

Applications should clearly disclose that the voice is AI-generated. This
project does so in its documentation and opening instructions.

## 9. Maintain conversation context

A conversation coach must remember its earlier question. Pipecat's context and
aggregators provide that memory:

```python
context = LLMContext()
user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
    context,
    user_params=LLMUserAggregatorParams(
        vad_analyzer=SileroVADAnalyzer(),
    ),
)
```

The user aggregator collects the learner's completed turn and adds it to the
context. The assistant aggregator stores the coach's response. The next LLM call
therefore sees both sides of the conversation.

Silero VAD analyzes incoming audio and helps identify speaking boundaries.

## 10. Assemble the Pipecat pipeline

The complete processor order is the heart of the application:

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

Order matters:

1. Audio must arrive before STT can transcribe it.
2. The transcript must enter context before the LLM runs.
3. Generated text must reach TTS before audio can be played.
4. The assistant response must be saved for the next turn.

Changing processor order changes behavior. Pipecat pipelines are readable
because this architecture is represented directly as a Python list.

## 11. Run the pipeline worker

`PipelineWorker` owns one live conversation:

```python
worker = PipelineWorker(
    pipeline,
    params=PipelineParams(
        audio_out_sample_rate=24000,
        enable_metrics=True,
        enable_usage_metrics=True,
    ),
    idle_timeout_secs=runner_args.pipeline_idle_timeout_secs,
)
```

The 24 kHz output setting matches OpenAI TTS. Metrics are enabled so students
can inspect timing and usage information in terminal logs.

## 12. Make the coach speak first

When the browser connects, the code adds a one-time developer message and queues
an `LLMRunFrame`:

```python
@transport.event_handler("on_client_connected")
async def on_client_connected(transport, client) -> None:
    context.add_message(
        {
            "role": "developer",
            "content": START_CONVERSATION_PROMPT,
        }
    )
    await worker.queue_frames([LLMRunFrame()])
```

The frame tells Pipecat to run the LLM even though the learner has not spoken
yet. The result becomes the coach's greeting and first question.

The disconnect event cancels the worker so audio and network resources are not
left running.

## 13. Install and run

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on macOS or Linux:

```bash
source .venv/bin/activate
```

Or activate it in Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install and configure:

```bash
pip install -r requirements.txt
```

```powershell
Copy-Item .env.example .env
```

Add the real API key to `.env`, then run:

```bash
python backend/main.py -t webrtc
```

Open the URL printed by Pipecat, allow microphone access, connect, and speak.
Using headphones will reduce the chance that the coach's voice is captured by
the microphone.

## 14. What this MVP cannot measure

The LLM receives text, so it cannot reliably measure pronunciation details such
as vowel quality, stress, rhythm, or individual phonemes. It may infer that a
word was unclear if STT repeatedly produces the wrong transcript, but that is
not a pronunciation score.

A pronunciation-focused extension would need an acoustic or phoneme assessment
service. The current project is strongest at grammar, vocabulary, natural
wording, and conversation practice.

## 15. Experiments for students

Try one change at a time and observe which stage it affects:

1. Prompt experiment: make the coach teach travel English.
2. Level experiment: ask for A2 vocabulary and shorter questions.
3. Voice experiment: change `OPENAI_TTS_VOICE`.
4. Context experiment: save each transcript to a lesson log.
5. Latency experiment: compare HTTP STT with OpenAI realtime STT.
6. Feedback experiment: ask the LLM to name only one correction per turn.

The most important lesson is that a voice agent is not one mysterious model. It
is a pipeline of understandable components, and Pipecat makes those components
explicit enough to study and replace.
