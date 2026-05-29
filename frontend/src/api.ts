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

export async function fetchProject(projectId: number): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project details');
  return await res.json();
}

export async function fetchProjectCitations(projectId: number): Promise<any[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/citations`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project citations');
  return await res.json();
}

export async function addSupervisorFeedback(projectId: number, author: string, text: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/feedback?author=${encodeURIComponent(author)}&text=${encodeURIComponent(text)}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to add supervisor feedback');
  return await res.json();
}

export async function resolveSupervisorFeedback(projectId: number, feedbackId: string, resolved: boolean = true): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/feedback/${feedbackId}/resolve?resolved=${resolved}`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to resolve supervisor feedback');
  return await res.json();
}

export async function addFeedbackReply(projectId: number, feedbackId: string, author: string, text: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/feedback/${feedbackId}/reply?author=${encodeURIComponent(author)}&text=${encodeURIComponent(text)}`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to add reply to supervisor feedback');
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

// --- Paper Endpoints ---

export async function uploadPaper(projectId: number, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const activeToken = localStorage.getItem('token');
  const headers: HeadersInit = {};
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const res = await fetch(`${API_BASE}/projects/${projectId}/papers`, {
    method: 'POST',
    headers: headers,
    body: formData
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to upload paper');
  }
  return await res.json();
}

export async function fetchProjectPapers(projectId: number): Promise<any[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/papers`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project papers');
  return await res.json();
}

// --- Document Sections Endpoints ---

export interface GeneratedSection {
  id: number;
  section_name: string;
  content: string;
  version: number;
  created_at: string;
  project_id: number;
}

export async function fetchProjectSections(projectId: number): Promise<GeneratedSection[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/sections`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project sections');
  return await res.json();
}

export async function saveProjectSection(projectId: number, sectionName: string, content: string): Promise<GeneratedSection> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/sections`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ section_name: sectionName, content })
  });
  if (!res.ok) throw new Error('Failed to save project section draft');
  return await res.json();
}


