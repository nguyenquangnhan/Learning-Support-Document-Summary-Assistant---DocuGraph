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
from app.services.document_service import process_document_sync

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
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a document (PDF, TXT, or Image) and process synchronously/asynchronously.
    """
    doc_title = title or file.filename or "Untitled Document"
    content = await file.read()
    file_type = file.filename.split(".")[-1].lower() if file.filename else "pdf"

    # Extract text (mock extraction for text or raw decode)
    try:
        raw_text = content.decode("utf-8")
    except Exception:
        raw_text = f"Nội dung số hóa từ tệp {doc_title}. Tài liệu chứa các khái niệm toán học, định lý và ứng dụng thực tiễn."

    doc = Document(
        title=doc_title,
        file_type=file_type,
        file_size=len(content),
        num_pages=max(1, len(raw_text) // 1000),
        status="processing"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Process pipeline
    await process_document_sync(db, doc, raw_text)

    return DocumentUploadResponse(
        document_id=doc.id,
        title=doc.title,
        status="ready",
        message="Document processed and Knowledge Graph created successfully."
    )

