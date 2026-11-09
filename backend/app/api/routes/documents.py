"""
DocuGraph AI – Documents API Router
Handles document upload, listing, detail retrieval, and manual summarization.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.services.document_service import process_document_sync, extract_text_from_file

router = APIRouter()


@router.get("", response_model=list[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    """List recent documents."""
    result = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(20))
    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Get single document detail with summary."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    summary_type: str = Form("detailed"),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a document (PDF, DOCX, TXT) and process through GraphRAG pipeline.
    """
    filename = file.filename or "Tai_lieu.pdf"
    doc_title = title or filename
    content = await file.read()
    file_type = filename.split(".")[-1].lower() if "." in filename else "pdf"

    # Real text extraction from PDF/DOCX/TXT
    raw_text, num_pages = extract_text_from_file(content, filename)

    doc = Document(
        title=doc_title,
        file_type=file_type,
        file_size=len(content),
        num_pages=num_pages,
        status="processing"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Process pipeline (Chunking -> Embedding -> Summary -> Graph Extraction)
    await process_document_sync(db, doc, raw_text)

    return DocumentUploadResponse(
        document_id=doc.id,
        title=doc.title,
        status="ready",
        message="Document processed and Knowledge Graph created successfully."
    )

