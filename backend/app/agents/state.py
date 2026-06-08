"""
Shared state definition for the LangGraph research pipeline.
All node functions read from and write to this state.
"""

from typing import TypedDict, Any


class ResearchState(TypedDict):
    """State that flows through the LangGraph research pipeline."""
    
    # Core identifiers
    project_id: int
    stage_name: str
    
    payload: dict
    
    output: str
    
    db_session: Any
