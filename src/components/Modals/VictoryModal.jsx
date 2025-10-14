import React from 'react';

function VictoryModal({ jogoTerminado, mensagem, reiniciarJogo }) {
    if (!jogoTerminado) return null;

    return (
        <div className="vitoria-overlay">
            <div className="vitoria-popup">
                <h2> Fim de Jogo! </h2>
                <p>{mensagem}</p>
                <button
                    className="turno-button"
                    onClick={() => reiniciarJogo()}
                >
                    Jogar Novamente
                </button>
            </div>
        </div>
    );
}

export default VictoryModal;