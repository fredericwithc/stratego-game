// src/game-modes/AIGame.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';
import { rankNum, pecaImovel } from '../utils/pieceUtils';
import { calcularMovimentosValidos, movimentoValido } from '../utils/movementUtils';
import { simularCombate } from '../utils/combatUtils';
import { obterPosicoesAdjacentes, obterPecasAdjacentes, isAgua } from '../utils/boardUtils';

// FUNÇÃO: Normaliza a aresta como chave sem direção (A5<->A6 vira "A5-A6" sempre) 
export const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Penaliza quando a IA tenta usar a MESMA aresta pela 3ª vez consecutiva 
export const penalizacaoCicloAresta = (origem, destino, arestaRepetida) => {
    if (!arestaRepetida || !arestaRepetida.chave) return 0;
    const chave = edgeKey(origem, destino);

    if (arestaRepetida.chave !== chave) return 0;         // aresta diferente, sem penalização

    if (arestaRepetida.cont >= 2) return -500;            // 3ª vez ou mais -> bloqueia forte
    if (arestaRepetida.cont === 1) return -30;            // 2ª vez -> permite, mas desestimula um pouco
    return 0;                                             // 1ª vez -> livre
};

// Penaliza voltar para a casa anterior e ficar rondando casas já muito visitadas 
export const penalizacaoRepeticao = (origem, destino, ultimoMovimento, visitasIA) => {
    let penalidade = 0;

    // Evitar "desfazer" imediatamente o último lance (origem<-destino do lance anterior)
    if (ultimoMovimento && ultimoMovimento.origem === destino && ultimoMovimento.destino === origem) {
        penalidade -= 120; // forte punição para não "voltar"
    }

    // Evitar casas muito visitadas
    const visitas = visitasIA[destino] || 0;
    if (visitas >= 3) penalidade -= 10 * visitas; // -30 a partir de 3 visitas, -40 a partir de 4, etc.

    return penalidade;
};

// Analisar situação do jogo 
export const analisarSituacao = (tabuleiro) => {
    const pecasVermelhas = Object.entries(tabuleiro).filter(([pos, peca]) => peca?.jogador === "Vermelho");
    const pecasAzuis = Object.entries(tabuleiro).filter(([pos, peca]) => peca?.jogador === "Azul");

    // Se IA tem vantagem numérica, atacar
    if (pecasVermelhas.length > pecasAzuis.length + 5) {
        return 'ataque_agressivo';
    }

    // Se IA está em desvantagem, defender
    if (pecasVermelhas.length < pecasAzuis.length - 3) {
        return 'defesa_conservadora';
    }

    // Situação equilibrada - exploração
    return 'exploracao';
};

