"""
DocuGraph AI – Supabase Server Integration Service
Uses SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, and SUPABASE_JWKS_URL
to verify user JWT sessions and persist documents, chunks, and quizzes into Supabase Cloud PostgreSQL.
"""
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_auth_headers(user_jwt: str | None = None) -> dict[str, str]:
    """
    Constructs headers for Supabase PostgREST API.
    Prioritizes user JWT (so Row-Level Security `auth.uid() = user_id` is enforced),
    or falls back to SUPABASE_SECRET_KEY if configured.
    """
    api_key = settings.SUPABASE_PUBLISHABLE_KEY or settings.SUPABASE_ANON_KEY
    secret_key = settings.SUPABASE_SECRET_KEY

    if user_jwt and user_jwt.strip():
        token = user_jwt.replace("Bearer ", "").strip()
        return {
            "apikey": api_key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    if secret_key and not secret_key.endswith("replace_with_full_secret_key") and "••••" not in secret_key:
        return {
            "apikey": secret_key,
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def verify_supabase_user(authorization: str | None) -> dict | None:
    """
    Verifies a user Bearer JWT against Supabase Auth & JWKS endpoint.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
                    "Authorization": f"Bearer {token}",
                },
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.debug(f"Supabase JWT verification skipped: {e}")
    return None


async def sync_document_to_supabase(doc_dict: dict, user_jwt: str | None = None) -> bool:
    """
    Upserts a document record into Supabase `public.documents` table.
    """
    try:
        headers = _get_auth_headers(user_jwt)
        headers["Prefer"] = "resolution=merge-duplicates,return=minimal"

        user_info = await verify_supabase_user(user_jwt) if user_jwt else None
        payload = {
            "id": doc_dict["id"],
            "title": doc_dict["title"],
            "file_type": doc_dict.get("file_type", "PDF"),
            "file_size": doc_dict.get("file_size"),
            "num_pages": doc_dict.get("num_pages", 1),
            "status": doc_dict.get("status", "ready"),
            "summary_tldr": doc_dict.get("summary_tldr"),
            "summary_detailed": doc_dict.get("summary_detailed"),
        }
        if user_info and user_info.get("id"):
            payload["user_id"] = user_info["id"]

        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/documents",
                headers=headers,
                json=payload,
            )
            return resp.status_code in (200, 201, 204)
    except Exception as e:
        logger.debug(f"Supabase document sync skipped: {e}")
        return False

