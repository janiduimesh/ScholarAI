import React, { useState, useEffect } from 'react';
import {
  fetchProjects,
  runAgent,
  fetchProjectPapers,
  fetchProjectCitations,
  fetchProjectSections,
  Project,
  GeneratedSection,
} from '../api';

interface DashboardPageProps {
  user: { name: string; email: string };
  onLogout: () => void;
  onOpenSetupWizard: () => void;
  onOpenProjectHub: (project: Project) => void;
}

type TabKey = 'dashboard' | 'projects' | 'literature' | 'citations' | 'versions';

interface PaperWithProject {
  id: number;
  title: string;
  authors: string;
  year: number | null;
  abstract: string;
  uploaded_at: string;
  project_id: number;
  projectTitle: string;
}

interface CitationWithProject {
  id: number;
  key: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  citation_type: string;
  bibtex: string;
  apa: string;
  ieee: string;
  project_id: number;
  projectTitle: string;
}

interface SectionWithProject extends GeneratedSection {
  projectTitle: string;
}


export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout, onOpenSetupWizard, onOpenProjectHub }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [runningAgentMap, setRunningAgentMap] = useState<Record<number, boolean>>({});
  const [totalPapers, setTotalPapers] = useState(0);
  const [totalCitations, setTotalCitations] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Cross-project data
  const [allPapers, setAllPapers] = useState<PaperWithProject[]>([]);
  const [allCitations, setAllCitations] = useState<CitationWithProject[]>([]);
  const [allSections, setAllSections] = useState<SectionWithProject[]>([]);
  const [tabDataLoading, setTabDataLoading] = useState(false);

  // Search/filter states
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStageFilter, setProjectStageFilter] = useState('All');
  const [literatureSearch, setLiteratureSearch] = useState('');
  const [citationSearch, setCitationSearch] = useState('');
  const [citationFormatView, setCitationFormatView] = useState<'ieee' | 'apa' | 'bibtex'>('ieee');
  const [versionSearch, setVersionSearch] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchProjects();
      setProjects(data);

      let papersCount = 0;
      let citationsCount = 0;
      try {
        const counts = await Promise.all(
          data.map(async (p) => {
            const papersList = await fetchProjectPapers(p.id).catch(() => []);
            const citationsList = await fetchProjectCitations(p.id).catch(() => []);
            return { papers: papersList.length, citations: citationsList.length };
          })
        );
        counts.forEach(item => {
          papersCount += item.papers;
          citationsCount += item.citations;
        });
      } catch (err) {
        console.error('Error fetching dashboard counts:', err);
      }
      setTotalPapers(papersCount);
      setTotalCitations(citationsCount);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setErrorMsg('Failed to load projects from the database. Make sure the backend server is running.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Load cross-project data when switching to a data tab
  const loadTabData = async (tab: TabKey) => {
    if (projects.length === 0) return;
    setTabDataLoading(true);
    try {
      if (tab === 'literature' && allPapers.length === 0) {
        const papersArrays = await Promise.all(
          projects.map(async (p) => {
            const papers = await fetchProjectPapers(p.id).catch(() => []);
            return papers.map((paper: any) => ({ ...paper, projectTitle: p.title }));
          })
        );
        setAllPapers(papersArrays.flat());
      }
      if (tab === 'citations' && allCitations.length === 0) {
        const citArrays = await Promise.all(
          projects.map(async (p) => {
            const cits = await fetchProjectCitations(p.id).catch(() => []);
            return cits.map((c: any) => ({ ...c, projectTitle: p.title }));
          })
        );
        setAllCitations(citArrays.flat());
      }
      if (tab === 'versions' && allSections.length === 0) {
        const secArrays = await Promise.all(
          projects.map(async (p) => {
            const secs = await fetchProjectSections(p.id).catch(() => []);
            return secs.map((s: any) => ({ ...s, projectTitle: p.title }));
          })
        );
        setAllSections(secArrays.flat());
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    } finally {
      setTabDataLoading(false);
    }
  };

  const handleTabSwitch = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'literature' || tab === 'citations' || tab === 'versions') {
      loadTabData(tab);
    }
  };

  const handleRunTopicAgent = async (project: Project) => {
    if (runningAgentMap[project.id]) return;
    setRunningAgentMap(prev => ({ ...prev, [project.id]: true }));
    try {
      alert(`Running Topic Selection Agent for project: "${project.title}"...`);
      const result = await runAgent(project.id, 'topic');
      alert(`Topic Refined Successfully!\n\nOutput:\n${result.output}`);
      loadProjects(); // Reload project to update stage
    } catch (err: any) {
      alert(`Error running agent: ${err.message || err}`);
    } finally {
      setRunningAgentMap(prev => ({ ...prev, [project.id]: false }));
    }
  };

  // Maps stages to percentages
  const getStagePercentage = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'topic selection': return 5;
      case 'literature review': return 18;
      case 'research gap': return 35;
      case 'methodology': return 50;
      case 'writing': return 62;
      case 'reviewer':
      case 'review': return 88;
      case 'formatting': return 95;
      case 'completed': return 100;
      default: return 10;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'writing': return 'var(--accent-peach)';
      case 'reviewer':
      case 'review': return 'var(--accent-green)';
      case 'literature review':
      case 'literature': return 'var(--accent-teal)';
      default: return 'var(--primary)';
    }
  };

  const getStageBadgeClass = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'writing': return 'writing';
      case 'reviewer':
      case 'review': return 'review';
      case 'literature review':
      case 'literature': return 'literature';
      default: return '';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Brief visual feedback could be added here
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  };

  // ── Shared Project Card Renderer ──
  const renderProjectCard = (proj: Project) => {
    const percent = getStagePercentage(proj.stage);
    const color = getStageColor(proj.stage);
    const badgeClass = getStageBadgeClass(proj.stage);
    const format = proj.description?.includes('Style:')
      ? proj.description.split('.')[0].replace('Style:', '').trim()
      : 'IEEE';

    return (
      <div key={proj.id} className="project-card glass-card">
        <div className="project-card-header">
          <div className="project-info">
            <h3 className="project-title">{proj.title}</h3>
            <p className="project-meta">
              {format} - Started {new Date(proj.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - {proj.stage} stage
            </p>
          </div>
          <span className={`stage-badge ${badgeClass}`}>{proj.stage}</span>
        </div>

        <div className="progress-container">
          <div className="progress-bar-wrapper">
            <div
              className="progress-bar-fill"
              style={{ width: `${percent}%`, backgroundColor: color }}
            />
          </div>
          <span className="progress-percentage">{percent}%</span>
        </div>

        <div className="pipeline-footer">
          <div className="pipeline-pills">
            <span className={`pipeline-pill ${percent >= 18 ? 'completed' : percent === 5 ? 'active' : ''}`}>
              {percent > 5 && '✓'} Literature
            </span>
            <span className={`pipeline-pill ${percent >= 35 ? 'completed' : percent === 18 ? 'active' : ''}`}>
              {percent > 18 && '✓'} Gaps
            </span>
            <span className={`pipeline-pill ${percent >= 50 ? 'completed' : percent === 35 ? 'active' : ''}`}>
              {percent > 35 && '✓'} Methodology
            </span>
            <span className={`pipeline-pill ${percent >= 62 ? 'completed' : percent === 50 ? 'active' : ''}`}>
              {percent > 50 && '✓'} Writing
            </span>
            <span className={`pipeline-pill ${percent >= 88 ? 'completed' : percent === 62 ? 'active' : ''}`}>
              {percent > 62 && '✓'} Review
            </span>
          </div>

          <button
            className="btn-outline"
            onClick={() => onOpenProjectHub(proj)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          >
            Open →
          </button>
        </div>
      </div>
    );
  };

  // ── Tab Content Renderers ──

  const renderDashboardContent = () => (
    <>
      <div className="dashboard-header">
        <div className="welcome-widget">
          <h1 className="welcome-title">Good morning, {user.name.split(' ')[0]}</h1>
          <p className="welcome-date">{new Date().toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</p>
        </div>
        <div className="header-right">
          <button className="btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <button className="btn-primary" onClick={onOpenSetupWizard}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New project
          </button>
        </div>
      </div>

      {/* Stats Section Row */}
      <section className="stats-row">
        <div className="stat-card glass-card">
          <span className="stat-label">Active projects</span>
          <h3 className="stat-value">{projects.length}</h3>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Papers reviewed</span>
          <h3 className="stat-value">{totalPapers}</h3>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Citations saved</span>
          <h3 className="stat-value">{totalCitations}</h3>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Exports done</span>
          <h3 className="stat-value">{projects.filter(p => p.stage.toLowerCase() === 'completed' || p.stage.toLowerCase() === 'formatting').length}</h3>
        </div>
      </section>

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Active Projects List */}
      <section className="active-projects-section">
        <div className="section-header">
          <h2 className="section-title">Active projects</h2>
          <button className="section-link" onClick={() => handleTabSwitch('projects')}>View all</button>
        </div>

        <div className="projects-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading projects...</div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }} className="glass-card">
              No active projects found. Click "New project" to create one.
            </div>
          ) : (
            projects.map(renderProjectCard)
          )}
        </div>
      </section>

      {/* Dashboard Bottom Grid */}
      <div className="dashboard-bottom-grid">
        {/* Recent Activity Card */}
        <div className="recent-activity-card glass-card">
          <h3 className="section-title">Recent activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon-box icon-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </div>
              <div className="activity-details">
                <span className="activity-title">Writing agent completed methodology draft</span>
                <span className="activity-project">Federated learning - 2 hours ago</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon-box icon-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <div className="activity-details">
                <span className="activity-title">14 new papers found for XAI project</span>
                <span className="activity-project">XAI clinical - 5 hours ago</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon-box icon-orange">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div className="activity-details">
                <span className="activity-title">Reviewer flagged 3 issues in sentiment paper</span>
                <span className="activity-project">Transformers - Yesterday</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon-box icon-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <div className="activity-details">
                <span className="activity-title">Exported final draft as IEEE PDF</span>
                <span className="activity-project">Transformers - Yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Layout */}
        <div className="right-column">
          {/* Supervisor Inbox Card */}
          <div className="supervisor-card glass-card">
            <h3 className="section-title">Supervisor inbox</h3>
            <div className="inbox-status">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              1 new message
            </div>
            <div className="message-bubble">
              <p className="message-text">"Good progress on ch.3. Please expand the privacy budget discussion."</p>
              <span className="message-author">Dr. Perera - 1d ago</span>
            </div>
            <button className="btn-secondary" style={{ width: '100%' }}>View all</button>
          </div>

          {/* Quick Actions Card */}
          <div className="quick-actions-card glass-card">
            <h3 className="section-title">Quick actions</h3>
            <div className="actions-list">
              <button className="btn-secondary btn-action" onClick={onOpenSetupWizard}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New project
              </button>
              <button className="btn-secondary btn-action">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload PDF
              </button>
              <button className="btn-secondary btn-action">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export all
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderMyProjectsContent = () => {
    const stageOptions = ['All', 'Topic Selection', 'Literature Review', 'Research Gap', 'Methodology', 'Writing', 'Reviewer', 'Formatting', 'Completed'];
    const filtered = projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase());
      const matchesStage = projectStageFilter === 'All' || p.stage === projectStageFilter;
      return matchesSearch && matchesStage;
    });

    return (
      <>
        <div className="dashboard-header">
          <div className="welcome-widget">
            <h1 className="welcome-title">My projects</h1>
            <p className="welcome-date">{projects.length} total projects</p>
          </div>
          <div className="header-right">
            <button className="btn-primary" onClick={onOpenSetupWizard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New project
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search projects by title..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            className="input-field"
            value={projectStageFilter}
            onChange={(e) => setProjectStageFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
          >
            {stageOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="projects-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading projects...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }} className="glass-card">
              {projects.length === 0 ? 'No projects found. Click "New project" to create one.' : 'No projects match your search or filter.'}
            </div>
          ) : (
            filtered.map(renderProjectCard)
          )}
        </div>
      </>
    );
  };

  const renderLiteratureContent = () => {
    const filtered = allPapers.filter(p =>
      p.title.toLowerCase().includes(literatureSearch.toLowerCase()) ||
      (p.authors || '').toLowerCase().includes(literatureSearch.toLowerCase()) ||
      p.projectTitle.toLowerCase().includes(literatureSearch.toLowerCase())
    );

    return (
      <>
        <div className="dashboard-header">
          <div className="welcome-widget">
            <h1 className="welcome-title">Literature library</h1>
            <p className="welcome-date">{allPapers.length} papers across all projects</p>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search papers by title, authors, or project..."
            value={literatureSearch}
            onChange={(e) => setLiteratureSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {tabDataLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading papers from all projects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }} className="glass-card">
            {allPapers.length === 0 ? 'No papers uploaded yet. Upload PDFs from within a project.' : 'No papers match your search.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Table header */}
            <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.5fr 1fr 1fr', gap: '1rem', padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Title</span>
              <span>Authors</span>
              <span>Year</span>
              <span>Project</span>
              <span>Uploaded</span>
            </div>
            {filtered.map(paper => {
              const proj = projects.find(p => p.id === paper.project_id);
              return (
                <div
                  key={paper.id}
                  className="glass-card"
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.5fr 1fr 1fr', gap: '1rem', padding: '1rem 1.25rem', alignItems: 'center', cursor: proj ? 'pointer' : 'default', transition: 'border-color 0.2s' }}
                  onClick={() => { if (proj) onOpenProjectHub(proj); }}
                >
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{paper.title}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{paper.authors || 'Unknown'}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{paper.year || '—'}</span>
                  <span className="stage-capsule" style={{ fontSize: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', textAlign: 'center' }}>{paper.projectTitle}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{paper.uploaded_at ? new Date(paper.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const renderCitationsContent = () => {
    const filtered = allCitations.filter(c =>
      c.title.toLowerCase().includes(citationSearch.toLowerCase()) ||
      c.authors.toLowerCase().includes(citationSearch.toLowerCase()) ||
      c.key.toLowerCase().includes(citationSearch.toLowerCase()) ||
      c.projectTitle.toLowerCase().includes(citationSearch.toLowerCase())
    );

    return (
      <>
        <div className="dashboard-header">
          <div className="welcome-widget">
            <h1 className="welcome-title">Citation library</h1>
            <p className="welcome-date">{allCitations.length} references across all projects</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search citations by key, title, authors, or project..."
            value={citationSearch}
            onChange={(e) => setCitationSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem' }}>
            {(['ieee', 'apa', 'bibtex'] as const).map(fmt => (
              <button
                key={fmt}
                className={citationFormatView === fmt ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', boxShadow: 'none', borderRadius: '6px', textTransform: 'uppercase' }}
                onClick={() => setCitationFormatView(fmt)}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {tabDataLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading citations from all projects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }} className="glass-card">
            {allCitations.length === 0 ? 'No citations yet. Citations are auto-generated when agents run.' : 'No citations match your search.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(cit => {
              const formattedText = citationFormatView === 'ieee' ? cit.ieee : citationFormatView === 'apa' ? cit.apa : cit.bibtex;
              return (
                <div key={cit.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{cit.title}</span>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>{cit.authors}</span>
                        <span>·</span>
                        <span>{cit.year}</span>
                        {cit.venue && <><span>·</span><span>{cit.venue}</span></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <span className="stage-capsule" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>{cit.projectTitle}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>[{cit.key}]</span>
                    </div>
                  </div>
                  {formattedText && (
                    <div
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.8rem',
                        fontFamily: citationFormatView === 'bibtex' ? 'monospace' : 'inherit',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onClick={() => copyToClipboard(formattedText)}
                      title="Click to copy"
                    >
                      {formattedText}
                      <span style={{ position: 'absolute', top: '0.5rem', right: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6 }}>Click to copy</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const renderVersionHistoryContent = () => {
    const filtered = allSections
      .filter(s =>
        s.section_name.toLowerCase().includes(versionSearch.toLowerCase()) ||
        s.projectTitle.toLowerCase().includes(versionSearch.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <>
        <div className="dashboard-header">
          <div className="welcome-widget">
            <h1 className="welcome-title">Version history</h1>
            <p className="welcome-date">{allSections.length} section drafts across all projects</p>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search by section name or project..."
            value={versionSearch}
            onChange={(e) => setVersionSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        {tabDataLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading version history from all projects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }} className="glass-card">
            {allSections.length === 0 ? 'No drafts generated yet. Use the Writing Agent to create section drafts.' : 'No versions match your search.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map(sec => {
              const wordCount = sec.content.trim().split(/\s+/).length;
              const isExpanded = expandedSectionId === sec.id;
              const proj = projects.find(p => p.id === sec.project_id);

              return (
                <div key={sec.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', flexShrink: 0 }}>
                        v{sec.version}
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{sec.section_name}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>{wordCount} words</span>
                          <span>·</span>
                          <span>{new Date(sec.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="stage-capsule" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>{sec.projectTitle}</span>
                      {proj && (
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); onOpenProjectHub(proj); }}>
                          Open project
                        </button>
                      )}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      lineHeight: '1.6',
                      color: 'var(--text-secondary)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {sec.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // ── Main Render ──

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardContent();
      case 'projects': return renderMyProjectsContent();
      case 'literature': return renderLiteratureContent();
      case 'citations': return renderCitationsContent();
      case 'versions': return renderVersionHistoryContent();
      default: return renderDashboardContent();
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-container sidebar-logo">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
              </svg>
            </div>
            <span>Scholar<span className="logo-text-ai">AI</span></span>
          </div>

          <nav className="sidebar-menu">
            <button className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabSwitch('dashboard')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              Dashboard
            </button>
            <button className={`menu-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleTabSwitch('projects')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              My projects
            </button>
            <button className={`menu-item ${activeTab === 'literature' ? 'active' : ''}`} onClick={() => handleTabSwitch('literature')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              Literature
            </button>
            <button className={`menu-item ${activeTab === 'citations' ? 'active' : ''}`} onClick={() => handleTabSwitch('citations')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              Citation library
            </button>
            <button className={`menu-item ${activeTab === 'versions' ? 'active' : ''}`} onClick={() => handleTabSwitch('versions')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Version history
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="menu-item" style={{ padding: '0.5rem 1rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>

          <div className="user-profile-widget" style={{ cursor: 'pointer' }} onClick={onLogout}>
            <div className="author-avatar" style={{ backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="author-details">
              <p className="author-name" style={{ fontSize: '0.85rem' }}>{user.name}</p>
              <p className="author-title" style={{ fontSize: '0.75rem' }}>Free plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-dashboard">
        {renderMainContent()}
      </main>
    </div>
  );
};
