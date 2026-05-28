import React, { useState } from 'react';
import { createProject } from '../api';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('IEEE');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const fullDesc = `Style: ${style}. ${description}`.trim();
      await createProject(title, fullDesc);
      onProjectCreated();
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      alert('Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create new research project</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="proj-title">Project Title</label>
            <input
              id="proj-title"
              type="text"
              className="input-field"
              placeholder="e.g. Robust Visual-Inertial Odometry for UAVs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="proj-style">Academic Citation Style</label>
            <select
              id="proj-style"
              className="input-field"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="IEEE">IEEE Format</option>
              <option value="APA">APA Format</option>
              <option value="Thesis">University Thesis Format</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="proj-desc">Research Area / Description</label>
            <textarea
              id="proj-desc"
              className="input-field"
              rows={4}
              placeholder="Provide a brief overview of the research topic, target questions, or constraints..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
