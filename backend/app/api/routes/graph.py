"""
DocuGraph AI – Graph Router
Serves Knowledge Graph data (nodes and edges) for Cytoscape.js canvas rendering.
"""
from fastapi import APIRouter
from app.schemas.graph import GraphResponse
from app.services.graph_service import get_document_graph

router = APIRouter()


@router.get("/{document_id}", response_model=GraphResponse)
async def get_graph(document_id: str):
    """Retrieve all graph nodes and edges for Cytoscape.js interactive visualization."""
    return await get_document_graph(document_id)

