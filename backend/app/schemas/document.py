from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    title: str
    file_type: str
    file_size: int | None = None
    num_pages: int = 1
    status: str
    summary_tldr: str | None = None
    summary_detailed: str | None = None
    created_at: datetime
    processed_at: datetime | None = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    document_id: str
    title: str
    status: str
    message: str


class OcrDocumentCreateRequest(BaseModel):
    title: str
    extracted_text: str
    confidence: float = 0.95
    latency_ms: float = 18.5
    device_engine: str = "ML Kit Text Recognition v2"
    num_pages: int = 1
    client_updated_at: str | None = None


class DocumentChunkResponse(BaseModel):
    id: str
    chunk_index: int
    content: str
    page_number: int

    class Config:
        from_attributes = True
