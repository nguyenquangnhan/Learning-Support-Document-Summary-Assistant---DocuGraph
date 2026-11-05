from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # Concept, Formula, Definition, Theorem, Principle
    definition: str | None = None
    formula: str | None = None
    page_number: int | None = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str  # depends_on, proves, relates_to, derived_from, contrasts_with
    confidence: float = 1.0


class GraphResponse(BaseModel):
    document_id: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]

