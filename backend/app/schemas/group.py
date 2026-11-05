from datetime import datetime
from pydantic import BaseModel


class GroupCreateRequest(BaseModel):
    name: str
    description: str | None = None
    created_by: str | None = None


class GroupJoinRequest(BaseModel):
    group_code: str
    user_id: str


class GroupResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    group_code: str
    created_at: datetime
    member_count: int = 0
    document_count: int = 0

    class Config:
        from_attributes = True

