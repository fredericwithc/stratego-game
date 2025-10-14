
import React from 'react';

function TurnChangeModal({ mostrarTrocaTurno, setMostrarTrocaTurno, jogadorAtual }) {
    if (!mostrarTrocaTurno) return null;

    return (
        <div className="turno-overlay">
            <div className="turno-popup">
                <h2>Troca de Turno</h2>
                <p>Agora é a vez do Jogador {jogadorAtual}</p>
                <button
                    className="turno-button"
                    onClick={() => setMostrarTrocaTurno(false)}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}

export default TurnChangeModal;