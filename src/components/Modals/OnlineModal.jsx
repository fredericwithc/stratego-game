// src/components/Modals/OnlineModal.jsx
import React from 'react';

function OnlineModal({
    mostrarModalOnline,
    setMostrarModalOnline,
    codigoSala,
    setCodigoSala,
    entrarNaSala,
    criarSala,
    erroConexao,
    setErroConexao,
    telaSalaCriada,
    setTelaSalaCriada,
    estadoOnline,
    setFaseJogo,
    setJogadorAtual
}) {

    // Modal de entrada/criação de sala
    if (mostrarModalOnline && !telaSalaCriada) {
        return (
            <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Jogo Online">
                <div className="modal">
                    <header className="modal-header">
                        <h3>Jogo Online</h3>
                        <button
                            className="close-btn"
                            onClick={() => {
                                setMostrarModalOnline(false);
                                setErroConexao('');
                                setCodigoSala('');
                            }}
                            aria-label="Fechar"
                        >
                            ×
                        </button>
                    </header>
                    <div className="modal-content">
                        <div className="online-section">
                            <h4>Entrar em uma Sala</h4>
                            <div className="online-inputs">
                                <input
                                    type="text"
                                    placeholder="Digite o código da sala"
                                    value={codigoSala}
                                    onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                                    className="sala-input"
                                    maxLength={6}
                                />
                                <button
                                    className="nav-btn"
                                    onClick={entrarNaSala}
                                    disabled={!codigoSala.trim()}
                                >
                                    Entrar
                                </button>
                            </div>

                            <div className="ou-divider">OU</div>

                            <h4>Criar Nova Sala</h4>
                            <button
                                className="nav-btn"
                                onClick={criarSala}
                            >
                                Criar Sala
                            </button>

                            {erroConexao && (
                                <div className="erro-conexao" style={{ color: 'red', marginTop: '10px' }}>
                                    {erroConexao}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tela de sala criada
    if (telaSalaCriada) {
        return (
            <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal">
                    <header className="modal-header">
                        <h3>Sala Criada com Sucesso!</h3>
                    </header>
                    <div className="modal-content" style={{ textAlign: 'center' }}>
                        <h4>Código da Sala:</h4>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#DFD0B8',
                            backgroundColor: '#2c3e50',
                            padding: '20px',
                            borderRadius: '10px',
                            margin: '20px 0',
                            letterSpacing: '0.2em'
                        }}>
                            {estadoOnline.sala}
                        </div>
                        <p>Compartilhe este código com seu amigo para que ele possa entrar na sala.</p>

                        <div style={{ marginTop: '20px' }}>
                            <button
                                className="nav-btn"
                                onClick={() => {
                                    // Copiar código para área de transferência
                                    navigator.clipboard.writeText(estadoOnline.sala);
                                    alert('Código copiado!');
                                }}
                                style={{ marginRight: '10px' }}
                            >
                                Copiar Código
                            </button>

                            <button
                                className="nav-btn"
                                onClick={() => {
                                    setTelaSalaCriada(false);
                                    setMostrarModalOnline(false);
                                    setErroConexao('');
                                    setCodigoSala('');
                                    setFaseJogo('configuracao');
                                    setJogadorAtual('Vermelho');
                                }}
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default OnlineModal;