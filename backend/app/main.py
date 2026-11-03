"""
DocuGraph AI – FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="DocuGraph AI API",
    description="Multi-layer Knowledge Assistant – GraphRAG powered by Gemini + Neo4j + pgvector",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "DocuGraph AI API"}


# TODO: Register routers here
# from app.api.routes import auth, documents, chat, mindmap, quiz, groups, battle
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
# app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])

