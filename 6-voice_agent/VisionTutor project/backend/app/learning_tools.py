from __future__ import annotations

import re


QUIZ_INTENT_RE = re.compile(r"\b(quiz|questions?|test me|ask me)\b|اختبار|أسئلة|اسئلة", re.IGNORECASE)
SAVE_NOTE_INTENT_RE = re.compile(r"\b(save|note|remember)\b|احفظ|ملاحظة|تذكر", re.IGNORECASE)
READ_TEXT_INTENT_RE = re.compile(r"\b(read|extract|ocr|visible text|text in)\b|اقرأ|النص|استخرج", re.IGNORECASE)
SUMMARIZE_INTENT_RE = re.compile(r"\b(summarize|summary|main ideas?|key ideas?)\b|لخص|ملخص|الفكرة", re.IGNORECASE)
MEDICAL_RISK_RE = re.compile(
    r"\b(diagnos(e|is)|prescrib(e|ing)|dosage|dose|treatment|should i take|emergency|medicine)\b"
    r"|تشخيص|جرعة|علاج|دواء|طوارئ",
    re.IGNORECASE,
)


def detect_tool_intent(text: str, selected_mode: str) -> tuple[str, str] | None:
    normalized = text.strip()
    if not normalized:
        return None

    if selected_mode == "medical" and MEDICAL_RISK_RE.search(normalized):
        return (
            "medical_safety",
            "The student asked for diagnosis, dosage, treatment, or medical decision support. "
            "Use the medical safety fallback: explain only for educational study and advise "
            "consulting a qualified healthcare professional.",
        )
    if QUIZ_INTENT_RE.search(normalized):
        return (
            "create_quiz",
            "Create 3 to 5 short quiz questions based on the current frame, latest explanation, "
            "or visible content. Number the questions clearly.",
        )
    if SAVE_NOTE_INTENT_RE.search(normalized):
        return ("save_learning_note", "")
    if READ_TEXT_INTENT_RE.search(normalized):
        return (
            "extract_visible_text",
            "Extract the readable text from the selected frame. Preserve important words, formulas, "
            "and headings. If text is unclear, say which parts are uncertain.",
        )
    if SUMMARIZE_INTENT_RE.search(normalized):
        return (
            "summarize_visible_content",
            "Summarize the educational content visible in the selected frame. Highlight key ideas "
            "and explain any difficult terms briefly.",
        )
    return None


def create_quiz_from_text(text: str) -> list[str]:
    sentences = [
        sentence.strip(" -•\t")
        for sentence in re.split(r"(?<=[.!?])\s+|\n+", text)
        if len(sentence.strip()) > 24
    ]
    if not sentences:
        return ["What is the main idea of the material shown?", "Which detail would you like to explain further?"]

    questions: list[str] = []
    for sentence in sentences[:5]:
        compact = re.sub(r"\s+", " ", sentence)
        questions.append(f"What is the key idea behind: {compact[:120]}?")
    return questions


def extract_quiz_questions(answer: str) -> list[str]:
    questions: list[str] = []
    for line in answer.splitlines():
        cleaned = re.sub(r"^\s*(?:[-*•]|\d+[.)])\s*", "", line).strip()
        if cleaned.endswith("?") or re.match(r"^(what|why|how|which|when|where|explain|solve|ما|كيف|لماذا|اشرح)", cleaned, re.I):
            questions.append(cleaned)
    if not questions and "?" in answer:
        questions = [part.strip() + "?" for part in answer.split("?") if part.strip()][:5]
    return questions[:5]
