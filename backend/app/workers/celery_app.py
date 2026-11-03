"""
DocuGraph AI – Celery Worker Configuration
Broker: Redis | Backend: Redis
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "docugraph",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.document_pipeline",  # OCR → Chunking → Embedding → Graph
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,       # process one heavy task at a time
    task_acks_late=True,                # re-queue on worker crash
)

