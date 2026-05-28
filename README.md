# AI Research Assistant 

This is the FastAPI backend powering the multi-agent academic writing assistant.

## Features
- **FastAPI Core**: Highly performant API routes mapping authentication, projects, PDF uploads, RAG, and document diffing.
- **Agent Orchestrator**: Supports 7 academic agents with online APIs (Gemini/OpenAI) and smart offline fallbacks.
- **Relational DB**: Pre-configured SQLite tables autocompiled on startup.
- **RAG & Vector Search**: Embedded word-level cosine similarity vector index using NumPy.
- **Document Export**: Word DOCX and static HTML export.

## Installation & Launch

1. **Setup Environment**:
   Ensure Python 3.10+ is installed.
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure API Keys (Optional)**:
   Rename `.env.example` to `.env` and fill in your keys:
   - `GEMINI_API_KEY` (highly recommended) or `OPENAI_API_KEY`
   *Note: If no API key is specified, the system runs in an offline reasoning simulation mode with realistic presets for academic demonstrations.*

3. **Run Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   Open `http://localhost:8000/docs` to explore the interactive OpenAPI/Swagger docs.
