// src/utils/pieceUtils.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';

// Converte '2' -> 2, mantém número como número 
export const rankNum = (n) => (typeof n === 'number' ? n : Number(n));

// Verificar se uma peça é imóvel 
export const pecaImovel = (numeroPeca) => {
    const pecasImoveis = ['🏳️', '💣']; // Bandeira e bomba
    const ehBomba = React.isValidElement(numeroPeca) && numeroPeca.props?.icon === faBomb;
    const ehBandeira = React.isValidElement(numeroPeca) && numeroPeca.props?.icon === faFlag;
    return pecasImoveis.includes(numeroPeca) || ehBomba || ehBandeira;
};