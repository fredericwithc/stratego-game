
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';
import './PieceSelector.css';

function PieceSelector({
    pecasDisponiveis,
    jogadorAtual,
    pecaSelecionadaConfig,
    setPecaSelecionadaConfig,
    modoMobile
}) {

    return (
        <div className="piece-selector">
            <h3>Selecione uma peça:</h3>
            <div className="piece-buttons">
                {Object.entries(pecasDisponiveis[jogadorAtual]).map(([tipo, quantidade]) => {
                    if (quantidade === 0) return null;
                    const display = tipo === 'bomba' ? <FontAwesomeIcon icon={faBomb} /> :
                        tipo === 'bandeira' ? <FontAwesomeIcon icon={faFlag} /> :
                            parseInt(tipo) === 1 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
                                    <span className="number-corner">1</span>
                                </div>
                            ) : parseInt(tipo) === 2 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
                                    <span className="number-corner">2</span>
                                </div>
                            ) : parseInt(tipo) === 3 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
                                    <span className="number-corner">3</span>
                                </div>
                            ) : parseInt(tipo) === 4 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
                                    <span className="number-corner">4</span>
                                </div>
                            ) : parseInt(tipo) === 5 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
                                    <span className="number-corner">5</span>
                                </div>
                            ) : parseInt(tipo) === 6 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
                                    <span className="number-corner">6</span>
                                </div>
                            ) : parseInt(tipo) === 7 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
                                    <span className="number-corner">7</span>
                                </div>
                            ) : parseInt(tipo) === 8 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
                                    <span className="number-corner">8</span>
                                </div>
                            ) : parseInt(tipo) === 9 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
                                    <span className="number-corner">9</span>
                                </div>
                            ) : parseInt(tipo) === 10 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
                                    <span className="number-corner">10</span>
                                </div>
                            ) : tipo;
                    return (
                        <button
                            key={tipo}
                            onClick={() => {
                                setPecaSelecionadaConfig(tipo);
                            }}
                            className={`piece-button player${jogadorAtual} ${pecaSelecionadaConfig === tipo ? 'selected' : ''}`}
                            style={{ cursor: quantidade > 0 ? 'grab' : 'not-allowed' }}
                        >
                            {display} ({quantidade})
                        </button>
                    );
                })}
            </div>
            {pecaSelecionadaConfig && (
                <p className="selected-piece">
                    Peça selecionada: {pecaSelecionadaConfig === 'bomba' ? <FontAwesomeIcon icon={faBomb} /> :
                        pecaSelecionadaConfig === 'bandeira' ? <FontAwesomeIcon icon={faFlag} /> :
                            pecaSelecionadaConfig === 1 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
                                    <span className="number-corner">1</span>
                                </div>
                            ) : pecaSelecionadaConfig === 2 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
                                    <span className="number-corner">2</span>
                                </div>
                            ) : pecaSelecionadaConfig === 3 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
                                    <span className="number-corner">3</span>
                                </div>
                            ) : pecaSelecionadaConfig === 4 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
                                    <span className="number-corner">4</span>
                                </div>
                            ) : pecaSelecionadaConfig === 5 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
                                    <span className="number-corner">5</span>
                                </div>
                            ) : pecaSelecionadaConfig === 6 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
                                    <span className="number-corner">6</span>
                                </div>
                            ) : pecaSelecionadaConfig === 7 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
                                    <span className="number-corner">7</span>
                                </div>
                            ) : pecaSelecionadaConfig === 8 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
                                    <span className="number-corner">8</span>
                                </div>
                            ) : pecaSelecionadaConfig === 9 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
                                    <span className="number-corner">9</span>
                                </div>
                            ) : pecaSelecionadaConfig === 10 ? (
                                <div className="piece-layout-2">
                                    <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
                                    <span className="number-corner">10</span>
                                </div>
                            ) : pecaSelecionadaConfig}
                    {modoMobile && (
                        <>
                            <br />
                            <span style={{ fontSize: '12px', color: '#f39c12' }}>
                                Toque na célula do tabuleiro para colocar a peça
                            </span>
                        </>
                    )}
                </p>
            )}
        </div>
    );
}

export default PieceSelector;