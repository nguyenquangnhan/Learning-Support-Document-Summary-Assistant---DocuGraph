from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    type: str = "Concept"  # Root, Topic, Subtopic, Detail, Concept, Formula, Theorem
    level: int = 1         # 0 = Root, 1 = Major Topic, 2 = Subtopic, 3 = Detail
    definition: str | None = None
    formula: str | None = None
    page_number: int | None = None
    color: str | None = None
    parent_id: str | None = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = "relates_to"  # depends_on, proves, relates_to, derived_from, contrasts_with, has_topic, has_detail
    confidence: float = 1.0


class GraphResponse(BaseModel):
    document_id: str
    mode: str = "graph"  # "graph" | "mindmap"
    nodes: list[GraphNode]
    edges: list[GraphEdge]

