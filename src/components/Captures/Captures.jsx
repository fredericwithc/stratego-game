// src/components/Captures/Captures.jsx
import React from 'react';
import './Captures.css';

function Captures({ pecasCapturadas, jogador }) {
    const className = jogador.toLowerCase();

    return (
        <div className={`capturas-container capturas-${className}`}>
            <h4 className={`capturas-titulo ${className}`}>Capturas do {jogador}</h4>
            <div className={`capturas-lista ${className}`}>
                {pecasCapturadas[jogador].map((peca, index) => (
                    <span key={index} className={`peca-capturada ${peca.jogador.toLowerCase()}`}>
                        {peca.numero}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default Captures;