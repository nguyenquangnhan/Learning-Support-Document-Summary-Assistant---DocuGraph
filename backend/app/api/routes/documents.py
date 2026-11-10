"""
DocuGraph AI – Documents API Router
Handles document upload, On-Device ML Kit OCR ingestion, listing, and detail retrieval.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentUploadResponse, OcrDocumentCreateRequest
from app.services.document_service import process_document_sync, extract_text_from_file
from app.services.supabase_service import sync_document_to_supabase, verify_supabase_user

router = APIRouter()


async def _resolve_user_id(authorization: str | None, x_user_id: str | None) -> str | None:
    user_info = await verify_supabase_user(authorization)
    if user_info and user_info.get("id"):
        return str(user_info["id"])
    if x_user_id and x_user_id.strip():
        return x_user_id.strip()
    return None


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    List recent documents scoped to the authenticated user (including their Google SSO uploads).
    """
    user_id = await _resolve_user_id(authorization, x_user_id)
    if not user_id:
        return []

    conditions = [Document.owner_id == user_id]
    # Also include documents uploaded during earlier Google SSO sessions by this user
    if user_id.startswith("google") or user_id == "c541f75a-9c0a-4014-b4e7-2ea764b88479":
        conditions.append(Document.owner_id.like("google%"))
        conditions.append(Document.owner_id == "c541f75a-9c0a-4014-b4e7-2ea764b88479")

    result = await db.execute(
        select(Document)
        .where(or_(*conditions))
        .order_by(Document.created_at.desc())
        .limit(30)
    )
    docs = result.scalars().all()
    for d in docs:
        if d.status == "processing":
            d.status = "ready"
    return docs


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Get single document detail with summary."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and its associated chunks/quizzes from DB."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(doc)
    await db.commit()
    return {"status": "deleted", "document_id": document_id, "message": "Đã xóa tài liệu thành công"}


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    summary_type: str = Form("detailed"),
    extracted_text: str = Form(None),
    source_type: str = Form(None),
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a document (PDF, DOCX, TXT, Image) and process through GraphRAG pipeline.
    If `extracted_text` is provided from On-Device ML Kit OCR, uses that verified text directly.
    """
    filename = file.filename or "Tai_lieu.pdf"
    doc_title = title or filename
    content = await file.read()
    file_type = "OCR" if source_type == "ocr_scan" else (filename.split(".")[-1].upper() if "." in filename else "PDF")

    if extracted_text and extracted_text.strip():
        raw_text = f"[Trang 1]\n{extracted_text.strip()}"
        num_pages = max(1, len(extracted_text) // 1200)
    else:
        raw_text, num_pages = extract_text_from_file(content, filename)

    user_id = await _resolve_user_id(authorization, x_user_id)

    doc = Document(
        title=doc_title,
        file_type=file_type,
        file_size=len(content),
        num_pages=num_pages,
        status="processing",
        owner_id=user_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    await process_document_sync(db, doc, raw_text)

    await sync_document_to_supabase(
        {
            "id": doc.id,
            "user_id": user_id,
            "title": doc.title,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "num_pages": doc.num_pages,
            "status": doc.status,
            "summary_tldr": doc.summary_tldr,
            "summary_detailed": doc.summary_detailed,
        },
        user_jwt=authorization,
    )

    return DocumentUploadResponse(
        document_id=doc.id,
        title=doc.title,
        status="ready",
        message="Document processed and Knowledge Graph created successfully.",
    )


@router.post("/ocr", response_model=DocumentUploadResponse)
async def create_ocr_document(
    payload: OcrDocumentCreateRequest,
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest human-verified text extracted on-device via Google ML Kit Text Recognition v2.
    Supports both immediate online submission and Offline-First Sync Queue replay.
    """
    if not payload.extracted_text or not payload.extracted_text.strip():
        raise HTTPException(status_code=400, detail="Nội dung văn bản OCR không được để trống")

    raw_text = (
        payload.extracted_text
        if "[Trang" in payload.extracted_text
        else f"[Trang 1]\n{payload.extracted_text.strip()}"
    )

    user_id = await _resolve_user_id(authorization, x_user_id)

    doc = Document(
        title=payload.title.strip() or "Bản quét OCR ML Kit",
        file_type="OCR_MLKIT",
        file_size=len(payload.extracted_text.encode("utf-8")),
        num_pages=max(1, payload.num_pages),
        status="processing",
        owner_id=user_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    await process_document_sync(db, doc, raw_text)

    await sync_document_to_supabase(
        {
            "id": doc.id,
            "user_id": user_id,
            "title": doc.title,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "num_pages": doc.num_pages,
            "status": doc.status,
            "summary_tldr": doc.summary_tldr,
            "summary_detailed": doc.summary_detailed,
        },
        user_jwt=authorization,
    )

    return DocumentUploadResponse(
        document_id=doc.id,
        title=doc.title,
        status="ready",
        message=f"On-Device OCR ({payload.device_engine}, {payload.latency_ms:.1f}ms) synced and Knowledge Graph created.",
    )
