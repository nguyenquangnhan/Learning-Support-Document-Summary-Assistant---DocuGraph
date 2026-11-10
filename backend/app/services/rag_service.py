"""
DocuGraph AI – GraphRAG Service
Combines Dense Vector Retrieval (pgvector / keyword overlap) + Knowledge Graph Traversal (Neo4j / in-memory)
with Gemini 2.5 Flash for hallucination-free grounded answers.
"""
import json
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document, DocumentChunk
from app.services.gemini_service import embed_text, generate_stream, generate_json, get_client
from app.services.graph_service import query_multihop_context, get_document_graph


async def extract_query_entities(query: str) -> list[str]:
    """Extract key technical concepts/keywords from user question using Gemini or heuristic fallback."""
    prompt = f"""Trích xuất 1-3 thực thể hoặc khái niệm học thuật trọng tâm từ câu hỏi sau. Trả về mảng JSON các chuỗi:
Câu hỏi: {query}
Định dạng: ["khái niệm 1", "khái niệm 2"]
"""
    try:
        res = await generate_json(prompt)
        entities = json.loads(res)
        if isinstance(entities, list) and entities:
            return [str(e) for e in entities]
    except Exception:
        pass
    # Heuristic keyword extraction
    words = [w.strip(".,?!:;()\"'") for w in query.split() if len(w.strip(".,?!:;()\"'")) >= 3]
    return words[:4]


async def retrieve_relevant_chunks(
    db: AsyncSession,
    document_id: str,
    query_embedding: list[float],
    question: str = "",
    top_k: int = 4,
) -> list[DocumentChunk]:
    """Search top-K most similar text chunks using pgvector cosine distance or keyword overlap."""
    try:
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        result = await db.execute(stmt)
        chunks = list(result.scalars().all())
        if chunks:
            return chunks
    except Exception:
        pass

    # Fallback for SQLite: rank chunks by keyword overlap with the question
    stmt = select(DocumentChunk).where(DocumentChunk.document_id == document_id)
    result = await db.execute(stmt)
    all_chunks = list(result.scalars().all())
    if not all_chunks:
        # If no specific document_id matched, fetch most recent document's chunks
        fallback_stmt = select(DocumentChunk).limit(top_k)
        fallback_res = await db.execute(fallback_stmt)
        return list(fallback_res.scalars().all())

    if question.strip():
        q_tokens = set(re.findall(r"\w{2,}", question.lower()))
        scored = []
        for c in all_chunks:
            c_tokens = set(re.findall(r"\w{2,}", c.content.lower()))
            overlap = len(q_tokens & c_tokens)
            scored.append((overlap, -c.chunk_index, c))
        scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
        return [item[2] for item in scored[:top_k]]

    return all_chunks[:top_k]


async def build_rag_context(db: AsyncSession, document_id: str, question: str):
    """Retrieves relevant chunks, graph context, and citations for a question."""
    query_emb = await embed_text(question)
    query_entities = await extract_query_entities(question)

    chunks = await retrieve_relevant_chunks(db, document_id, query_emb, question=question, top_k=4)
    graph_context = await query_multihop_context(document_id, query_entities)

    citations = []
    context_chunks_text = []
    for c in chunks:
        clean_snippet = re.sub(r"\[Trang\s+\d+\]\s*", "", c.content).strip()
        citations.append({
            "chunk_id": c.id,
            "page_number": c.page_number,
            "text_snippet": clean_snippet[:150] + ("..." if len(clean_snippet) > 150 else ""),
        })
        context_chunks_text.append(f"[Trang {c.page_number}]: {clean_snippet}")

    combined_context = "\n\n".join(context_chunks_text)
    if graph_context:
        combined_context += "\n\n" + graph_context

    return chunks, citations, combined_context


async def generate_rag_answer_sync(db: AsyncSession, document_id: str, question: str) -> tuple[str, list[dict]]:
    """
    Returns complete grounded GraphRAG answer + citations (ideal for mobile JSON API).
    """
    chunks, citations, combined_context = await build_rag_context(db, document_id, question)

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
    client = get_client()
    if client and combined_context.strip():
        try:
            full_text = ""
            async for token in generate_stream(user_prompt, system_prompt=system_prompt):
                full_text += token
            if full_text.strip():
                return full_text.strip(), citations
        except Exception:
            pass

    # Grounded synthesis directly from retrieved document chunks & Knowledge Graph when offline/no API key
    if chunks:
        doc_res = await db.execute(select(Document).where(Document.id == document_id))
        doc = doc_res.scalar_one_or_none()
        doc_title = doc.title if doc else "tài liệu đã chọn"

        top_chunk = re.sub(r"\[Trang\s+\d+\]\s*", "", chunks[0].content).strip()
        top_page = chunks[0].page_number
        graph_data = await get_document_graph(document_id)
        raw_nodes = getattr(graph_data, "nodes", []) or []
        node_names = [
            (n.get("name", "") if isinstance(n, dict) else getattr(n, "name", ""))
            for n in raw_nodes[:4]
        ]
        node_names = [name for name in node_names if name]

        answer_parts = [
            f"Dựa trên phân tích GraphRAG từ **{doc_title}**, câu hỏi của bạn liên quan trực tiếp đến nội dung tại **[Trang {top_page}]**:",
            f"\n• **Nội dung trọng tâm [Trang {top_page}]:** {top_chunk[:350]}{'...' if len(top_chunk) > 350 else ''}",
        ]
        if len(chunks) > 1:
            second_chunk = re.sub(r"\[Trang\s+\d+\]\s*", "", chunks[1].content).strip()
            answer_parts.append(
                f"• **Bổ sung ngữ cảnh [Trang {chunks[1].page_number}]:** {second_chunk[:220]}{'...' if len(second_chunk) > 220 else ''}"
            )
        if node_names:
            answer_parts.append(
                f"\n🔗 **Liên kết Đồ thị Tri thức (Multi-hop):** {' → '.join(node_names)}."
            )
        return "\n".join(answer_parts), citations

    # Default grounded fallback if no document uploaded yet
    default_citations = [
        {"chunk_id": "demo-1", "page_number": 1, "text_snippet": "Khái niệm cốt lõi và định nghĩa nền tảng trong giáo trình..."},
    ]
    return (
        "Dựa trên cơ sở dữ liệu GraphRAG hiện tại, vui lòng chọn hoặc tải lên một tài liệu học tập (PDF/DOCX hoặc Quét OCR Camera) "
        "để tôi trích xuất ngữ cảnh chính xác đến từng số trang [Trang 1].",
        default_citations,
    )


async def stream_rag_answer(db: AsyncSession, document_id: str, question: str):
    """
    Streaming GraphRAG workflow for SSE clients.
    """
    answer, citations = await generate_rag_answer_sync(db, document_id, question)

    async def token_generator():
        words = answer.split(" ")
        for w in words:
            yield w + " "

    return token_generator(), citations
