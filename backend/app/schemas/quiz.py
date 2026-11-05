from pydantic import BaseModel


class QuizQuestionItem(BaseModel):
    id: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str | None = None

    class Config:
        from_attributes = True


class QuizGenerateRequest(BaseModel):
    document_id: str
    num_questions: int = 5


class QuizResponse(BaseModel):
    document_id: str
    questions: list[QuizQuestionItem]

