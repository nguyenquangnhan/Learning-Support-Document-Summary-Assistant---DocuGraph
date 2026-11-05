from pydantic import BaseModel


class BattleRoomCreateRequest(BaseModel):
    document_id: str
    host_id: str


class BattleSubmitAnswerRequest(BaseModel):
    user_id: str
    user_name: str
    selected_option: str
    time_taken_ms: int
    is_correct: bool


class BattleRoomResponse(BaseModel):
    id: str
    room_code: str
    document_id: str
    host_id: str
    status: str
    current_question: int

