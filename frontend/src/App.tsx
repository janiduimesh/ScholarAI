import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { DashboardPage } from './components/DashboardPage';
import { ProjectModal } from './components/ProjectModal';
import { fetchCurrentUser } from './api';
import './App.css';

function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
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
        <>
          <DashboardPage
            key={dashboardKey}
            user={user || { name: 'Ayesha Fernando', email: 'ayesha.f@nus.edu.sg' }}
            onLogout={handleLogout}
            onOpenProjectModal={() => setIsProjectModalOpen(true)}
          />
          <ProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
            onProjectCreated={() => setDashboardKey((prev) => prev + 1)}
          />
        </>
      )}
    </>
  );
}

export default App;
