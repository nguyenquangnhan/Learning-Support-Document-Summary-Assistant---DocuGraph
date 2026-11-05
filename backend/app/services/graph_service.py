"""
DocuGraph AI – Neo4j Knowledge Graph Service
Handles Cypher queries for storing and querying Concept Graphs and Multi-hop RAG expansion.
"""
from app.db.database import neo4j_driver
from app.schemas.graph import GraphNode, GraphEdge, GraphResponse


async def save_graph_to_neo4j(document_id: str, nodes: list[dict], edges: list[dict]):
    """Store extracted entities and relations into Neo4j."""
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


async def get_document_graph(document_id: str) -> GraphResponse:
    """Retrieve all nodes and edges belonging to a document for Cytoscape visualization."""
    nodes = []
    edges = []
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
        # Fallback if Neo4j is offline or empty
        pass

    return GraphResponse(document_id=document_id, nodes=nodes, edges=edges)


async def query_multihop_context(document_id: str, entity_names: list[str]) -> str:
    """Multi-hop expansion: fetch 1-2 hop neighboring concepts for entities in the query."""
    if not entity_names:
        return ""
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
            if not records:
                return ""
            context_lines = ["\n[Knowledge Graph Multi-hop Insights]:"]
            for r in records:
                context_lines.append(f"- ({r['concept_a']}) --[{r.get('label') or r.get('rel_type')}]--> ({r['concept_b']}): {r.get('definition', '')}")
            return "\n".join(context_lines)
    except Exception:
        return ""

