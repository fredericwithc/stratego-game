
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWebAwesome } from '@fortawesome/free-brands-svg-icons';
import './GameMenu.css';

function GameMenu({ setModoJogo, setFaseJogo, setTabuleiro, setMensagem, posicionarPecasIA, setJogadorAtual, setMostrarModalOnline }) {
    return (
        <div>
            <h1 className="game-title">
                <FontAwesomeIcon icon={faWebAwesome} /> STRATEGO <FontAwesomeIcon icon={faWebAwesome} />
            </h1>

            <div className="menu-container">
                <h2 className="menu-title">Escolha o Modo de Jogo</h2>

                <button
                    className="menu-button"
                    onClick={() => {
                        setModoJogo('local');
                        setFaseJogo('configuracao');
                    }}
                >
                    2 Jogadores Local
                </button>

                <button
                    className="menu-button"
                    onClick={() => {
                        setModoJogo('ia');
                        setTabuleiro({}); // Limpar tabuleiro
                        setMensagem('IA posicionando peças...');

                        setTimeout(() => {
                            posicionarPecasIA();
                            setJogadorAtual("Azul");
                            setFaseJogo('configuracao');
                            setMensagem('Posicione suas peças no território azul (linhas G-J)');
                        }, 500);
                    }}
                >
                    Contra IA
                </button>

                <button
                    className="menu-button"
                    onClick={() => {
                        setMostrarModalOnline(true); // só abre o modal
                    }}
                >
                    Jogar Online
                </button>
            </div>
        </div>
    );
}

export default GameMenu;