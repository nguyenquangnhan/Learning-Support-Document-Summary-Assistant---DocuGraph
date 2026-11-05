from pydantic import BaseModel


class Citation(BaseModel):
    chunk_id: str
    page_number: int
    text_snippet: str


class ChatMessageRequest(BaseModel):
    document_id: str
    message: str
    history: list[dict] = []


class ChatMessageResponse(BaseModel):
    answer: str
    citations: list[Citation] = []

