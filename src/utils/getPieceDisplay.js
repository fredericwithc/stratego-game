import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
import { rankNum } from './pieceUtils';
import { renderPieceWithRank, renderPieceBack } from './renderUtils';

// 🎯 FUNÇÃO: Mostrar qual peça está numa célula 
export const getPeca = (
    posicao,
    tabuleiro,
    combateAtivo,
    revealCombate,
    faseJogo,
    modoJogo,
    jogadorAtual,
    mostrarTrocaTurno,
    estadoOnline = null 
) => {
    const peca = tabuleiro[posicao];
    if (!peca) return '';

    // Durante combate, SEMPRE mostrar as peças das duas casas envolvidas
    if (
        combateAtivo &&
        (posicao === revealCombate.origem || posicao === revealCombate.destino)
    ) {
        return renderPieceWithRank(peca.numero, peca.jogador);
    }

    // MODO ONLINE - LÓGICA ESPECIAL
    if (modoJogo === 'online' && estadoOnline && estadoOnline.minhaCor) {
        const minhaCor = estadoOnline.minhaCor;

        // Durante configuração no modo online
        if (faseJogo === 'configuracao' || faseJogo === 'aguardando') {
            // Só mostro a FACE das MINHAS peças
            if (peca.jogador === minhaCor) {
                return renderPieceWithRank(peca.numero, peca.jogador);
            } else {
                // Peças do oponente ficam ocultas
                return renderPieceBack(peca.jogador);
            }
        }

        // Durante o jogo no modo online
        if (faseJogo === 'jogando') {
            // Só mostro a FACE das MINHAS peças
            if (peca.jogador === minhaCor) {
                return renderPieceWithRank(peca.numero, peca.jogador);
            } else {
                // Peças do oponente ficam ocultas (até combate)
                return renderPieceBack(peca.jogador);
            }
        }
    }

    // Durante configuração, controle de visibilidade
    if (faseJogo === 'configuracao') {
        // No modo IA, NUNCA mostrar as peças Vermelhas (IA) – sempre "de costas"
        if (modoJogo === 'ia') {
            if (peca.jogador === 'Vermelho') {
                return renderPieceBack('Vermelho');
            }
            // Peças Azuis (humano): mostra quando for o turno dele configurar
            return peca.jogador === jogadorAtual
                ? renderPieceWithRank(peca.numero, peca.jogador)
                : renderPieceBack('Azul');
        }

        // Modo local (sem IA)
        if (peca.jogador === jogadorAtual) {
            return renderPieceWithRank(peca.numero, peca.jogador);
        } else {
            return renderPieceBack(peca.jogador);
        }
    }

    // Durante popup de troca de turno, esconder todas as peças
    if (mostrarTrocaTurno) {
        return '';
    }

    // Durante transição de configuração para jogo, manter estado anterior
    if (faseJogo === 'jogando' && modoJogo === 'ia' && jogadorAtual === "Vermelho") {
        // Se está mudando da configuração para jogo, esconder peças da IA imediatamente
        if (peca.jogador === "Vermelho") {
            return renderPieceBack("Vermelho");
        }
    }

    // Durante o jogo contra IA, só mostrar peças do jogador humano
    if (modoJogo === 'ia') {
        if (peca.jogador === "Azul") {
            return renderPieceWithRank(peca.numero, peca.jogador);
        } else {
            return renderPieceBack("Vermelho");
        }
    } else {
        // Modo local - mostrar peças do jogador atual
        if (peca.jogador === jogadorAtual) {
            return renderPieceWithRank(peca.numero, peca.jogador);
        } else {
            return renderPieceBack(peca.jogador);
        }
    }
};