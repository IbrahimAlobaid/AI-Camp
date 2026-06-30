# VisionTutor AI

VisionTutor AI is a visual voice tutor for students.

Marketing sentence: **Talk to your camera and learn from anything you see.**

Arabic sentence: **افتح الكاميرا، اسأل بصوتك، وتعلم من أي شيء أمامك.**

The student starts a WebRTC video call, points the camera at learning material, asks a question by voice, and receives a short spoken explanation. The app is focused on books, code, diagrams, documents, math problems, and study material rather than being a generic camera assistant.

## Architecture

```text
Browser (React + Vite + Pipecat client)
  camera + microphone
  mode / freeze / memory controls
          |
          | WebRTC signaling through FastAPI
          v
FastAPI + Pipecat SmallWebRTCTransport
  -> LatestFrameProcessor (stores one current frame in memory)
  -> OpenAI STT
  -> user turn/context aggregation
  -> ToolRouterProcessor (simple voice intent routing)
  -> VisionContextProcessor (adds prompt + exactly one frame)
  -> OpenAI vision-capable LLM
  -> AnswerStateProcessor (mirrors answer/quiz/text into UI state)
  -> OpenAI TTS
  -> WebRTC audio back to the browser
```

The backend does not save raw images or audio. It keeps only the latest in-memory camera frame and attaches exactly one selected frame to each LLM request. It does not continuously stream video frames to OpenAI.

## Key features

- Product rebrand to **VisionTutor AI**
- Live latest-frame vision behavior
- Freeze / unfreeze frame control
- “Frame used for this answer” preview
- Learning mode selector
- Spoken answers with OpenAI TTS
- Simple student memory/preferences
- Saved notes
- Quiz generation
- Prompt-level educational safety, especially for Medical Study Mode

## Latest frame vs frozen frame

By default, VisionTutor AI answers using the newest camera frame available when the student finishes speaking.

If the student clicks **Freeze Frame**, the backend copies the current latest frame into memory and uses that frozen frame for future questions. Clicking **Unfreeze Frame** returns the system to the live latest frame.

Frozen images are not saved to disk.

## Learning modes

- **General Tutor**: simple explanations for visible educational content
- **Math Tutor**: step-by-step math help, not just final answers
- **Code Explainer**: explains visible code and concise fixes
- **Document Explainer**: reads, summarizes, and explains visible text
- **Diagram Explainer**: explains diagrams, charts, arrows, and relationships
- **Medical Study Mode**: educational-only medical study help; no diagnosis, dosage, prescriptions, or treatment instructions

The selected mode is stored in the backend session state and injected into the LLM prompt on each turn.

## Tools in this MVP

The backend includes a small internal tool router. It detects simple voice intents and adds the result or instruction to the next LLM turn.

Implemented intents:

- “make a quiz” -> `create_quiz`
- “save this note” -> `save_learning_note`
- “read the text” -> `extract_visible_text`
- “summarize this page” -> `summarize_visible_content`
- Medical diagnosis/treatment-style requests in Medical Study Mode -> safe educational fallback

The quiz and notes also have simple UI buttons.

## Memory

The app keeps a single local MVP student profile in `backend/data/student_memory.json`.

Memory fields:

- preferred language: auto, Arabic, English
- explanation level: beginner, intermediate, advanced
- preferred style: short, detailed, step-by-step
- saved notes

Raw camera frames are never persisted.

## Optional RAG direction

The current MVP is structured so a future RAG layer can be added behind `search_knowledge_base` without changing the WebRTC/Pipecat flow. A full PDF upload and embeddings vector store is intentionally left out of this first clean pass to keep the demo stable and easy to explain.

Recommended next endpoints:

- `POST /knowledge/upload`
- `GET /knowledge/files`
- `DELETE /knowledge/files/{file_id}`

Recommended implementation:

- extract PDF text
- chunk pages
- embed chunks with OpenAI embeddings
- store metadata locally
- retrieve chunks only when the user asks to use uploaded sources or when Document/Medical modes make it relevant

## Safety layer

Safety is handled through a dedicated prompt builder plus rule-based medical intent detection.

General rules:

- say when the frame is unclear
- do not claim certainty from blurry images
- do not infer sensitive attributes about people
- avoid unsafe instructions

Medical Study Mode:

- allowed: educational anatomy, physiology, textbook, device, and guideline explanations
- not allowed: diagnosis, prescription, dosage, emergency treatment, or telling the user to take/stop medication

Safe fallback:

> I can explain this for educational purposes, but I cannot diagnose or prescribe treatment. Please consult a qualified healthcare professional for medical decisions.

## Backend setup

Prerequisites:

- Python 3.12+
- `uv`
- OpenAI API key

```powershell
cd backend
Copy-Item .env.example .env
# Edit .env and set OPENAI_API_KEY
uv sync
uv run uvicorn app.main:app --reload --port 7860
```

Health check:

```text
http://localhost:7860/health
```

## Frontend setup

Prerequisites:

- Node.js 20+

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment variables

Backend:

```dotenv
OPENAI_API_KEY=your_api_key_here
OPENAI_STT_MODEL=gpt-4o-mini-transcribe
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
```

Frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:7860
```

`VITE_API_BASE_URL` is optional and defaults to `http://localhost:7860`.

## Example voice questions

General:

- What do you see?
- Explain this to me.

Math:

- Solve this problem step by step.
- What is the next step?

Code:

- Explain this code.
- What is the bug here?

Document:

- Summarize this page.
- Read the visible text.

Diagram:

- Explain this diagram.
- What do the arrows mean?

Medical Study:

- Explain this ECG concept for study.
- What does this textbook paragraph mean?

Notes and quiz:

- Save this as a note.
- Make a quiz.
- Ask me questions about this.
- Explain it more simply.
- Give me an example.

## Verification

Backend:

```powershell
cd backend
uv sync
uv run python -m compileall app
uv run uvicorn app.main:app --reload --port 7860
```

Then test:

```text
GET http://localhost:7860/health
```

Frontend:

```powershell
cd frontend
npm install
npm run build
npm run dev
```

Manual test checklist:

1. Start the backend.
2. Start the frontend.
3. Open the app.
4. Select **Start Call** and grant camera/microphone permissions.
5. Point the camera at learning material.
6. Ask “What do you see?”
7. Freeze the frame.
8. Move the camera.
9. Ask another question and verify the frozen frame is used.
10. Unfreeze and verify the live frame is used again.
11. Change mode to Math Tutor and ask a math question.
12. Change mode to Code Explainer and ask about visible code.
13. Say “make a quiz.”
14. Say “save this as a note.”
15. In Medical Study Mode, ask a diagnosis-style question and verify the answer stays educational and safe.

For deployment outside localhost, serve over HTTPS and configure TURN/STUN appropriately for WebRTC.
