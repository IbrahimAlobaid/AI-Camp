# English Voice Coach

English Voice Coach is a full-stack educational voice-agent application. A
learner speaks in a React web interface, Pipecat streams the microphone audio to
a Python backend, and OpenAI services transcribe, coach, and speak the reply.

The project teaches two subjects at the same time:

- practical English conversation with supportive corrections;
- the architecture of a real chained voice agent.

## The voice pipeline

```text
Browser microphone
        |
        | WebRTC
        v
Pipecat transport
        |
        v
OpenAI STT  -> learner transcript
        |
        v
OpenAI LLM  -> correction + reply + follow-up question
        |
        v
OpenAI TTS  -> AI-generated speech
        |
        | WebRTC
        v
Browser speaker
```

STT means speech-to-text, LLM means large language model, and TTS means
text-to-speech. Pipecat coordinates these services as a streaming pipeline and
keeps the conversation context between turns.

This project uses a chained pipeline because each stage is visible and can be
studied independently. That makes it easier to teach than a single opaque
speech-to-speech model.

## Full-stack architecture

```text
.
|-- backend/
|   |-- main.py               # Pipecat pipeline and WebRTC runner
|   |-- config.py             # Environment configuration
|   |-- prompts.py            # English-coach behavior
|   |-- session_settings.py   # Safe settings received from the browser
|   |-- requirements.txt
|   `-- README.md
|-- frontend/
|   |-- src/
|   |   |-- app/              # Application composition
|   |   |-- components/       # Reusable interface sections
|   |   |-- hooks/            # Voice session and local settings state
|   |   |-- lib/              # Pipecat client and learning helpers
|   |   `-- types/
|   |-- package.json
|   `-- README.md
|-- docs/article.md            # Original step-by-step tutorial
|-- report/                    # Concise Voice Agent and Pipecat course notes
|-- .env.example
|-- requirements.txt           # Convenience wrapper for backend dependencies
`-- README.md
```

The frontend contains no OpenAI key. It connects only to the local Pipecat
server. The backend reads the key and makes every OpenAI request.

## Prerequisites

- Python 3.11 or newer
- Node.js 22.14 or newer
- npm
- an OpenAI Platform API key with billing enabled
- a current Chromium, Firefox, or Safari browser
- headphones, recommended to reduce acoustic echo

OpenAI API usage is billed separately from a ChatGPT subscription.

## 1. Configure the backend

Create a Python virtual environment from the repository root.

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

macOS or Linux:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create the private environment file:

```powershell
Copy-Item .env.example .env
```

or:

```bash
cp .env.example .env
```

Then put your real key in `.env`:

```dotenv
OPENAI_API_KEY=sk-your-real-key
OPENAI_STT_MODEL=gpt-4o-transcribe
OPENAI_LLM_MODEL=gpt-4.1-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=coral
```

Never place this key in `frontend/` or commit `.env`.

## 2. Run the Pipecat backend

From the repository root:

```bash
python backend/main.py -t webrtc
```

The Pipecat development runner listens on `http://localhost:7860`. The custom
frontend uses:

- `GET /healthz` to show whether the backend is available;
- `POST /api/offer` to negotiate the Small WebRTC connection.

The original Pipecat development client remains available from the URL printed
by the runner, so the underlying voice pipeline can still be tested without the
custom frontend.

## 3. Run the React frontend

Open a second terminal:

```bash
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

On macOS or Linux, use:

```bash
cp .env.example .env.local
```

Open the Vite URL, normally `http://localhost:5173`, and select **Start
practice**. The browser will ask for microphone permission.

The frontend environment contains only a public backend URL:

```dotenv
VITE_PIPECAT_API_URL=http://localhost:7860
```

## What the learner can do

- choose an English level from A1 to C1;
- choose a lesson topic and teaching style;
- choose correction detail and a supported OpenAI voice;
- start, mute, and end a live WebRTC voice session;
- see microphone, STT, LLM, TTS, and speaker states;
- read the final learner transcript and coach response;
- see a correction card when the coach uses the correction format;
- review the conversation history and recent pipeline events.

Settings are stored locally in the browser. At connection time they are sent as
WebRTC request data. The backend validates every value against an allow-list and
uses the accepted values to build the system prompt and select the TTS voice.
Settings are locked while a session is active because each Pipecat worker is
configured when its session starts.

## Educational design choices

### One Pipecat client

The React application creates one shared `PipecatClient`. This avoids duplicate
WebRTC transports, media-device managers, and event listeners during rerenders.

### Events drive the interface

The interface does not simulate voice-agent progress. It listens for Pipecat
RTVI events such as user speech, final transcripts, LLM activity, TTS activity,
bot output, and transport changes.

### Safe session configuration

The browser may request a level, topic, style, strictness, or voice, but the
backend never trusts arbitrary values. `backend/session_settings.py` accepts
only known options and uses safe defaults for anything else.

### A visible chained pipeline

Students can identify exactly where audio becomes text, where teaching behavior
is applied, and where the reply becomes audio. This visibility is the main
reason for using STT -> LLM -> TTS in this tutorial.

## Validation commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
python -m compileall backend
```

## Current limitations

- Pronunciation feedback is indirect. The LLM receives an STT transcript, not
  phoneme-level pronunciation scores.
- The conversation is kept in memory for the current session only.
- The browser and backend are intended for local educational use. Production
  deployment still needs authenticated session creation, HTTPS, TURN
  configuration where required, rate limits, monitoring, and a secrets manager.
- The correction card depends on the coach using the documented phrase
  `A more natural sentence is:`. A production app should send structured
  learning events instead of parsing display text.

## Where to continue

- [Backend guide](backend/README.md)
- [Frontend guide](frontend/README.md)
- [Teaching article](docs/article.md)
- [Voice-agent course report](report/00-introduction.md)
- [Pipecat documentation](https://docs.pipecat.ai/)
