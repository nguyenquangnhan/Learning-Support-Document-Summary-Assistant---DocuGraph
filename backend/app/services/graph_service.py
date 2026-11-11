"""
DocuGraph AI – Neo4j Knowledge Graph & Mindmap Service
Handles Cypher queries for storing and querying:
1. Concept Graph (:KnowledgeNode with [:RELATION]) for Semantic Multi-hop RAG
2. Hierarchical Mindmap (:MindmapNode with [:HAS_TOPIC]) for Tree Visualization
"""
import asyncio
import json
import logging
import re
from app.db.database import neo4j_driver
from app.schemas.graph import GraphNode, GraphEdge, GraphResponse
from app.services.gemini_service import generate_json

logger = logging.getLogger(__name__)

# In-memory storage fallbacks when Neo4j is offline
_in_memory_graphs: dict[str, dict] = {}
_in_memory_mindmaps: dict[str, dict] = {}


# ── Neo4j Persistence: Concept Graph ───────────────────────────────────────────
async def save_graph_to_neo4j(document_id: str, nodes: list[dict], edges: list[dict]):
    """Store extracted entities and relations into Neo4j with in-memory fallback."""
    _in_memory_graphs[document_id] = {"nodes": nodes, "edges": edges}

    if neo4j_driver is None:
        return

    try:
        async with neo4j_driver.session() as session:
            # Create / Update Knowledge Nodes
            query_nodes = """
            UNWIND $nodes AS node
            MERGE (n:KnowledgeNode {id: node.id, document_id: $doc_id})
            SET n.name = node.name,
                n.type = coalesce(node.type, 'Concept'),
                n.definition = coalesce(node.definition, ''),
                n.formula = coalesce(node.formula, ''),
                n.page_number = node.page_number
            """
            await session.run(query_nodes, doc_id=document_id, nodes=nodes)

            # Create / Update Relations
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


# ── Neo4j Persistence: Mindmap Tree ────────────────────────────────────────────
async def save_mindmap_to_neo4j(document_id: str, nodes: list[dict], edges: list[dict]):
    """Store hierarchical mindmap tree into Neo4j with in-memory fallback."""
    _in_memory_mindmaps[document_id] = {"nodes": nodes, "edges": edges}

    if neo4j_driver is None:
        return

    try:
        async with neo4j_driver.session() as session:
            # Create / Update Mindmap Nodes with level and parent_id
            query_nodes = """
            UNWIND $nodes AS node
            MERGE (m:MindmapNode {id: node.id, document_id: $doc_id})
            SET m.label = node.label,
                m.type = coalesce(node.type, 'Topic'),
                m.level = coalesce(node.level, 1),
                m.definition = coalesce(node.definition, ''),
                m.color = coalesce(node.color, '#6366F1'),
                m.parent_id = node.parent_id
            """
            await session.run(query_nodes, doc_id=document_id, nodes=nodes)

            # Create / Update Tree Edges (HAS_TOPIC)
            query_edges = """
            UNWIND $edges AS edge
            MATCH (a:MindmapNode {id: edge.source, document_id: $doc_id})
            MATCH (b:MindmapNode {id: edge.target, document_id: $doc_id})
            MERGE (a)-[r:HAS_TOPIC {label: edge.label, document_id: $doc_id}]->(b)
            """
            await session.run(query_edges, doc_id=document_id, edges=edges)
    except Exception as e:
        logger.warning(f"Neo4j save_mindmap_to_neo4j failed: {e}. Mindmap cached in memory.")


