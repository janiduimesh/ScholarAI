import React, { useState, useRef } from 'react';
import { createProject, uploadPaper } from '../api';

interface SetupWizardProps {
  onBackToDashboard: () => void;
  onFinish: (projectId: number) => void;
}

interface UploadedFile {
  id?: number;
  name: string;
  size: string;
  status: 'uploading' | 'done' | 'failed';
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onBackToDashboard, onFinish }) => {
  const [step, setStep] = useState<number>(1); // Start at Step 1 to enter topic title
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [citationFormat, setCitationFormat] = useState('IEEE');
  const [documentType, setDocumentType] = useState('Journal paper');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = async () => {
    if (step === 1) {
      if (!topic.trim()) {
        alert('Please enter a research topic title.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setIsSubmitting(true);
      try {
        const fullDesc = `Style: ${citationFormat}. Type: ${documentType}. Supervisor: ${supervisorEmail || 'None'}. Raw: ${description}`;
        const project = await createProject(topic, fullDesc);
        setProjectId(project.id);
        setStep(3);
      } catch (err) {
        alert('Failed to create project in database');
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === 3) {
      if (projectId) {
        onFinish(projectId);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !projectId) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      
      const newFileObj: UploadedFile = {
        name: file.name,
        size: fileSizeStr,
        status: 'uploading'
      };

      setFiles(prev => [...prev, newFileObj]);

      try {
        // Upload paper PDF to backend database
        await uploadPaper(projectId, file);
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'done' } : f));
      } catch (err) {
        console.error('File upload failed:', err);
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'failed' } : f));
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container" onClick={onBackToDashboard} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
            </svg>
          </div>
          <span>Scholar<span className="logo-text-ai">AI</span></span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onBackToDashboard}>Cancel</button>
        </div>
      </header>

      <div className="wizard-container">
        {/* Step Tracker */}
        <div className="wizard-steps-header">
          <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="wizard-step-circle">{step > 1 ? '✓' : '1'}</div>
            Research topic
          </div>
          <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="wizard-step-circle">{step > 2 ? '✓' : '2'}</div>
            Format & type
          </div>
          <div className={`wizard-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="wizard-step-circle">{step > 3 ? '✓' : '3'}</div>
            Upload papers
          </div>
          <div className="wizard-step">
            <div className="wizard-step-circle">4</div>
            Configure agents
          </div>
        </div>

        {/* Wizard Main Card */}
        <div className="wizard-card glass-card">
          {step === 1 && (
            <>
              <h2 className="wizard-title">Research topic & raw idea</h2>
              <p className="wizard-subtitle">Provide a name and a brief summary of the topic you want to write about.</p>
              
              <div className="form-group">
                <label htmlFor="topic-title">Research Topic / Title</label>
                <input
                  id="topic-title"
                  type="text"
                  className="input-field"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Robust Visual-Inertial Odometry for UAVs"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="topic-desc">Topic Overview (Optional)</label>
                <textarea
                  id="topic-desc"
                  className="input-field"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what you want the paper to focus on..."
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="wizard-alert-success">
                <strong>Research topic saved</strong><br />
                "{topic}"
              </div>

              <h2 className="wizard-title">Format & document type</h2>
              <p className="wizard-subtitle">This controls citation formatting, section structure, and export template.</p>

              {/* Citation Format Selectors */}
              <div className="form-group">
                <label>Citation format</label>
                <div className="citation-formats-row">
                  {['IEEE', 'APA 7th', 'MLA 9th', 'Chicago', 'Vancouver', 'Harvard'].map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      className={`format-badge ${citationFormat === fmt ? 'active' : ''}`}
                      onClick={() => setCitationFormat(fmt)}
                    >
                      {citationFormat === fmt && '✓ '}
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Type Cards */}
              <div className="form-group">
                <label>Document type</label>
                <div className="doc-type-grid">
                  {[
                    { title: 'Journal paper', desc: 'Structured sections, abstract, references' },
                    { title: 'Conference paper', desc: 'Concise, two-column layout' },
                    { title: 'Thesis / dissertation', desc: 'Extended, chapter-based' },
                    { title: 'Literature review', desc: 'Standalone review only' }
                  ].map(doc => (
                    <div
                      key={doc.title}
                      className={`doc-type-card ${documentType === doc.title ? 'active' : ''}`}
                      onClick={() => setDocumentType(doc.title)}
                    >
                      <h4 className="doc-type-heading">{doc.title}</h4>
                      <p className="doc-type-body">{doc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Email */}
              <div className="form-group">
                <label htmlFor="sup-email">Supervisor email (optional — they can review and leave comments)</label>
                <input
                  id="sup-email"
                  type="email"
                  className="input-field"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  placeholder="supervisor@university.edu"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="wizard-title">Seed papers</h2>
              <p className="wizard-subtitle">Upload existing PDFs you want to include in the literature synthesis.</p>

              {/* PDF Dropzone */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="application/pdf"
                multiple
                onChange={handleFileChange}
              />
              <div className="dropzone" onClick={triggerFileSelect}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p className="dropzone-text">Click to select PDF files here, or <span>browse files</span></p>
                <p className="dropzone-info">Up to 10 PDFs - Max 20MB each</p>
              </div>

              {/* File List */}
              <div className="file-list">
                {files.map((file, i) => (
                  <div key={i} className="file-row">
                    <div className="file-info">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="file-icon" style={{
                        color: file.status === 'done' ? 'var(--accent-green)' : file.status === 'failed' ? '#ef4444' : 'var(--accent-orange)'
                      }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{file.size}</span>
                      {file.status === 'uploading' && <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>Uploading...</span>}
                      {file.status === 'failed' && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Failed</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="wizard-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (step === 1) onBackToDashboard();
                else setStep(prev => prev - 1);
              }}
              disabled={isSubmitting}
            >
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : step === 1 ? 'Next ➔' : step === 2 ? 'Next — upload papers →' : 'Initialize Project →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
