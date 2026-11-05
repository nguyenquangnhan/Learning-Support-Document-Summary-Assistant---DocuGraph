import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class BattleRoom(Base):
    __tablename__ = "battle_rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_code: Mapped[str] = mapped_column(String(6), unique=True, index=True, nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    host_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="waiting")  # waiting, active, finished
    current_question: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    scores: Mapped[list["BattleScore"]] = relationship("BattleScore", back_populates="room", cascade="all, delete-orphan")


class BattleScore(Base):
    __tablename__ = "battle_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("battle_rooms.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_name: Mapped[str] = mapped_column(String(100), default="Player")
    score: Mapped[int] = mapped_column(Integer, default=0)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0)
    total_time_ms: Mapped[int] = mapped_column(Integer, default=0)

    room: Mapped["BattleRoom"] = relationship("BattleRoom", back_populates="scores")

