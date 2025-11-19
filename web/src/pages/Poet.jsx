import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

const Poet = () => {
  const { id } = useParams();
  const [poet, setPoet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPoemIndex, setCurrentPoemIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');


  const [copyStatus, setCopyStatus] = useState('idle');
  const [shareStatus, setShareStatus] = useState('idle');

  useEffect(() => {
    setLoading(true);
    fetch(`/data/poets/${id}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(data => {
        setPoet(data);
        setLoading(false);

        // Check for hash to set initial poem
        const hash = window.location.hash;
        if (hash && hash.startsWith('#poem-')) {
          const index = parseInt(hash.replace('#poem-', ''), 10);
          if (!isNaN(index) && index >= 0 && index < data.poems.length) {
            setCurrentPoemIndex(index);
          }
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // Sync URL hash with current index
  useEffect(() => {
    if (poet) {
      window.history.replaceState(null, '', `#poem-${currentPoemIndex}`);
      window.scrollTo(0, 0); // Scroll to top when poem changes
      // Reset statuses on page change
      setCopyStatus('idle');
      setShareStatus('idle');
    }
  }, [poet, currentPoemIndex]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!poet) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [poet, currentPoemIndex]);

  const handlePrev = useCallback(() => {
    setCurrentPoemIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    if (poet) {
      setCurrentPoemIndex(prev => (prev < poet.poems.length - 1 ? prev + 1 : prev));
    }
  }, [poet]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const shareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    });
  };

  const filteredPoems = useMemo(() => {
    if (!poet) return [];
    if (!sidebarSearch) return poet.poems.map((p, i) => ({ ...p, originalIndex: i }));
    return poet.poems
      .map((p, i) => ({ ...p, originalIndex: i }))
      .filter(p => p.title.toLowerCase().includes(sidebarSearch.toLowerCase()));
  }, [poet, sidebarSearch]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!poet) {
    return <div className="error-container">未找到该诗人信息</div>;
  }

  const currentPoem = poet.poems[currentPoemIndex];

  return (
    <div className="poet-page-container">


      {/* Sidebar Navigation */}
      <aside className={`sidebar ${showSidebar ? 'show' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="back-btn">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>返回首页</span>
          </Link>
          <button
            className="close-sidebar-btn btn-icon"
            onClick={() => setShowSidebar(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="poet-info-sidebar">
          <h1 className="sidebar-poet-name">{poet.name}</h1>
          <p className="sidebar-poet-count">{poet.poems.length} 首作品</p>
        </div>

        <div className="sidebar-search">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="搜索诗题..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
          />
        </div>

        <nav className="toc-nav">
          <ul className="toc-list">
            {filteredPoems.map((poem) => (
              <li key={poem.originalIndex}>
                <button
                  className={`toc-link ${currentPoemIndex === poem.originalIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPoemIndex(poem.originalIndex);
                    setShowSidebar(false);
                  }}
                >
                  {poem.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {/* Footer content if needed, or remove entirely if empty */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content-area">
        <div className="single-poem-container">
          <article className="poem-card">
            <div className="poem-header">
              <div className="poem-header-content">
                <h3 className="poem-author">{poet.name}</h3>
                <h2 className="poem-title">{currentPoem.title}</h2>
              </div>
              <button
                className="header-menu-btn btn-icon"
                onClick={() => setShowSidebar(true)}
                title="目录"
              >
                <span className="material-symbols-outlined">format_list_bulleted</span>
              </button>
            </div>

            <div
              className="poem-content"
            >
              {currentPoem.content.split('\n').map((line, i) => (
                <p key={i} className="poem-line">{line || '\u00A0'}</p>
              ))}
            </div>

            {/* Inline Action Footer */}
            <div className="poem-footer-actions">
              <button
                className={`action-btn ${shareStatus === 'copied' ? 'success' : ''}`}
                onClick={shareLink}
                title="分享链接"
              >
                <span className="material-symbols-outlined">
                  {shareStatus === 'copied' ? 'check' : 'share'}
                </span>
                <span>{shareStatus === 'copied' ? '已复制' : '分享'}</span>
              </button>
              <div className="action-divider"></div>
              <button
                className={`action-btn ${copyStatus === 'copied' ? 'success' : ''}`}
                onClick={() => copyToClipboard(currentPoem.content)}
                title="复制内容"
              >
                <span className="material-symbols-outlined">
                  {copyStatus === 'copied' ? 'check' : 'content_copy'}
                </span>
                <span>{copyStatus === 'copied' ? '已复制' : '复制'}</span>
              </button>
            </div>

            <div className="poem-pagination">
              <button
                className="nav-btn prev"
                onClick={handlePrev}
                disabled={currentPoemIndex === 0}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>上一首</span>
              </button>

              <span className="page-indicator">
                {currentPoemIndex + 1} / {poet.poems.length}
              </span>

              <button
                className="nav-btn next"
                onClick={handleNext}
                disabled={currentPoemIndex === poet.poems.length - 1}
              >
                <span>下一首</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </article>
        </div>
      </main>

      <style>{`
        .poet-page-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--md-sys-color-background);
          position: relative;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background-color: var(--md-sys-color-surface);
          border-right: 1px solid var(--border-ink);
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: transform 0.3s ease;
        }

        .sidebar-header {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-ink-light);
          text-decoration: none;
          padding: 8px;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: var(--accent-red);
        }

        .poet-info-sidebar {
          padding: 16px 24px;
        }

        .sidebar-poet-name {
          font-size: 1.8rem;
          margin: 0;
          color: var(--text-ink);
        }

        .sidebar-poet-count {
          color: var(--text-ink-light);
          margin: 4px 0 0 0;
          font-size: 0.9rem;
        }

        .sidebar-search {
          padding: 0 24px 16px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 32px;
          font-size: 18px;
          color: var(--text-ink-light);
        }

        .sidebar-search input {
          width: 100%;
          padding: 8px 8px 8px 36px;
          border: 1px solid var(--border-ink);
          border-radius: 4px;
          background: transparent;
          color: var(--text-ink);
          font-family: var(--font-sans);
          outline: none;
        }

        .sidebar-search input:focus {
          border-color: var(--accent-red);
        }

        .toc-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 16px;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toc-link {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          color: var(--text-ink);
          background: none;
          border: none;
          border-radius: 4px;
          font-size: 0.95rem;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: var(--font-serif);
          transition: all 0.2s;
        }

        .toc-link:hover {
          background-color: var(--hover-ink);
          color: var(--accent-red);
        }

        .toc-link.active {
          background-color: var(--hover-ink);
          color: var(--accent-red);
          font-weight: bold;
          border-left: 3px solid var(--accent-red);
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--border-ink);
          background-color: var(--md-sys-color-surface);
        }



        /* Main Content Styles */
        .main-content-area {
          flex: 1;
          /* Removed height: 100vh and overflow-y: auto to use native scroll */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start; /* Changed from center to flex-start */
          padding: 4rem 2rem; /* Increased top padding */
          min-height: 100vh;
        }

        .single-poem-container {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
        }

        .poem-card {
          background-color: var(--bg-paper);
          padding: 0;
        }

        .poem-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-ink);
          position: relative;
        }

        .poem-header-content {
          flex: 1;
          text-align: center;
          /* Ensure title stays centered even with the button on the right */
          padding-left: 40px; /* Balance the right button space */
        }

        .poem-author {
          font-size: 1rem;
          color: var(--text-ink-light);
          margin: 0 0 8px 0;
          font-weight: 400;
          font-family: var(--font-sans);
          display: none; /* Hidden on desktop */
        }

        .poem-title {
          font-size: 2rem;
          margin: 0;
          color: var(--text-ink);
          font-weight: 700;
        }

        .header-menu-btn {
          display: none; /* Hidden by default on desktop if sidebar is visible/persistent */
          color: var(--text-ink-light);
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .header-menu-btn:hover {
          background-color: var(--hover-ink);
          color: var(--accent-red);
        }

        .poem-content {
          font-family: 'Noto Serif SC', serif;
          color: var(--text-ink);
          font-size: 1.125rem; /* Fixed comfortable size (18px) */
          line-height: 1.75;
          text-align: justify;
          min-height: 300px;
          margin-bottom: 3rem; /* Reduced to bring actions closer */
        }

        .poem-line {
          margin: 0 0 0.8rem 0; /* Reduced from 1.2rem */
          min-height: 1em;
        }

        /* Footer Actions */
        .poem-footer-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          padding-bottom: 2rem;
          margin-bottom: 2rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: var(--text-ink-light);
          font-family: var(--font-sans);
          font-size: 0.9rem;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 100px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          color: var(--accent-red);
          background-color: var(--hover-ink);
        }
        
        .action-btn.success {
          color: var(--accent-red);
          background-color: var(--hover-ink);
        }

        .action-btn .material-symbols-outlined {
          font-size: 20px;
        }

        .action-divider {
          width: 1px;
          height: 20px;
          background-color: var(--border-ink);
        }

        .poem-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2rem;
          border-top: 1px solid var(--border-ink);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 1px solid transparent;
          padding: 8px 16px;
          border-radius: 100px;
          color: var(--text-ink);
          font-family: var(--font-serif);
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover:not(:disabled) {
          background-color: var(--hover-ink);
          border-color: var(--border-ink);
          color: var(--accent-red);
        }

        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-indicator {
          font-family: var(--font-sans);
          color: var(--text-ink-light);
          font-size: 0.9rem;
          letter-spacing: 1px;
        }

        /* Mobile Responsive */
        .mobile-menu-toggle {
          display: none;
          position: fixed;
          bottom: 24px;
          right: 24px; /* Restored to right */
          background-color: var(--bg-paper);
          color: var(--text-ink);
          width: 56px;
          height: 56px;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 200;
          border: 1px solid var(--border-ink);
        }

        .close-sidebar-btn {
          display: none;
        }

        @media (max-width: 900px) {
          .sidebar {
            position: fixed;
            left: 0;
            transform: translateX(-100%);
            width: 85%;
            max-width: 320px;
            box-shadow: 2px 0 12px rgba(0,0,0,0.1);
            background-color: var(--bg-paper);
          }

          .sidebar.show {
            transform: translateX(0);
          }



          .close-sidebar-btn {
            display: flex;
          }

          .main-content-area {
            padding: 2rem 1rem;
            height: auto;
            min-height: 100vh;
            display: block;
          }

          .single-poem-container {
            padding-top: 1rem;
            padding-bottom: 2rem;
          }

          .poem-title {
            font-size: 1.6rem;
          }

          .header-menu-btn {
            display: flex; /* Show on mobile */
          }
          
          .poem-header-content {
            padding-left: 0; /* Reset padding on mobile */
            text-align: left; /* Align left on mobile for better flow */
          }

          .poem-author {
            text-align: left;
            display: block; /* Show on mobile */
          }
          
          .poem-title {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default Poet;