# ── Mindmap Retrieval ──────────────────────────────────────────────────────────
async def get_document_mindmap(document_id: str) -> GraphResponse:
    """Retrieve hierarchical mindmap nodes and edges for Cytoscape breadthfirst/tree visualization."""
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []

    if neo4j_driver is not None:
        try:
            async with neo4j_driver.session() as session:
                res_nodes = await session.run(
                    """
                    MATCH (m:MindmapNode {document_id: $doc_id})
                    RETURN m
                    ORDER BY m.level ASC, m.id ASC
                    """,
                    doc_id=document_id,
                )
                records_nodes = await res_nodes.data()
                for rec in records_nodes:
                    m = rec["m"]
                    nodes.append(GraphNode(
                        id=m.get("id", ""),
                        label=m.get("label", "Node"),
                        type=m.get("type", "Topic"),
                        level=int(m.get("level", 1)),
                        definition=m.get("definition"),
                        color=m.get("color"),
                        parent_id=m.get("parent_id"),
                    ))

                res_edges = await session.run(
                    """
                    MATCH (a:MindmapNode {document_id: $doc_id})-[r:HAS_TOPIC]->(b:MindmapNode {document_id: $doc_id})
                    RETURN a.id AS source, b.id AS target, r.label AS label
                    """,
                    doc_id=document_id,
                )
                records_edges = await res_edges.data()
                for idx, rec in enumerate(records_edges):
                    edges.append(GraphEdge(
                        id=f"mm_e_{idx}",
                        source=rec["source"],
                        target=rec["target"],
                        label=rec.get("label", "bao_gồm"),
                    ))
        except Exception as e:
            logger.warning(f"Neo4j query mindmap failed: {e}")

    # Fallback to in-memory mindmap cache
    if not nodes and document_id in _in_memory_mindmaps:
        cached = _in_memory_mindmaps[document_id]
        for n in cached.get("nodes", []):
            nodes.append(GraphNode(
                id=str(n.get("id", "")),
                label=n.get("label") or n.get("name", "Node"),
                type=n.get("type", "Topic"),
                level=int(n.get("level", 1)),
                definition=n.get("definition"),
                color=n.get("color", "#6366F1"),
                parent_id=n.get("parent_id"),
            ))
        for idx, e in enumerate(cached.get("edges", [])):
            edges.append(GraphEdge(
                id=f"mm_e_{idx}",
                source=str(e.get("source", "")),
                target=str(e.get("target", "")),
                label=e.get("label", "bao_gồm"),
            ))

    return GraphResponse(document_id=document_id, mode="mindmap", nodes=nodes, edges=edges)


# ── Concept Graph Retrieval ────────────────────────────────────────────────────
async def get_document_graph(document_id: str, mode: str = "graph") -> GraphResponse:
    """Retrieve all nodes and edges belonging to a document for Cytoscape visualization."""
    if mode == "mindmap":
        mm = await get_document_mindmap(document_id)
        if mm.nodes:
            return mm

    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []

    if neo4j_driver is not None:
        try:
            async with neo4j_driver.session() as session:
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
                        level=2,
                        definition=n.get("definition"),
                        formula=n.get("formula"),
                        page_number=n.get("page_number"),
                        color="#6366F1" if n.get("type") == "Concept" else "#F59E0B"
                    ))

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
                level=2,
                definition=n.get("definition"),
                formula=n.get("formula"),
                page_number=n.get("page_number"),
                color="#6366F1" if n.get("type") == "Concept" else "#F59E0B"
            ))
        for idx, e in enumerate(cached.get("edges", [])):
            edges.append(GraphEdge(
                id=f"e_{idx}",
                source=str(e.get("source", "")),
                target=str(e.get("target", "")),
                label=e.get("label", "relates_to"),
                confidence=e.get("confidence", 1.0)
            ))

    # If mindmap mode requested but mindmap empty, synthesize from graph
    if mode == "mindmap" and not nodes:
        # Generate default mindmap
        pass

    return GraphResponse(document_id=document_id, mode=mode, nodes=nodes, edges=edges)