// Calcular prioridade do movimento 
export const calcularPrioridadeMovimento = (origem, destino, peca, estrategia, tabuleiro, ultimoMovimento, visitasIA, arestaRepetida) => {
    let prioridade = 0;
    const pecaDestino = tabuleiro[destino];

    // PRIORIDADE MÁXIMA: Capturar bandeira
    if (pecaDestino?.numero === '🏳️' || (React.isValidElement(pecaDestino?.numero) && pecaDestino?.numero.props?.icon === faFlag)) {
        return 1000;
    }

    // ALTA PRIORIDADE: Atacar peças inimigas
    if (pecaDestino && pecaDestino.jogador === "Azul") {
        const resultado = simularCombate(peca, pecaDestino);
        if (resultado === 'vitoria') {
            prioridade += 300 + rankNum(pecaDestino.numero) * 10; // capturas fortes valem mais
        } else if (resultado === 'empate') {
            prioridade += 5; // pouco atrativo
        } else {
            prioridade -= 300; // evita suicídios
        }
    }

    // ESTRATÉGIAS ESPECÍFICAS
    if (estrategia === 'ataque_agressivo') {
        // Avançar com peças fortes
        if (Number(peca.numero) >= 7) {
            const linhaOrigem = origem[0].charCodeAt(0);
            const linhaDestino = destino[0].charCodeAt(0);
            if (linhaDestino > linhaOrigem) { // Movendo para frente
                prioridade += 30;
            }
        }
    }

    if (estrategia === 'exploracao') {
        // Usar batedores para explorar
        if (peca.numero === 2) {
            const distancia = Math.abs(origem[0].charCodeAt(0) - destino[0].charCodeAt(0)) +
                Math.abs(parseInt(origem[1]) - parseInt(destino[1]));
            prioridade += distancia * 15; // Favor movimentos longos
        }

        // Revelar peças inimigas desconhecidas
        if (pecaDestino && pecaDestino.jogador === "Azul") {
            prioridade += 25;
        }
    }

    if (estrategia === 'defesa_conservadora') {
        // Manter peças valiosas atrás
        if (Number(peca.numero) >= 8) {
            const linhaOrigem = origem[0].charCodeAt(0);
            const linhaDestino = destino[0].charCodeAt(0);
            if (linhaDestino < linhaOrigem) { // Recuando
                prioridade += 20;
            }
        }
    }

    // penalização por repetição/volta e "passeios" em casas já batidas
    prioridade += penalizacaoRepeticao(origem, destino, ultimoMovimento, visitasIA);

    // EVITAR movimentos perigosos
    const pecasAdjacentesDestino = obterPecasAdjacentes(destino, tabuleiro);
    pecasAdjacentesDestino.forEach(([pos, pecaAdjacente]) => {
        if (pecaAdjacente?.jogador === "Azul" && Number(pecaAdjacente.numero) > Number(peca.numero)) {
            prioridade -= 60; // Evitar ficar perto de peças mais fortes
        }
    });

    // Penaliza usar a mesma aresta 3+ vezes seguidas (e desestimula a 2ª)
    prioridade += penalizacaoCicloAresta(origem, destino, arestaRepetida);

    return prioridade;
};

// Escolher melhor movimento baseado na estratégia 
export const escolherMelhorMovimento = (estrategia, tabuleiro, ultimoMovimento, visitasIA, arestaRepetida) => {
    const pecasMoveis = Object.entries(tabuleiro).filter(([pos, peca]) =>
        peca?.jogador === "Vermelho" && !pecaImovel(peca.numero)
    );

    let movimentosCandidatos = [];

    pecasMoveis.forEach(([origem, peca]) => {
        const movimentosValidos = calcularMovimentosValidos(origem, tabuleiro);

        movimentosValidos.forEach(destino => {
            const prioridade = calcularPrioridadeMovimento(origem, destino, peca, estrategia, tabuleiro, ultimoMovimento, visitasIA, arestaRepetida);
            movimentosCandidatos.push({ origem, destino, peca, prioridade });
        });
    });

    // Ordena por prioridade
    movimentosCandidatos.sort((a, b) => b.prioridade - a.prioridade);

    if (movimentosCandidatos.length > 0) {
        return movimentosCandidatos[0];
    }

    //FALLBACK: tenta um movimento adjacente seguro para NÃO travar
    console.warn('[IA] nenhum movimento "inteligente" encontrado; tentando fallback...');
    for (const [origem, peca] of pecasMoveis) {
        const candidatosAdj = calcularMovimentosValidos(origem, tabuleiro);
        if (candidatosAdj.length > 0) {
            return { origem, destino: candidatosAdj[0], peca, prioridade: 0 };
        }
    }

    console.error('[IA] nem fallback disponível – sem lances!');
    return null;
};

