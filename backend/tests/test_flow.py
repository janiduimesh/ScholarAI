import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Configure Test Database (SQLite memory)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_full_pipeline_flow():
    # 1. Register User
    reg_response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@scholar.com", "password": "password123", "full_name": "Test Scholar"}
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == "test@scholar.com"
    
    # 2. Login User
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@scholar.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Project
    proj_response = client.post(
        "/api/v1/projects/",
        headers=headers,
        json={"title": "Visual VIO for Drones", "description": "Fusing cameras and inertial tracking"}
    )
    assert proj_response.status_code == 201
    project_id = proj_response.json()["id"]
    assert proj_response.json()["stage"] == "Topic Selection"

    # 4. Trigger Topic Agent Refinement
    agent_response = client.post(
        "/api/v1/agents/run",
        headers=headers,
        json={"project_id": project_id, "agent_name": "topic"}
    )
    assert agent_response.status_code == 200
    assert agent_response.json()["success"] is True
    
    # Check if stage advanced to Literature Review
    check_response = client.get(f"/api/v1/projects/{project_id}", headers=headers)
    assert check_response.json()["stage"] == "Literature Review"
    assert "Problem Statement" in check_response.json()["refined_topic"]

    # 5. Add supervisor feedback
    feedback_response = client.post(
        "/api/v1/projects/{}/feedback?author=Prof.+Hale&text=Excellent+scope".format(project_id),
        headers=headers
    )
    assert feedback_response.status_code == 200
    assert "Prof. Hale" in feedback_response.json()["supervisor_feedback"]
