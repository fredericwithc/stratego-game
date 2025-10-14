import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';
import { rankNum } from './pieceUtils';
import { verificarVitoria } from './combatUtils';

// FUNÇÃO: Registrar peça capturada 
export const registrarCaptura = (pecaCapturada, jogadorCapturador, pecasCapturadas, setPecasCapturadas) => {
    const novasPecasCapturadas = { ...pecasCapturadas };
    novasPecasCapturadas[jogadorCapturador].push(pecaCapturada);
    setPecasCapturadas(novasPecasCapturadas);
};

// FUNÇÃO: Executar combate 
export const executarCombate = (
    pecaAtacante,
    pecaDefensora,
    posicao,
    novoTabuleiro,
    origem,
    setMensagem,
    registrarCapturaFn,
    setTabuleiro,
    setJogoTerminado,
    setCombateAtivo,
    setPecaRevelada,
    setRevealCombate,
    jogadorAtual,
    modoJogo,
    finalizarMovimentoIA,
    setJogadorAtual,
    setMostrarTrocaTurno
) => {
    // PRIORIDADE MÁXIMA: Verificar se capturou bandeira
    const ehBandeira = React.isValidElement(pecaDefensora.numero) &&
        pecaDefensora.numero.props?.icon === faFlag;

    if (ehBandeira) {
        setMensagem(`Bandeira capturada! ${pecaAtacante.jogador} venceu!`);
        registrarCapturaFn(pecaDefensora, pecaAtacante.jogador);
        novoTabuleiro[posicao] = pecaAtacante;
        delete novoTabuleiro[origem];
        setTabuleiro(novoTabuleiro);

        // Finalizar jogo imediatamente
        setJogoTerminado(true);
        setMensagem(`${pecaAtacante.jogador} venceu! Bandeira capturada!`);
        setCombateAtivo(false);
        setPecaRevelada(null);
        setRevealCombate({ origem: null, destino: null });
        return;
    }

    if (rankNum(pecaAtacante.numero) === 1 && rankNum(pecaDefensora.numero) === 10) {
        // Assassino vence Marechal quando ataca
        setMensagem(`Combate: Assassino vs Marechal - Assassino venceu!`);
        registrarCapturaFn(pecaDefensora, pecaAtacante.jogador);
        novoTabuleiro[posicao] = pecaAtacante;

    } else if (pecaDefensora.numero === '💣' || (React.isValidElement(pecaDefensora.numero) && pecaDefensora.numero.props?.icon === faBomb)) {
        if (rankNum(pecaAtacante.numero) === 3) {
            setMensagem(`Combate: Engenheiro vs Bomba - Bomba desarmada!`);
            registrarCapturaFn(pecaDefensora, pecaAtacante.jogador);
            novoTabuleiro[posicao] = pecaAtacante;
        } else {
            setMensagem(`Combate: ${pecaAtacante.numero} vs Bomba - Ambos destruídos!`);
            registrarCapturaFn(pecaAtacante, pecaDefensora.jogador);
            registrarCapturaFn(pecaDefensora, pecaAtacante.jogador); // CAPTURA A BOMBA TAMBÉM
            delete novoTabuleiro[posicao]; // REMOVE AMBOS DO TABULEIRO
        }

    } else if (rankNum(pecaAtacante.numero) > rankNum(pecaDefensora.numero)) {
        setMensagem(`Combate: ${pecaAtacante.numero} vs ${pecaDefensora.numero} - Atacante venceu!`);
        registrarCapturaFn(pecaDefensora, pecaAtacante.jogador);
        novoTabuleiro[posicao] = pecaAtacante;

    } else if (rankNum(pecaAtacante.numero) < rankNum(pecaDefensora.numero)) {
        setMensagem(`Combate: ${pecaAtacante.numero} vs ${pecaDefensora.numero} - Defensor venceu!`);
        registrarCapturaFn(pecaAtacante, pecaDefensora.jogador);

    } else {
        setMensagem(`Combate: ${pecaAtacante.numero} vs ${pecaDefensora.numero} - Empate! Ambas morrem.`);
        registrarCapturaFn(pecaAtacante, pecaDefensora.jogador);
        registrarCapturaFn(pecaDefensora, pecaAtacante.jogador);
        delete novoTabuleiro[posicao];
    }

    // Finalizar movimento
    delete novoTabuleiro[origem];
    setTabuleiro(novoTabuleiro);
    // Verificar vitória imediatamente após atualizar tabuleiro
    const resultadoVitoria = verificarVitoria(novoTabuleiro);
    if (resultadoVitoria) {
        setJogoTerminado(true);
        setCombateAtivo(false);
        setPecaRevelada(null);
        return;
    }
    setCombateAtivo(false);
    setPecaRevelada(null);
    setRevealCombate({ origem: null, destino: null });

    const novoJogador = jogadorAtual === "Vermelho" ? "Azul" : "Vermelho";

    // Se a IA acabou de jogar, limpa os estados dela
    if (jogadorAtual === "Vermelho" && modoJogo === 'ia') {
        finalizarMovimentoIA();
    }

    setJogadorAtual(novoJogador);
    // Só mostra popup de troca de turno se NÃO for modo IA
    if (modoJogo !== 'ia') {
        setMostrarTrocaTurno(true);
    }
};

// FUNÇÃO: Processar drop de peça arrastada 
export const handleDrop = (
    destino,
    draggedPiece,
    dragSourcePosition,
    tabuleiro,
    movimentoValidoFn,
    setTabuleiro,
    jogadorAtual,
    setJogadorAtual,
    modoJogo,
    setMostrarTrocaTurno,
    setDraggedPiece,
    setDragSourcePosition,
    setIsDragging,
    setMovimentosValidos
) => {
    if (!draggedPiece || !dragSourcePosition) {
        return;
    }

    const origem = dragSourcePosition;
    const pecaAtacante = tabuleiro[origem];
    const pecaDefensora = tabuleiro[destino];

    if (!movimentoValidoFn(origem, destino, pecaAtacante)) {
        setDraggedPiece(null);
        setDragSourcePosition(null);
        return;
    }

    const novoTabuleiro = { ...tabuleiro };

    if (!pecaDefensora) {
        // Movimento simples
        novoTabuleiro[destino] = pecaAtacante;
        delete novoTabuleiro[origem];
        setTabuleiro(novoTabuleiro);

        // ADICIONAR TROCA DE TURNO:
        const novoJogador = jogadorAtual === "Vermelho" ? "Azul" : "Vermelho";
        setJogadorAtual(novoJogador);

        // Se não for modo IA, mostrar popup de troca
        if (modoJogo !== 'ia') {
            setMostrarTrocaTurno(true);
        }
    }

    // Limpar estados
    setDraggedPiece(null);
    setDragSourcePosition(null);
    setIsDragging(false);
    setMovimentosValidos([]);
};