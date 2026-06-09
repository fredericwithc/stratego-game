import { renderPieceWithRank, renderPieceBack } from './renderUtils';

// Retorna 'frente' | 'verso' | 'oculta' | null
export const getPieceFaceType = ({
    posicao,
    tabuleiro,
    combateAtivo,
    revealCombate,
    faseJogo,
    modoJogo,
    jogadorAtual,
    mostrarTrocaTurno,
    estadoOnline = null
}) => {
    const peca = tabuleiro[posicao];
    if (!peca) return null;

    if (
        combateAtivo &&
        (posicao === revealCombate.origem || posicao === revealCombate.destino)
    ) {
        return 'frente';
    }

    if (modoJogo === 'online' && estadoOnline && estadoOnline.minhaCor) {
        const minhaCor = estadoOnline.minhaCor;

        if (faseJogo === 'configuracao' || faseJogo === 'aguardando') {
            return peca.jogador === minhaCor ? 'frente' : 'verso';
        }

        if (faseJogo === 'jogando') {
            return peca.jogador === minhaCor ? 'frente' : 'verso';
        }
    }

    if (faseJogo === 'configuracao') {
        if (modoJogo === 'ia') {
            if (peca.jogador === 'Vermelho') return 'verso';
            return peca.jogador === jogadorAtual ? 'frente' : 'verso';
        }

        return peca.jogador === jogadorAtual ? 'frente' : 'verso';
    }

    if (mostrarTrocaTurno) {
        return 'oculta';
    }

    if (faseJogo === 'jogando' && modoJogo === 'ia' && jogadorAtual === 'Vermelho') {
        if (peca.jogador === 'Vermelho') return 'verso';
    }

    if (modoJogo === 'ia') {
        return peca.jogador === 'Azul' ? 'frente' : 'verso';
    }

    return peca.jogador === jogadorAtual ? 'frente' : 'verso';
};

// Classe CSS para borda da célula: peca-frente-azul, peca-verso-vermelho, etc.
export const getPieceBorderClass = (
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
    const face = getPieceFaceType({
        posicao,
        tabuleiro,
        combateAtivo,
        revealCombate,
        faseJogo,
        modoJogo,
        jogadorAtual,
        mostrarTrocaTurno,
        estadoOnline
    });

    if (!peca || !face || face === 'oculta') return '';

    const cor = peca.jogador === 'Vermelho' ? 'vermelho' : 'azul';
    return `peca-${face}-${cor}`;
};

// FUNÇÃO: Mostrar qual peça está numa célula
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

    const face = getPieceFaceType({
        posicao,
        tabuleiro,
        combateAtivo,
        revealCombate,
        faseJogo,
        modoJogo,
        jogadorAtual,
        mostrarTrocaTurno,
        estadoOnline
    });

    if (face === 'oculta' || !face) return '';

    if (face === 'frente') {
        return renderPieceWithRank(peca.numero, peca.jogador);
    }

    return renderPieceBack(peca.jogador);
};
