import { renderPieceWithRank, renderPieceBack } from './renderUtils';

export const BORDA_CORES = {
    verso: { Vermelho: '#b42a2a', Azul: '#2577ad' },
    frente: { Vermelho: '#8b1a1a', Azul: '#1a5276' }
};

const PIECE_FACE_PARAMS = [
    'posicao',
    'tabuleiro',
    'combateAtivo',
    'revealCombate',
    'faseJogo',
    'modoJogo',
    'jogadorAtual',
    'mostrarTrocaTurno',
    'estadoOnline'
];

const buildPieceFaceParams = (args) => {
    if (args.length === 1 && args[0]?.tabuleiro) {
        return args[0];
    }

    const params = {};
    PIECE_FACE_PARAMS.forEach((key, index) => {
        if (args[index] !== undefined) {
            params[key] = args[index];
        }
    });
    return params;
};

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

// Estilo inline de borda para peças reveladas (frente)
export const getPieceFrontBorderInline = (...args) => {
    const params = buildPieceFaceParams(args);
    const peca = params.tabuleiro?.[params.posicao];
    if (!peca) return {};

    const face = getPieceFaceType(params);
    if (face !== 'frente') return {};

    const corBorda = BORDA_CORES.frente[peca.jogador];
    return {
        border: `2px solid ${corBorda}`,
        boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.2)'
    };
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