# ── AI & Heuristic Mindmap Builder ─────────────────────────────────────────────
async def build_mindmap_and_graph_for_document(document_id: str, doc_title: str, clean_text: str) -> tuple[dict, dict]:
    """
    Builds both:
    1. Hierarchical Mindmap tree (Root -> Chapters/Topics -> Concepts -> Details)
    2. Concept Graph (Nodes with bidirectional relationships)
    Saves both into Neo4j and in-memory caches.
    """
    # 1. Try Gemini AI extraction with 5s timeout
    mindmap_data = None
    prompt = f"""Bạn là chuyên gia thiết kế Sơ đồ Tư duy (Mindmap) và Đồ thị Tri thức học thuật.
Hãy phân tích tài liệu sau và xuất JSON sơ đồ tư duy phân cấp 3-4 tầng:
{{
  "mindmap": {{
    "root": "{doc_title}",
    "topics": [
      {{
        "title": "Tên chủ đề/chương 1",
        "subtopics": [
          {{
            "title": "Tiểu mục A",
            "details": ["Định nghĩa hoặc công thức chính"]
          }}
        ]
      }}
    ]
  }},
  "concepts": [
    {{"id": "c1", "name": "Tên khái niệm", "type": "Concept", "definition": "Định nghĩa tóm tắt"}}
  ],
  "relationships": [
    {{"source": "c1", "target": "c2", "label": "relates_to"}}
  ]
}}

Nội dung bài học:
{clean_text[:4000]}
"""
    try:
        raw_json = await asyncio.wait_for(generate_json(prompt), timeout=5.0)
        parsed = json.loads(raw_json)
        if isinstance(parsed, dict) and "mindmap" in parsed:
            mindmap_data = parsed
    except Exception:
        mindmap_data = None

    # 2. Build or Fallback Heuristic Structure
    mm_nodes: list[dict] = []
    mm_edges: list[dict] = []

    # Root Node (Level 0)
    root_id = "mm_root"
    mm_nodes.append({
        "id": root_id,
        "label": doc_title[:45],
        "type": "Root",
        "level": 0,
        "definition": f"Tài liệu trọng tâm: {doc_title}",
        "color": "#4F46E5",
        "parent_id": None,
    })

    if mindmap_data and "mindmap" in mindmap_data and "topics" in mindmap_data["mindmap"]:
        # Build from Gemini output
        topics = mindmap_data["mindmap"]["topics"][:4]
        for t_idx, topic in enumerate(topics):
            t_id = f"mm_t_{t_idx}"
            t_title = topic.get("title", f"Chủ đề {t_idx + 1}")
            mm_nodes.append({
                "id": t_id,
                "label": t_title[:38],
                "type": "Topic",
                "level": 1,
                "definition": f"Chủ đề trọng tâm {t_idx + 1}",
                "color": "#10B981",
                "parent_id": root_id,
            })
            mm_edges.append({
                "source": root_id,
                "target": t_id,
                "label": "chủ đề chính",
            })

            subtopics = topic.get("subtopics", [])[:3]
            for s_idx, sub in enumerate(subtopics):
                s_id = f"mm_s_{t_idx}_{s_idx}"
                s_title = sub.get("title", f"Nội dung {s_idx + 1}") if isinstance(sub, dict) else str(sub)
                mm_nodes.append({
                    "id": s_id,
                    "label": s_title[:35],
                    "type": "Subtopic",
                    "level": 2,
                    "definition": f"Khái niệm thuộc {t_title}",
                    "color": "#F59E0B",
                    "parent_id": t_id,
                })
                mm_edges.append({
                    "source": t_id,
                    "target": s_id,
                    "label": "bao gồm",
                })

                if isinstance(sub, dict) and "details" in sub:
                    for d_idx, detail in enumerate(sub.get("details", [])[:2]):
                        d_id = f"mm_d_{t_idx}_{s_idx}_{d_idx}"
                        mm_nodes.append({
                            "id": d_id,
                            "label": str(detail)[:32],
                            "type": "Detail",
                            "level": 3,
                            "definition": str(detail),
                            "color": "#06B6D4",
                            "parent_id": s_id,
                        })
                        mm_edges.append({
                            "source": s_id,
                            "target": d_id,
                            "label": "chi tiết",
                        })
    else:
        # Heuristic Mindmap Generation based on headings, bold text & sections
        paragraphs = [p.strip() for p in re.split(r"\n+", clean_text) if len(p.strip()) > 20]
        heading_candidates = [
            p for p in paragraphs
            if any(p.startswith(prefix) for prefix in ("#", "Chương", "Bài", "Phần", "1.", "2.", "3.", "4.", "I.", "II."))
            or (len(p) < 60 and not p.endswith("."))
        ][:4]

        if not heading_candidates:
            heading_candidates = [
                "1. Cơ sở Lý thuyết & Khái niệm",
                "2. Các Nguyên lý Trọng tâm",
                "3. Thuật toán & Phương pháp Giải",
                "4. Ứng dụng & Bài tập Thực hành",
            ]

        for t_idx, heading in enumerate(heading_candidates):
            t_id = f"mm_t_{t_idx}"
            clean_head = re.sub(r"^[#\d.\s]+", "", heading).strip()[:35] or f"Chủ đề {t_idx + 1}"
            mm_nodes.append({
                "id": t_id,
                "label": clean_head,
                "type": "Topic",
                "level": 1,
                "definition": f"Chủ đề trọng tâm: {clean_head}",
                "color": "#10B981",
                "parent_id": root_id,
            })
            mm_edges.append({
                "source": root_id,
                "target": t_id,
                "label": "chủ đề chính",
            })

            # Subtopics
            sub_candidates = [
                f"{clean_head} - Định nghĩa",
                f"{clean_head} - Đặc điểm",
                f"{clean_head} - Công thức & Quy tắc",
            ]
            for s_idx, sub in enumerate(sub_candidates):
                s_id = f"mm_s_{t_idx}_{s_idx}"
                mm_nodes.append({
                    "id": s_id,
                    "label": sub[:35],
                    "type": "Subtopic",
                    "level": 2,
                    "definition": f"Nội dung trọng điểm của {clean_head}",
                    "color": "#F59E0B",
                    "parent_id": t_id,
                })
                mm_edges.append({
                    "source": t_id,
                    "target": s_id,
                    "label": "bao gồm",
                })

                # Detail leaf
                d_id = f"mm_d_{t_idx}_{s_idx}_0"
                mm_nodes.append({
                    "id": d_id,
                    "label": "Ví dụ & Ứng dụng",
                    "type": "Detail",
                    "level": 3,
                    "definition": f"Minh họa thực tế cho {sub}",
                    "color": "#06B6D4",
                    "parent_id": s_id,
                })
                mm_edges.append({
                    "source": s_id,
                    "target": d_id,
                    "label": "chi tiết",
                })

    # Concept Graph generation
    words = re.findall(r"\b[A-ZÀ-Ỹ][a-zà-ỹA-Z0-9_-]{2,}(?:\s+[A-ZÀ-Ỹa-zà-ỹ0-9_-]{2,}){0,2}\b", clean_text)
    stop_words = {"Trang", "Chương", "Phần", "Mục", "Bài", "Trong", "Theo", "Nhưng", "Hoặc", "Nếu", "Khi"}
    unique_concepts = [w for w in dict.fromkeys(words) if w not in stop_words][:8]
    if len(unique_concepts) < 4:
        unique_concepts = ["Khái niệm Cơ sở", "Quy tắc Điều kiện", "Mô hình Giải thuật", "Công thức Thực thi", "Ứng dụng Hệ thống"]

    graph_nodes = []
    for i, c in enumerate(unique_concepts):
        graph_nodes.append({
            "id": f"node_{i}",
            "name": c[:38],
            "type": "Concept" if i % 2 == 0 else "Theorem",
            "definition": f"Khái niệm học thuật trong {doc_title}",
            "formula": "T(n) = O(n)" if i == 2 else "",
            "page_number": (i // 2) + 1,
        })
    graph_edges = []
    for i in range(len(graph_nodes) - 1):
        graph_edges.append({
            "source": f"node_{i}",
            "target": f"node_{i + 1}",
            "label": "relates_to" if i % 2 == 0 else "depends_on",
            "confidence": 0.95,
        })
    if len(graph_nodes) >= 3:
        graph_edges.append({
            "source": "node_0",
            "target": "node_2",
            "label": "derives",
            "confidence": 0.90,
        })

    # Save both to Neo4j
    await save_mindmap_to_neo4j(document_id, mm_nodes, mm_edges)
    await save_graph_to_neo4j(document_id, graph_nodes, graph_edges)

    return (
        {"nodes": mm_nodes, "edges": mm_edges},
        {"nodes": graph_nodes, "edges": graph_edges},
    )


# ── Multi-hop Context Retrieval for GraphRAG ──────────────────────────────────
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
