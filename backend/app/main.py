"""
DocuGraph AI – FastAPI Application Entry Point
GraphRAG powered by Gemini 2.5 Flash + Neo4j + pgvector + Supabase
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
import app.models  # register all models on Base.metadata

from app.api.routes import documents, chat, graph, quiz, groups, battle


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="DocuGraph AI API",
    description="Multi-layer Knowledge Assistant – GraphRAG powered by Gemini + Neo4j + pgvector",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS – supports local web dev, mobile simulators, and physical devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "DocuGraph AI API",
        "version": "2.0.0",
        "model": settings.GEMINI_MODEL,
        "embedding": settings.GEMINI_EMBEDDING_MODEL
    }


# Register all API routers
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["GraphRAG Chat"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["Knowledge Graph"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["Personal Quiz"])
app.include_router(groups.router, prefix="/api/v1/groups", tags=["Study Groups"])
app.include_router(battle.router, prefix="/api/v1/battle", tags=["Realtime Quiz Battle"])