// Posicionar peças da IA 
export const posicionarPecasIA = () => {
    // Constantes temporárias
    const BOMBA = 'BOMBA_TEMP';
    const BANDEIRA = 'BANDEIRA_TEMP';

    // Escolher estratégia aleatória
    const estrategias = ['defensiva', 'ofensiva', 'balanceada', 'decoy'];
    const estrategiaEscolhida = estrategias[Math.floor(Math.random() * estrategias.length)];

    let tabuleiroNovo = {};

    // Posições possíveis para bandeira
    const posicoesSegurasBandeira = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    let posicaoBandeira = posicoesSegurasBandeira[Math.floor(Math.random() * posicoesSegurasBandeira.length)];

    if (estrategiaEscolhida === 'defensiva') {
        // Bandeira
        tabuleiroNovo[posicaoBandeira] = { numero: BANDEIRA, jogador: 'Vermelho' };

        // 3 bombas ao redor
        const protecoesBandeira = obterPosicoesAdjacentes(posicaoBandeira);
        protecoesBandeira.slice(0, 3).forEach(pos => {
            tabuleiroNovo[pos] = { numero: BOMBA, jogador: 'Vermelho' };
        });

        // Mais 3 bombas
        const bombasExtras = ['A0', 'A9', 'B1', 'B0', 'B9'].filter(pos => !tabuleiroNovo[pos]);
        bombasExtras.slice(0, 3).forEach(pos => {
            tabuleiroNovo[pos] = { numero: BOMBA, jogador: 'Vermelho' };
        });

        // Peças altas
        const posicoesLivresA = ['A1', 'A2', 'A3', 'A7', 'A8'].filter(pos => !tabuleiroNovo[pos]);
        if (posicoesLivresA[0]) tabuleiroNovo[posicoesLivresA[0]] = { numero: 10, jogador: 'Vermelho' };
        if (posicoesLivresA[1]) tabuleiroNovo[posicoesLivresA[1]] = { numero: 9, jogador: 'Vermelho' };

        // Array com TODAS as peças
        const todasAsPecas = [
            BANDEIRA,
            BOMBA, BOMBA, BOMBA, BOMBA, BOMBA, BOMBA,
            10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 1
        ];

        const pecasJaUsadas = Object.values(tabuleiroNovo).map(p => p.numero);
        const pecasRestantes = todasAsPecas.filter(peca => {
            const qtdUsada = pecasJaUsadas.filter(p => p === peca).length;
            const qtdTotal = todasAsPecas.filter(p => p === peca).length;
            return qtdUsada < qtdTotal;
        });

        const posicoesVazias = [];
        for (let linha = 65; linha <= 68; linha++) {
            for (let col = 0; col <= 9; col++) {
                const pos = String.fromCharCode(linha) + col;
                if (!tabuleiroNovo[pos]) {
                    posicoesVazias.push(pos);
                }
            }
        }

        // Embaralhar
        for (let i = pecasRestantes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
        }

        for (let i = posicoesVazias.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
        }

        // Preencher
        pecasRestantes.forEach((peca, index) => {
            if (posicoesVazias[index]) {
                tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
            }
        });

    } else if (estrategiaEscolhida === 'ofensiva') {
        // Bandeira
        tabuleiroNovo[posicaoBandeira] = { numero: BANDEIRA, jogador: 'Vermelho' };

        // 2 bombas ao redor da bandeira
        const protecoesBandeira = obterPosicoesAdjacentes(posicaoBandeira);
        protecoesBandeira.slice(0, 2).forEach(pos => {
            tabuleiroNovo[pos] = { numero: BOMBA, jogador: 'Vermelho' };
        });

        // Peças fortes na frente
        tabuleiroNovo['D4'] = { numero: 10, jogador: 'Vermelho' };
        tabuleiroNovo['D5'] = { numero: 9, jogador: 'Vermelho' };
        tabuleiroNovo['D3'] = { numero: 8, jogador: 'Vermelho' };
        tabuleiroNovo['D6'] = { numero: 8, jogador: 'Vermelho' };

        // Completar bombas restantes até 6 (sem ultrapassar)
        const bombasJaColocadas = Object.values(tabuleiroNovo).filter(p => p.numero === BOMBA).length;
        const bombasRestantes = Math.max(6 - bombasJaColocadas, 0);
        if (bombasRestantes > 0) {
            const bombasOfensivasCandidatas = ['A0', 'A9', 'B0', 'D0', 'A1', 'B1', 'C0', 'C9']
                .filter(pos => !tabuleiroNovo[pos]);
            bombasOfensivasCandidatas.slice(0, bombasRestantes).forEach(pos => {
                tabuleiroNovo[pos] = { numero: BOMBA, jogador: 'Vermelho' };
            });
        }

        // Agora monte a lista base levando em conta QUANTAS bombas já existem
        const bombasUsadas = Object.values(tabuleiroNovo).filter(p => p.numero === BOMBA).length;
        const bombasRestantesNoArray = Math.max(6 - bombasUsadas, 0);

        const todasAsPecas = [
            BANDEIRA,
            ...Array(bombasRestantesNoArray).fill(BOMBA),
            10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5,
            4, 4, 4, 4,
            3, 3, 3, 3, 3,
            2, 2, 2, 2, 2, 2, 2, 2,
            1
        ];

        // Completar o restante das casas (A–D)
        const pecasJaUsadas = Object.values(tabuleiroNovo).map(p => p.numero);
        const pecasRestantes = todasAsPecas.filter(peca => {
            const qtdUsada = pecasJaUsadas.filter(p => p === peca).length;
            const qtdTotal = todasAsPecas.filter(p => p === peca).length;
            return qtdUsada < qtdTotal;
        });

        const posicoesVazias = [];
        for (let linha = 65; linha <= 68; linha++) {
            for (let col = 0; col <= 9; col++) {
                const pos = String.fromCharCode(linha) + col;
                if (!tabuleiroNovo[pos]) posicoesVazias.push(pos);
            }
        }

        // Embaralhar listas
        for (let i = pecasRestantes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
        }
        for (let i = posicoesVazias.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
        }

        // Preencher
        pecasRestantes.forEach((peca, index) => {
            if (posicoesVazias[index]) {
                tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
            }
        });

    } else if (estrategiaEscolhida === 'balanceada') {
        // Bandeira
        tabuleiroNovo[posicaoBandeira] = { numero: BANDEIRA, jogador: 'Vermelho' };

        // 3 bombas ao redor da bandeira
        const protecoesBandeira = obterPosicoesAdjacentes(posicaoBandeira);
        protecoesBandeira.slice(0, 3).forEach(pos => {
            tabuleiroNovo[pos] = { numero: BOMBA, jogador: 'Vermelho' };
        });

        // Peças altas
        const posicoesLivresA = ['A0', 'A1', 'A8', 'A9'].filter(pos => !tabuleiroNovo[pos]);
        if (posicoesLivresA[0]) tabuleiroNovo[posicoesLivresA[0]] = { numero: 10, jogador: 'Vermelho' };
        tabuleiroNovo['B2'] = { numero: 9, jogador: 'Vermelho' };

        // Completar bombas restantes até 6 (sem ultrapassar)
        const bombasJaColocadas = Object.values(tabuleiroNovo).filter(p => p.numero === BOMBA).length;
        const bombasRestantes = Math.max(6 - bombasJaColocadas, 0);
        if (bombasRestantes > 0) {
            const bombasBalanceadas = ['A0', 'D1', 'D8', 'B0', 'B9']
                .filter(pos => !tabuleiroNovo[pos]);
            bombasBalanceadas.slice(0, bombasRestantes).forEach(pos => {
                tabuleiroNovo[pos] = { numero: BOMBA, jogador: 'Vermelho' };
            });
        }

        // Agora monte a lista base levando em conta QUANTAS bombas já existem
        const bombasUsadas = Object.values(tabuleiroNovo).filter(p => p.numero === BOMBA).length;
        const bombasRestantesNoArray = Math.max(6 - bombasUsadas, 0);

        const todasAsPecas = [
            BANDEIRA,
            ...Array(bombasRestantesNoArray).fill(BOMBA),
            10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5,
            4, 4, 4, 4,
            3, 3, 3, 3, 3,
            2, 2, 2, 2, 2, 2, 2, 2,
            1
        ];

        // Completar o restante das casas (A–D)
        const pecasJaUsadas = Object.values(tabuleiroNovo).map(p => p.numero);
        const pecasRestantes = todasAsPecas.filter(peca => {
            const qtdUsada = pecasJaUsadas.filter(p => p === peca).length;
            const qtdTotal = todasAsPecas.filter(p => p === peca).length;
            return qtdUsada < qtdTotal;
        });

        const posicoesVazias = [];
        for (let linha = 65; linha <= 68; linha++) {
            for (let col = 0; col <= 9; col++) {
                const pos = String.fromCharCode(linha) + col;
                if (!tabuleiroNovo[pos]) posicoesVazias.push(pos);
            }
        }

        // Embaralhar listas
        for (let i = pecasRestantes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
        }
        for (let i = posicoesVazias.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
        }

        // Preencher
        pecasRestantes.forEach((peca, index) => {
            if (posicoesVazias[index]) {
                tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
            }
        });

    } else if (estrategiaEscolhida === 'decoy') {
        // Bandeira na frente
        const posicoesDecoy = ['D4', 'D5', 'D6'];
        posicaoBandeira = posicoesDecoy[Math.floor(Math.random() * posicoesDecoy.length)];
        tabuleiroNovo[posicaoBandeira] = { numero: BANDEIRA, jogador: 'Vermelho' };

        // 6 bombas
        const bombasDecoy = ['A0', 'A1', 'A8', 'A9', 'B0', 'B9', 'A2', 'A7'].filter(pos => !tabuleiroNovo[pos]);
        bombasDecoy.slice(0, 6).forEach(pos => {
            tabuleiroNovo[pos] = { numero: BOMBA, jogador: 'Vermelho' };
        });

        // Peças fortes
        const adjacentes = obterPosicoesAdjacentes(posicaoBandeira);
        if (adjacentes[0]) tabuleiroNovo[adjacentes[0]] = { numero: 10, jogador: 'Vermelho' };
        if (adjacentes[1]) tabuleiroNovo[adjacentes[1]] = { numero: 9, jogador: 'Vermelho' };

        const todasAsPecas = [
            BANDEIRA,
            BOMBA, BOMBA, BOMBA, BOMBA, BOMBA, BOMBA,
            10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 1
        ];

        const pecasJaUsadas = Object.values(tabuleiroNovo).map(p => p.numero);
        const pecasRestantes = todasAsPecas.filter(peca => {
            const qtdUsada = pecasJaUsadas.filter(p => p === peca).length;
            const qtdTotal = todasAsPecas.filter(p => p === peca).length;
            return qtdUsada < qtdTotal;
        });

        const posicoesVazias = [];
        for (let linha = 65; linha <= 68; linha++) {
            for (let col = 0; col <= 9; col++) {
                const pos = String.fromCharCode(linha) + col;
                if (!tabuleiroNovo[pos]) posicoesVazias.push(pos);
            }
        }

        // Embaralhar
        for (let i = pecasRestantes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
        }

        for (let i = posicoesVazias.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
        }

        // Preencher
        pecasRestantes.forEach((peca, index) => {
            if (posicoesVazias[index]) {
                tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
            }
        });
    }

    // CONVERTER STRINGS PARA REACT ELEMENTS
    Object.keys(tabuleiroNovo).forEach(pos => {
        const peca = tabuleiroNovo[pos];
        if (peca.numero === BOMBA) {
            tabuleiroNovo[pos] = {
                numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />,
                jogador: 'Vermelho'
            };
        } else if (peca.numero === BANDEIRA) {
            tabuleiroNovo[pos] = {
                numero: <FontAwesomeIcon icon={faFlag} className="flag-icon" />,
                jogador: 'Vermelho'
            };
        }
    });

    return tabuleiroNovo;
};


