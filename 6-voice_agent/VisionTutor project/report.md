# VisionTutor AI — Project Report

VisionTutor AI is a focused educational voice-and-vision web app. A student opens the browser, starts a WebRTC video call, points the camera at learning material, asks by voice, and receives a short spoken explanation.

Marketing sentence: **Talk to your camera and learn from anything you see.**

Arabic sentence: **افتح الكاميرا، اسأل بصوتك، وتعلم من أي شيء أمامك.**

## Product purpose

The project evolved from a generic “ask what the camera sees” demo into a visual voice tutor for students. It is designed for books, math problems, code, documents, diagrams, and study material.

The assistant uses:

- the user’s spoken question
- one selected camera frame
- the active learning mode
- simple tool intent routing
- saved preferences and notes
- educational safety rules
- OpenAI STT, vision LLM, and TTS

## Runtime flow

```text
Student opens camera
  ↓
Uses live latest frame or freezes a frame
  ↓
Asks by voice
  ↓
OpenAI STT
  ↓
Learning mode + memory + safety prompt
  ↓
Vision understanding over one selected frame
  ↓
Optional simple tool intent
  ↓
OpenAI TTS
  ↓
Spoken explanation
  ↓
UI shows transcript, explanation, used frame, notes, and quiz
```

## Backend

Location: `backend/`

The backend is a FastAPI app using Pipecat Small WebRTC transport.

Important files:

- `backend/app/main.py`: FastAPI app, WebRTC offer/ICE endpoints, health check, session endpoints, notes endpoint, quiz endpoint.
- `backend/app/bot.py`: Pipecat pipeline assembly for one WebRTC peer connection.
- `backend/app/config.py`: OpenAI model and API key environment configuration.
- `backend/app/session_state.py`: single-user MVP session state, memory profile, saved notes, latest/frozen frame state, JPEG preview generation.
- `backend/app/prompting.py`: VisionTutor AI base identity, mode prompts, memory injection, and safety rules.
- `backend/app/learning_tools.py`: simple rule-based intent detection for quiz, note saving, OCR-style reading, summarization, and medical safety.
- `backend/app/processors/latest_frame_processor.py`: copies only the newest `InputImageRawFrame` into memory.
- `backend/app/processors/vision_context_processor.py`: injects the prompt and attaches exactly one active frame to each LLM turn.
- `backend/app/processors/tool_router_processor.py`: detects simple voice tool intents before the LLM call.
- `backend/app/processors/answer_state_processor.py`: mirrors final LLM output into session state for the frontend.
- `backend/app/processors/error_fallback_processor.py`: converts OpenAI/Pipecat error frames into a spoken fallback message.
- `backend/pyproject.toml`: backend dependencies.

## Frontend

Location: `frontend/`

The frontend is a React + Vite + TypeScript app using the Pipecat JavaScript client and Small WebRTC transport.

Important files:

- `frontend/src/App.tsx`: main UI, call lifecycle, Pipecat client setup, bot audio track attachment, session polling, mode/freeze/memory/note/quiz controls.
- `frontend/src/styles.css`: responsive educational product UI.
- `frontend/src/main.tsx`: React app entry point.
- `frontend/index.html`: browser document title and theme color.
- `frontend/package.json`: frontend scripts and dependencies.

## Implemented features

- Rebrand to **VisionTutor AI**
- Educational landing copy and workflow steps
- Start/stop WebRTC call
- Local camera preview
- Bot audio playback through a hidden audio element
- Learning mode selector:
  - General Tutor
  - Math Tutor
  - Code Explainer
  - Document Explainer
  - Diagram Explainer
  - Medical Study Mode
- Freeze / unfreeze frame control
- Backend uses frozen frame when enabled, otherwise live latest frame
- “Frame used for this answer” JPEG preview
- Last transcript panel
- Last explanation panel
- Saved notes panel
- Quiz panel
- Student settings panel:
  - language
  - level
  - response style
- Local JSON memory for preferences and saved notes
- Prompt-level safety and medical-risk routing

## Privacy and frame handling

The backend does not persist raw camera frames.

It keeps:

- `latest_frame`: the newest in-memory camera frame
- `frozen_frame`: an optional copied frame when the user freezes
- `use_frozen_frame`: whether frozen or live frame is active
- `last_used_frame_preview`: a temporary compressed JPEG data URL for UI display

Only one frame is attached to each LLM request. Continuous video is not streamed to the LLM.

## Local setup

Backend:

```powershell
cd backend
Copy-Item .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 7860
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Verification performed

- `uv sync`
- `uv run python -m compileall app`
- FastAPI TestClient checks for:
  - `GET /health`
  - `GET /session`
  - `PATCH /session/mode`
  - `PATCH /session/memory`
  - `POST /session/freeze`
  - `POST /notes`
  - `POST /quiz`
- `npm install`
- `npm run build`

## Current limitation

The first clean MVP does not yet include full PDF upload + embeddings RAG. The README documents the recommended next endpoints and implementation path for adding it without changing the core Pipecat/WebRTC architecture.
