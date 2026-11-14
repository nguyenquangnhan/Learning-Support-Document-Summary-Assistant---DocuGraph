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

# Models ordered by reliability & quota availability on Free Tier
FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
]


def _get_candidate_models() -> list[str]:
    primary = (settings.GEMINI_MODEL or "gemini-3.5-flash-lite").strip()
    models = [primary]
    for m in FALLBACK_MODELS:
        if m not in models:
            models.append(m)
    return models


# Initialize client if key is configured
def get_client() -> genai.Client | None:
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key or api_key in ("mock-gemini-key", "your-gemini-api-key-here", "change-me"):
        return None
    try:
        # Force Gemini Developer API endpoint (generativelanguage.googleapis.com)
        # Disable built-in slow tenacity retries on 429 so we can immediately switch to fallback models
        return genai.Client(
            api_key=api_key,
            vertexai=False,
            http_options=types.HttpOptions(
                retry_options=types.HttpRetryOptions(attempts=1)
            ),
        )
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
    """Convert a single text → 768-dim vector using gemini-embedding-001."""
    client = get_client()
    if client:
        try:
            response = await client.aio.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=768),
            )
            return response.embeddings[0].values[:768]
        except Exception as e:
            logger.warning(f"Gemini embed_text failed: {e}. Using deterministic fallback.")
    return _mock_embedding(text)


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple texts into 768-dim vectors."""
    client = get_client()
    if client:
        try:
            response = await client.aio.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(output_dimensionality=768),
            )
            return [emb.values[:768] for emb in response.embeddings]
        except Exception as e:
            logger.warning(f"Gemini embed_batch failed: {e}. Using fallback.")
    return [_mock_embedding(t) for t in texts]


async def generate_stream(prompt: str, system_prompt: str = ""):
    """Streaming text generation – async generator yielding text chunks with multi-model fallback."""
    client = get_client()
    if client:
        config = types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=8192,
            system_instruction=system_prompt or None,
        )
        for model_name in _get_candidate_models():
            try:
                yielded = False
                async for chunk in await client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=prompt,
                    config=config,
                ):
                    if chunk.text:
                        yielded = True
                        yield chunk.text
                if yielded:
                    return
            except Exception as e:
                logger.warning(f"Gemini generate_stream failed on {model_name}: {e}. Trying next model...")
    
    # Return empty so caller (e.g., rag_service) can fall back to grounded document synthesis
    return


async def generate_json(prompt: str, system_prompt: str = "") -> str:
    """
    Non-streaming structured JSON output with automatic model fallback on 429 quota limits.
    Used for: entity extraction, quiz generation, mindmap JSON.
    """
    client = get_client()
    if client:
        config = types.GenerateContentConfig(
            temperature=0.0,
            response_mime_type="application/json",
            system_instruction=system_prompt or None,
        )
        last_err = None
        for model_name in _get_candidate_models():
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )
                if response.text:
                    return response.text
            except Exception as e:
                last_err = e
                logger.warning(f"Gemini generate_json failed on {model_name}: {e}. Trying next model...")
        if last_err:
            raise last_err
    raise ValueError("Gemini Client is not configured or failed to generate JSON.")
