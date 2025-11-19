import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const [poets, setPoets] = useState([]);
  const [poems, setPoems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayedPoets, setDisplayedPoets] = useState([]);
  const [displayedPoems, setDisplayedPoems] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const observer = useRef();
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}poets.json`).then(res => res.json()),
      fetch(`${import.meta.env.BASE_URL}poems.json`).then(res => res.json())
    ])
      .then(([poetsData, poemsData]) => {
        setPoets(poetsData);
        setPoems(poemsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  // Search Logic
  const { poetResults, poemResults } = useMemo(() => {
    if (!searchTerm) return { poetResults: [], poemResults: [] };
    const lowerTerm = searchTerm.toLowerCase();

    const filteredPoets = poets.filter(poet =>
      poet.name.toLowerCase().includes(lowerTerm) ||
      poet.pinyin.toLowerCase().includes(lowerTerm)
    );

    const filteredPoems = poems.filter(poem =>
      poem.t.toLowerCase().includes(lowerTerm)
    );

    return { poetResults: filteredPoets, poemResults: filteredPoems };
  }, [poets, poems, searchTerm]);

  // Pagination for Search Results
  useEffect(() => {
    if (searchTerm) {
      setPage(1);
      setDisplayedPoets(poetResults.slice(0, ITEMS_PER_PAGE));
      setDisplayedPoems(poemResults.slice(0, ITEMS_PER_PAGE));
    } else {
      setDisplayedPoets([]);
      setDisplayedPoems([]);
    }
  }, [poetResults, poemResults, searchTerm]);

  const loadMoreSearch = useCallback(() => {
    const nextPage = page + 1;
    const nextPoets = poetResults.slice(0, nextPage * ITEMS_PER_PAGE);
    const nextPoems = poemResults.slice(0, nextPage * ITEMS_PER_PAGE);

    setDisplayedPoets(nextPoets);
    setDisplayedPoems(nextPoems);
    setPage(nextPage);
  }, [poetResults, poemResults, page]);

  const lastElementRef = useCallback(node => {
    if (loading || !searchTerm) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (displayedPoets.length < poetResults.length || displayedPoems.length < poemResults.length) {
          loadMoreSearch();
        }
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, searchTerm, displayedPoets.length, displayedPoems.length, poetResults.length, poemResults.length, loadMoreSearch]);

  const handleRandom = () => {
    if (poets.length > 0) {
      const randomPoet = poets[Math.floor(Math.random() * poets.length)];
      setLoading(true);
      const randomPoetId = randomPoet.id;
      fetch(`${import.meta.env.BASE_URL}data/poets/${randomPoetId}.json`)
        .then(res => res.json())
        .then(data => {
          if (data.poems && data.poems.length > 0) {
            const randomPoemIndex = Math.floor(Math.random() * data.poems.length);
            navigate(`/poet/${randomPoetId}?poemId=${randomPoemIndex}`);
          } else {
            navigate(`/poet/${randomPoetId}`);
          }
          setLoading(false);
        })
        .catch(() => {
          navigate(`/poet/${randomPoetId}`);
          setLoading(false);
        });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">诗库</h1>
        <p className="hero-subtitle">
          收录 {poets.length} 位诗人，{poems.length} 首诗歌
        </p>

        <div className={`search-container ${searchTerm ? 'has-value' : ''}`}>
          <input
            type="text"
            className="search-input"
            placeholder="搜索诗人或诗歌..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <button className="random-btn" onClick={handleRandom}>
          <span className="material-symbols-outlined">shuffle</span>
          <span>随机读一首</span>
        </button>
      </div>

      <div className="content-section">
        {searchTerm && (
          <div className="search-results">
            {/* Poets Section */}
            {displayedPoets.length > 0 && (
              <div className="result-section">
                <h3 className="section-title">诗人 ({poetResults.length})</h3>
                <div className="poet-list">
                  {displayedPoets.map((poet, index) => {
                    const isLastPoet = index === displayedPoets.length - 1;
                    const refProps = (isLastPoet && displayedPoems.length === 0) ? { ref: lastElementRef } : {};
                    return (
                      <Link {...refProps} key={poet.id} to={`/poet/${poet.id}`} className="poet-item">
                        <span className="poet-name">{poet.name}</span>
                        <span className="poet-meta">{poet.poemCount} 首</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Poems Section */}
            {displayedPoems.length > 0 && (
              <div className="result-section">
                <h3 className="section-title">诗歌 ({poemResults.length})</h3>
                <div className="poem-list">
                  {displayedPoems.map((poem, index) => {
                    // Use index as key if needed, but ideally combine id+index
                    const key = `${poem.i}-${poem.x}`;
                    const refProps = (index === displayedPoems.length - 1) ? { ref: lastElementRef } : {};

                    return (
                      <Link {...refProps} key={key} to={`/poet/${poem.i}?poemId=${poem.x}`} className="poem-item">
                        <span className="poem-title">{poem.t}</span>
                        <span className="poem-author">{poem.p}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {displayedPoets.length === 0 && displayedPoems.length === 0 && (
              <div className="no-results">
                <p>未找到相关内容</p>
              </div>
            )}

            {(displayedPoets.length < poetResults.length || displayedPoems.length < poemResults.length) && (
              <div className="loading-more"><span>...</span></div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .home-container {
          min-height: 100vh;
        }
        
        .hero-section {
          padding: 4rem 1rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          min-height: 60vh;
          justify-content: center;
        }
        
        .hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: 0.2em;
          color: var(--text-ink);
        }

        .hero-subtitle {
          font-size: 1rem;
          color: var(--text-ink-light);
          margin: -1rem 0 1rem 0;
          font-family: var(--font-serif);
          opacity: 0.8;
        }

        .search-container {
          position: relative;
          width: 200px; /* Initial short width */
          max-width: 500px;
          border-bottom: 1px solid transparent; /* Hidden border by default */
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .search-container:focus-within,
        .search-container.has-value {
          width: 100%; /* Expand */
          border-bottom-color: var(--text-ink); /* Show border */
        }

        .search-input {
          width: 100%;
          background: transparent;
          border: none;
          font-size: 1.1rem;
          font-family: var(--font-serif);
          color: var(--text-ink);
          padding: 0.5rem 0;
          text-align: center;
          outline: none;
          opacity: 0.6; /* Semi-hidden text */
          transition: opacity 0.3s ease;
        }

        .search-container:focus-within .search-input,
        .search-container.has-value .search-input {
          opacity: 1; /* Full opacity when active */
        }

        .search-input::placeholder {
          color: var(--text-ink-light);
          opacity: 0.5;
        }

        .clear-btn {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-ink-light);
          cursor: pointer;
          padding: 4px;
        }

        .random-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: transparent;
          border: 1px solid var(--border-ink);
          padding: 10px 24px;
          border-radius: 100px;
          color: var(--text-ink);
          font-family: var(--font-sans);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
        }

        .random-btn:hover {
          background-color: var(--hover-ink);
          color: var(--accent-red);
          border-color: var(--accent-red);
        }

        .content-section {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .section-title {
            font-size: 1.2rem;
            color: var(--text-ink-light);
            border-bottom: 1px solid var(--border-ink);
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
            margin-top: 2rem;
            font-family: var(--font-serif);
        }
        
        .section-title:first-child {
            margin-top: 0;
        }

        .poet-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.5rem 1rem;
        }

        .poet-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          transition: transform 0.3s ease;
          text-align: center;
          text-decoration: none;
        }

        .poet-item:hover {
          transform: translateY(-2px);
        }

        .poet-name {
          font-size: 1.2rem;
          color: var(--text-ink);
          margin-bottom: 0.25rem;
        }

        .poet-item:hover .poet-name {
          color: var(--accent-red);
        }

        .poet-meta {
          font-size: 0.8rem;
          color: var(--text-ink-light);
          font-family: var(--font-sans);
        }
        
        .poem-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .poem-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            text-decoration: none;
            border-bottom: 1px dashed var(--border-ink);
            transition: background-color 0.2s;
        }
        
        .poem-item:hover {
            background-color: var(--hover-ink);
        }
        
        .poem-title {
            font-size: 1.1rem;
            color: var(--text-ink);
            font-family: var(--font-serif);
        }
        
        .poem-author {
            font-size: 0.9rem;
            color: var(--text-ink-light);
        }

        .loading-more {
          text-align: center;
          padding: 2rem;
          color: var(--text-ink-light);
          letter-spacing: 0.2em;
        }
        
        .no-results {
          text-align: center;
          padding: 4rem;
          color: var(--text-ink-light);
        }
        
        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 2px solid var(--border-ink);
            border-top-color: var(--text-ink);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div >
  );
};

export default Home;
