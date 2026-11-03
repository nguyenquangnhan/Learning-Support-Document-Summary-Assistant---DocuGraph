"""
DocuGraph AI – Document Processing Pipeline (Celery Task)
Flow: Download → OCR/Parse → Chunk → Embed → Graph Extract → Store
"""
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, name="document_pipeline.process_document", max_retries=3)
def process_document(self, document_id: str, file_url: str, file_type: str):
    """
    Background task: full pipeline from raw file → Knowledge Graph.

    Steps:
    1. Download file from Supabase Storage
    2. PDF/DOCX parse OR PaddleOCR (for images/scans)
    3. Semantic chunking (512 tokens, 10% overlap)
    4. Parallel: (a) Gemini embed → pgvector  |  (b) Entity extract → Neo4j
    5. Update document status to 'ready'
    """
    try:
        # TODO: implement pipeline steps
        self.update_state(state="PROGRESS", meta={"step": "ocr", "percent": 10})
        # ... pipeline logic here
        return {"status": "success", "document_id": document_id}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 10)

