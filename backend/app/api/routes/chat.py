"""
DocuGraph AI – Chat Router
Handles streaming GraphRAG Q&A with citations.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.chat import ChatMessageRequest
from app.services.rag_service import stream_rag_answer

router = APIRouter()


@router.post("/stream")
async def chat_stream(request: ChatMessageRequest, db: AsyncSession = Depends(get_db)):
    """
    Streaming GraphRAG endpoint (Server-Sent Events format).
    Yields chunks of text and concludes with grounding citations.
    """
    try:
        generator, citations = await stream_rag_answer(db, request.document_id, request.message)

        async def event_generator():
            # Send initial citations metadata
            yield f"data: {json.dumps({'type': 'citations', 'citations': citations})}\n\n"

            # Stream answer tokens
            async for chunk in generator:
                yield f"data: {json.dumps({'type': 'token', 'text': chunk})}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

