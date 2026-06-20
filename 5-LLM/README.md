# AI Camp - Session 5: Large Language Models

This folder contains the materials for the fifth AI Camp session. It focuses on building practical applications with Large Language Models, from API usage and prompt engineering to RAG, agents, evaluation, and production concerns.

## Topics

- LLM fundamentals, tokens, context windows, latency, and cost
- Working with LLM APIs and message roles
- Prompt engineering, sampling controls, and reasoning techniques
- Embeddings, vector databases, and semantic search
- Retrieval-Augmented Generation and chunking strategies
- Fine-tuning, LoRA, QLoRA, and quantization
- Agents, tools, ReAct, memory, and orchestration frameworks
- Evaluation, safety, security, and production considerations

## Contents

| File | Description |
| --- | --- |
| `LLM_Systems_and_Applications.ipynb` | Main session notebook covering the design and operation of modern LLM systems. |
| `Labs/lesson_1.ipynb` | LLM APIs, prompt templates, output parsers, chains, and conversational memory. |
| `Labs/RAG.ipynb` | Embeddings, similarity search, visualization, and a simple RAG pipeline. |
| `Labs/Agent.ipynb` | Tool-using agents and the ReAct reasoning-and-action pattern. |
| `Labs/pojects.ipynb` | Applied projects including a recipe generator, invoice extractor, and tech newsletter. |
| `Labs/OIP.jpg` | Image asset used by the lab notebooks. |

## Setup

This session requires Python `>=3.13` and uses dependencies defined in `pyproject.toml`.

Install the environment with `uv`:

```bash
uv sync
```

Some labs require API keys. Create a `.env` file inside `5-LLM/` and add only the keys needed by the notebook you are running:

```text
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
```

Do not commit real API keys to the repository.

Start Jupyter Notebook:

```bash
uv run jupyter notebook
```

## Recommended Flow

1. Begin with `LLM_Systems_and_Applications.ipynb`.
2. Continue with `Labs/lesson_1.ipynb` for API and prompt-building practice.
3. Study `Labs/RAG.ipynb` and `Labs/Agent.ipynb`.
4. Finish with the applied examples in `Labs/pojects.ipynb`.
