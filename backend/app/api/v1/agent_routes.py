from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.project_service import ProjectService
from app.services.agent_log_service import AgentLogService
from app.agents.graph import run_research_stage, run_full_pipeline
from app.schemas.agent_schema import AgentRunRequest, AgentRunResponse, AgentLogResponse
from app.models.user_model import User

router = APIRouter(tags=["agents"])

@router.post("/agents/run", response_model=AgentRunResponse)
def run_agent_stage(
    request: AgentRunRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, request.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        # Prepare parameters for the agent
        payload = {}
        if request.agent_name.lower() == "writing" or request.agent_name.lower() == "reviewer":
            payload["section_name"] = request.instructions or "Introduction"
        elif request.agent_name.lower() == "formatting":
            payload["citation_style"] = request.instructions or "ieee"
            
        # Maps agent name to LangGraph stage names
        agent_stage_map = {
            "topic": "Topic Selection",
            "literature": "Literature Review",
            "gap": "Research Gap",
            "methodology": "Methodology",
            "writing": "Writing",
            "reviewer": "Reviewer",
            "formatting": "Formatting"
        }
        
        target_stage = agent_stage_map.get(request.agent_name.lower())
        if not target_stage:
            raise HTTPException(status_code=400, detail=f"Invalid agent name '{request.agent_name}'")

        output = run_research_stage(db, request.project_id, target_stage, payload)
        
        return {
            "success": True,
            "message": f"Agent '{request.agent_name}' completed execution successfully.",
            "output": output
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

@router.post("/agents/pipeline/{project_id}", response_model=AgentRunResponse)
def run_pipeline(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """
    Run the full research pipeline: Topic → Literature → Gap → Methodology.
    Stops before the Writing stage. Skips stages that are already completed.
    """
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        output = run_full_pipeline(db, project_id)
        return {
            "success": True,
            "message": "Full pipeline executed successfully (Topic → Literature → Gap → Methodology).",
            "output": output
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")

@router.get("/projects/{project_id}/agent-logs", response_model=List[AgentLogResponse])
def get_agent_logs(
    project_id: int, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return AgentLogService.get_logs(db, project_id, limit)

@router.post("/projects/{project_id}/agent-logs/clear")
def clear_agent_logs(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    project = ProjectService.get_project(db, project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    success = AgentLogService.clear_logs(db, project_id)
    return {"success": success, "message": "Agent logs cleared successfully"}
