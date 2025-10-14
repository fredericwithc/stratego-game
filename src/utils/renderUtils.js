import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWebAwesome } from '@fortawesome/free-brands-svg-icons';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';
import { rankNum } from './pieceUtils';

// FUNÇÃO: Renderizar peça com imagem de patente 
export const renderPieceWithRank = (numero) => {
    if (rankNum(numero) === 1) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
                <span className="number-corner">1</span>
            </div>
        );
    } else if (rankNum(numero) === 2) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
                <span className="number-corner">2</span>
            </div>
        );
    } else if (rankNum(numero) === 3) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
                <span className="number-corner">3</span>
            </div>
        );
    } else if (rankNum(numero) === 4) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
                <span className="number-corner">4</span>
            </div>
        );
    } else if (rankNum(numero) === 5) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
                <span className="number-corner">5</span>
            </div>
        );
    } else if (rankNum(numero) === 6) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
                <span className="number-corner">6</span>
            </div>
        );
    } else if (rankNum(numero) === 7) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
                <span className="number-corner">7</span>
            </div>
        );
    } else if (rankNum(numero) === 8) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
                <span className="number-corner">8</span>
            </div>
        );
    } else if (rankNum(numero) === 9) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
                <span className="number-corner">9</span>
            </div>
        );
    } else if (rankNum(numero) === 10) {
        return (
            <div className="piece-layout-2">
                <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
                <span className="number-corner">10</span>
            </div>
        );
    } else {
        return numero;
    }
};

// FUNÇÃO: Renderizar ícone de peça de costas 
export const renderPieceBack = (jogador) => {
    return (
        <FontAwesomeIcon
            icon={faWebAwesome}
            className={`piece-back ${jogador === 'Vermelho' ? 'vermelho' : 'azul'}`}
            style={{ transition: 'none' }}
        />
    );
};