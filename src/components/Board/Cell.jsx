import React from 'react';

function Cell({ posicao, handleCellClick, getCellStyle, getPeca, isWater }) {
    if (isWater) {
        return <div className="cell water" data-pos={posicao}></div>;
    }

    return (
        <div
            className="cell"
            data-pos={posicao}
            onClick={() => handleCellClick(posicao)}
            style={getCellStyle(posicao)}
        >
            {getPeca(posicao)}
        </div>
    );
}

export default Cell;