"""
DocuGraph AI – Gemini AI Service
Uses the NEW google-genai SDK (google.genai) — replaces deprecated google-generativeai.
Docs: https://googleapis.github.io/python-genai/
"""
from google import genai
from google.genai import types
from app.core.config import settings

# Initialize client (reads GEMINI_API_KEY from env automatically if set via env var,
# or pass explicitly)
client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def embed_text(text: str) -> list[float]:
    """Convert a single text → 768-dim vector using text-embedding-004."""
    response = await client.aio.models.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        contents=text,
    )
    return response.embeddings[0].values


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple texts (more efficient than calling embed_text in a loop)."""
    response = await client.aio.models.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        contents=texts,
    )
    return [emb.values for emb in response.embeddings]


async def generate_stream(prompt: str, system_prompt: str = ""):
    """Streaming text generation – async generator yielding text chunks."""
    config = types.GenerateContentConfig(
        temperature=0.1,
        max_output_tokens=8192,
        system_instruction=system_prompt or None,
    )
    async for chunk in await client.aio.models.generate_content_stream(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=config,
    ):
        if chunk.text:
            yield chunk.text


async def generate_json(prompt: str, system_prompt: str = "") -> str:
    """
    Non-streaming structured JSON output.
    Used for: entity extraction, quiz generation, mindmap JSON.
    """
    config = types.GenerateContentConfig(
        temperature=0.0,
        response_mime_type="application/json",
        system_instruction=system_prompt or None,
    )
    response = await client.aio.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=config,
    )
    return response.text
