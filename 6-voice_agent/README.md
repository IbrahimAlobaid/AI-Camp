# Session 6 - Voice Agents

This session introduces practical voice-agent systems. It explains how live audio moves through a chained pipeline, how Pipecat coordinates real-time components, and how to build full-stack educational agents with WebRTC, STT, LLMs, TTS, context, memory, and safe production habits.

## Topics Covered

- Voice-agent fundamentals, latency, turn-taking, streaming, and VAD.
- Chained voice architecture: speech-to-text, LLM reasoning, and text-to-speech.
- Pipecat core concepts: transports, processors, frames, pipelines, workers, runners, and event handlers.
- Context and memory for multi-turn spoken conversations.
- WebRTC transport between a browser frontend and a Python backend.
- Production considerations: secrets, privacy, authentication, retries, observability, cost control, scaling, and safety.
- End-to-end educational voice-agent projects.

## Contents

| Path | Description |
| --- | --- |
| `pipecat docs/` | Course notes for voice-agent concepts, Pipecat architecture, pipelines, frames, STT/LLM/TTS, context, WebRTC, project building, production practices, and glossary terms. |
| `English Voice Coach project/` | Full-stack English learning voice coach using React, Pipecat, WebRTC, OpenAI STT, an LLM coach, and OpenAI TTS. |
| `VisionTutor project/` | Visual voice tutor that combines camera input, voice questions, Pipecat WebRTC transport, OpenAI STT, a vision-capable LLM, TTS, learning modes, notes, quiz generation, and safety rules. |

## Recommended Flow

1. Read `pipecat docs/1-Introduction to project.md`.
2. Continue through the Pipecat notes in order, especially the pipeline, frame, STT/LLM/TTS, context, and WebRTC chapters.
3. Study `English Voice Coach project/` as the main chained voice-agent example.
4. Study `VisionTutor project/` as the multimodal voice-agent extension.
5. Review the production best-practices chapter before deploying or extending either project.

## Project Setup

Each project includes its own README with exact setup and run commands.

General requirements:

- Python 3.11+ or Python 3.12+, depending on the project.
- Node.js and npm for the React frontends.
- An OpenAI API key for STT, LLM, vision, and TTS services.
- A modern browser with microphone permissions; camera permissions are needed for VisionTutor AI.

Keep API keys only in local `.env` files and never commit them.

## Key Libraries

- Pipecat
- OpenAI APIs
- FastAPI
- WebRTC
- React
- Vite
