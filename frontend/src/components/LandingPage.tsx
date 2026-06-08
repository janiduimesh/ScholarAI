import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const agents = [
    {
      title: 'Literature search',
      desc: 'Finds and ranks papers, extracts key findings',
      iconClass: 'icon-teal',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    {
      title: 'Citation agent',
      desc: 'Formats citations, flags unsupported claims',
      iconClass: 'icon-purple',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      )
    },
    {
      title: 'Research gap',
      desc: 'Compares papers, surfaces missing areas',
      iconClass: 'icon-orange',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
          <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>
      )
    },
    {
      title: 'Methodology',
      desc: 'Suggests methods, datasets, metrics',
      iconClass: 'icon-peach',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 2.5-2 3.5 0 1 1 2 2 2h15c1 0 2-1 2-2 0-1-.5-2.24-2-3.5"></path>
          <path d="M12 2v14.5"></path>
          <path d="M6.4 7a5.5 5.5 0 0 0 11.2 0"></path>
        </svg>
      )
    },
    {
      title: 'Writing agent',
      desc: 'Drafts all sections with inline citations',
      iconClass: 'icon-blue',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      )
    },
    {
      title: 'Reviewer agent',
      desc: 'Checks tone, plagiarism risk, weak arguments',
      iconClass: 'icon-green',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <polyline points="9 15 11 17 15 13"></polyline>
        </svg>
      )
    },
    {
      title: 'Formatting agent',
      desc: 'Applies IEEE / APA / thesis formatting rules',
      iconClass: 'icon-gray',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
            </svg>
          </div>
          <span>Scholar<span className="logo-text-ai">AI</span></span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onStart}>Sign in</button>
          <button className="btn-primary" onClick={onStart}>Get started free</button>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Multi-agent AI - 7 specialised research agents
        </div>

        <h1 className="landing-title">
          From research topic to <span className="gradient-text">published paper</span> — end to end
        </h1>

        <p className="landing-subtitle">
          ScholarAI connects literature search, citation management, gap analysis, methodology, writing, and review into one seamless pipeline. Built for students and researchers who want to do better work, faster.
        </p>

        <div className="landing-buttons">
          <button className="btn-primary" onClick={onStart} style={{ padding: '0.8rem 1.8rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            Start your first paper
          </button>
          <button className="btn-secondary" style={{ padding: '0.8rem 1.8rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Watch demo
          </button>
        </div>

        <div className="landing-benefits-list">
          <div className="benefit-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Free to start
          </div>
          <div className="benefit-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            No credit card required
          </div>
          <div className="benefit-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            IEEE - APA - Thesis formats
          </div>
        </div>

        <h2 className="landing-section-title">7 agents working together in your pipeline</h2>

        <div className="agents-grid">
          {agents.map((agent, i) => (
            <div key={i} className="agent-card glass-card">
              <div className={`agent-icon-box ${agent.iconClass}`}>
                {agent.icon}
              </div>
              <h3 className="agent-card-title">{agent.title}</h3>
              <p className="agent-card-desc">{agent.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
