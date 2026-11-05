"""
DocuGraph AI – GraphRAG Service
Combines Dense Vector Retrieval (pgvector) + Knowledge Graph Traversal (Neo4j)
with Gemini 2.5 Flash for hallucination-free grounded answers.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import DocumentChunk
from app.services.gemini_service import embed_text, generate_stream, generate_json
from app.services.graph_service import query_multihop_context
from app.schemas.chat import Citation


async def extract_query_entities(query: str) -> list[str]:
    """Extract key technical concepts/keywords from user question using Gemini."""
    prompt = f"""Trích xuất 1-3 thực thể hoặc khái niệm học thuật trọng tâm từ câu hỏi sau. Trả về mảng JSON các chuỗi:
Câu hỏi: {query}
Định dạng: ["khái niệm 1", "khái niệm 2"]
"""
    try:
        res = await generate_json(prompt)
        entities = json.loads(res)
        if isinstance(entities, list):
            return entities
    except Exception:
        pass
    return []


async def retrieve_relevant_chunks(db: AsyncSession, document_id: str, query_embedding: list[float], top_k: int = 4) -> list[DocumentChunk]:
    """Search top-K most similar text chunks using pgvector cosine distance."""
    try:
        # Using pgvector cosine distance: embedding <=> query_embedding
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception:
        # Fallback if pgvector table is empty or extension pending: fetch first available chunks
        stmt = select(DocumentChunk).where(DocumentChunk.document_id == document_id).limit(top_k)
        result = await db.execute(stmt)
        return list(result.scalars().all())


async def stream_rag_answer(db: AsyncSession, document_id: str, question: str):
    """
    GraphRAG hybrid workflow:
    1. Embed user question
    2. Retrieve top text chunks from pgvector
    3. Extract query entities & fetch multi-hop relationship path from Neo4j
    4. Construct grounded system prompt with page number citations
    5. Stream response via Gemini 2.5 Flash
    """
    # 1. Embed question & extract entities
    query_emb = await embed_text(question)
    query_entities = await extract_query_entities(question)

    # 2. Vector search (pgvector)
    chunks = await retrieve_relevant_chunks(db, document_id, query_emb, top_k=4)

    # 3. Graph multi-hop expansion (Neo4j)
    graph_context = await query_multihop_context(document_id, query_entities)

    # 4. Prepare context & citations
    citations = []
    context_chunks_text = []
    for c in chunks:
        citations.append({
            "chunk_id": c.id,
            "page_number": c.page_number,
            "text_snippet": c.content[:150] + "..."
        })
        context_chunks_text.append(f"[Trang {c.page_number}]: {c.content}")

    combined_context = "\n\n".join(context_chunks_text)
    if graph_context:
        combined_context += "\n\n" + graph_context

    system_prompt = """Bạn là DocuGraph AI – Trợ lý Tri thức Đa tầng học thuật chuyên sâu.
Nhiệm vụ của bạn là giải đáp thắc mắc của sinh viên HOÀN TOÀN DỰA TRÊN TÀI LIỆU VÀ ĐỒ THỊ TRI THỨC ĐƯỢC CUNG CẤP.
Quy tắc bắt buộc:
1. Trả lời bằng tiếng Việt rõ ràng, logic, có phân cấp.
2. Trích dẫn chính xác số trang tài liệu nguồn (ví dụ: [Trang X]).
3. Tuyệt đối KHÔNG bịa đặt thông tin (zero hallucination). Nếu thông tin không có trong ngữ cảnh, hãy nói rõ tài liệu chưa đề cập.
4. Trình bày công thức toán/lý bằng định dạng LaTeX $...$ hoặc $$...$$.
"""

    user_prompt = f"""--- NGỮ CẢNH TÀI LIỆU & ĐỒ THỊ TRI THỨC ---
{combined_context}

--- CÂU HỎI CỦA SINH VIÊN ---
{question}
"""

    return generate_stream(user_prompt, system_prompt=system_prompt), citations

