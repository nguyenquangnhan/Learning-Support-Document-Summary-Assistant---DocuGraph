"""
DocuGraph AI – Document Ingestion & Summarization Service
Splits text into chunks, computes embeddings, generates TL;DR & Bullet points, and triggers entity extraction.
"""
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document, DocumentChunk
from app.services.gemini_service import embed_batch, generate_json
from app.services.graph_service import save_graph_to_neo4j


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Simple semantic chunking by token/character estimation."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks if chunks else [text]


async def process_document_sync(db: AsyncSession, doc: Document, raw_text: str):
    """
    Executes the ingestion pipeline:
    1. Chunking
    2. Batch vector embeddings via Gemini text-embedding-004
    3. Generate TL;DR & Detailed Bullet Points
    4. Entity-Relation extraction & save to Neo4j
    """
    chunks_text = chunk_text(raw_text, chunk_size=400, overlap=40)
    embeddings = await embed_batch(chunks_text)

    # Save chunks to PostgreSQL + pgvector
    for idx, (content, emb) in enumerate(zip(chunks_text, embeddings)):
        chunk = DocumentChunk(
            id=str(uuid.uuid4()),
            document_id=doc.id,
            chunk_index=idx,
            content=content,
            page_number=(idx // 2) + 1,
            embedding=emb,
            token_count=len(content.split())
        )
        db.add(chunk)

    # Generate Summary (TL;DR & Bullet Points)
    summary_prompt = f"""Hãy đọc nội dung tài liệu sau và tạo bản tóm tắt học tập theo 2 phần đúng định dạng JSON:
{{
  "summary_tldr": "1-2 đoạn văn rút gọn luận điểm cốt lõi nhất",
  "summary_detailed": "Tóm tắt chi tiết theo từng đề mục, kèm công thức, thuật ngữ quan trọng và bullet points"
}}

Nội dung:
{raw_text[:8000]}
"""
    try:
        summary_raw = await generate_json(summary_prompt)
        summary_data = json.loads(summary_raw)
        doc.summary_tldr = summary_data.get("summary_tldr", "")
        doc.summary_detailed = summary_data.get("summary_detailed", "")
    except Exception:
        doc.summary_tldr = raw_text[:300] + "..."
        doc.summary_detailed = raw_text[:1000]

    # Extract Graph Nodes & Edges for Neo4j
    graph_prompt = f"""Trích xuất Đồ thị Tri thức (Knowledge Graph) từ bài giảng sau.
Trả về đúng cấu trúc JSON gồm:
{{
  "nodes": [
    {{"id": "n1", "name": "Tên khái niệm", "type": "Concept/Formula/Theorem", "definition": "Định nghĩa ngắn", "formula": "Công thức nếu có", "page_number": 1}}
  ],
  "edges": [
    {{"source": "n1", "target": "n2", "label": "relates_to/depends_on/proves", "confidence": 0.95}}
  ]
}}

Nội dung:
{raw_text[:6000]}
"""
    try:
        graph_raw = await generate_json(graph_prompt)
        graph_data = json.loads(graph_raw)
        nodes = graph_data.get("nodes", [])
        edges = graph_data.get("edges", [])
        await save_graph_to_neo4j(doc.id, nodes, edges)
    except Exception:
        pass

    doc.status = "ready"
    await db.commit()
    await db.refresh(doc)
    return doc

