import React, { useState, useEffect, useRef } from 'react';
import {
  Project,
  runAgent,
  uploadPaper,
  fetchProjectPapers,
  fetchProject
} from '../api';

interface LiteratureSearchProps {
  project: Project;
  user: { name: string; email: string };
  onBackToHub: () => void;
  onProceedToGaps: (updatedProj: Project) => void;
}

interface PaperResult {
  id: string;
  title: string;
  author: string;
  citations: number;
  description: string;
  tags: string[];
  relevance: 'high' | 'medium' | 'low';
  added: boolean;
  url?: string;
}

export const LiteratureSearch: React.FC<LiteratureSearchProps> = ({
  project,
  user,
  onBackToHub,
  onProceedToGaps
}) => {
  const [query, setQuery] = useState(project.title);
  const [activeSources, setActiveSources] = useState<string[]>(['Semantic Scholar', 'arXiv', 'IEEE Xplore', 'PubMed', 'ACM DL']);
  const [results, setResults] = useState<PaperResult[]>([]);
  const [dbPapers, setDbPapers] = useState<any[]>([]);
  const [localAddedPapers, setLocalAddedPapers] = useState<PaperResult[]>([]);

  const [loading, setLoading] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentLog, setAgentLog] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProjectPapers = async () => {
    try {
      const papersList = await fetchProjectPapers(project.id);
      setDbPapers(papersList);
    } catch (err) {
      console.error('Error fetching project papers:', err);
    }
  };

  useEffect(() => {
    loadProjectPapers();

    // Load local added papers from localStorage
    const saved = localStorage.getItem(`added_papers_${project.id}`);
    if (saved) {
      try {
        setLocalAddedPapers(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Run initial search using project title
    handleSearch(project.title);
  }, [project.id]);

  // --- Individual Source Search Functions ---

  const searchSemanticScholar = async (searchQuery: string): Promise<PaperResult[]> => {
    const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchQuery)}&limit=10&fields=title,authors,citationCount,abstract,year,url`);
    if (!res.ok) throw new Error('Semantic Scholar API failed');
    const data = await res.json();
    const papers = data.data || [];
    return papers.map((p: any) => {
      const authorNames = p.authors && p.authors.length > 0
        ? p.authors.map((a: any) => a.name).slice(0, 3).join(', ') + (p.authors.length > 3 ? ' et al.' : '')
        : 'Unknown Authors';
      const citations = p.citationCount || 0;
      const tags = ['Semantic Scholar'];
      if (citations > 100) tags.push('Highly Cited');
      if (p.year && p.year >= 2024) tags.push('Recent');
      return {
        id: p.paperId || Math.random().toString(),
        title: p.title,
        author: `${authorNames} - ${p.year || 'N/A'} - ${citations} citations`,
        citations,
        description: p.abstract || 'No abstract available.',
        tags,
        relevance: (citations > 100 ? 'high' : citations > 20 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        added: false,
        url: p.url
      };
    });
  };

  const searchArxiv = async (searchQuery: string): Promise<PaperResult[]> => {
    const res = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchQuery)}&start=0&max_results=10`);
    if (!res.ok) throw new Error('arXiv API failed');
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    return Array.from(entries).map((entry) => {
      const title = entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled';
      const summary = entry.querySelector('summary')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const authorEls = entry.querySelectorAll('author');
      const authorNames = Array.from(authorEls).map(a => a.querySelector('name')?.textContent || '').filter(Boolean).slice(0, 3);
      const authorStr = authorNames.join(', ') + (authorEls.length > 3 ? ' et al.' : '');
      const published = entry.querySelector('published')?.textContent || '';
      const year = published ? new Date(published).getFullYear() : 'N/A';
      const link = entry.querySelector('id')?.textContent || '';
      const arxivId = link.split('/abs/').pop() || Math.random().toString();
      return {
        id: `arxiv-${arxivId}`,
        title,
        author: `${authorStr} - ${year} - arXiv`,
        citations: 0,
        description: summary.slice(0, 500) || 'No abstract available.',
        tags: ['arXiv', 'Preprint'],
        relevance: 'medium' as 'high' | 'medium' | 'low',
        added: false,
        url: link
      };
    });
  };

  const searchPubMed = async (searchQuery: string): Promise<PaperResult[]> => {
    const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=10&retmode=json`);
    if (!searchRes.ok) throw new Error('PubMed search failed');
    const searchData = await searchRes.json();
    const ids: string[] = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    const summaryRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`);
    if (!summaryRes.ok) throw new Error('PubMed summary failed');
    const summaryData = await summaryRes.json();

    return ids.map((id: string) => {
      const article = summaryData.result?.[id];
      if (!article || article.error) return null;
      const authors = article.authors?.map((a: any) => a.name).slice(0, 3).join(', ') || 'Unknown';
      const authorSuffix = (article.authors?.length > 3) ? ' et al.' : '';
      const year = article.pubdate?.split(' ')[0] || 'N/A';
      return {
        id: `pubmed-${id}`,
        title: article.title || 'Untitled',
        author: `${authors}${authorSuffix} - ${year} - PubMed`,
        citations: 0,
        description: article.title || 'Abstract available on PubMed.',
        tags: ['PubMed', 'Biomedical'],
        relevance: 'medium' as 'high' | 'medium' | 'low',
        added: false,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    }).filter(Boolean) as PaperResult[];
  };

  const searchIEEE = async (searchQuery: string): Promise<PaperResult[]> => {
    const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(searchQuery)}&rows=10&filter=member:263&select=DOI,title,author,published-print,is-referenced-by-count,abstract`, {
      headers: { 'User-Agent': 'ScholarAI/1.0 (mailto:scholarai@research.app)' }
    });
    if (!res.ok) throw new Error('IEEE/CrossRef API failed');
    const data = await res.json();
    const items = data.message?.items || [];
    return items.map((item: any) => {
      const title = item.title?.[0] || 'Untitled';
      const authors = item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).slice(0, 3).join(', ') || 'Unknown';
      const authorSuffix = (item.author?.length > 3) ? ' et al.' : '';
      const year = item['published-print']?.['date-parts']?.[0]?.[0] || 'N/A';
      const citations = item['is-referenced-by-count'] || 0;
      return {
        id: `ieee-${item.DOI || Math.random().toString()}`,
        title,
        author: `${authors}${authorSuffix} - ${year} - ${citations} citations`,
        citations,
        description: item.abstract?.replace(/<[^>]*>/g, '').slice(0, 500) || 'No abstract available.',
        tags: ['IEEE Xplore', ...(citations > 50 ? ['Highly Cited'] : [])],
        relevance: (citations > 100 ? 'high' : citations > 20 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        added: false,
        url: `https://doi.org/${item.DOI}`
      };
    });
  };

  const searchACM = async (searchQuery: string): Promise<PaperResult[]> => {
    const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(searchQuery)}&rows=10&filter=member:320&select=DOI,title,author,published-print,is-referenced-by-count,abstract`, {
      headers: { 'User-Agent': 'ScholarAI/1.0 (mailto:scholarai@research.app)' }
    });
    if (!res.ok) throw new Error('ACM/CrossRef API failed');
    const data = await res.json();
    const items = data.message?.items || [];
    return items.map((item: any) => {
      const title = item.title?.[0] || 'Untitled';
      const authors = item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).slice(0, 3).join(', ') || 'Unknown';
      const authorSuffix = (item.author?.length > 3) ? ' et al.' : '';
      const year = item['published-print']?.['date-parts']?.[0]?.[0] || 'N/A';
      const citations = item['is-referenced-by-count'] || 0;
      return {
        id: `acm-${item.DOI || Math.random().toString()}`,
        title,
        author: `${authors}${authorSuffix} - ${year} - ${citations} citations`,
        citations,
        description: item.abstract?.replace(/<[^>]*>/g, '').slice(0, 500) || 'No abstract available.',
        tags: ['ACM DL', ...(citations > 50 ? ['Highly Cited'] : [])],
        relevance: (citations > 100 ? 'high' : citations > 20 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        added: false,
        url: `https://doi.org/${item.DOI}`
      };
    });
  };

  // --- Main Search Handler (queries all active sources in parallel) ---

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const saved = localStorage.getItem(`added_papers_${project.id}`);
      const savedList: PaperResult[] = saved ? JSON.parse(saved) : [];
      const savedIds = new Set(savedList.map(p => p.id));

      const sourceMap: Record<string, (q: string) => Promise<PaperResult[]>> = {
        'Semantic Scholar': searchSemanticScholar,
        'arXiv': searchArxiv,
        'PubMed': searchPubMed,
        'IEEE Xplore': searchIEEE,
        'ACM DL': searchACM,
      };

      const activeSearches = activeSources
        .filter(src => sourceMap[src])
        .map(src => sourceMap[src](searchQuery).catch((err) => {
          console.warn(`${src} search failed:`, err);
          return [] as PaperResult[];
        }));

      if (activeSearches.length === 0) {
        setResults([]);
        return;
      }

      const allResults = await Promise.all(activeSearches);
      const merged = allResults.flat().map(p => ({
        ...p,
        added: savedIds.has(p.id)
      }));

      setResults(merged);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaper = (paper: PaperResult) => {
    const updatedResults = results.map(r => r.id === paper.id ? { ...r, added: true } : r);
    setResults(updatedResults);

    const updatedLocal = [...localAddedPapers, { ...paper, added: true }];
    setLocalAddedPapers(updatedLocal);
    localStorage.setItem(`added_papers_${project.id}`, JSON.stringify(updatedLocal));
  };

  const handleRemovePaper = (id: string) => {
    const updatedResults = results.map(r => r.id === id ? { ...r, added: false } : r);
    setResults(updatedResults);

    const updatedLocal = localAddedPapers.filter(p => p.id !== id);
    setLocalAddedPapers(updatedLocal);
    localStorage.setItem(`added_papers_${project.id}`, JSON.stringify(updatedLocal));
  };

  const toggleSource = (source: string) => {
    setActiveSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      await uploadPaper(project.id, file);
      alert('PDF seed paper uploaded and indexed successfully!');
      loadProjectPapers();
    } catch (err: any) {
      alert(`Failed to upload paper: ${err.message || err}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const STAGES_PAST_LITERATURE = ['Research Gap', 'Methodology', 'Writing', 'Review', 'Complete'];

  const handleProceedToGaps = async () => {
    if (agentRunning) return;

    if (STAGES_PAST_LITERATURE.includes(project.stage)) {
      const updatedProj = await fetchProject(project.id);
      onProceedToGaps(updatedProj);
      return;
    }

    setAgentRunning(true);
    setAgentProgress(15);
    setAgentLog('Spawning Literature Review synthesis agent...');

    const progressInterval = setInterval(() => {
      setAgentProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 1200);

    try {
      setAgentLog('Reading reference PDFs and indexing chunks...');
      await runAgent(project.id, 'literature');
      setAgentProgress(100);
      setAgentLog('Literature synthesis successfully compiled! Pipeline advanced to Gaps stage.');

      setTimeout(async () => {
        clearInterval(progressInterval);
        const updatedProj = await fetchProject(project.id);
        onProceedToGaps(updatedProj);
        setAgentRunning(false);
      }, 1500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setAgentRunning(false);
      alert(`Literature agent failed: ${err.message || err}`);
    }
  };

  const getDynamicThemes = () => {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 4 && !['preservation', 'improve', 'preservations', 'learning', 'paper', 'systems', 'systems?', 'with', 'using', 'framework', 'system'].includes(w));
    const baseThemes = ['literature survey', 'methodology design', 'performance evaluation'];
    if (words.length > 0) {
      return [...words.slice(0, 4), ...baseThemes];
    }
    return ['differential privacy', 'model aggregation', 'IoT constraints', 'non-IID data', 'communication rounds'];
  };

  const getDynamicSummary = () => {
    const themes = getDynamicThemes();
    return `The literature surrounding this topic is clustered around three main vectors: (1) ${themes[0] || 'core algorithms'}, (2) ${themes[1] || 'performance constraints'}, and (3) ${themes[2] || 'validation baselines'}. There remains a distinct lack of research focusing on resource-constrained execution environments.`;
  };

  const addedPapersCount = dbPapers.length + localAddedPapers.length;

  return (
    <div className="project-hub-container">
      {/* Sidebar Panel Navigation */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-container sidebar-logo" onClick={onBackToHub} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
              </svg>
            </div>
            <span>Scholar<span className="logo-text-ai">AI</span></span>
          </div>

          <nav className="sidebar-menu">
            <button className="menu-item" onClick={onBackToHub}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              Dashboard
            </button>
            <button className="menu-item" onClick={onBackToHub}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              Project Hub
            </button>
            <button className="menu-item active">
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

      {/* Main Literature Search View */}
      <main className="project-hub-main">
        {/* Header Title Row */}
        <div className="lit-search-header">
          <div className="lit-search-title-box">
            <div className="project-hub-title-row">
              <button className="btn-icon" onClick={onBackToHub} style={{ width: '2rem', height: '2rem', border: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <h1 className="lit-search-title">Literature search agent</h1>
            </div>
            <p className="project-hub-subtitle">{project.title}</p>
          </div>

          <div className="project-hub-actions">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="application/pdf"
              onChange={handleFileChange}
            />
            <button className="btn-secondary" onClick={handleUploadClick} disabled={uploadingFile}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              {uploadingFile ? 'Uploading...' : 'Upload PDF'}
            </button>
            <button className="btn-primary" onClick={handleProceedToGaps} disabled={agentRunning}>
              {agentRunning ? 'Running Literature synthesis...' : 'Proceed to gaps'}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {agentRunning && (
          <div className="pipeline-cta-card glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(20, 184, 166, 0.2)', backgroundColor: 'rgba(20, 184, 166, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="spinner-icon" style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Literature Review Agent is running...</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{agentLog}</p>
              </div>
            </div>
            <span className="stage-capsule" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)', fontSize: '0.8rem' }}>{agentProgress}%</span>
          </div>
        )}

        {/* Search Bar Input */}
        <div className="search-bar-row">
          <input
            type="text"
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={() => handleSearch(query)} style={{ padding: '0 2rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search
          </button>
          <button className="btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            Filters
          </button>
        </div>

        {/* Sources Row */}
        <div className="sources-filters-row">
          <div className="sources-list">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Sources:</span>
            {['Semantic Scholar', 'arXiv', 'IEEE Xplore', 'PubMed', 'ACM DL'].map(src => (
              <button
                key={src}
                className={`source-item ${activeSources.includes(src) ? 'active' : ''}`}
                onClick={() => toggleSource(src)}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="filters-row">
            <span>Year: <strong>2019-2026</strong></span>
            <span>Citations: <strong className="filter-badge">50+</strong></span>
          </div>
        </div>

        {/* Split Grid */}
        <div className="lit-search-grid">
          {/* Results column on the left */}
          <div>
            <div className="papers-found-row">
              <div className="papers-count-box">
                <h2 className="papers-count">{results.length} papers found</h2>
                <div className="relevance-pills">
                  <span className="relevance-pill high">{results.filter(r => r.relevance === 'high').length} high</span>
                  <span className="relevance-pill medium">{results.filter(r => r.relevance === 'medium').length} medium</span>
                  <span className="relevance-pill low">{results.filter(r => r.relevance === 'low').length} low</span>
                </div>
              </div>
              <div className="papers-sort-box">
                Sort:
                <select className="input-field" style={{ padding: '0.35rem 1rem', width: 'auto', fontSize: '0.8rem', height: 'auto' }}>
                  <option>Relevance</option>
                  <option>Citations</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>

            <div className="results-stack">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Searching citation databases...</div>
              ) : results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} className="glass-card">
                  No search results found. Type a query and press Search.
                </div>
              ) : (
                results.map((paper) => (
                  <div key={paper.id} className="result-card glass-card">
                    <div className="result-card-header">
                      <div className="result-title-box">
                        <h3 className="result-title">{paper.title}</h3>
                        <span className="result-author">{paper.author}</span>
                      </div>

                      <div className="result-actions">
                        {paper.added ? (
                          <button className="btn-secondary btn-added" onClick={() => handleRemovePaper(paper.id)} style={{ padding: '0.4rem 1rem', color: 'var(--accent-teal)' }}>
                            ✓ Added
                          </button>
                        ) : (
                          <button className="btn-primary" onClick={() => handleAddPaper(paper)} style={{ fontSize: '0.85rem', padding: '0.4rem 1.2rem' }}>
                            + Add
                          </button>
                        )}
                        <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1.2rem' }} onClick={() => {
                          if (paper.url) window.open(paper.url, '_blank');
                          else alert('No summary link available');
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          Summary
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1.2rem' }} onClick={() => {
                          if (paper.url) window.open(paper.url, '_blank');
                          else alert('No URL link available');
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <line x1="18" y1="2" x2="22" y2="6"></line>
                            <path d="M7.5 11.5L2 17V22H7L12.5 16.5M7.5 11.5L16.5 2.5L21.5 7.5L12.5 16.5M7.5 11.5L12.5 16.5"></path>
                          </svg>
                          Open
                        </button>
                      </div>
                    </div>
                    <p className="result-desc">{paper.description}</p>
                    <div className="result-tags-row">
                      {paper.tags.map((tag, idx) => (
                        <span key={idx} className="result-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Added and summary sidebar on the right */}
          <div className="hub-sidebar-widgets">
            {/* Added to project widget */}
            <div className="aside-card glass-card">
              <h3 className="aside-title">Added to project ({addedPapersCount})</h3>
              <div className="added-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {dbPapers.map((p) => (
                  <div key={p.id} className="added-item">
                    <span className="added-item-name">
                      {p.authors || 'Uploaded PDF'}
                      <span className="added-item-subtitle"> ({p.title.slice(0, 15)}...)</span>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>PDF Seed</span>
                  </div>
                ))}
                {localAddedPapers.map((p) => (
                  <div key={p.id} className="added-item">
                    <span className="added-item-name">
                      {p.author.split(' - ')[0]}
                      <span className="added-item-subtitle"> ({p.title.slice(0, 15)}...)</span>
                    </span>
                    <button type="button" className="btn-remove-file" style={{ fontSize: '0.85rem' }} onClick={() => handleRemovePaper(p.id)}>×</button>
                  </div>
                ))}
                {addedPapersCount === 0 && (
                  <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                    No papers added yet
                  </div>
                )}
              </div>
            </div>

            {/* Key Themes found */}
            <div className="aside-card glass-card">
              <h3 className="aside-title">Key Themes found</h3>
              <div className="themes-cloud">
                {getDynamicThemes().map(theme => (
                  <span key={theme} className="theme-pill">{theme}</span>
                ))}
              </div>
            </div>

            {/* AI Summary and gaps trigger */}
            <div className="aside-card glass-card">
              <h3 className="aside-title">AI Summary</h3>
              <p className="ai-summary-text">
                {getDynamicSummary()}
              </p>
              <button className="btn-primary" onClick={handleProceedToGaps} disabled={agentRunning} style={{ width: '100%', marginTop: '1.25rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Analyse gaps
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
