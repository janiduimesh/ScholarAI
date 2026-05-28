from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models
from app.api.v1 import (
    auth_routes,
    project_routes,
    paper_routes,
    agent_routes,
    citation_routes,
    document_routes,
    export_routes
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Research Assistant API",
    description="Backend API powering the academic paper writing assistant with agent pipelines and RAG.",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API Routers under v1 prefix
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(project_routes.router, prefix="/api/v1")
app.include_router(paper_routes.router, prefix="/api/v1")
app.include_router(agent_routes.router, prefix="/api/v1")
app.include_router(citation_routes.router, prefix="/api/v1")
app.include_router(document_routes.router, prefix="/api/v1")
app.include_router(export_routes.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Research Assistant API",
        "documentation": "/docs"
    }
