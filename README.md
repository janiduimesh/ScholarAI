# ScholarAI — Multi-Agent Academic Writing Assistant

An AI-powered research assistant that automates the academic paper writing workflow using a multi-agent pipeline. Built with **FastAPI**, **React/TypeScript**, **LangGraph**, and **Google Gemini 2.5 Flash**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React / Vite Frontend                    │
│  Landing → Auth → Dashboard → Project Hub → Literature Search   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (/api/v1)
┌──────────────────────────▼──────────────────────────────────────┐
│                        FastAPI Backend                           │
│                                                                  │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Auth     │  │ Projects   │  │ Papers   │  │ Exports      │  │
│  │ Routes   │  │ Routes     │  │ Routes   │  │ Routes       │  │
│  └──────────┘  └────────────┘  └──────────┘  └──────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              LangGraph Agent Pipeline                     │   │
│  │                                                           │   │
│  │  Topic → Literature → Gap Analysis → Methodology          │   │
│  │                    ↓                                       │   │
│  │         Writing → Reviewer → Formatting                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐     │
│  │ RAG Service  │  │ PDF Parser   │  │ Vector Embeddings │     │
│  └──────────────┘  └──────────────┘  └───────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Neon PostgreSQL │
                  └─────────────────┘
```

## Features

### Multi-Agent Research Pipeline
- **Topic Selection Agent** — Refines raw research topics into structured academic proposals
- **Literature Search Agent** — Synthesizes uploaded papers into a literature review with citation mapping
- **Gap Analysis Agent** — Identifies research gaps and limitations in existing work
- **Methodology Agent** — Designs research methodology frameworks based on identified gaps
- **Writing Agent** — Generates formal academic sections (Introduction, Related Work, etc.) with RAG context
- **Reviewer Agent** — Audits drafts for academic style, passive voice, and citation accuracy
- **Citation Agent** — Verifies factual claims against source material
- **Formatting Agent** — Applies IEEE/APA formatting rules

### Pipeline Orchestration
- **LangGraph StateGraph** for deterministic agent sequencing with skip logic
- **Single-stage dispatch** — Run any individual agent on demand
- **Full pipeline mode** — Auto-chain: Topic → Literature → Gap → Methodology with stage skip detection

### RAG & Document Intelligence
- PDF upload and chunked text extraction via PyPDF
- Word-level cosine similarity vector search using NumPy embeddings
- Context-aware section drafting with retrieved paper chunks

### Document Management
- Versioned section drafts with full history
- Supervisor feedback threads with reply chains and resolution tracking
- Export to DOCX with IEEE/APA citation formatting

### Authentication & Multi-Tenancy
- JWT-based authentication (register, login, token refresh)
- Per-user project isolation
- Role-based access with bearer token headers

## Tech Stack

| Layer        | Technology                                                      |
| :----------- | :-------------------------------------------------------------- |
| Frontend     | React 18, TypeScript, Vite 5                                    |
| Backend      | FastAPI, SQLAlchemy, Pydantic, Uvicorn                          |
| LLM          | Google Gemini 2.5 Flash via `google-generativeai` SDK           |
| Agents       | LangGraph (StateGraph with conditional edges)                   |
| Database     | Neon PostgreSQL (serverless) with `psycopg2-binary`             |
| RAG          | NumPy cosine similarity vectors, PyPDF chunked extraction       |
| Auth         | JWT via `python-jose`, password hashing via `passlib[bcrypt]`   |
| Export       | `python-docx` for Word documents, Jinja2 templates              |
| Deployment   | Docker, Render (backend), Vercel (frontend), Terraform IaC      |

## Project Structure

```
ScholarAI/
├── backend/
│   ├── app/
│   │   ├── agents/            # LangGraph pipeline & all specialized agents
│   │   │   ├── graph.py       # StateGraph definitions (single-stage & pipeline)
│   │   │   ├── state.py       # ResearchState TypedDict
│   │   │   ├── base_agent.py  # Base class with LLM calls and logging
│   │   │   ├── topic_agent.py
│   │   │   ├── literature_agent.py
│   │   │   ├── gap_analysis_agent.py
│   │   │   ├── methodology_agent.py
│   │   │   ├── writing_agent.py
│   │   │   ├── reviewer_agent.py
│   │   │   ├── citation_agent.py
│   │   │   └── formatting_agent.py
│   │   ├── api/v1/            # FastAPI route handlers
│   │   │   ├── auth_routes.py
│   │   │   ├── project_routes.py
│   │   │   ├── paper_routes.py
│   │   │   ├── agent_routes.py
│   │   │   ├── citation_routes.py
│   │   │   ├── document_routes.py
│   │   │   └── export_routes.py
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic (RAG, PDF, auth, export)
│   │   ├── repositories/      # Data access layer
│   │   ├── prompts/           # LLM prompt templates per agent
│   │   ├── utils/             # Helpers (response parsing, etc.)
│   │   ├── config.py          # Pydantic Settings (env-based config)
│   │   ├── database.py        # SQLAlchemy engine & session
│   │   └── main.py            # FastAPI app entry point
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AuthPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectHub.tsx
│   │   │   ├── SetupWizard.tsx
│   │   │   ├── LiteratureSearch.tsx
│   │   │   └── ProjectModal.tsx
│   │   ├── api.ts             # API client with all endpoint functions
│   │   ├── App.tsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.ts
├── terraform/                 # Infrastructure as Code (Render + Vercel)
│   ├── main.tf
│   ├── variables.tf
│   ├── render.tf
│   ├── vercel.tf
│   └── outputs.tf
├── .github/workflows/
│   └── ci-cd.yml              # GitHub Actions CI/CD pipeline
└── .gitignore
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create your environment file:
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
DATABASE_URL=postgresql://user:pass@your-neon-host/neondb?sslmode=require
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
```

Start the backend:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Docker (Alternative)

```bash
cd backend
docker compose up --build
```

## API Endpoints

| Method | Endpoint                                    | Description                        |
| :----- | :------------------------------------------ | :--------------------------------- |
| POST   | `/api/v1/auth/register`                     | Register a new user                |
| POST   | `/api/v1/auth/login`                        | Login and receive JWT token        |
| GET    | `/api/v1/auth/me`                           | Get current user profile           |
| GET    | `/api/v1/projects/`                         | List all user projects             |
| POST   | `/api/v1/projects/`                         | Create a new research project      |
| GET    | `/api/v1/projects/{id}`                     | Get project details                |
| PUT    | `/api/v1/projects/{id}`                     | Update project fields              |
| POST   | `/api/v1/projects/{id}/papers`              | Upload a reference PDF             |
| GET    | `/api/v1/projects/{id}/papers`              | List uploaded papers               |
| POST   | `/api/v1/agents/run`                        | Run a single agent stage           |
| POST   | `/api/v1/agents/pipeline/{id}`              | Run the full auto-pipeline         |
| GET    | `/api/v1/projects/{id}/sections`            | Get all generated sections         |
| POST   | `/api/v1/projects/{id}/sections`            | Save a section draft               |
| GET    | `/api/v1/projects/{id}/citations`           | List project citations             |
| POST   | `/api/v1/projects/{id}/feedback`            | Add supervisor feedback            |
| POST   | `/api/v1/export`                            | Export document (DOCX)             |

## Deployment

### Infrastructure as Code (Terraform)

The `terraform/` directory provisions:
- **Render** — Backend web service (Docker runtime)
- **Vercel** — Frontend static deployment

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in your API keys
terraform init
terraform apply
```

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs on every push:
1. **Backend CI** — Installs dependencies, runs `pytest`
2. **Frontend CI** — Runs `eslint` lint checks and production build
3. **Deploy** — Triggers Render deploy hook on successful checks

## Environment Variables

| Variable                     | Required | Description                              |
| :--------------------------- | :------- | :--------------------------------------- |
| `DATABASE_URL`               | Yes      | PostgreSQL connection string (Neon)      |
| `SECRET_KEY`                 | Yes      | JWT signing secret                       |
| `ALGORITHM`                  | No       | JWT algorithm (default: `HS256`)         |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| No       | Token expiry in minutes (default: `120`) |
| `LLM_PROVIDER`               | Yes      | `gemini` or `openai`                     |
| `GEMINI_API_KEY`             | Yes*     | Google Gemini API key                    |
| `OPENAI_API_KEY`             | No       | OpenAI API key (alternative provider)    |

## License

This project is developed for academic and portfolio purposes.
