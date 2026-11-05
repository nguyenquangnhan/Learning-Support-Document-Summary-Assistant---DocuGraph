"""
DocuGraph AI – Realtime Battle Room Router
Coordinates battle room creation and scores.
Realtime live syncing is powered by Supabase Realtime WebSocket channels.
"""
import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.battle import BattleRoom, BattleScore
from app.schemas.battle import BattleRoomCreateRequest, BattleSubmitAnswerRequest, BattleRoomResponse

router = APIRouter()


def generate_room_code() -> str:
    return "".join(random.choices(string.digits, k=6))


@router.post("/rooms", response_model=BattleRoomResponse)
async def create_battle_room(req: BattleRoomCreateRequest, db: AsyncSession = Depends(get_db)):
    code = generate_room_code()
    room = BattleRoom(
        room_code=code,
        document_id=req.document_id,
        host_id=req.host_id,
        status="waiting"
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.get("/rooms/{room_code}", response_model=BattleRoomResponse)
async def get_battle_room(room_code: str, db: AsyncSession = Depends(get_db)):
    stmt = select(BattleRoom).where(BattleRoom.room_code == room_code)
    res = await db.execute(stmt)
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Phòng đấu trí không tồn tại")
    return room


@router.post("/rooms/{room_code}/submit")
async def submit_battle_answer(room_code: str, req: BattleSubmitAnswerRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(BattleRoom).where(BattleRoom.room_code == room_code)
    res = await db.execute(stmt)
    room = res.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Phòng không tồn tại")

    score_points = 100 if req.is_correct else 0
    # Time bonus: faster answer yields bonus points
    if req.is_correct and req.time_taken_ms < 5000:
        score_points += int((5000 - req.time_taken_ms) / 100)

    score_record = BattleScore(
        room_id=room.id,
        user_id=req.user_id,
        user_name=req.user_name,
        score=score_points,
        correct_answers=1 if req.is_correct else 0,
        total_time_ms=req.time_taken_ms
    )
    db.add(score_record)
    await db.commit()

    return {"status": "ok", "earned_points": score_points}

