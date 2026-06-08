"""
LangGraph-based research pipeline graph.
Replaces the manual OrchestratorAgent dispatcher with a compiled StateGraph.

Two graphs are provided:
  1. research_graph — single-stage dispatch (for on-demand individual runs)
  2. pipeline_graph — full pipeline: topic → literature → gap → methodology → END
"""

from langgraph.graph import StateGraph, END

from app.agents.state import ResearchState
from app.agents.topic_agent import TopicAgent
from app.agents.literature_agent import LiteratureAgent
from app.agents.gap_analysis_agent import GapAnalysisAgent
from app.agents.methodology_agent import MethodologyAgent
from app.agents.writing_agent import WritingAgent
from app.agents.reviewer_agent import ReviewerAgent
from app.agents.formatting_agent import FormattingAgent
from app.repositories.project_repository import ProjectRepository


# ── Stage ordering (used for skip logic in pipeline) ────────────────────────

STAGE_ORDER = [
    "Topic Selection",
    "Literature Review",
    "Research Gap",
    "Methodology",
    "Writing",
    "Reviewer",
    "Formatting",
    "Completed",
]


def _stage_index(stage_name: str) -> int:
    """Return the index of a stage in the pipeline. -1 if unknown."""
    normalized = stage_name.strip()
    # Handle aliases
    if normalized == "Review":
        normalized = "Reviewer"
    try:
        return STAGE_ORDER.index(normalized)
    except ValueError:
        return -1


def _is_stage_done(db, project_id: int, stage_name: str) -> bool:
    """Check if the project has already advanced past the given stage."""
    project = ProjectRepository.get_by_id(db, project_id)
    if not project:
        return False
    current_idx = _stage_index(project.stage)
    target_idx = _stage_index(stage_name)
    # If the project's current stage is past the target, it's already done
    return current_idx > target_idx


# ── Node Functions ──────────────────────────────────────────────────────────
# Each node receives the full ResearchState, runs the corresponding agent,
# and returns the updated state fields.

def topic_node(state: ResearchState) -> dict:
    """Run the Topic Selection Agent."""
    agent = TopicAgent(state["db_session"], state["project_id"])
    output = agent.run()
    return {"output": output}


def literature_node(state: ResearchState) -> dict:
    """Run the Literature Search Agent."""
    agent = LiteratureAgent(state["db_session"], state["project_id"])
    output = agent.run()
    return {"output": output}


def gap_node(state: ResearchState) -> dict:
    """Run the Research Gap Analysis Agent."""
    literature_synthesis = state["payload"].get("literature_synthesis", "")
    agent = GapAnalysisAgent(state["db_session"], state["project_id"])
    output = agent.run(literature_synthesis=literature_synthesis)
    return {"output": output}


def methodology_node(state: ResearchState) -> dict:
    """Run the Methodology Design Agent."""
    agent = MethodologyAgent(state["db_session"], state["project_id"])
    output = agent.run()
    return {"output": output}


def writing_node(state: ResearchState) -> dict:
    """Run the Writing Agent for a specific section."""
    section_name = state["payload"].get("section_name", "Introduction")
    agent = WritingAgent(state["db_session"], state["project_id"])
    output = agent.run(section_name)
    return {"output": output}


def reviewer_node(state: ResearchState) -> dict:
    """Run the Reviewer Agent for a specific section."""
    section_name = state["payload"].get("section_name", "Introduction")
    agent = ReviewerAgent(state["db_session"], state["project_id"])
    output = agent.run(section_name)
    return {"output": output}


def formatting_node(state: ResearchState) -> dict:
    """Run the Formatting Agent with the specified citation style."""
    citation_style = state["payload"].get("citation_style", "ieee")
    agent = FormattingAgent(state["db_session"], state["project_id"])
    output = agent.run(citation_style)
    return {"output": output}


# ── Pipeline Node Functions (with skip logic) ──────────────────────────────
# These wrap the regular nodes but skip execution if the stage is already done.

def pipeline_topic_node(state: ResearchState) -> dict:
    """Run topic agent, or skip if already past this stage."""
    if _is_stage_done(state["db_session"], state["project_id"], "Topic Selection"):
        return {"output": state.get("output", "") + "\n[Skipped] Topic Selection — already completed."}
    return topic_node(state)


def pipeline_literature_node(state: ResearchState) -> dict:
    """Run literature agent, or skip if already past this stage."""
    if _is_stage_done(state["db_session"], state["project_id"], "Literature Review"):
        return {"output": state.get("output", "") + "\n[Skipped] Literature Review — already completed."}
    return literature_node(state)


def pipeline_gap_node(state: ResearchState) -> dict:
    """Run gap analysis agent, or skip if already past this stage."""
    if _is_stage_done(state["db_session"], state["project_id"], "Research Gap"):
        return {"output": state.get("output", "") + "\n[Skipped] Research Gap — already completed."}
    return gap_node(state)


