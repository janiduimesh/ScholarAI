const API_BASE = 'http://localhost:8000/api/v1';

export interface Project {
  id: number;
  title: string;
  description?: string;
  stage: string;
  created_at: string;
  refined_topic?: string;
  research_gap?: string;
  methodology?: string;
  supervisor_feedback?: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface AgentLog {
  id: number;
  project_id: number;
  agent_name: string;
  message: string;
  timestamp: string;
  level: string;
  step?: string;
}

// Helpers for Authorization Header
function getAuthHeaders(token?: string): HeadersInit {
  const activeToken = token || localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

// --- Auth Endpoints ---

export async function registerUser(email: string, password: string, fullName: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Registration failed');
  }
  return await res.json();
}

export async function loginUser(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Login failed');
  }
  const data = await res.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function fetchCurrentUser(token?: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user details');
  }
  return await res.json();
}

// --- Project Endpoints ---

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE}/projects/`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  } catch (err) {
    console.error('API Error fetching projects:', err);
    throw err;
  }
}

export async function createProject(title: string, description: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, description })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to create project');
  }
  return await res.json();
}

// --- Agent Endpoints ---

export async function runAgent(projectId: number, agentName: string, instructions?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/agents/run`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      project_id: projectId,
      agent_name: agentName,
      instructions: instructions || ''
    })
  });
  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(errBody.detail || 'Execution failed');
  }
  return await res.json();
}

export async function fetchAgentLogs(projectId: number): Promise<AgentLog[]> {
  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}/agent-logs`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch agent logs');
    return await res.json();
  } catch (err) {
    console.error('API Error fetching agent logs:', err);
    return [];
  }
}
