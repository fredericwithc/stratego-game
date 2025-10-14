// src/utils/combatUtils.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';
import { rankNum } from './pieceUtils';
import { jogadorTemMovimentosValidos } from './movementUtils';

// FUNÇÃO: Verificar se algum jogador venceu 
export const verificarVitoria = (tabuleiro) => {
    // Verificar se alguma bandeira foi capturada
    const bandeiraJogador1 = Object.values(tabuleiro).find(peca =>
        (peca?.numero === '🏳️' || (React.isValidElement(peca?.numero) && peca?.numero.props?.icon === faFlag))
        && peca?.jogador === "Vermelho"
    );
    const bandeiraJogador2 = Object.values(tabuleiro).find(peca =>
        (peca?.numero === '🏳️' || (React.isValidElement(peca?.numero) && peca?.numero.props?.icon === faFlag))
        && peca?.jogador === "Azul"
    );

    if (!bandeiraJogador1) return { vencedor: "Azul", motivo: 'Bandeira capturada!' };
    if (!bandeiraJogador2) return { vencedor: "Vermelho", motivo: 'Bandeira capturada!' };

    // Verificar se algum jogador não tem mais peças
    const pecasJogador1 = Object.values(tabuleiro).filter(peca => peca?.jogador === "Vermelho");
    const pecasJogador2 = Object.values(tabuleiro).filter(peca => peca?.jogador === "Azul");

    if (pecasJogador1.length === 0) return { vencedor: "Azul", motivo: 'Jogador Vermelho não tem mais peças' };
    if (pecasJogador2.length === 0) return { vencedor: "Vermelho", motivo: 'Jogador Azul não tem mais peças' };

    // Verificar se algum jogador não tem movimentos válidos (imobilizado)
    if (!jogadorTemMovimentosValidos("Vermelho", tabuleiro)) {
        return { vencedor: "Azul", motivo: 'Jogador Vermelho não tem movimentos válidos' };
    }
    if (!jogadorTemMovimentosValidos("Azul", tabuleiro)) {
        return { vencedor: "Vermelho", motivo: 'Jogador Azul não tem movimentos válidos' };
    }

    return null;
};

// Simular resultado de combate 
export const simularCombate = (atacante, defensor) => {
    const a = rankNum(atacante.numero);
    const d = rankNum(defensor.numero);

    // Assassino (1) ataca Marechal (10)
    if (a === 1 && d === 10) return 'vitoria';

    // Bomba
    if (defensor.numero === '💣' || (React.isValidElement(defensor.numero) && defensor.numero.props?.icon === faBomb)) {
        if (a === 3) return 'vitoria'; // desarmador desarma bomba
        return 'derrota';
    }

    if (a > d) return 'vitoria';
    if (a < d) return 'derrota';
    return 'empate';
};