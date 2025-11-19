import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import Home from './pages/Home';
import Poet from './pages/Poet';

function Layout() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    const [theme, setTheme] = useState(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="app-container">
            <header className="main-header">
                <div className="header-content">
                    <Link to="/" className="logo" style={{ opacity: isHome ? 0 : 1, pointerEvents: isHome ? 'none' : 'auto' }}>
                        诗库
                    </Link>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button onClick={toggleTheme} className="btn-icon" title={theme === 'light' ? "切换到夜间模式" : "切换到日间模式"}>
                            <span className="material-symbols-outlined">
                                {theme === 'light' ? 'dark_mode' : 'light_mode'}
                            </span>
                        </button>

                    </div>
                </div>
            </header>
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/poet/:id" element={<Poet />} />
                </Routes>
            </main>
            <footer className="footer">
                <p>数据来源 <a href="https://github.com/sheepzh/poetry" style={{ textDecoration: 'underline' }}>sheepzh/poetry</a></p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Layout />
        </Router>
    );
}

export default App;
