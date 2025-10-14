import React from 'react';
import './RotateWarning.css';

function RotateWarning({ orientacao }) {
    if (orientacao !== 'portrait' || window.innerWidth > 768) {
        return null;
    }

    return (
        <div className="rotate-device-warning">
            <div>
                <h2>Rotacione seu dispositivo</h2>
                <p>Este jogo foi otimizado para modo paisagem</p>
                <div style={{ fontSize: '3rem', margin: '20px' }}>↻</div>
            </div>
        </div>
    );
}

export default RotateWarning;