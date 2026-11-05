import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class StudyGroup(Base):
    __tablename__ = "study_groups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    group_code: Mapped[str] = mapped_column(String(6), unique=True, index=True, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members: Mapped[list["GroupMember"]] = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    documents: Mapped[list["GroupDocument"]] = relationship("GroupDocument", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("study_groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), default="member")  # host, member
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    group: Mapped["StudyGroup"] = relationship("StudyGroup", back_populates="members")


class GroupDocument(Base):
    __tablename__ = "group_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("study_groups.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    added_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    group: Mapped["StudyGroup"] = relationship("StudyGroup", back_populates="documents")

