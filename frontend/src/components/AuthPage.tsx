import React, { useState } from 'react';
import { registerUser, loginUser, fetchCurrentUser } from '../api';

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBack }) => {
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (activeTab === 'signup') {
        if (!agreed) {
          throw new Error('Please agree to the Terms of Service and Privacy Policy');
        }
        const fullName = `${firstName} ${lastName}`.trim();
        // 1. Register User in DB
        await registerUser(email, password, fullName);
        // 2. Automatically Log them in
        const tokenRes = await loginUser(email, password);
        // 3. Fetch User details
        const userDetails = await fetchCurrentUser(tokenRes.access_token);
        
        onLoginSuccess({
          name: userDetails.full_name || email.split('@')[0],
          email: userDetails.email
        });
      } else {
        // 1. Login User in DB
        const tokenRes = await loginUser(email, password);
        // 2. Fetch User details
        const userDetails = await fetchCurrentUser(tokenRes.access_token);
        
        onLoginSuccess({
          name: userDetails.full_name || email.split('@')[0],
          email: userDetails.email
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center' }}>
      <header className="app-header" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <div className="logo-container" onClick={onBack} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
            </svg>
          </div>
          <span>Scholar<span className="logo-text-ai">AI</span></span>
        </div>
      </header>

      <div className="auth-page-container">
        {/* Left Column Form */}
        <div className="auth-form-card glass-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg(null);
              }}
            >
              Create account
            </button>
            <button
              className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg(null);
              }}
            >
              Sign in
            </button>
          </div>

          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {activeTab === 'signup' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first-name">First name</label>
                  <input
                    id="first-name"
                    type="text"
                    className="input-field"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last-name">Last name</label>
                  <input
                    id="last-name"
                    type="text"
                    className="input-field"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">University email</label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-password-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  className="input-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {activeTab === 'signup' && (
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="" disabled>Select your role...</option>
                  <option value="student">Undergraduate Student</option>
                  <option value="phd">PhD Candidate</option>
                  <option value="researcher">Researcher</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
            )}

            {activeTab === 'signup' && (
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  I agree to the <a href="#terms">terms of service</a> and <a href="#privacy">privacy policy</a>
                </span>
              </label>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              {loading ? 'Processing...' : activeTab === 'signup' ? 'Create free account' : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>

          <button className="btn-google" disabled={loading} onClick={async () => {
            // Mock a Google click by registering/logging in a test account on the DB
            try {
              setErrorMsg(null);
              setLoading(true);
              const testEmail = 'ayesha.f@nus.edu.sg';
              try {
                await registerUser(testEmail, 'googlePass123', 'Ayesha Fernando');
              } catch (e) {
                // If user already exists, just continue
              }
              const tokenRes = await loginUser(testEmail, 'googlePass123');
              const userDetails = await fetchCurrentUser(tokenRes.access_token);
              onLoginSuccess({
                name: userDetails.full_name || 'Ayesha Fernando',
                email: userDetails.email
              });
            } catch (err: any) {
              setErrorMsg(err.message || 'Google Auth simulation failed');
            } finally {
              setLoading(false);
            }
          }}>
            <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px' }}>
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.64 5.64 0 0 1 8.35 12.96a5.64 5.64 0 0 1 5.641-5.64c2.479 0 4.542 1.57 5.253 3.75l3.967-3.08A11.91 11.91 0 0 0 13.99 2 11.96 11.96 0 0 0 2 13.96a11.96 11.96 0 0 0 11.99 11.96c6.262 0 11.233-4.5 11.233-11.23 0-.6-.057-1.3-.173-1.8H12.24z"/>
            </svg>
            Google
          </button>

          <p className="auth-footer-text">
            {activeTab === 'signup' ? (
              <>
                Already have an account?{' '}
                <span onClick={() => setActiveTab('signin')}>Sign in</span>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <span onClick={() => setActiveTab('signup')}>Create account</span>
              </>
            )}
          </p>
        </div>

        {/* Right Column Benefits */}
        <div className="auth-benefits-side">
          <h3 className="auth-benefits-title">What you get</h3>

          <div className="auth-benefits-list">
            <div className="auth-benefit-item">
              <div className="auth-benefit-icon-wrapper icon-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <div className="auth-benefit-text-wrapper">
                <h4 className="auth-benefit-heading">Automated literature review</h4>
                <p className="auth-benefit-body">Finds and summarises relevant papers from Semantic Scholar, arXiv, and uploaded PDFs</p>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon-wrapper icon-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"></polyline>
                  <line x1="4" y1="20" x2="21" y2="3"></line>
                  <polyline points="21 16 21 21 16 21"></polyline>
                  <line x1="15" y1="15" x2="21" y2="21"></line>
                  <line x1="4" y1="4" x2="9" y2="9"></line>
                </svg>
              </div>
              <div className="auth-benefit-text-wrapper">
                <h4 className="auth-benefit-heading">Research gap identification</h4>
                <p className="auth-benefit-body">Compares existing work and surfaces exactly what's missing in your field</p>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon-wrapper icon-peach">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <div className="auth-benefit-text-wrapper">
                <h4 className="auth-benefit-heading">AI-drafted paper sections</h4>
                <p className="auth-benefit-body">Introduction, literature review, methodology, and conclusion — all properly cited</p>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon-wrapper icon-green">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div className="auth-benefit-text-wrapper">
                <h4 className="auth-benefit-heading">Export to DOCX, PDF, BibTeX</h4>
                <p className="auth-benefit-body">IEEE, APA, or university thesis formatting applied automatically on export</p>
              </div>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="testimonial-card glass-card">
            <div className="stars-row">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </div>
            <p className="testimonial-quote">
              "ScholarAI helped me cut my literature review time from 3 weeks to 4 days. The gap analysis alone was worth it."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">PK</div>
              <div className="author-details">
                <p className="author-name">Priya K.</p>
                <p className="author-title">PhD candidate, NUS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
