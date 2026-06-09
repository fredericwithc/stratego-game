
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';

export const PECAS_INICIAIS_JOGADOR = {
    10: 1, 9: 1, 8: 2, 7: 3, 6: 4, 5: 4, 4: 4, 3: 5, 2: 8, 1: 1,
    bomba: 6, bandeira: 1
};

const tipoPecaFromNumero = (numero) => {
    if (numero === 'bomba' || numero === 'BOMBA') return 'bomba';
    if (numero === 'bandeira' || numero === 'BANDEIRA') return 'bandeira';

    if (React.isValidElement(numero)) {
        const iconName = numero.props?.icon?.iconName;
        if (iconName === 'bomb') return 'bomba';
        if (iconName === 'flag') return 'bandeira';
    }

    const n = Number(numero);
    if (!Number.isNaN(n) && n >= 1 && n <= 10) return n;
    return null;
};

// Recalcula estoque a partir do que já está no tabuleiro (corrige dessincronia online)
export const calcularPecasDisponiveisDoTabuleiro = (jogador, tabuleiro) => {
    const disponiveis = { ...PECAS_INICIAIS_JOGADOR };

    Object.values(tabuleiro || {}).forEach((peca) => {
        if (!peca || peca.jogador !== jogador) return;
        const tipo = tipoPecaFromNumero(peca.numero);
        if (tipo != null && disponiveis[tipo] !== undefined) {
            disponiveis[tipo] = Math.max(0, disponiveis[tipo] - 1);
        }
    });

    return disponiveis;
};

// FUNÇÃO: Verificar se todas as peças foram colocadas no tabuleiro 
export const validarConfiguracaoCompleta = (jogador, pecasDisponiveis) => {
    const pecasRestantes = Object.values(pecasDisponiveis[jogador]).reduce((total, qtd) => total + qtd, 0);
    return pecasRestantes === 0;
};

// FUNÇÃO: Contar quantas peças faltam ser colocadas 
export const contarPecasRestantes = (jogador, pecasDisponiveis) => {
    return Object.values(pecasDisponiveis[jogador]).reduce((total, qtd) => total + qtd, 0);
};

// FUNÇÃO: Colocar peça durante configuração 
export const colocarPecaConfiguracao = (
    posicao,
    pecaSelecionadaConfig,
    draggedPiece,
    jogadorAtual,
    tabuleiro,
    pecasDisponiveis,
    setTabuleiro,
    setPecasDisponiveis,
    setPecaSelecionadaConfig,
    setDraggedPiece,
    setIsDragging,
    setDragSourcePosition,
    setTouchDragData,
    ghostElement,
    setGhostElement
) => {
    if (!pecaSelecionadaConfig && !draggedPiece) return;
    const pecaParaColocar = draggedPiece || pecaSelecionadaConfig;

    // Verificar se é território correto
    const linha = posicao[0];
    const territorioValido = (jogadorAtual === "Vermelho" && linha >= 'A' && linha <= 'D') ||
        (jogadorAtual === "Azul" && linha >= 'G' && linha <= 'J');

    if (!territorioValido || tabuleiro[posicao]) {
        return;
    }

    // Colocar peça
    const simbolo = pecaParaColocar === 'bomba' ? <FontAwesomeIcon icon={faBomb} className="bomb-icon" /> :
        pecaParaColocar === 'bandeira' ? <FontAwesomeIcon icon={faFlag} className="flag-icon" /> : pecaParaColocar;

    const novoTabuleiro = { ...tabuleiro };
    novoTabuleiro[posicao] = { numero: simbolo, jogador: jogadorAtual };
    setTabuleiro(novoTabuleiro);

    // Reduzir peça disponível
    const novasPecas = { ...pecasDisponiveis };
    novasPecas[jogadorAtual][pecaParaColocar]--;
    setPecasDisponiveis(novasPecas);

    // Só DESseleciona quando zerar o estoque dessa peça
    if (novasPecas[jogadorAtual][pecaParaColocar] <= 0) {
        setPecaSelecionadaConfig(null);
    }

    // Limpar estados de drag and drop
    setDraggedPiece(null);
    setIsDragging(false);
    setDragSourcePosition(null);
    setTouchDragData(null);
    try {
        if (ghostElement) {
            document.body.removeChild(ghostElement);
        }
    } catch { }
    setGhostElement(null);
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('dragging-over'));
};

// FUNÇÃO: Mover peça dentro do tabuleiro durante configuração 
export const moverPecaNoTabuleiro = (posicaoOrigem, posicaoDestino, jogadorAtual, tabuleiro, setTabuleiro) => {
    const pecaOrigem = tabuleiro[posicaoOrigem];
    const pecaDestino = tabuleiro[posicaoDestino];

    // Verificar se é território válido
    const linha = posicaoDestino[0];
    const territorioValido = (jogadorAtual === "Vermelho" && linha >= 'A' && linha <= 'D') ||
        (jogadorAtual === "Azul" && linha >= 'G' && linha <= 'J');

    if (!territorioValido) return;

    const novoTabuleiro = { ...tabuleiro };

    if (pecaDestino) {
        // Trocar posições das duas peças
        novoTabuleiro[posicaoOrigem] = pecaDestino;
        novoTabuleiro[posicaoDestino] = pecaOrigem;
    } else {
        // Mover para célula vazia
        novoTabuleiro[posicaoDestino] = pecaOrigem;
        delete novoTabuleiro[posicaoOrigem];
    }

    setTabuleiro(novoTabuleiro);
};