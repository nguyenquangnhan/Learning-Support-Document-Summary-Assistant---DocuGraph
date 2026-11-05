"""
DocuGraph AI – Quiz Service
Generates high-yield academic multiple-choice questions from document chunks using Gemini Structured JSON.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import DocumentChunk
from app.models.quiz import QuizQuestion
from app.services.gemini_service import generate_json


async def generate_quiz_for_document(db: AsyncSession, document_id: str, num_questions: int = 5) -> list[QuizQuestion]:
    """Generate and persist quiz questions from document content."""
    # Fetch some chunks
    stmt = select(DocumentChunk).where(DocumentChunk.document_id == document_id).limit(10)
    result = await db.execute(stmt)
    chunks = result.scalars().all()

    context_text = "\n".join([c.content for c in chunks])[:6000]
    if not context_text:
        context_text = "Tài liệu học tập chuyên ngành tổng quát."

    prompt = f"""Dựa vào nội dung tài liệu học tập sau, hãy tạo {num_questions} câu hỏi trắc nghiệm ôn tập (4 phương án A, B, C, D).
Yêu cầu trả về đúng định dạng JSON cấu trúc sau:
[
  {{
    "question": "Nội dung câu hỏi?",
    "option_a": "Phương án A",
    "option_b": "Phương án B",
    "option_c": "Phương án C",
    "option_d": "Phương án D",
    "correct_option": "A",
    "explanation": "Giải thích ngắn gọn vì sao đáp án đúng dựa trên bài học"
  }}
]

Nội dung bài học:
{context_text}
"""
    raw_json = await generate_json(prompt)
    data = json.loads(raw_json)

    created_questions = []
    for item in data:
        q = QuizQuestion(
            document_id=document_id,
            question=item.get("question", ""),
            option_a=item.get("option_a", ""),
            option_b=item.get("option_b", ""),
            option_c=item.get("option_c", ""),
            option_d=item.get("option_d", ""),
            correct_option=item.get("correct_option", "A").upper(),
            explanation=item.get("explanation", "")
        )
        db.add(q)
        created_questions.append(q)

    await db.commit()
    for q in created_questions:
        await db.refresh(q)

    return created_questions

