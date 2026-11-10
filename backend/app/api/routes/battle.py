"""
DocuGraph AI – Realtime Multiplayer Battle Room Router

Luồng đấu trí nhiều người chơi:
  1. Chủ phòng tạo phòng  -> POST /rooms            (sinh mã phòng 6 số, trạng thái "waiting")
  2. Người chơi nhập mã    -> POST /rooms/{code}/join (chỉ vào được khi phòng còn "waiting")
  3. Chủ phòng bấm Bắt đầu -> POST /rooms/{code}/start (chỉ host mới có quyền)
  4. Tất cả client polling  -> GET  /rooms/{code}     (server điều phối câu hỏi theo đồng hồ server,
                                                       nên mọi người chơi cùng 1 câu tại cùng 1 thời điểm)
  5. Trả lời                -> POST /rooms/{code}/answer (mỗi câu chỉ trả lời 1 lần, tính điểm tốc độ)

Trạng thái phòng được giữ trong bộ nhớ (in-memory) của tiến trình FastAPI.
"""
import asyncio
import random
import string
import time
from dataclasses import dataclass, field

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.quiz import QuizQuestion
from app.services.quiz_service import generate_quiz_for_document

router = APIRouter()

QUESTION_SECONDS = 15  # Thời gian trả lời mỗi câu
REVEAL_SECONDS = 5  # Thời gian hiển thị đáp án + bảng xếp hạng tạm thời
COUNTDOWN_SECONDS = 3  # Đếm ngược trước câu đầu tiên
MAX_PLAYERS = 30
ROOM_TTL_SECONDS = 60 * 60 * 3  # Tự dọn phòng sau 3 giờ


# ── Schemas ────────────────────────────────────────────────────────────────────
class CreateRoomRequest(BaseModel):
    host_id: str
    host_name: str
    document_id: str
    document_title: str | None = None
    num_questions: int = 5


class JoinRoomRequest(BaseModel):
    user_id: str
    user_name: str


class StartRoomRequest(BaseModel):
    user_id: str


class AnswerRequest(BaseModel):
    user_id: str
    question_index: int
    option: str


class LeaveRoomRequest(BaseModel):
    user_id: str


# ── In-memory room state ───────────────────────────────────────────────────────
@dataclass
class Player:
    user_id: str
    name: str
    score: int = 0
    correct: int = 0
    total_answer_ms: int = 0
    answers: dict[int, dict] = field(default_factory=dict)  # question_index -> {option, correct, points, ms}


@dataclass
class Room:
    code: str
    host_id: str
    document_id: str
    document_title: str
    questions: list[dict]
    status: str = "waiting"  # waiting | playing | finished
    players: dict[str, Player] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None


ROOMS: dict[str, Room] = {}


def _now() -> float:
    return time.time()


def _cleanup_rooms() -> None:
    now = _now()
    expired = [code for code, r in ROOMS.items() if now - r.created_at > ROOM_TTL_SECONDS]
    for code in expired:
        ROOMS.pop(code, None)


def _generate_code() -> str:
    for _ in range(50):
        code = "".join(random.choices(string.digits, k=6))
        if code not in ROOMS:
            return code
    raise HTTPException(status_code=500, detail="Không thể sinh mã phòng, vui lòng thử lại")


def _get_room(code: str) -> Room:
    room = ROOMS.get(code.strip())
    if not room:
        raise HTTPException(status_code=404, detail="Phòng đấu trí không tồn tại hoặc đã bị đóng")
    return room


