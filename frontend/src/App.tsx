import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { DashboardPage } from './components/DashboardPage';
import { SetupWizard } from './components/SetupWizard';
import { ProjectHub } from './components/ProjectHub';
import { LiteratureSearch } from './components/LiteratureSearch';
import { fetchCurrentUser, fetchProject, Project } from './api';
import './App.css';

function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'setup-wizard' | 'project-hub' | 'literature-search'>('landing');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dashboardKey, setDashboardKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token)
        .then((userDetails) => {
          setUser({
            name: userDetails.full_name || userDetails.email.split('@')[0],
            email: userDetails.email,
          });
          setView('dashboard');
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveProject(null);
    setView('landing');
  };

  return (
    <>
      {view === 'landing' && (
        <LandingPage onStart={() => setView('auth')} />
      )}

      {view === 'auth' && (
        <AuthPage
          onLoginSuccess={(userData) => {
            setUser(userData);
            setView('dashboard');
          }}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'dashboard' && (
        <DashboardPage
          key={dashboardKey}
          user={user || { name: 'Ayesha Fernando', email: 'ayesha.f@nus.edu.sg' }}
          onLogout={handleLogout}
          onOpenSetupWizard={() => setView('setup-wizard')}
          onOpenProjectHub={(project) => {
            setActiveProject(project);
            setView('project-hub');
          }}
        />
      )}

      {view === 'setup-wizard' && (
        <SetupWizard
          onBackToDashboard={() => setView('dashboard')}
          onFinish={async (projectId) => {
            try {
              const proj = await fetchProject(projectId);
              setActiveProject(proj);
            } catch (err) {
              console.error('Failed to fetch newly created project details:', err);
              setActiveProject({
                id: projectId,
                title: 'Research Project',
                description: 'Style: IEEE. Type: Journal paper',
                stage: 'Topic Selection',
                created_at: new Date().toISOString()
              });
            }
            setView('project-hub');
            setDashboardKey((prev) => prev + 1);
          }}
        />
      )}

      {view === 'project-hub' && activeProject && (
        <ProjectHub
          project={activeProject}
          user={user || { name: 'Ayesha Fernando', email: 'ayesha.f@nus.edu.sg' }}
          onBackToDashboard={() => setView('dashboard')}
          onGoToLiteratureSearch={() => setView('literature-search')}
          onProjectUpdate={(updatedProj) => setActiveProject(updatedProj)}
        />
      )}

      {view === 'literature-search' && activeProject && (
        <LiteratureSearch
          project={activeProject}
          user={user || { name: 'Ayesha Fernando', email: 'ayesha.f@nus.edu.sg' }}
          onBackToHub={() => setView('project-hub')}
          onProceedToGaps={(updatedProj) => {
            setActiveProject(updatedProj);
            setView('project-hub');
          }}
        />
      )}
    </>
  );
}

export default App;
