// src/utils/boardUtils.js
import { posAgua } from './constants';

// FUNÇÃO: Verificar se uma posição é água 
export const isAgua = (posicao) => {
    return posAgua.includes(posicao);
};

// Linhas A–D = território do Jogador Vermelho 
export const isTerritorioVermelho = (pos) => {
    const l = pos[0];
    return l >= 'A' && l <= 'D';
};

// Linhas G–J = território do Jogador Azul 
export const isTerritorioAzul = (pos) => {
    const l = pos[0];
    return l >= 'G' && l <= 'J';
};

// FUNÇÃO: Verificar se duas células são adjacentes 
export const saoAdjacentes = (pos1, pos2) => {
    const linha1 = pos1[0];
    const col1 = parseInt(pos1[1]);
    const linha2 = pos2[0];
    const col2 = parseInt(pos2[1]);

    const difLinha = Math.abs(linha1.charCodeAt(0) - linha2.charCodeAt(0));
    const difCol = Math.abs(col1 - col2);

    const resultado = (difLinha === 1 && difCol === 0) || (difLinha === 0 && difCol === 1);

    return resultado;
};

// FUNÇÃO: Verificar se o caminho entre duas posições está livre 
export const caminhoLivre = (posInicial, posDestino, tabuleiroAtual) => {
    const linha1 = posInicial[0].charCodeAt(0);
    const col1 = parseInt(posInicial[1]);
    const linha2 = posDestino[0].charCodeAt(0);
    const col2 = parseInt(posDestino[1]);

    const deltaLinha = linha2 > linha1 ? 1 : linha2 < linha1 ? -1 : 0;
    const deltaCol = col2 > col1 ? 1 : col2 < col1 ? -1 : 0;

    let linhaAtual = linha1 + deltaLinha;
    let colAtual = col1 + deltaCol;

    while (linhaAtual !== linha2 || colAtual !== col2) {
        const posAtual = String.fromCharCode(linhaAtual) + colAtual;
        if (tabuleiroAtual[posAtual] || isAgua(posAtual)) {
            return false; // Caminho bloqueado
        }
        linhaAtual += deltaLinha;
        colAtual += deltaCol;
    }

    return true;
};

// Função auxiliar para obter posições adjacentes 
export const obterPosicoesAdjacentes = (posicao) => {
    const linha = posicao[0].charCodeAt(0);
    const col = parseInt(posicao[1]);
    const adjacentes = [];

    // Verificar todas as 4 direções
    const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    direcoes.forEach(([deltaLinha, deltaCol]) => {
        const novaLinha = linha + deltaLinha;
        const novaCol = col + deltaCol;

        if (novaLinha >= 65 && novaLinha <= 68 && novaCol >= 0 && novaCol <= 9) {
            adjacentes.push(String.fromCharCode(novaLinha) + novaCol);
        }
    });

    return adjacentes;
};

// Obter peças adjacentes (com as peças do tabuleiro)
export const obterPecasAdjacentes = (posicao, tabuleiro) => {
    const linha = posicao[0].charCodeAt(0);
    const col = parseInt(posicao[1]);
    const adjacentes = [];

    const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    direcoes.forEach(([deltaLinha, deltaCol]) => {
        const novaLinha = linha + deltaLinha;
        const novaCol = col + deltaCol;

        if (novaLinha >= 65 && novaLinha <= 74 && novaCol >= 0 && novaCol <= 9) {
            const pos = String.fromCharCode(novaLinha) + novaCol;
            if (tabuleiro[pos]) {
                adjacentes.push([pos, tabuleiro[pos]]);
            }
        }
    });

    return adjacentes;
};