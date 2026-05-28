import time
from sqlalchemy.orm import Session
from app.config import settings
from app.services.agent_log_service import AgentLogService

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
        Sends the prompt to the configured Gemini LLM API.
        Returns the LLM response or raises an error with a relevant message.
        """

        # --- Validate Configuration ---
        if settings.LLM_PROVIDER != "gemini" or not settings.GEMINI_API_KEY:
            error_msg = (
                "LLM not configured. Please set LLM_PROVIDER=gemini and provide "
                "a valid GEMINI_API_KEY in your .env file."
            )
            self.log_warning(error_msg, "Config Error")
            raise ValueError(error_msg)

        # --- Call Gemini LLM ---
        try:
            self.log_thinking("Connecting to Gemini API...", "API Call")

            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            config = None
            if system_instruction:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction
                )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config,
            )

            return response.text or ""

        except Exception as e:
            error_msg = f"Gemini API call failed: {str(e)}"
            self.log_warning(error_msg, "API Error")
            raise RuntimeError(error_msg)

