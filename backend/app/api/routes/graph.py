"""
DocuGraph AI – Graph & Mindmap Router
Serves Knowledge Graph and Hierarchical Mindmap data for Cytoscape.js canvas rendering.
Powered by Neo4j and Gemini Structured JSON extraction.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.document import Document, DocumentChunk
from app.schemas.graph import GraphResponse
from app.services.graph_service import (
    get_document_graph,
    get_document_mindmap,
    build_mindmap_and_graph_for_document,
)

router = APIRouter()


@router.get("/{document_id}", response_model=GraphResponse)
async def get_graph(
    document_id: str,
    mode: str = Query("graph", description="Mode: 'graph' for Concept Network or 'mindmap' for Hierarchical Tree"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve nodes and edges for Cytoscape.js interactive visualization (Graph or Mindmap)."""
    res = await get_document_graph(document_id, mode=mode)
    
    # If no nodes found yet, auto-generate from document content
    if not res.nodes:
        doc_res = await db.execute(select(Document).where(Document.id == document_id))
        doc = doc_res.scalar_one_or_none()
        if doc:
            chunks_res = await db.execute(
                select(DocumentChunk).where(DocumentChunk.document_id == document_id).limit(10)
            )
            chunks = list(chunks_res.scalars().all())
            text = "\n".join([c.content for c in chunks]) if chunks else (doc.summary_detailed or doc.summary_tldr or doc.title)
            await build_mindmap_and_graph_for_document(document_id, doc.title, text)
            res = await get_document_graph(document_id, mode=mode)

    return res


@router.get("/{document_id}/mindmap", response_model=GraphResponse)
async def get_mindmap(document_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve hierarchical mindmap tree for tree layout visualization."""
    return await get_graph(document_id, mode="mindmap", db=db)


@router.post("/{document_id}/generate", response_model=GraphResponse)
async def generate_graph_and_mindmap(
    document_id: str,
    mode: str = Query("mindmap", description="Mode to return after generation: 'mindmap' or 'graph'"),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI extraction to generate and save fresh Mindmap & Concept Graph into Neo4j."""
    doc_res = await db.execute(select(Document).where(Document.id == document_id))
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

    chunks_res = await db.execute(
        select(DocumentChunk).where(DocumentChunk.document_id == document_id).limit(15)
    )
    chunks = list(chunks_res.scalars().all())
    text = "\n".join([c.content for c in chunks]) if chunks else (doc.summary_detailed or doc.summary_tldr or doc.title)

    await build_mindmap_and_graph_for_document(document_id, doc.title, text)
    return await get_document_graph(document_id, mode=mode)
