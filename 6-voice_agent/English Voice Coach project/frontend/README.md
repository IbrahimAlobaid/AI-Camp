# English Voice Coach Frontend

This folder contains a Vite, React, and TypeScript interface for the Pipecat
voice agent. It uses Pipecat's official browser client, React bindings, and
Small WebRTC transport.

Use Node.js 22.14 or newer. This matches the current Small WebRTC dependency
chain and avoids npm engine warnings.

## Run

Start the Python backend first. Then:

```bash
npm install
```

Copy the example browser environment:

```powershell
Copy-Item .env.example .env.local
```

or:

```bash
cp .env.example .env.local
```

Start Vite:

```bash
npm run dev
```

The default frontend URL is `http://localhost:5173`.

## Browser environment

```dotenv
VITE_PIPECAT_API_URL=http://localhost:7860
```

This is a public backend URL, not a secret. Never define `OPENAI_API_KEY` in a
Vite variable because Vite exposes `VITE_*` values to browser code.

## Component structure

```text
src/
|-- app/             # Top-level page composition
|-- components/      # Hero, practice workspace, settings, diagrams, panels
|-- hooks/           # Voice session events, microphone permission, settings
|-- lib/             # Shared Pipecat client and learning helpers
|-- types/           # Session and UI domain types
|-- main.tsx
`-- styles.css
```

## WebRTC integration

`src/lib/pipecat-client.ts` creates one shared `PipecatClient` with
`SmallWebRTCTransport`. `src/hooks/use-voice-session.ts` connects it to:

```text
http://localhost:7860/api/offer
```

The connection request includes the selected learning options as
`requestData`. The Python backend validates and applies them when it constructs
the session worker.

`PipecatClientAudio` plays the remote coach track. RTVI events drive the visible
transcript, feedback, status, and timeline. The interface does not use a fake
conversation API.

## Commands

```bash
npm run lint
npm run build
npm run preview
```

## Accessibility and behavior

- Native buttons, labels, and select controls are keyboard accessible.
- Status is communicated with text as well as color and animation.
- Motion is reduced when the operating system requests reduced motion.
- Settings remain editable before connection and lock for an active session.
- Error and empty states explain the next useful action.

## Extension ideas

- Add structured correction events from the backend.
- Add a session summary and downloadable vocabulary list.
- Add authentication before exposing the backend publicly.
- Add TURN credentials for networks that cannot establish direct WebRTC.
- Add end-to-end tests with a controlled audio fixture.
