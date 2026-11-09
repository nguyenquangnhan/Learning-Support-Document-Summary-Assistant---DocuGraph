"""
DocuGraph AI – Database connections
- PostgreSQL + pgvector (SQLAlchemy async)
- Neo4j driver
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from neo4j import AsyncGraphDatabase
from app.core.config import settings


# ── Database (PostgreSQL + pgvector or SQLite dev fallback) ────────────────────
is_sqlite = settings.POSTGRES_URL.startswith("sqlite")
engine_kwargs = {
    "echo": False,
}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(settings.POSTGRES_URL, **engine_kwargs)

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
neo4j_driver = None
try:
    if settings.NEO4J_URI and not settings.NEO4J_URI.startswith("neo4j+s://xxxxxxxx"):
        neo4j_driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
        )
except Exception:
    neo4j_driver = None


async def get_neo4j():
    """FastAPI dependency – yields a Neo4j async session if available."""
    if neo4j_driver is None:
        yield None
        return
    async with neo4j_driver.session() as session:
        yield session

