"""
DocuGraph AI – Study Groups Router (Real-time Multi-User Sync + Database Persistence)
Manages group creation, PIN join (6-char code), real-time member sync, notifications, and shared resources.
"""
import random
import string
import time
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

AVATAR_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#8B5CF6"]


class CreateStudyGroupReq(BaseModel):
    name: str
    code: str | None = None
    host_id: str
    host_name: str
    host_email: str = "student@vku.udn.vn"
    is_private: bool = True


class JoinStudyGroupReq(BaseModel):
    code: str
    user_id: str
    user_name: str
    user_email: str = "student@vku.udn.vn"


class AddMemberReq(BaseModel):
    name: str
    email: str


class ShareResourceReq(BaseModel):
    id: str
    title: str
    file_type: str = "PDF"
    num_pages: int = 1
    uploaded_by: str
    summary_tldr: str | None = None
    summary_detailed: str | None = None
    created_at: str | None = None


# In-memory live registry of study groups keyed by uppercase 6-char code
LIVE_GROUPS: dict[str, dict] = {}


def _generate_code() -> str:
    for _ in range(50):
        code = "VKU" + "".join(random.choices(string.ascii_uppercase + string.digits, k=3))
        if code not in LIVE_GROUPS:
            return code
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


@router.get("")
async def list_user_groups(user_id: str | None = None):
    """Returns all groups that user_id belongs to (or all public/active groups if unspecified)."""
    results = []
    for g in LIVE_GROUPS.values():
        if not user_id or any(m["id"] == user_id for m in g["members"]):
            results.append(g)
    results.sort(key=lambda x: x.get("updated_at", 0), reverse=True)
    return results


@router.get("/{code}")
async def get_group_by_code(code: str):
    clean_code = code.strip().upper()
    group = LIVE_GROUPS.get(clean_code)
    if not group:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhóm học tập này")
    return group


@router.post("")
async def create_group(req: CreateStudyGroupReq):
    code = (req.code or _generate_code()).strip().upper()
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    group = {
        "id": f"grp_{code}_{int(time.time())}",
        "name": req.name.strip() or f"Nhóm Học Tập ({code})",
        "code": code,
        "isPrivate": req.is_private,
        "updated_at": time.time(),
        "last_event": {
            "id": str(uuid.uuid4()),
            "type": "created",
            "actor_id": req.host_id,
            "actor_name": req.host_name,
            "message": f"{req.host_name} đã khởi tạo nhóm {code}",
            "timestamp": time.time(),
        },
        "members": [
            {
                "id": req.host_id,
                "name": req.host_name,
                "email": req.host_email,
                "role": "Trưởng nhóm",
                "color": "#4F46E5",
                "joined_at": now_iso,
            }
        ],
        "resources": [],
    }
    LIVE_GROUPS[code] = group
    return group


@router.post("/join")
async def join_group(req: JoinStudyGroupReq):
    code = req.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Mã nhóm không hợp lệ")

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    group = LIVE_GROUPS.get(code)

    # Nếu nhóm được tạo offline trước đó trên máy chủ phòng mà chưa kịp đồng bộ lên server,
    # tự động khởi tạo phòng chờ trên server để cả 2 bên cùng đồng bộ vào mã code này
    if not group:
        group = {
            "id": f"grp_{code}",
            "name": f"Nhóm Học Tập ({code})",
            "code": code,
            "isPrivate": True,
            "updated_at": time.time(),
            "last_event": None,
            "members": [],
            "resources": [],
        }
        LIVE_GROUPS[code] = group

    existing = next((m for m in group["members"] if m["id"] == req.user_id), None)
    if existing:
        existing["name"] = req.user_name or existing["name"]
        existing["email"] = req.user_email or existing["email"]
    else:
        role = "Trưởng nhóm" if len(group["members"]) == 0 else "Thành viên"
        color = AVATAR_COLORS[len(group["members"]) % len(AVATAR_COLORS)]
        group["members"].append(
            {
                "id": req.user_id,
                "name": req.user_name,
                "email": req.user_email,
                "role": role,
                "color": color,
                "joined_at": now_iso,
            }
        )
        group["updated_at"] = time.time()
        group["last_event"] = {
            "id": str(uuid.uuid4()),
            "type": "member_joined",
            "actor_id": req.user_id,
            "actor_name": req.user_name,
            "message": f"🎉 {req.user_name} vừa tham gia vào nhóm {group['name']}!",
            "timestamp": time.time(),
        }

    return group


