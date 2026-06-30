from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel

from pipecat.transports.smallwebrtc.connection import IceServer, SmallWebRTCConnection
from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCPatchRequest,
    SmallWebRTCRequest,
    SmallWebRTCRequestHandler,
)

from app.bot import run_bot
from app.config import Settings
from app.learning_tools import create_quiz_from_text
from app.session_state import TutorSessionState


settings = Settings.from_environment()
session_state = TutorSessionState(
    storage_path=Path(__file__).resolve().parents[1] / "data" / "student_memory.json"
)
webrtc_handler = SmallWebRTCRequestHandler(
    ice_servers=[IceServer(urls="stun:stun.l.google.com:19302")]
)
bot_tasks: set[asyncio.Task[None]] = set()


class ModeUpdate(BaseModel):
    mode: str


class MemoryUpdate(BaseModel):
    preferred_language: str | None = None
    explanation_level: str | None = None
    preferred_style: str | None = None
    weak_topics: list[str] | None = None


class NoteRequest(BaseModel):
    text: str | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await webrtc_handler.close()
    for task in bot_tasks:
        task.cancel()
    if bot_tasks:
        await asyncio.gather(*bot_tasks, return_exceptions=True)


app = FastAPI(title="VisionTutor AI", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/session")
async def get_session() -> dict:
    return session_state.snapshot()


@app.post("/session/freeze")
async def freeze_frame() -> dict:
    if not session_state.freeze_frame():
        raise HTTPException(status_code=409, detail="No live camera frame is available to freeze yet.")
    return session_state.snapshot()


@app.post("/session/unfreeze")
async def unfreeze_frame() -> dict:
    session_state.unfreeze_frame()
    return session_state.snapshot()


@app.patch("/session/mode")
async def update_mode(update: ModeUpdate) -> dict:
    try:
        session_state.set_learning_mode(update.mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return session_state.snapshot()


@app.patch("/session/memory")
async def update_memory(update: MemoryUpdate) -> dict:
    updates = update.model_dump(exclude_none=True)
    try:
        session_state.update_memory(updates)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return session_state.snapshot()


@app.get("/notes")
async def get_notes() -> dict:
    return {"saved_notes": session_state.snapshot()["saved_notes"]}


@app.post("/notes")
async def save_note(request: NoteRequest | None = None) -> dict:
    session_state.save_note(request.text if request else None)
    return session_state.snapshot()


@app.post("/quiz")
async def create_quiz() -> dict:
    snapshot = session_state.snapshot()
    quiz = create_quiz_from_text(
        snapshot["last_answer"] or snapshot["last_extracted_text"] or snapshot["last_tool_result"]
    )
    session_state.set_generated_quiz(quiz)
    return session_state.snapshot()


async def start_bot(connection: SmallWebRTCConnection) -> None:
    """Start a connection's long-running pipeline without blocking signaling."""

    task = asyncio.create_task(run_bot(connection, settings, session_state))
    bot_tasks.add(task)
    task.add_done_callback(bot_tasks.discard)


@app.post("/offer")
async def offer(request: Request) -> dict[str, str]:
    """Accept an SDP offer from Pipecat's browser Small WebRTC transport."""

    try:
        body = await request.json()
        webrtc_request = SmallWebRTCRequest.from_dict(body)
        answer = await webrtc_handler.handle_web_request(webrtc_request, start_bot)
        if answer is None:
            raise RuntimeError("WebRTC negotiation did not produce an answer")
        return answer
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("WebRTC offer failed")
        raise HTTPException(status_code=500, detail=f"Unable to start the WebRTC call: {exc}") from exc


@app.patch("/offer")
async def ice_candidate(request: SmallWebRTCPatchRequest) -> dict[str, str]:
    """Accept trickle-ICE candidates sent after the initial SDP offer."""

    await webrtc_handler.handle_patch_request(request)
    return {"status": "success"}
