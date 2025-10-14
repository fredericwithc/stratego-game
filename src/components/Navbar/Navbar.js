// src/components/Navbar/Navbar.jsx
import React from 'react';
import './Navbar.css';

function Navbar({ abrirRegras, handleRestart }) {
    return (
        <nav className="navbar">
            <div className="nav-left">
                <span className="brand">Stratego</span>
            </div>

            <div className="nav-right">
                <button className="nav-btn" onClick={abrirRegras}>Regras</button>
                <button className="icon-btn" onClick={handleRestart} aria-label="Reiniciar">
                    {/* Ícone restart (SVG) */}
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1h-2.1A7.1 7.1 0 0 0 12 20a7 7 0 0 0 0-14z" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;