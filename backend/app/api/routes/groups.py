"""
DocuGraph AI – Study Groups Router
Manages group creation, PIN join (6-char code), and zero-token shared resources.
"""
import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.study_group import StudyGroup, GroupMember, GroupDocument
from app.models.document import Document
from app.schemas.group import GroupCreateRequest, GroupJoinRequest, GroupResponse
from app.schemas.document import DocumentResponse

router = APIRouter()


def generate_group_code() -> str:
    """Generate 6-character alphanumeric uppercase code."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.get("", response_model=list[GroupResponse])
async def list_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudyGroup).order_by(StudyGroup.created_at.desc()).limit(20))
    groups = result.scalars().all()
    return groups


@router.post("", response_model=GroupResponse)
async def create_group(req: GroupCreateRequest, db: AsyncSession = Depends(get_db)):
    code = generate_group_code()
    group = StudyGroup(
        name=req.name,
        description=req.description,
        group_code=code,
        created_by=req.created_by
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)

    if req.created_by:
        member = GroupMember(group_id=group.id, user_id=req.created_by, role="host")
        db.add(member)
        await db.commit()

    return group


@router.post("/join", response_model=GroupResponse)
async def join_group(req: GroupJoinRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(StudyGroup).where(StudyGroup.group_code == req.group_code.upper())
    res = await db.execute(stmt)
    group = res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Mã nhóm không tồn tại")

    member = GroupMember(group_id=group.id, user_id=req.user_id, role="member")
    db.add(member)
    await db.commit()
    return group


@router.get("/{group_id}/documents", response_model=list[DocumentResponse])
async def get_group_shared_documents(group_id: str, db: AsyncSession = Depends(get_db)):
    """Zero-token shared documents retrieval: returns all documents already ingested in group."""
    stmt = (
        select(Document)
        .join(GroupDocument, GroupDocument.document_id == Document.id)
        .where(GroupDocument.group_id == group_id)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

