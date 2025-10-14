// src/utils/movementUtils.js
import { saoAdjacentes, caminhoLivre, isAgua } from './boardUtils';
import { rankNum, pecaImovel } from './pieceUtils';

// FUNÇÃO: Validar movimento considerando regras especiais 
export const movimentoValido = (posInicial, posDestino, peca, tabuleiro) => {
    // Batedores (número 2) podem se mover em linha reta múltiplas casas
    if (rankNum(peca?.numero) === 2) {
        return movimentoBatedor(posInicial, posDestino, tabuleiro);
    }

    // Todas as outras peças só podem se mover para células adjacentes
    return saoAdjacentes(posInicial, posDestino);
};

// FUNÇÃO: Verificar movimento válido para batedores 
export const movimentoBatedor = (posInicial, posDestino, tabuleiro) => {
    const linha1 = posInicial[0];
    const col1 = parseInt(posInicial[1]);
    const linha2 = posDestino[0];
    const col2 = parseInt(posDestino[1]);

    // Deve ser movimento em linha reta (horizontal ou vertical)
    const mesmaLinha = linha1 === linha2;
    const mesmaColuna = col1 === col2;

    if (!mesmaLinha && !mesmaColuna) return false;

    // Verificar se o caminho está livre
    return caminhoLivre(posInicial, posDestino, tabuleiro);
};

// FUNÇÃO: Calcular movimentos válidos para uma peça 
export const calcularMovimentosValidos = (posicao, tabuleiroAtual) => {
    const peca = tabuleiroAtual[posicao];
    if (!peca) return [];

    const movimentos = [];
    const linhaAtual = posicao[0].charCodeAt(0);
    const colunaAtual = parseInt(posicao[1], 10);

    // Batedor (2) pode ir longe em linha reta
    if (rankNum(peca.numero) === 2) {
        // esquerda
        for (let col = colunaAtual - 1; col >= 0; col--) {
            const pos = String.fromCharCode(linhaAtual) + col;
            if (isAgua(pos)) break;
            if (tabuleiroAtual[pos]) {
                if (tabuleiroAtual[pos].jogador !== peca.jogador) movimentos.push(pos);
                break;
            }
            movimentos.push(pos);
        }
        // direita
        for (let col = colunaAtual + 1; col <= 9; col++) {
            const pos = String.fromCharCode(linhaAtual) + col;
            if (isAgua(pos)) break;
            if (tabuleiroAtual[pos]) {
                if (tabuleiroAtual[pos].jogador !== peca.jogador) movimentos.push(pos);
                break;
            }
            movimentos.push(pos);
        }
        // cima
        for (let l = linhaAtual - 1; l >= 65; l--) {
            const pos = String.fromCharCode(l) + colunaAtual;
            if (isAgua(pos)) break;
            if (tabuleiroAtual[pos]) {
                if (tabuleiroAtual[pos].jogador !== peca.jogador) movimentos.push(pos);
                break;
            }
            movimentos.push(pos);
        }
        // baixo
        for (let l = linhaAtual + 1; l <= 74; l++) {
            const pos = String.fromCharCode(l) + colunaAtual;
            if (isAgua(pos)) break;
            if (tabuleiroAtual[pos]) {
                if (tabuleiroAtual[pos].jogador !== peca.jogador) movimentos.push(pos);
                break;
            }
            movimentos.push(pos);
        }
    } else {
        // Outras peças: uma casa ortogonal
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        dirs.forEach(([dL, dC]) => {
            const novaL = linhaAtual + dL;
            const novaC = colunaAtual + dC;
            if (novaL >= 65 && novaL <= 74 && novaC >= 0 && novaC <= 9) {
                const pos = String.fromCharCode(novaL) + novaC;
                if (!isAgua(pos) && (!tabuleiroAtual[pos] || tabuleiroAtual[pos].jogador !== peca.jogador)) {
                    movimentos.push(pos);
                }
            }
        });
    }

    return movimentos;
};

// FUNÇÃO: Verificar se um jogador tem pelo menos uma peça que pode se mover 
export const jogadorTemMovimentosValidos = (jogador, tabuleiroAtual) => {
    const pecasMoveis = Object.entries(tabuleiroAtual).filter(([pos, p]) => {
        if (!p || p.jogador !== jogador) return false;
        if (pecaImovel(p.numero)) return false;
        const movimentos = calcularMovimentosValidos(pos, tabuleiroAtual);
        return movimentos.length > 0;
    });
    return pecasMoveis.length > 0;
};