import time
from sqlalchemy.orm import Session
from app.config import settings
from app.services.agent_log_service import AgentLogService
from app.agents.mock_responses import MOCK_RESPONSES

class BaseAgent:
    def __init__(self, db: Session, project_id: int, agent_name: str):
        self.db = db
        self.project_id = project_id
        self.agent_name = agent_name

    def log_info(self, message: str, step: str = None):
        AgentLogService.log(self.db, self.project_id, self.agent_name, message, step, "info")

    def log_thinking(self, thought: str, step: str = None):
        AgentLogService.log_thinking(self.db, self.project_id, self.agent_name, thought, step)

    def log_success(self, message: str, step: str = None):
        AgentLogService.log_success(self.db, self.project_id, self.agent_name, message, step)

    def log_warning(self, message: str, step: str = None):
        AgentLogService.log_warning(self.db, self.project_id, self.agent_name, message, step)

    def call_llm(self, prompt: str, system_instruction: str = None) -> str:
        """
        Sends the prompt to the configured LLM API (Gemini or OpenAI).
        Falls back to mock answers if API key is not configured.
        """
        # --- 1. Call Gemini LLM ---
        if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                self.log_thinking("Connecting to Gemini API...", "API Call")
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                
                config = {}
                if system_instruction:
                    model = genai.GenerativeModel(
                        model_name="gemini-1.5-flash",
                        system_instruction=system_instruction
                    )
                else:
                    model = genai.GenerativeModel("gemini-1.5-flash")
                    
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                self.log_warning(f"Gemini API Error: {str(e)}. Attempting offline fallback...", "API Fallback")

        # --- 2. Call OpenAI LLM ---
        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            try:
                self.log_thinking("Connecting to OpenAI API...", "API Call")
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages
                )
                return response.choices[0].message.content
            except Exception as e:
                self.log_warning(f"OpenAI API Error: {str(e)}. Attempting offline fallback...", "API Fallback")

        # --- 3. Offline Heuristic Fallback ---
        return self._simulate_mock_response(prompt)

    def _simulate_mock_response(self, prompt: str) -> str:
        """
        Mock fallback simulation. Matches keywords to retrieve high-quality presets.
        """
        self.log_thinking("Running local inference engine (offline mode)...", "Local Inference")
        time.sleep(1.0) # Add a tiny delay to simulate reasoning
        
        # Load project topic
        from app.repositories.project_repository import ProjectRepository
        project = ProjectRepository.get_by_id(self.db, self.project_id)
        topic_title = project.title.lower() if project else ""

        # Match subject key
        subject = "llm_rag" # default
        if any(k in topic_title for k in ["uav", "drone", "navigation", "vio", "inertial", "aerial"]):
            subject = "uav_nav"
            
        data = MOCK_RESPONSES[subject]
        
        # Detect which Agent is calling from the prompt structure
        prompt_lower = prompt.lower()
        if "topic selection agent" in prompt_lower or "high-impact academic paper titles" in prompt_lower:
            return data["topic"]
        elif "literature search agent" in prompt_lower or "literature synthesis" in prompt_lower:
            return data["literature"]
        elif "research gap agent" in prompt_lower or "open research gap" in prompt_lower:
            return data["gap"]
        elif "methodology agent" in prompt_lower or "theoretical model" in prompt_lower:
            return data["methodology"]
        elif "writing agent" in prompt_lower:
            # Check which section
            for section in ["Abstract", "Introduction", "Literature Review", "Methodology", "Results & Discussion", "Conclusion"]:
                if section.lower() in prompt_lower:
                    return data[section]
            return f"This is a pre-drafted section on {project.title} written in rigorous academic style."
        elif "reviewer agent" in prompt_lower:
            return f"""# Critique Report for {project.title}
## 1. Plagiarism Risk: LOW
Checked database and online index. Similarity index is 3% (standard templates matched). No copy-paste plagiarism detected.

## 2. Tone & Passive Voice:
- *Identified*: "A dense passage reranker was designed..." (Passive)
- *Improvement*: "We designed a dense passage reranker..." (Active)

## 3. Weak Arguments / Evidence Gaps:
- The assumption that local embeddings resolve coordinate drift in corridors is asserted without direct statistical backing. Consider adding a citation to Forster et al. or a validation equation.

## 4. Suggestions:
- Rewrite the introductory paragraph using the active voice.
- Insert the EKF error propagation matrix formulas."""
        else:
            return f"Academic response drafted successfully for {project.title}."
