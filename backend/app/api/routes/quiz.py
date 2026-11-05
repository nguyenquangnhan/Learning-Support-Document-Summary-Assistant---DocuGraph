"""
DocuGraph AI – Quiz Router
Generates and serves multiple-choice questions for personal review.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.quiz import QuizQuestion
from app.schemas.quiz import QuizResponse, QuizGenerateRequest
from app.services.quiz_service import generate_quiz_for_document

router = APIRouter()


@router.get("/{document_id}", response_model=QuizResponse)
async def get_quiz(document_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve existing quiz questions for a document."""
    stmt = select(QuizQuestion).where(QuizQuestion.document_id == document_id)
    result = await db.execute(stmt)
    questions = result.scalars().all()
    return QuizResponse(document_id=document_id, questions=questions)


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(req: QuizGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate new AI questions from the document using Gemini Structured JSON."""
    try:
        questions = await generate_quiz_for_document(db, req.document_id, req.num_questions)
        return QuizResponse(document_id=req.document_id, questions=questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

