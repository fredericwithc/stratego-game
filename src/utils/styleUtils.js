
import { isTerritorioVermelho, isTerritorioAzul } from './boardUtils';

// FUNÇÃO: Verificar se há peça vermelha na posição 
export const temPecaVermelha = (posicao, tabuleiro) => {
    return tabuleiro[posicao]?.jogador === "Vermelho";
};

// FUNÇÃO: Verificar se há peça azul na posição 
export const temPecaAzul = (posicao, tabuleiro) => {
    return tabuleiro[posicao]?.jogador === "Azul";
};

// 🌟 FUNÇÃO: Determinar o estilo da célula (selecionada ou não) 
export const getCellStyle = (
    posicao,
    celulaSelecionada,
    combateAtivo,
    pecaRevelada,
    tabuleiro,
    faseJogo,
    pecaSelecionadaNoTabuleiro,
    movimentosValidos,
    dadosAnimacao,
    ultimoMovimento,
    revealCombate = { origem: null, destino: null }
) => {
    const baseSelecionada = (celulaSelecionada === posicao)
        ? {
            outline: '3px solid #DFD0B8',
            outlineOffset: '-3px'
        }
        : {};

    const celulaEmCombate =
        combateAtivo &&
        (posicao === revealCombate?.origem ||
            posicao === revealCombate?.destino ||
            pecaRevelada === posicao);

    if (celulaEmCombate) {
        const pecaInfo = tabuleiro[posicao];
        const corJogador = pecaInfo?.jogador === "Vermelho" ?
            'linear-gradient(135deg, #e74c3c, #c0392b)' :
            'linear-gradient(135deg, #3498db, #2980b9)';

        const corBorda = pecaInfo?.jogador === "Vermelho" ? '#c0392b' : '#2980b9';

        return {
            animation: 'revealPiece .5s ease-in-out',
            transform: 'scale(1.2)',
            background: `${corJogador} !important`,
            border: `3px solid ${corBorda} !important`,
            boxShadow: `0 0 20px ${pecaInfo?.jogador === "Vermelho" ? 'rgba(231, 76, 60, 0.6)' : 'rgba(52, 152, 219, 0.6)'}`,
            zIndex: 9999,
            position: 'relative'
        };
    }

    // Destacar peça selecionada no tabuleiro durante configuração
    if (faseJogo === 'configuracao' && pecaSelecionadaNoTabuleiro === posicao) {
        const corFundo = temPecaVermelha(posicao, tabuleiro)
            ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
            : 'linear-gradient(135deg, #3498db, #2980b9)';

        return {
            ...baseSelecionada,
            background: corFundo,
            outline: '3px solid #DFD0B8',
            outlineOffset: '-3px',
            boxShadow: '0 0 10px #DFD0B8',
            zIndex: 10
        };
    }

    const vazia = !tabuleiro[posicao];
    const ehVermelho = isTerritorioVermelho(posicao);
    const ehAzul = isTerritorioAzul(posicao);

    // Durante configuração, aplicar cor de fundo suave
    if (faseJogo === 'configuracao' && vazia && (ehVermelho || ehAzul)) {
        return {
            ...baseSelecionada,
            opacity: 0.35,
            backgroundColor: ehVermelho
                ? '#e74c3c'
                : '#3498db',
        };
    }

    // Destacar movimentos válidos durante o jogo
    if (faseJogo === 'jogando' && movimentosValidos.includes(posicao)) {
        // Preservar cor da peça se existir
        let corFundo = 'rgba(223, 208, 184, 0.2)';
        if (temPecaVermelha(posicao, tabuleiro)) {
            corFundo = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        } else if (temPecaAzul(posicao, tabuleiro)) {
            corFundo = 'linear-gradient(135deg, #3498db, #2980b9)';
        }

        return {
            ...baseSelecionada,
            background: corFundo,
            outline: '2px solid #DFD0B8',
            outlineOffset: '-2px',
            boxShadow: '0 0 8px rgba(223, 208, 184, 0.6)'
        };
    }

    // Fora da config - cor baseada na peça, não no território
    if (temPecaVermelha(posicao, tabuleiro)) {
        return { ...baseSelecionada, background: 'linear-gradient(135deg, #e74c3c, #c0392b)' };
    }
    if (temPecaAzul(posicao, tabuleiro)) {
        return { ...baseSelecionada, background: 'linear-gradient(135deg, #3498db, #2980b9)' };
    }

    // Aplicar classes de animação se estiver animando movimento
    if (dadosAnimacao) {
        if (dadosAnimacao.origem === posicao) {
            return {
                ...baseSelecionada,
                animation: 'cellFadeOut 0.5s ease-in-out'
            };
        }
        if (dadosAnimacao.destino === posicao) {
            return {
                ...baseSelecionada,
                animation: 'cellFadeIn 0.5s ease-in-out'
            };
        }
    }

    // Mostrar rastro do último movimento da IA
    if (ultimoMovimento) {
        if (posicao === ultimoMovimento.origem) {
            return { ...baseSelecionada, className: 'last-move-origin' };
        }
        if (posicao === ultimoMovimento.destino) {
            return { ...baseSelecionada, className: 'last-move-dest' };
        }
    }

    // Se não tem peça, usar mapa
    return baseSelecionada;
};