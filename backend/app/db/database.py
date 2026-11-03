"""
DocuGraph AI – Database connections
- PostgreSQL + pgvector (SQLAlchemy async)
- Neo4j driver
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from neo4j import AsyncGraphDatabase
from app.core.config import settings


# ── PostgreSQL + pgvector ──────────────────────────────────────────────────────
engine = create_async_engine(
    settings.POSTGRES_URL,
    echo=settings.APP_ENV == "development",
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency – yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ── Neo4j ──────────────────────────────────────────────────────────────────────
neo4j_driver = AsyncGraphDatabase.driver(
    settings.NEO4J_URI,
    auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
)


async def get_neo4j():
    """FastAPI dependency – yields a Neo4j async session."""
    async with neo4j_driver.session() as session:
        yield session

