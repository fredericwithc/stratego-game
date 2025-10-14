
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';

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
    console.log('=== COLOCAR PEÇA ===');
    console.log('pecaSelecionadaConfig:', pecaSelecionadaConfig);
    console.log('draggedPiece:', draggedPiece);
    console.log('posicao:', posicao);
    console.log('tabuleiro[posicao]:', tabuleiro[posicao]);

    if (!pecaSelecionadaConfig && !draggedPiece) return;
    const pecaParaColocar = draggedPiece || pecaSelecionadaConfig;

    console.log('pecaParaColocar:', pecaParaColocar);

    // Verificar se é território correto
    const linha = posicao[0];
    const territorioValido = (jogadorAtual === "Vermelho" && linha >= 'A' && linha <= 'D') ||
        (jogadorAtual === "Azul" && linha >= 'G' && linha <= 'J');

    console.log('territorioValido:', territorioValido);
    console.log('tabuleiro[posicao] existe?:', !!tabuleiro[posicao]);

    if (!territorioValido || tabuleiro[posicao]) {
        console.log('❌ VALIDAÇÃO FALHOU - não vai colocar');
        return;
    }

    console.log('✅ VAI COLOCAR A PEÇA');

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