def pipeline_methodology_node(state: ResearchState) -> dict:
    """Run methodology agent, or skip if already past this stage."""
    if _is_stage_done(state["db_session"], state["project_id"], "Methodology"):
        return {"output": state.get("output", "") + "\n[Skipped] Methodology — already completed."}
    return methodology_node(state)


# ── Routing Function (single-stage graph) ──────────────────────────────────

STAGE_TO_NODE = {
    "Topic Selection": "topic",
    "Literature Review": "literature",
    "Research Gap": "gap",
    "Methodology": "methodology",
    "Writing": "writing",
    "Review": "reviewer",
    "Reviewer": "reviewer",
    "Formatting": "formatting",
}


def route_stage(state: ResearchState) -> str:
    """
    Conditional routing function for single-stage dispatch.
    Returns the node name to execute based on the stage_name in state.
    """
    stage = state["stage_name"].strip()
    node = STAGE_TO_NODE.get(stage)
    if not node:
        valid = ", ".join(STAGE_TO_NODE.keys())
        raise ValueError(f"Unknown stage '{stage}'. Valid stages: {valid}")
    return node


# ── Build Single-Stage Graph ───────────────────────────────────────────────

def _build_single_stage_graph():
    """Construct and compile the single-stage dispatch graph."""
    graph = StateGraph(ResearchState)

    # Register all agent nodes
    graph.add_node("topic", topic_node)
    graph.add_node("literature", literature_node)
    graph.add_node("gap", gap_node)
    graph.add_node("methodology", methodology_node)
    graph.add_node("writing", writing_node)
    graph.add_node("reviewer", reviewer_node)
    graph.add_node("formatting", formatting_node)

    # Conditional entry: route from START to the correct node
    graph.add_conditional_edges(
        "__start__",
        route_stage,
        {
            "topic": "topic",
            "literature": "literature",
            "gap": "gap",
            "methodology": "methodology",
            "writing": "writing",
            "reviewer": "reviewer",
            "formatting": "formatting",
        }
    )

    # All nodes go to END after execution
    graph.add_edge("topic", END)
    graph.add_edge("literature", END)
    graph.add_edge("gap", END)
    graph.add_edge("methodology", END)
    graph.add_edge("writing", END)
    graph.add_edge("reviewer", END)
    graph.add_edge("formatting", END)

    return graph.compile()


# ── Build Pipeline Graph ───────────────────────────────────────────────────
# Sequential: topic → literature → gap → methodology → END
# Stops BEFORE writing (writing/reviewer/formatting are manual).

def _build_pipeline_graph():
    """
    Construct and compile the full auto-pipeline graph.
    Chains: Topic Selection → Literature Review → Research Gap → Methodology → END
    Each node skips if the project has already passed that stage.
    """
    graph = StateGraph(ResearchState)

    # Register pipeline nodes (with skip logic)
    graph.add_node("p_topic", pipeline_topic_node)
    graph.add_node("p_literature", pipeline_literature_node)
    graph.add_node("p_gap", pipeline_gap_node)
    graph.add_node("p_methodology", pipeline_methodology_node)

    # Sequential chain: START → topic → literature → gap → methodology → END
    graph.add_edge("__start__", "p_topic")
    graph.add_edge("p_topic", "p_literature")
    graph.add_edge("p_literature", "p_gap")
    graph.add_edge("p_gap", "p_methodology")
    graph.add_edge("p_methodology", END)

    return graph.compile()


# ── Compile both graphs at module load ──────────────────────────────────────

research_graph = _build_single_stage_graph()
pipeline_graph = _build_pipeline_graph()


# ── Public API ──────────────────────────────────────────────────────────────

def run_research_stage(db, project_id: int, stage_name: str, payload: dict = None) -> str:
    """
    Execute a single research pipeline stage via the LangGraph.
    
    Args:
        db: SQLAlchemy Session
        project_id: The project to run the agent on
        stage_name: Pipeline stage (e.g., "Topic Selection", "Writing")
        payload: Optional parameters (section_name, citation_style, etc.)
    
    Returns:
        The agent's output string
    """
    initial_state: ResearchState = {
        "project_id": project_id,
        "stage_name": stage_name,
        "payload": payload or {},
        "output": "",
        "db_session": db,
    }

    result = research_graph.invoke(initial_state)
    return result["output"]


def run_full_pipeline(db, project_id: int) -> str:
    """
    Execute the full research pipeline: Topic → Literature → Gap → Methodology.
    Stops before Writing (which requires manual section-by-section drafting).
    
    Each stage automatically skips if the project has already passed it,
    so calling this on a project at the 'Research Gap' stage will skip
    Topic and Literature, then run Gap → Methodology.
    
    Args:
        db: SQLAlchemy Session
        project_id: The project to run the pipeline on
    
    Returns:
        Combined output from all executed stages
    """
    initial_state: ResearchState = {
        "project_id": project_id,
        "stage_name": "pipeline",  # Not used for routing in pipeline graph
        "payload": {},
        "output": "",
        "db_session": db,
    }

    result = pipeline_graph.invoke(initial_state)
    return result["output"]