def _compute_phase(room: Room) -> dict:
    """
    Tính pha hiện tại dựa trên đồng hồ server, đảm bảo mọi client đồng bộ tuyệt đối.
    Pha: waiting | countdown | question | reveal | finished
    """
    if room.status == "waiting" or room.started_at is None:
        return {"phase": "waiting", "question_index": -1, "phase_ends_at": None}

    now = _now()
    elapsed = now - room.started_at
    if elapsed < COUNTDOWN_SECONDS:
        return {
            "phase": "countdown",
            "question_index": 0,
            "phase_ends_at": room.started_at + COUNTDOWN_SECONDS,
        }

    slot = QUESTION_SECONDS + REVEAL_SECONDS
    in_game = elapsed - COUNTDOWN_SECONDS
    idx = int(in_game // slot)
    if idx >= len(room.questions):
        room.status = "finished"
        return {"phase": "finished", "question_index": len(room.questions) - 1, "phase_ends_at": None}

    slot_start = room.started_at + COUNTDOWN_SECONDS + idx * slot
    offset = in_game - idx * slot
    if offset < QUESTION_SECONDS:
        return {"phase": "question", "question_index": idx, "phase_ends_at": slot_start + QUESTION_SECONDS}
    return {"phase": "reveal", "question_index": idx, "phase_ends_at": slot_start + slot}


def _leaderboard(room: Room) -> list[dict]:
    players = sorted(
        room.players.values(),
        key=lambda p: (-p.score, -p.correct, p.total_answer_ms),
    )
    return [
        {
            "user_id": p.user_id,
            "name": p.name,
            "score": p.score,
            "correct": p.correct,
            "is_host": p.user_id == room.host_id,
            "rank": i + 1,
            "avg_answer_ms": int(p.total_answer_ms / max(1, len(p.answers))),
        }
        for i, p in enumerate(players)
    ]


def _serialize(room: Room, viewer_id: str | None) -> dict:
    phase_info = _compute_phase(room)
    phase = phase_info["phase"]
    idx = phase_info["question_index"]

    question_payload = None
    if phase in ("question", "reveal") and 0 <= idx < len(room.questions):
        q = room.questions[idx]
        question_payload = {
            "index": idx,
            "question": q["question"],
            "options": q["options"],
        }
        if phase == "reveal":
            question_payload["correct_option"] = q["correct_option"]
            question_payload["explanation"] = q.get("explanation") or ""

    viewer = room.players.get(viewer_id or "")
    my_answer = viewer.answers.get(idx) if (viewer and idx >= 0) else None
    answered_count = sum(1 for p in room.players.values() if idx in p.answers) if idx >= 0 else 0

    return {
        "room_code": room.code,
        "host_id": room.host_id,
        "document_id": room.document_id,
        "document_title": room.document_title,
        "status": room.status,
        "phase": phase,
        "question_index": idx,
        "total_questions": len(room.questions),
        "question_seconds": QUESTION_SECONDS,
        "reveal_seconds": REVEAL_SECONDS,
        "phase_ends_at": phase_info["phase_ends_at"],
        "server_now": _now(),
        "question": question_payload,
        "my_answer": my_answer,
        "answered_count": answered_count,
        "is_host": viewer_id == room.host_id,
        "is_member": viewer is not None,
        "players": _leaderboard(room),
    }


FALLBACK_QUESTIONS = [
    {
        "question": "Mục tiêu chính của việc tóm tắt tài liệu học tập là gì?",
        "options": [
            {"key": "A", "text": "Nắm bắt các luận điểm cốt lõi và kiến thức trọng tâm nhanh chóng"},
            {"key": "B", "text": "Sao chép nguyên văn toàn bộ nội dung mà không chọn lọc"},
            {"key": "C", "text": "Xóa bỏ toàn bộ công thức và sơ đồ"},
            {"key": "D", "text": "Chỉ đọc lướt tiêu đề"},
        ],
        "correct_option": "A",
        "explanation": "Tóm tắt tài liệu giúp cô đọng kiến thức trọng tâm, tiết kiệm thời gian ôn tập và tăng khả năng tiếp thu.",
    },
    {
        "question": "Phương pháp ôn tập chủ động (Active Recall) mang lại lợi ích gì lớn nhất?",
        "options": [
            {"key": "A", "text": "Kích hoạt vùng nhớ não bộ, ghi nhớ kiến thức sâu và lâu bền hơn"},
            {"key": "B", "text": "Chỉ đọc lại sách nhiều lần một cách thụ động"},
            {"key": "C", "text": "Bỏ qua các bài tập khó"},
            {"key": "D", "text": "Học thuộc lòng mà không cần hiểu bản chất"},
        ],
        "correct_option": "A",
        "explanation": "Active Recall buộc não phải chủ động trích xuất thông tin, củng cố liên kết neuron thần kinh.",
    },
    {
        "question": "Hệ thống DocuGraph AI kết hợp Đồ thị tri thức (GraphRAG) nhằm mục đích gì?",
        "options": [
            {"key": "A", "text": "Xây dựng mạng lưới liên kết khái niệm và truy xuất chính xác theo ngữ cảnh"},
            {"key": "B", "text": "Chỉ chuyển đổi định dạng tệp tin"},
            {"key": "C", "text": "Tự động tắt máy tính khi học xong"},
            {"key": "D", "text": "Chặn người dùng truy cập internet"},
        ],
        "correct_option": "A",
        "explanation": "GraphRAG kết hợp Knowledge Graph và RAG để giải quyết bài toán suy luận đa bước phức tạp.",
    },
    {
        "question": "Trong kiến trúc Clean Architecture, Domain Layer có đặc điểm cốt lõi nào?",
        "options": [
            {"key": "A", "text": "Độc lập hoàn toàn với UI, Database, Network và chứa business logic trọng tâm"},
            {"key": "B", "text": "Phụ thuộc trực tiếp vào các component giao diện React Native"},
            {"key": "C", "text": "Chỉ chứa các lệnh truy vấn SQL cụ thể"},
            {"key": "D", "text": "Không được khai báo bất kỳ Entity hay Interface nào"},
        ],
        "correct_option": "A",
        "explanation": "Domain layer là trung tâm của Clean Architecture, hoàn toàn độc lập với công nghệ và framework bên ngoài.",
    },
    {
        "question": "Thuật toán tìm kiếm theo chiều sâu (DFS) trên đồ thị thường sử dụng cấu trúc dữ liệu nào?",
        "options": [
            {"key": "A", "text": "Ngăn xếp (Stack - LIFO) hoặc đệ quy"},
            {"key": "B", "text": "Hàng đợi (Queue - FIFO)"},
            {"key": "C", "text": "Bảng băm (Hash Table)"},
            {"key": "D", "text": "Mảng một chiều tĩnh"},
        ],
        "correct_option": "A",
        "explanation": "DFS duyệt sâu theo từng nhánh của đồ thị và sử dụng Stack (LIFO) hoặc ngăn xếp đệ quy.",
    },
]


async def _load_questions(db: AsyncSession, document_id: str, num_questions: int) -> list[dict]:
    rows = []
    try:
        stmt = select(QuizQuestion).where(QuizQuestion.document_id == document_id)
        rows = list((await db.execute(stmt)).scalars().all())
    except Exception:
        rows = []

    if not rows:
        try:
            # Chờ tạo câu hỏi từ LLM tối đa 4 giây, nếu timeout thì fallback ngay lập tức
            rows = await asyncio.wait_for(
                generate_quiz_for_document(db, document_id, num_questions=num_questions),
                timeout=4.0,
            )
        except Exception:
            rows = []

    if not rows:
        # Sử dụng bộ câu hỏi mẫu chất lượng cao làm fallback bảo đảm phòng chơi luôn sẵn sàng
        return FALLBACK_QUESTIONS[: max(1, min(len(FALLBACK_QUESTIONS), num_questions))]

    return [
        {
            "question": r.question,
            "options": [
                {"key": "A", "text": r.option_a},
                {"key": "B", "text": r.option_b},
                {"key": "C", "text": r.option_c},
                {"key": "D", "text": r.option_d},
            ],
            "correct_option": (r.correct_option or "A").strip().upper()[:1],
            "explanation": r.explanation,
        }
        for r in rows[: max(1, num_questions)]
    ]


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.post("/rooms")
async def create_room(req: CreateRoomRequest, db: AsyncSession = Depends(get_db)):
    """Chủ phòng tạo phòng đấu trí mới từ một tài liệu."""
    _cleanup_rooms()
    if not req.document_id.strip():
        raise HTTPException(status_code=400, detail="Vui lòng chọn tài liệu để tạo đề thi")

    questions = await _load_questions(db, req.document_id, req.num_questions)
    code = _generate_code()
    room = Room(
        code=code,
        host_id=req.host_id,
        document_id=req.document_id,
        document_title=req.document_title or "Tài liệu học tập",
        questions=questions,
    )
    room.players[req.host_id] = Player(user_id=req.host_id, name=req.host_name or "Chủ phòng")
    ROOMS[code] = room
    return _serialize(room, req.host_id)


@router.post("/rooms/{room_code}/join")
async def join_room(room_code: str, req: JoinRoomRequest):
    """Người chơi nhập mã phòng để tham gia (chỉ khi phòng đang chờ)."""
    room = _get_room(room_code)
    _compute_phase(room)

    if req.user_id in room.players:
        room.players[req.user_id].name = req.user_name or room.players[req.user_id].name
        return _serialize(room, req.user_id)

    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Trận đấu đã bắt đầu hoặc kết thúc, không thể vào phòng")
    if len(room.players) >= MAX_PLAYERS:
        raise HTTPException(status_code=400, detail="Phòng đã đủ người chơi")

    room.players[req.user_id] = Player(user_id=req.user_id, name=req.user_name or "Người chơi")
    return _serialize(room, req.user_id)


@router.get("/rooms/{room_code}")
async def get_room_state(room_code: str, user_id: str | None = None):
    """Client polling trạng thái phòng (đồng bộ theo đồng hồ server)."""
    room = _get_room(room_code)
    return _serialize(room, user_id)


@router.post("/rooms/{room_code}/start")
async def start_room(room_code: str, req: StartRoomRequest):
    """Chỉ chủ phòng mới được bắt đầu trận đấu."""
    room = _get_room(room_code)
    if req.user_id != room.host_id:
        raise HTTPException(status_code=403, detail="Chỉ chủ phòng mới có quyền bắt đầu trận đấu")
    if room.status != "waiting":
        raise HTTPException(status_code=400, detail="Trận đấu đã được bắt đầu")

    room.status = "playing"
    room.started_at = _now()
    return _serialize(room, req.user_id)


@router.post("/rooms/{room_code}/answer")
async def submit_answer(room_code: str, req: AnswerRequest):
    """Gửi đáp án cho câu hỏi hiện tại. Điểm = 100 + thưởng tốc độ (tối đa 150)."""
    room = _get_room(room_code)
    player = room.players.get(req.user_id)
    if not player:
        raise HTTPException(status_code=403, detail="Bạn chưa tham gia phòng này")

    phase_info = _compute_phase(room)
    if phase_info["phase"] != "question" or phase_info["question_index"] != req.question_index:
        raise HTTPException(status_code=400, detail="Đã hết thời gian trả lời câu hỏi này")
    if req.question_index in player.answers:
        raise HTTPException(status_code=400, detail="Bạn đã trả lời câu hỏi này rồi")

    q = room.questions[req.question_index]
    option = (req.option or "").strip().upper()[:1]
    remaining = max(0.0, phase_info["phase_ends_at"] - _now())
    answer_ms = int((QUESTION_SECONDS - remaining) * 1000)
    is_correct = option == q["correct_option"]
    points = (100 + int(remaining * 10)) if is_correct else 0

    player.answers[req.question_index] = {
        "option": option,
        "correct": is_correct,
        "points": points,
        "ms": answer_ms,
    }
    player.score += points
    player.correct += 1 if is_correct else 0
    player.total_answer_ms += answer_ms
    return {"status": "ok", "accepted": True}


@router.post("/rooms/{room_code}/leave")
async def leave_room(room_code: str, req: LeaveRoomRequest):
    """Rời phòng. Nếu chủ phòng rời khi đang chờ thì phòng bị đóng."""
    room = ROOMS.get(room_code.strip())
    if not room:
        return {"status": "ok"}
    if req.user_id == room.host_id and room.status == "waiting":
        ROOMS.pop(room.code, None)
        return {"status": "closed"}
    if room.status == "waiting":
        room.players.pop(req.user_id, None)
    return {"status": "ok"}