@router.post("/{code}/sync")
async def sync_existing_group(code: str, payload: dict):
    """Allows a client that already has a local group (e.g. default group VKU23S) to register/merge it on server."""
    clean_code = code.strip().upper()
    existing = LIVE_GROUPS.get(clean_code)
    incoming_name = (payload.get("name") or "").strip()
    incoming_members = payload.get("members", []) or []

    if not existing:
        LIVE_GROUPS[clean_code] = {
            "id": payload.get("id") or f"grp_{clean_code}",
            "name": incoming_name or f"Nhóm Học Tập ({clean_code})",
            "code": clean_code,
            "isPrivate": payload.get("isPrivate", True),
            "updated_at": time.time(),
            "last_event": None,
            "members": incoming_members,
            "resources": payload.get("resources", []),
        }
        return LIVE_GROUPS[clean_code]

    # Nếu nhóm trên server đang mang tên placeholder "Nhóm Học Tập (...)" mà client gửi lên có tên thật của Nhóm trưởng,
    # thì cập nhật ngay tên thật của nhóm trưởng đặt
    if incoming_name and (
        not existing.get("name")
        or existing["name"].startswith("Nhóm Học Tập")
    ) and not incoming_name.startswith("Nhóm Học Tập"):
        existing["name"] = incoming_name

    # Merge members và giữ đúng vai trò "Trưởng nhóm" của người tạo nhóm
    member_by_id = {m["id"]: m for m in existing["members"] if m.get("id")}
    for m in incoming_members:
        mid = m.get("id")
        if not mid:
            continue
        if mid not in member_by_id:
            # Nếu incoming member là Trưởng nhóm thật sự thì đưa lên đầu danh sách
            if m.get("role") == "Trưởng nhóm":
                for em in existing["members"]:
                    if em.get("role") == "Trưởng nhóm" and em.get("id") != mid:
                        em["role"] = "Thành viên"
                existing["members"].insert(0, m)
            else:
                existing["members"].append(m)
            member_by_id[mid] = m
        else:
            # Cập nhật tên mới nhất và role Trưởng nhóm nếu client là chủ nhóm
            if m.get("name"):
                member_by_id[mid]["name"] = m["name"]
            if m.get("email"):
                member_by_id[mid]["email"] = m["email"]
            if m.get("role") == "Trưởng nhóm":
                for em in existing["members"]:
                    em["role"] = "Trưởng nhóm" if em.get("id") == mid else "Thành viên"

    # Merge shared resources
    existing_res_ids = {r["id"] for r in existing["resources"]}
    for r in payload.get("resources", []):
        if r.get("id") and r["id"] not in existing_res_ids:
            existing["resources"].insert(0, r)
            existing_res_ids.add(r["id"])

    return existing


@router.post("/{code}/members")
async def add_member_to_group(code: str, req: AddMemberReq):
    clean_code = code.strip().upper()
    group = LIVE_GROUPS.get(clean_code)
    if not group:
        raise HTTPException(status_code=404, detail="Nhóm không tồn tại")

    new_member = {
        "id": f"mem_{int(time.time() * 1000)}",
        "name": req.name.strip(),
        "email": req.email.strip(),
        "role": "Thành viên",
        "color": AVATAR_COLORS[len(group["members"]) % len(AVATAR_COLORS)],
    }
    group["members"].append(new_member)
    group["updated_at"] = time.time()
    group["last_event"] = {
        "id": str(uuid.uuid4()),
        "type": "member_added",
        "actor_id": new_member["id"],
        "actor_name": new_member["name"],
        "message": f"👋 Đã thêm {new_member['name']} vào nhóm!",
        "timestamp": time.time(),
    }
    return group


@router.delete("/{code}/members/{member_id}")
async def remove_member_from_group(code: str, member_id: str):
    clean_code = code.strip().upper()
    group = LIVE_GROUPS.get(clean_code)
    if not group:
        raise HTTPException(status_code=404, detail="Nhóm không tồn tại")

    removed = next((m for m in group["members"] if m["id"] == member_id), None)
    group["members"] = [m for m in group["members"] if m["id"] != member_id]
    group["updated_at"] = time.time()
    if removed:
        group["last_event"] = {
            "id": str(uuid.uuid4()),
            "type": "member_left",
            "actor_id": member_id,
            "actor_name": removed.get("name", "Thành viên"),
            "message": f"{removed.get('name', 'Thành viên')} đã rời khỏi nhóm.",
            "timestamp": time.time(),
        }
    return group


@router.post("/{code}/resources")
async def share_resource_to_group(code: str, req: ShareResourceReq):
    clean_code = code.strip().upper()
    group = LIVE_GROUPS.get(clean_code)
    if not group:
        raise HTTPException(status_code=404, detail="Nhóm không tồn tại")

    if not any(r["id"] == req.id for r in group["resources"]):
        group["resources"].insert(
            0,
            {
                "id": req.id,
                "title": req.title,
                "fileType": req.file_type,
                "numPages": req.num_pages,
                "uploadedBy": req.uploaded_by,
                "summaryTldr": req.summary_tldr,
                "summaryDetailed": req.summary_detailed,
                "createdAt": req.created_at or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            },
        )
        group["updated_at"] = time.time()
        group["last_event"] = {
            "id": str(uuid.uuid4()),
            "type": "resource_shared",
            "actor_id": req.uploaded_by,
            "actor_name": req.uploaded_by,
            "message": f"📚 {req.uploaded_by} vừa chia sẻ tài liệu \"{req.title}\" vào nhóm!",
            "timestamp": time.time(),
        }
    return group


@router.delete("/{code}")
async def delete_group_by_code(code: str):
    clean_code = code.strip().upper()
    LIVE_GROUPS.pop(clean_code, None)
    return {"status": "deleted", "code": clean_code}
