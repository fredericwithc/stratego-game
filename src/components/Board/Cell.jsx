import React from 'react';

function Cell({ posicao, handleCellClick, getCellStyle, getCellClassName, getPeca, isWater }) {
    if (isWater) {
        return <div className="cell water" data-pos={posicao}></div>;
    }

    const pieceClass = getCellClassName ? getCellClassName(posicao) : '';

    return (
        <div
            className={`cell${pieceClass ? ` ${pieceClass}` : ''}`}
            data-pos={posicao}
            onClick={() => handleCellClick(posicao)}
            style={getCellStyle(posicao)}
        >
            {getPeca(posicao)}
        </div>
    );
}

export default Cell;