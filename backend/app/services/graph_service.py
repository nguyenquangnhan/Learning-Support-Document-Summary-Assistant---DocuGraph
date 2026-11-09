"""
DocuGraph AI – Neo4j Knowledge Graph Service
Handles Cypher queries for storing and querying Concept Graphs and Multi-hop RAG expansion.
"""
import logging
from app.db.database import neo4j_driver
from app.schemas.graph import GraphNode, GraphEdge, GraphResponse

logger = logging.getLogger(__name__)

# In-memory graph storage fallback when Neo4j is offline
_in_memory_graphs: dict[str, dict] = {}


async def save_graph_to_neo4j(document_id: str, nodes: list[dict], edges: list[dict]):
    """Store extracted entities and relations into Neo4j with in-memory fallback."""
    # Always keep in memory cache for fast fallback
    _in_memory_graphs[document_id] = {"nodes": nodes, "edges": edges}

    if neo4j_driver is None:
        return

    try:
        async with neo4j_driver.session() as session:
            # Create Nodes
            query_nodes = """
            UNWIND $nodes AS node
            MERGE (n:KnowledgeNode {id: node.id, document_id: $doc_id})
            SET n.name = node.name,
                n.type = node.type,
                n.definition = node.definition,
                n.formula = node.formula,
                n.page_number = node.page_number
            """
            await session.run(query_nodes, doc_id=document_id, nodes=nodes)

            # Create Edges
            query_edges = """
            UNWIND $edges AS edge
            MATCH (a:KnowledgeNode {id: edge.source, document_id: $doc_id})
            MATCH (b:KnowledgeNode {id: edge.target, document_id: $doc_id})
            MERGE (a)-[r:RELATION {label: edge.label, document_id: $doc_id}]->(b)
            SET r.confidence = coalesce(edge.confidence, 1.0)
            """
            await session.run(query_edges, doc_id=document_id, edges=edges)
    except Exception as e:
        logger.warning(f"Neo4j save_graph_to_neo4j failed: {e}. Graph cached in memory.")


async def get_document_graph(document_id: str) -> GraphResponse:
    """Retrieve all nodes and edges belonging to a document for Cytoscape visualization."""
    nodes = []
    edges = []

    if neo4j_driver is not None:
        try:
            async with neo4j_driver.session() as session:
                # Fetch nodes
                result_nodes = await session.run(
                    "MATCH (n:KnowledgeNode {document_id: $doc_id}) RETURN n",
                    doc_id=document_id
                )
                records_nodes = await result_nodes.data()
                for rec in records_nodes:
                    n = rec["n"]
                    nodes.append(GraphNode(
                        id=n.get("id", ""),
                        label=n.get("name", "Node"),
                        type=n.get("type", "Concept"),
                        definition=n.get("definition"),
                        formula=n.get("formula"),
                        page_number=n.get("page_number")
                    ))

                # Fetch edges
                result_edges = await session.run(
                    "MATCH (a:KnowledgeNode {document_id: $doc_id})-[r:RELATION]->(b:KnowledgeNode {document_id: $doc_id}) RETURN a.id AS source, b.id AS target, r.label AS label, r.confidence AS confidence",
                    doc_id=document_id
                )
                records_edges = await result_edges.data()
                for idx, rec in enumerate(records_edges):
                    edges.append(GraphEdge(
                        id=f"e_{idx}",
                        source=rec["source"],
                        target=rec["target"],
                        label=rec.get("label", "relates_to"),
                        confidence=rec.get("confidence", 1.0)
                    ))
        except Exception as e:
            logger.warning(f"Neo4j query failed: {e}")

    # Fallback to in-memory cache if Neo4j returned no nodes
    if not nodes and document_id in _in_memory_graphs:
        cached = _in_memory_graphs[document_id]
        for n in cached.get("nodes", []):
            nodes.append(GraphNode(
                id=str(n.get("id", "")),
                label=n.get("name") or n.get("label", "Node"),
                type=n.get("type", "Concept"),
                definition=n.get("definition"),
                formula=n.get("formula"),
                page_number=n.get("page_number")
            ))
        for idx, e in enumerate(cached.get("edges", [])):
            edges.append(GraphEdge(
                id=f"e_{idx}",
                source=str(e.get("source", "")),
                target=str(e.get("target", "")),
                label=e.get("label", "relates_to"),
                confidence=e.get("confidence", 1.0)
            ))

    return GraphResponse(document_id=document_id, nodes=nodes, edges=edges)


async def query_multihop_context(document_id: str, entity_names: list[str]) -> str:
    """Multi-hop expansion: fetch 1-2 hop neighboring concepts for entities in the query."""
    if not entity_names:
        return ""
    if neo4j_driver is not None:
        try:
            async with neo4j_driver.session() as session:
                query = """
                MATCH (n:KnowledgeNode {document_id: $doc_id})-[r:RELATION*1..2]-(m:KnowledgeNode {document_id: $doc_id})
                WHERE n.name IN $entity_names
                RETURN DISTINCT n.name AS concept_a, type(r[0]) AS rel_type, r[0].label AS label, m.name AS concept_b, m.definition AS definition
                LIMIT 15
                """
                result = await session.run(query, doc_id=document_id, entity_names=entity_names)
                records = await result.data()
                if records:
                    context_lines = ["\n[Knowledge Graph Multi-hop Insights]:"]
                    for r in records:
                        context_lines.append(f"- ({r['concept_a']}) --[{r.get('label') or r.get('rel_type')}]--> ({r['concept_b']}): {r.get('definition', '')}")
                    return "\n".join(context_lines)
        except Exception:
            pass

    # Fallback to in-memory graph
    if document_id in _in_memory_graphs:
        cached = _in_memory_graphs[document_id]
        matching = [
            f"- Khái niệm: {n.get('name')} - {n.get('definition', '')}"
            for n in cached.get("nodes", [])
            if any(name.lower() in n.get("name", "").lower() for name in entity_names)
        ]
        if matching:
            return "\n[Knowledge Graph Insights]:\n" + "\n".join(matching[:5])
    return ""

