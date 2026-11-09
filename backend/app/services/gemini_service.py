"""
DocuGraph AI – Gemini AI Service
Uses the NEW google-genai SDK (google.genai) — replaces deprecated google-generativeai.
Docs: https://googleapis.github.io/python-genai/
"""
import hashlib
import json
import logging
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize client if key is configured
def get_client() -> genai.Client | None:
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key in ("mock-gemini-key", "your-gemini-api-key-here", "change-me"):
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.warning(f"Could not initialize Gemini Client: {e}")
        return None


def _mock_embedding(text: str, dim: int = 768) -> list[float]:
    """Generates a reproducible, normalized pseudo-embedding when API key is missing."""
    h = hashlib.sha256(text.encode("utf-8")).digest()
    vals = [((b / 255.0) * 2.0 - 1.0) for b in (h * (dim // len(h) + 1))[:dim]]
    norm = sum(v * v for v in vals) ** 0.5 or 1.0
    return [v / norm for v in vals]


async def embed_text(text: str) -> list[float]:
    """Convert a single text → 768-dim vector using text-embedding-004."""
    client = get_client()
    if client:
        try:
            response = await client.aio.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text,
            )
            return response.embeddings[0].values
        except Exception as e:
            logger.warning(f"Gemini embed_text failed: {e}. Using deterministic fallback.")
    return _mock_embedding(text)


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple texts."""
    client = get_client()
    if client:
        try:
            response = await client.aio.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=texts,
            )
            return [emb.values for emb in response.embeddings]
        except Exception as e:
            logger.warning(f"Gemini embed_batch failed: {e}. Using fallback.")
    return [_mock_embedding(t) for t in texts]


async def generate_stream(prompt: str, system_prompt: str = ""):
    """Streaming text generation – async generator yielding text chunks."""
    client = get_client()
    if client:
        try:
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
            return
        except Exception as e:
            logger.warning(f"Gemini generate_stream failed: {e}. Yielding fallback response.")
    
    # Fallback streaming
    fallback_response = (
        "Xin chào! Dựa trên ngữ cảnh tài liệu đã được phân tích, các khái niệm chính "
        "đã được trích xuất vào Đồ thị Tri thức (Knowledge Graph). "
        "Vui lòng cấu hình GEMINI_API_KEY trong file backend/.env để nhận câu trả lời phân tích sâu theo thời gian thực."
    )
    for word in fallback_response.split(" "):
        yield word + " "


async def generate_json(prompt: str, system_prompt: str = "") -> str:
    """
    Non-streaming structured JSON output.
    Used for: entity extraction, quiz generation, mindmap JSON.
    """
    client = get_client()
    if client:
        try:
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
            if response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Gemini generate_json failed: {e}")
            raise e
    raise ValueError("Gemini Client is not configured or failed to generate JSON.")
