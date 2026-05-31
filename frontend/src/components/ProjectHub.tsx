import React, { useState, useEffect } from 'react';
import { 
  runAgent, 
  fetchAgentLogs, 
  fetchProject,
  fetchProjectSections, 
  fetchProjectPapers, 
  fetchProjectCitations,
  addSupervisorFeedback, 
  resolveSupervisorFeedback, 
  addFeedbackReply, 
  saveProjectSection,
  updateProject,
  Project, 
  GeneratedSection 
} from '../api';

interface ProjectHubProps {
  project: Project;
  user: { name: string; email: string };
  onBackToDashboard: () => void;
  onGoToLiteratureSearch: () => void;
  onProjectUpdate?: (updatedProj: Project) => void;
}

export const ProjectHub: React.FC<ProjectHubProps> = ({ 
  project, 
  user,
  onBackToDashboard, 
  onGoToLiteratureSearch,
  onProjectUpdate
}) => {
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [citations, setCitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [agentRunning, setAgentRunning] = useState<boolean>(false);
  const [draftProgress, setDraftProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [runningAgentName, setRunningAgentName] = useState<string>('');
  const [runningSectionName, setRunningSectionName] = useState<string>('');

  const [editingSection, setEditingSection] = useState<GeneratedSection | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isPreviewingPaper, setIsPreviewingPaper] = useState(false);

  const defaultSectionsList = [
    'Abstract',
    'Introduction',
    'Literature review',
    'Research gap analysis',
    'Methodology',
    'Results & discussion',
    'Conclusion'
  ];

  const stages = [
    'Topic Selection',
    'Literature Review',
    'Research Gap',
    'Methodology',
    'Writing',
    'Reviewer',
    'Formatting'
  ];

  const currentStageIndex = stages.indexOf(currentProject.stage);

  useEffect(() => {
    refreshAllData().finally(() => setLoading(false));
  }, [project.id]);

  const refreshAllData = async () => {
    try {
      const proj = await fetchProject(project.id);
      setCurrentProject(proj);
      if (onProjectUpdate) {
        onProjectUpdate(proj);
      }
      
      const secs = await fetchProjectSections(project.id);
      setSections(secs);
      
      const paps = await fetchProjectPapers(project.id);
      setPapers(paps);
      
      const cits = await fetchProjectCitations(project.id);
      setCitations(cits);
    } catch (err) {
      console.error("Error refreshing Project Hub data:", err);
    }
  };

  const pollLogs = async () => {
    try {
      const logList = await fetchAgentLogs(currentProject.id);
      const logMsgs = logList.map(l => l.message);
      setLogs(logMsgs);
      
      if (logList.length > 0) {
        // Calculate progress incrementally based on log length
        const computedProgress = Math.min(95, Math.round((logList.length / 10) * 100));
        setDraftProgress(computedProgress);
      }
    } catch (e) {
      console.error("Error polling agent logs:", e);
    }
  };

  const handleRunAgent = async (agentName: string, instructions?: string) => {
    if (agentRunning) return;
    setAgentRunning(true);
    setRunningAgentName(agentName);
    if (agentName === 'writing') {
      setRunningSectionName(instructions || 'Introduction');
    }
    setDraftProgress(5);
    setLogs(['Initializing agent...']);

    // Poll logs every 1.5 seconds
    const logInterval = setInterval(() => {
      pollLogs();
    }, 1500);

    try {
      if (agentName === 'reviewer') {
        const updatedProj = await updateProject(currentProject.id, { stage: 'Reviewer' });
        setCurrentProject(updatedProj);
        if (onProjectUpdate) onProjectUpdate(updatedProj);
      } else if (agentName === 'formatting') {
        const updatedProj = await updateProject(currentProject.id, { stage: 'Formatting' });
        setCurrentProject(updatedProj);
        if (onProjectUpdate) onProjectUpdate(updatedProj);
      }

      await runAgent(currentProject.id, agentName, instructions);
      setTimeout(async () => {
        clearInterval(logInterval);
        
        if (agentName === 'formatting') {
          try {
            const completedProj = await updateProject(currentProject.id, { stage: 'Completed' });
            setCurrentProject(completedProj);
            if (onProjectUpdate) onProjectUpdate(completedProj);
          } catch (e) {
            console.error("Failed to set stage to Completed:", e);
          }
        }
        
        await refreshAllData();
        setAgentRunning(false);
        setRunningAgentName('');
        setRunningSectionName('');
        setDraftProgress(100);
      }, 2000);
    } catch (err: any) {
      clearInterval(logInterval);
      setAgentRunning(false);
      setRunningAgentName('');
      setRunningSectionName('');
      alert(`Agent execution failed: ${err.message || err}`);
    }
  };

  const handleDraftAllSections = async () => {
    if (agentRunning) return;
    const undraftedSections = defaultSectionsList.filter(name =>
      !sections.some(s => s.section_name.toLowerCase() === name.toLowerCase())
    );
    if (undraftedSections.length === 0) {
      alert('All sections have already been drafted!');
      return;
    }
    for (const sectionName of undraftedSections) {
      setAgentRunning(true);
      setRunningAgentName('writing');
      setRunningSectionName(sectionName);
      setDraftProgress(5);
      setLogs([`Drafting ${sectionName}...`]);
      const logInterval = setInterval(() => { pollLogs(); }, 1500);
      try {
        await runAgent(currentProject.id, 'writing', sectionName);
        clearInterval(logInterval);
        await refreshAllData();
      } catch (err: any) {
        clearInterval(logInterval);
        setAgentRunning(false);
        setRunningAgentName('');
        setRunningSectionName('');
        alert(`Agent failed on section '${sectionName}': ${err.message || err}`);
        return;
      }
    }
    setAgentRunning(false);
    setRunningAgentName('');
    setRunningSectionName('');
    setDraftProgress(100);
  };

  const handleResolveFeedback = async (feedbackId: string) => {
    try {
      const updatedProj = await resolveSupervisorFeedback(currentProject.id, feedbackId, true);
      setCurrentProject(updatedProj);
      if (onProjectUpdate) onProjectUpdate(updatedProj);
    } catch (err) {
      alert('Failed to resolve feedback comment');
    }
  };

  const handleReplyFeedback = async (feedbackId: string, replyText: string) => {
    try {
      const updatedProj = await addFeedbackReply(currentProject.id, feedbackId, 'Author', replyText);
      setCurrentProject(updatedProj);
      if (onProjectUpdate) onProjectUpdate(updatedProj);
    } catch (err) {
      alert('Failed to reply to feedback');
    }
  };

  const getFormatStyle = () => {
    if (currentProject.description?.includes('Style:')) {
      const match = currentProject.description.match(/Style:\s*([^\.]+)/);
      return match ? match[1].trim() : 'IEEE';
    }
    return 'IEEE';
  };

  const getDocType = () => {
    if (currentProject.description?.includes('Type:')) {
      const match = currentProject.description.match(/Type:\s*([^\.]+)/);
      return match ? match[1].trim() : 'Journal paper';
    }
    return 'Journal paper';
  };

  const getStepState = (stepNum: number) => {
    let isActive = false;
    let isCompleted = false;

    if (stepNum === 1) {
      isActive = currentStageIndex <= 1;
      isCompleted = currentStageIndex > 1;
    } else if (stepNum === 2) {
      isActive = currentStageIndex === 1;
      isCompleted = currentStageIndex > 1;
    } else if (stepNum === 3) {
      isActive = currentStageIndex === 2;
      isCompleted = currentStageIndex > 2;
    } else if (stepNum === 4) {
      isActive = currentStageIndex === 3;
      isCompleted = currentStageIndex > 3;
    } else if (stepNum === 5) {
      isActive = currentStageIndex === 4;
      isCompleted = currentStageIndex > 4;
    } else if (stepNum === 6) {
      isActive = currentStageIndex === 5;
      isCompleted = currentStageIndex > 5;
    } else if (stepNum === 7) {
      isActive = currentStageIndex === 6;
      isCompleted = currentProject.stage === 'Completed';
    }

    if (isCompleted) return 'completed';
    if (isActive) return 'active';
    return '';
  };

  const getConnectorClass = (prevStepNum: number) => {
    const targetState = getStepState(prevStepNum + 1);
    return targetState === 'completed' || targetState === 'active' ? 'completed' : '';
  };

  let feedbacks: any[] = [];
  try {
    if (currentProject.supervisor_feedback) {
      feedbacks = JSON.parse(currentProject.supervisor_feedback);
    }
  } catch (e) {
    console.error(e);
  }

  // Generate dynamic versions list
  const getVersionsList = () => {
    if (sections.length === 0) {
      return [
        { tag: 'v0.1 — Initialization', time: new Date(currentProject.created_at).toLocaleDateString() }
      ];
    }
    
    // Sort all sections versions
    const sorted = [...sections].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted.map(sec => ({
      tag: `${sec.section_name} v${sec.version}`,
      time: new Date(sec.created_at).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    }));
  };

  const renderPipelineCTA = () => {
    if (agentRunning) {
      return (
        <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="spinner-icon" style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Agent Running: {runningAgentName.toUpperCase()}</span>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {logs[logs.length - 1] || 'Agent processes details...'}
              </p>
            </div>
          </div>
          <span className="stage-capsule" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontSize: '0.8rem' }}>{draftProgress}%</span>
        </div>
      );
    }

    switch (currentProject.stage) {
      case 'Topic Selection':
        return (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(249, 115, 22, 0.2)', backgroundColor: 'rgba(249, 115, 22, 0.05)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)' }}>Topic Refinement Available</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>The Topic Selection Agent will refine your title, compile research objectives, and establish a formal problem statement.</p>
            </div>
            <button className="btn-primary" onClick={() => handleRunAgent('topic')}>Run Topic Agent</button>
          </div>
        );
      case 'Literature Review':
        return (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(20, 184, 166, 0.2)', backgroundColor: 'rgba(20, 184, 166, 0.05)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--accent-teal)' }}>Literature Synthesis Required</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fuses uploaded seed documents into structured theme paragraphs. Search citations or trigger the agent directly.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={onGoToLiteratureSearch}>Search Agent</button>
              <button className="btn-primary" onClick={() => handleRunAgent('literature')}>Run Literature Agent</button>
            </div>
          </div>
        );
      case 'Research Gap':
        return (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(249, 115, 22, 0.2)', backgroundColor: 'rgba(249, 115, 22, 0.05)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--accent-orange)' }}>Research Gap Identification</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audits state-of-the-art baselines and maps out the open gap / core contribution structure of your paper.</p>
            </div>
            <button className="btn-primary" onClick={() => handleRunAgent('gap')}>Run Gap Agent</button>
          </div>
        );
      case 'Methodology':
        return (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(244, 63, 94, 0.2)', backgroundColor: 'rgba(244, 63, 94, 0.05)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--accent-peach)' }}>Methodology Formulation Pending</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Constructs mathematics models, estimation pipelines, algorithms, and evaluation settings.</p>
            </div>
            <button className="btn-primary" onClick={() => handleRunAgent('methodology')}>Run Methodology Agent</button>
          </div>
        );
      case 'Writing':
        return (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)' }}>Draft Generation Stage Active</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>You can trigger individual section drafting using the "Draft" actions next to each chapter below, or draft all sections at once.</p>
            </div>
            <button className="btn-primary" onClick={handleDraftAllSections} disabled={agentRunning}>Draft All Sections</button>
          </div>
        );
      case 'Reviewer':
        return (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(34, 197, 94, 0.2)', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--accent-green)' }}>Peer Review Audits</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invokes the Critic Agent to evaluate draft arguments, mathematical consistency, and cite layouts.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }} onClick={() => handleRunAgent('reviewer', 'Introduction')}>Run Peer Review</button>
              <button className="btn-primary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }} onClick={async () => {
                try {
                  const updatedProj = await updateProject(currentProject.id, { stage: 'Formatting' });
                  setCurrentProject(updatedProj);
                  if (onProjectUpdate) onProjectUpdate(updatedProj);
                } catch (err: any) {
                  alert(`Failed to advance stage: ${err.message || err}`);
                }
              }}>Proceed to Formatting</button>
            </div>
          </div>
        );
      case 'Formatting':
        return (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#e2e8f0' }}>Formatting & Compile</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Renders reference indexes and builds compile packages based on {getFormatStyle()} templates.</p>
            </div>
            <button className="btn-primary" onClick={() => handleRunAgent('formatting', getFormatStyle())}>Run Formatting Agent</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="project-hub-container">
      {/* Sidebar Panel Navigation */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-container sidebar-logo" onClick={onBackToDashboard} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
              </svg>
            </div>
            <span>Scholar<span className="logo-text-ai">AI</span></span>
          </div>

          <nav className="sidebar-menu">
            <button className="menu-item" onClick={onBackToDashboard}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              Dashboard
            </button>
            <button className="menu-item active">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              Project Hub
            </button>
            <button className="menu-item" onClick={onGoToLiteratureSearch}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Literature search
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile-widget">
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
      <main className="project-hub-main">
        {/* Header Title Row */}
        <div className="project-hub-header">
          <div className="project-hub-title-box">
            <div className="project-hub-title-row">
              <button className="btn-icon" onClick={onBackToDashboard} style={{ width: '2rem', height: '2rem', border: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <h1 className="project-hub-title">{currentProject.title}</h1>
              <span className="stage-capsule" style={{ 
                backgroundColor: currentProject.stage === 'Writing' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                color: currentProject.stage === 'Writing' ? 'var(--accent-peach)' : 'var(--primary)' 
              }}>
                {currentProject.stage}
              </span>
            </div>
            <p className="project-hub-subtitle">
              {getFormatStyle()} - {getDocType()} - Started {new Date(currentProject.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
            </p>
          </div>

          <div className="project-hub-actions">
            <button className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              v0.{sections.length || 1}
            </button>
            <button className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share
            </button>
            <button className="btn-primary" onClick={() => setIsPreviewingPaper(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Horizontal Pipeline Steps Tracker */}
        <div className="pipeline-bar-wrapper">
          <div className="pipeline-tracker">
            <div className={`pipeline-step-item ${getStepState(1)}`} onClick={onGoToLiteratureSearch} style={{ cursor: 'pointer' }}>
              <div className="pipeline-step-num">1</div>
              Literature
            </div>
            <div className={`pipeline-connector ${getConnectorClass(1)}`} />
            <div className={`pipeline-step-item ${getStepState(2)}`}>
              <div className="pipeline-step-num">2</div>
              Citations
            </div>
            <div className={`pipeline-connector ${getConnectorClass(2)}`} />
            <div className={`pipeline-step-item ${getStepState(3)}`}>
              <div className="pipeline-step-num">3</div>
              Gaps
            </div>
            <div className={`pipeline-connector ${getConnectorClass(3)}`} />
            <div className={`pipeline-step-item ${getStepState(4)}`}>
              <div className="pipeline-step-num">4</div>
              Methodology
            </div>
            <div className={`pipeline-connector ${getConnectorClass(4)}`} />
            <div className={`pipeline-step-item ${getStepState(5)}`}>
              <div className="pipeline-step-num">5</div>
              Writing
            </div>
            <div className={`pipeline-connector ${getConnectorClass(5)}`} />
            <div className={`pipeline-step-item ${getStepState(6)}`}>
              <div className="pipeline-step-num">6</div>
              Review
            </div>
            <div className={`pipeline-connector ${getConnectorClass(6)}`} />
            <div className={`pipeline-step-item ${getStepState(7)}`}>
              <div className="pipeline-step-num">7</div>
              Formatting
            </div>
          </div>
        </div>

        {renderPipelineCTA()}

        {/* Pipeline Control Grid Section */}
        <div className="project-hub-grid">
          {/* Main Paper Section list on the left side */}
          <div className="sections-card glass-card">
            <div className="sections-header-row">
              <h2 className="section-title">Paper sections</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }} onClick={() => setIsPreviewingPaper(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Preview full paper
                </button>
                <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', backgroundColor: 'var(--accent-peach)', boxShadow: 'none' }} onClick={() => handleRunAgent('reviewer', 'Introduction')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  Send to reviewer
                </button>
              </div>
            </div>

            <div className="paper-sections-list">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading paper drafts...</div>
              ) : (
                defaultSectionsList.map((name, index) => {
                  const sectionDrafts = sections.filter(s =>
                    s.section_name.toLowerCase() === name.toLowerCase() &&
                    !s.content.startsWith('[No ')
                  );
                  const latestDraft = sectionDrafts.length > 0 
                    ? sectionDrafts.reduce((prev, current) => (prev.version > current.version) ? prev : current)
                    : null;

                  const isRunningThis = agentRunning && runningAgentName === 'writing' && runningSectionName.toLowerCase() === name.toLowerCase();

                  if (latestDraft) {
                    const wordsCount = latestDraft.content.trim().split(/\s+/).length;
                    const citeMatches = latestDraft.content.match(/\[\d+\]/g);
                    const citeCount = citeMatches ? new Set(citeMatches).size : 0;

                    return (
                      <div key={name} className="section-item-card">
                        <div className="section-item-left">
                          <div className="section-status-check">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <div className="section-item-details">
                            <h3 className="section-item-title">{index + 1}. {name}</h3>
                            <p className="section-item-meta">{wordsCount} words - {citeCount} citations - Version {latestDraft.version}</p>
                          </div>
                        </div>
                        <div className="section-item-right">
                          <span className="section-item-badge">Done</span>
                          <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => {
                            setEditingSection(latestDraft);
                            setEditedContent(latestDraft.content);
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isRunningThis) {
                    return (
                      <div key={name} className="section-item-card running">
                        <div className="section-item-left">
                          <div className="spinner-icon" style={{ flexShrink: 0, display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="2" x2="12" y2="6"></line>
                              <line x1="12" y1="18" x2="12" y2="22"></line>
                              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                              <line x1="2" y1="12" x2="6" y2="12"></line>
                              <line x1="18" y1="12" x2="22" y2="12"></line>
                              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                              <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
                            </svg>
                          </div>
                          <div className="section-item-details">
                            <h3 className="section-item-title">{index + 1}. {name}</h3>
                            <p className="section-item-meta" style={{ color: 'var(--primary)', fontWeight: '500' }}>
                              {logs[logs.length - 1] || 'Writing agent is drafting...'}
                            </p>
                          </div>
                        </div>
                        <div className="section-item-right">
                          <button className="btn-outline" disabled style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', color: 'var(--text-muted)' }}>
                            Wait...
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={name} className="section-item-card queued">
                      <div className="section-item-left">
                        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                        </div>
                        <div className="section-item-details">
                          <h3 className="section-item-title">{index + 1}. {name}</h3>
                          <p className="section-item-meta">Draft not started</p>
                        </div>
                      </div>
                      <div className="section-item-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="section-queued-text">Queued</span>
                        <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.05)' }} onClick={() => handleRunAgent('writing', name)}>
                          Draft
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Supervisor note box */}
            <div className="supervisor-note-box" style={{ marginTop: '2rem' }}>
              <h4 className="supervisor-note-title">Supervisor feedback</h4>
              {feedbacks.length === 0 ? (
                <div>
                  <p className="supervisor-note-quote">
                    "Good progress on the topic scope. Please expand the related work and add references to the literature reviews."
                  </p>
                  <span className="supervisor-note-author">Dr. Perera - Default Feedback</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  {feedbacks.map((fb: any) => (
                    <div key={fb.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                      <p className="supervisor-note-quote" style={{ textDecoration: fb.resolved ? 'line-through' : 'none', color: fb.resolved ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        "{fb.text}"
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        <span>{fb.author} — {new Date(fb.timestamp).toLocaleDateString()}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!fb.resolved && (
                            <button className="btn-secondary" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', height: 'auto', border: 'none', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} onClick={() => handleResolveFeedback(fb.id)}>
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {fb.replies && fb.replies.map((rep: any) => (
                        <div key={rep.id} style={{ marginLeft: '1rem', marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--primary)', fontSize: '0.8rem' }}>
                          <p style={{ margin: 0, color: 'var(--text-primary)' }}>{rep.text}</p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— {rep.author}</span>
                        </div>
                      ))}
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const fd = new FormData(form);
                        const replyText = fd.get('replyText') as string;
                        if (replyText.trim()) {
                          handleReplyFeedback(fb.id, replyText);
                          form.reset();
                        }
                      }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginLeft: '1rem' }}>
                        <input name="replyText" placeholder="Write reply..." className="input-field" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', flex: 1 }} required />
                        <button type="submit" className="btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', height: 'auto', boxShadow: 'none' }}>Reply</button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const author = fd.get('author') as string;
                const text = fd.get('text') as string;
                if (author && text) {
                  try {
                    const updatedProj = await addSupervisorFeedback(currentProject.id, author, text);
                    setCurrentProject(updatedProj);
                    if (onProjectUpdate) onProjectUpdate(updatedProj);
                  } catch (err) {
                    alert('Failed to add feedback comment');
                  }
                  e.currentTarget.reset();
                }
              }} style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Add Supervisor Feedback (Simulated)</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input name="author" placeholder="Supervisor Name" className="input-field" style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', width: '130px' }} required defaultValue="Dr. Perera" />
                  <input name="text" placeholder="Leave a feedback message..." className="input-field" style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} required />
                  <button type="submit" className="btn-primary" style={{ padding: '0.35rem 1rem', fontSize: '0.8rem', boxShadow: 'none' }}>Add</button>
                </div>
              </form>
            </div>
          </div>

          {/* Right sidebar widgets (within grid) */}
          <div className="hub-sidebar-widgets">
            {/* Agent Status */}
            <div className="aside-card glass-card">
              <h3 className="aside-title">Agent Status</h3>
              <div className="agent-status-list">
                {[
                  { 
                    name: 'Literature', 
                    status: currentStageIndex > 1 ? `Complete · ${papers.length} papers` : (currentStageIndex === 1 && agentRunning && runningAgentName === 'literature' ? 'Running' : 'Complete'), 
                    iconClass: 'icon-teal', 
                    active: currentStageIndex === 1 && agentRunning && runningAgentName === 'literature', 
                    done: currentStageIndex > 1 
                  },
                  { 
                    name: 'Citation', 
                    status: currentStageIndex > 1 ? `Complete · ${citations.length} refs` : 'Waiting', 
                    iconClass: 'icon-purple', 
                    active: false, 
                    done: currentStageIndex > 1 
                  },
                  { 
                    name: 'Gap finder', 
                    status: currentStageIndex > 2 ? 'Complete' : (currentStageIndex === 2 ? (agentRunning && runningAgentName === 'gap' ? 'Running' : 'Pending') : 'Waiting'), 
                    iconClass: 'icon-orange', 
                    active: currentStageIndex === 2 && agentRunning && runningAgentName === 'gap', 
                    done: currentStageIndex > 2 
                  },
                  { 
                    name: 'Methodology', 
                    status: currentStageIndex > 3 ? 'Complete' : (currentStageIndex === 3 ? (agentRunning && runningAgentName === 'methodology' ? 'Running' : 'Pending') : 'Waiting'), 
                    iconClass: 'icon-peach', 
                    active: currentStageIndex === 3 && agentRunning && runningAgentName === 'methodology', 
                    done: currentStageIndex > 3 
                  },
                  { 
                    name: 'Writing', 
                    status: currentStageIndex > 4 ? 'Complete' : (currentStageIndex === 4 ? (agentRunning && runningAgentName === 'writing' ? 'Running' : 'Active') : 'Waiting'), 
                    iconClass: 'icon-blue', 
                    active: currentStageIndex === 4 && agentRunning && runningAgentName === 'writing', 
                    done: currentStageIndex > 4 
                  },
                  { 
                    name: 'Reviewer', 
                    status: currentStageIndex > 5 ? 'Complete' : (currentStageIndex === 5 ? (agentRunning && runningAgentName === 'reviewer' ? 'Running' : 'Pending') : 'Waiting'), 
                    iconClass: 'icon-green', 
                    active: currentStageIndex === 5 && agentRunning && runningAgentName === 'reviewer', 
                    done: currentStageIndex > 5 
                  },
                  { 
                    name: 'Formatting', 
                    status: currentStageIndex > 6 ? 'Complete' : (currentStageIndex === 6 ? (agentRunning && runningAgentName === 'formatting' ? 'Running' : 'Pending') : 'Waiting'), 
                    iconClass: 'icon-gray', 
                    active: currentStageIndex === 6 && agentRunning && runningAgentName === 'formatting', 
                    done: currentStageIndex > 6 
                  },
                ].map((ag, i) => (
                  <div key={i} className={`agent-status-row ${ag.active ? 'running' : ''}`}>
                    <div className="agent-status-left">
                      <div className={`agent-mini-icon ${ag.iconClass}`}>
                        {ag.done ? '✓' : '●'}
                      </div>
                      <span className="agent-status-name">{ag.name}</span>
                    </div>
                    <span className={`agent-status-desc ${ag.active ? 'running' : ''}`}>{ag.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Versions history */}
            <div className="aside-card glass-card">
              <h3 className="aside-title">Versions</h3>
              <div className="version-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {getVersionsList().map((v, i) => (
                  <div key={i} className={`version-item ${i === 0 ? 'active' : ''}`}>
                    <div className="version-item-details">
                      <span className="version-tag">{v.tag}</span>
                      <span className="version-time">{v.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      {editingSection && (
        <div className="modal-overlay" onClick={() => setEditingSection(null)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit: {editingSection.section_name} (v{editingSection.version})</h3>
              <button className="btn-close" onClick={() => setEditingSection(null)}>×</button>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="input-field"
                rows={16}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.4' }}
              />
            </div>
            <div className="modal-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => setEditingSection(null)}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                try {
                  await saveProjectSection(currentProject.id, editingSection.section_name, editedContent);
                  await refreshAllData();
                  setEditingSection(null);
                } catch (err) {
                  alert('Failed to save section changes');
                }
              }}>Save & Version</button>
            </div>
          </div>
        </div>
      )}

      {/* Manuscript Preview Modal */}
      {isPreviewingPaper && (
        <div className="modal-overlay" onClick={() => setIsPreviewingPaper(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 className="modal-title">{currentProject.title} — Manuscript Draft</h3>
              <button className="btn-close" onClick={() => setIsPreviewingPaper(false)}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <h2 style={{ textAlign: 'center', margin: '1rem 0' }}>{currentProject.title}</h2>
              <div style={{ textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Research Manuscript Draft ({getFormatStyle()} Format)
              </div>
              
              {defaultSectionsList.map(name => {
                const sectionDrafts = sections.filter(s => s.section_name.toLowerCase() === name.toLowerCase());
                const latestDraft = sectionDrafts.length > 0 
                  ? sectionDrafts.reduce((prev, current) => (prev.version > current.version) ? prev : current)
                  : null;
                  
                return (
                  <div key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>{name}</h3>
                    {latestDraft ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{latestDraft.content}</div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content generated for this section yet. Run the writing agent to draft it.</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
              <button className="btn-secondary" onClick={() => setIsPreviewingPaper(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
