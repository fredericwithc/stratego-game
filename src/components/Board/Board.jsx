import React from 'react';
import Cell from './Cell';
import './Board.css';

function Board({ handleCellClick, getCellStyle, getPeca, animandoMovimento }) {

    // Posições de água
    const posicoesAgua = ['E2', 'E3', 'E6', 'E7', 'F2', 'F3', 'F6', 'F7'];

    // Função auxiliar para verificar se é água
    const isWater = (pos) => posicoesAgua.includes(pos);

    // Gerar todas as células do tabuleiro
    const renderBoard = () => {
        const linhas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const colunas = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        return linhas.map(linha => {
            return colunas.map(coluna => {
                const posicao = `${linha}${coluna}`;
                return (
                    <Cell
                        key={posicao}
                        posicao={posicao}
                        handleCellClick={handleCellClick}
                        getCellStyle={getCellStyle}
                        getPeca={getPeca}
                        isWater={isWater(posicao)}
                    />
                );
            });
        });
    };

    return (
        <div className="board-wrapper">
            <div className="coordinates">
                <div className="coord-numbers">
                    <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
                    <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
                </div>
            </div>

            <div className="board-content">
                <div className="coord-letters">
                    <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>
                    <span>F</span><span>G</span><span>H</span><span>I</span><span>J</span>
                </div>

                <div className="board-container">
                    <div
                        className="game-board"
                        id="gameBoard"
                        onClick={animandoMovimento ? (e) => e.preventDefault() : undefined}
                        style={{ pointerEvents: animandoMovimento ? 'none' : 'auto' }}
                    >
                        {renderBoard()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Board;