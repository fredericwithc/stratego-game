/* eslint-disable */
import React, { useState, useEffect } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWebAwesome } from '@fortawesome/free-brands-svg-icons';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';

import { database } from './firebase';
import { ref, set, onValue, get, push, remove, off } from 'firebase/database';

function App() {
  // ESTADO: Qual célula está selecionada
  const [celulaSelecionada, setCelulaSelecionada] = useState(null);

  // ESTADO: Drag and Drop na fase de colocação de peças
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragSourcePosition, setDragSourcePosition] = useState(null); // posição de origem no tabuleiro
  const [isDragging, setIsDragging] = useState(false);

  // ESTADO: Detectando Mobile para draganddrop
  const [modoMobile, setModoMobile] = useState(false);
  const [touchDragData, setTouchDragData] = useState(null);
  const [ghostElement, setGhostElement] = useState(null);

  // ESTADO que controla qual modo de jogo está ativo
  // Valores: 'menu', 'local', 'ia', 'online'
  const [modoJogo, setModoJogo] = useState('menu');

  // ESTADO para IA (se modo IA estiver ativo)
  // Controla se a IA está "pensando" e qual dificuldade
  const [estadoIA, setEstadoIA] = useState({
    pensando: false,
    dificuldade: 'Média' // depois adicionar 'facil', 'média', 'dificil'
  });

  // ESTADO Revelação temporária durante o combate (origem e destino)
  const [revealCombate, setRevealCombate] = useState({ origem: null, destino: null });

  // ESTADO para modo online (se modo online estiver ativo)
  // Armazena informações da sala e conexão
  const [estadoOnline, setEstadoOnline] = useState({
    sala: null,
    conectado: false,
    jogadorHost: false
  });

  // ESTADO: criar a sala para modo online
  const [telaSalaCriada, setTelaSalaCriada] = useState(false);

  // ESTADO: Controla se o modal de jogo online está visível
  const [mostrarModalOnline, setMostrarModalOnline] = useState(false);

  // ESTADO: Código da sala que o jogador digitou para entrar
  const [codigoSala, setCodigoSala] = useState('');

  // ESTADO: ID único do jogador na sala online (gerado automaticamente)
  const [jogadorOnlineId, setJogadorOnlineId] = useState(null);

  // ESTADO: Se está aguardando outro jogador se conectar à sala
  const [aguardandoJogador, setAguardandoJogador] = useState(false);

  // ESTADO: Mensagens de erro de conexão para mostrar ao usuário
  const [erroConexao, setErroConexao] = useState('');

  // ESTADO: peca selecionada no posicionamento
  const [pecaSelecionadaNoTabuleiro, setPecaSelecionadaNoTabuleiro] = useState(null);

  // ESTADO Guarda origem e destino do último movimento da IA
  const [ultimoMovimento, setUltimoMovimento] = useState(null);

  // ESTADO Destaque visual do último movimento
  useEffect(() => {
    //limpa qualquer destaque antigo
    document
      .querySelectorAll('.last-move-origin, .last-move-dest')
      .forEach(el => el.classList.remove('last-move-origin', 'last-move-dest'));

    if (!ultimoMovimento) return;

    //aplica as classes na origem e destino do último lance
    const { origem, destino } = ultimoMovimento;
    const origemEl = document.querySelector(`.cell[data-pos="${origem}"]`);
    const destinoEl = document.querySelector(`.cell[data-pos="${destino}"]`);

    if (origemEl) origemEl.classList.add('last-move-origin');
    if (destinoEl) destinoEl.classList.add('last-move-dest');
  }, [ultimoMovimento]);

  // ESTADO: Identificação de modo 'paisagem' em celular
  const [orientacao, setOrientacao] = useState('landscape');

  // ESTADO: controla se uma animação de movimento está acontecendo
  // Impede ações do usuário durante a transição visual da peça
  const [animandoMovimento, setAnimandoMovimento] = useState(false);
  // Controle se a IA está executando um movimento
  const [movimentoIAEmAndamento, setMovimentoIAEmAndamento] = useState(false);

  // ESTADO: que armazena dados da animação (posição origem, destino, peça)
  // Usado para criar o efeito visual de movimento da peça
  const [dadosAnimacao, setDadosAnimacao] = useState(null);

  // ESTADO Memória simples da IA
  const [historicoIA, setHistoricoIA] = useState([]);   // [{ origem, destino, peca, ts }]
  const [visitasIA, setVisitasIA] = useState({});       // { "A5": 3, "B2": 1, ... }

  // ESTADO Controla a repetição consecutiva da mesma aresta (origem<->destino) pela IA
  const [arestaRepetida, setArestaRepetida] = useState({ chave: null, cont: 0 });


  // ESTADO que armazena as peças capturadas por cada jogador
  // Objeto com arrays: {Vermelho: [peças], Azul: [peças]}
  const [pecasCapturadas, setPecasCapturadas] = useState({
    Vermelho: [],
    Azul: []
  });

  // ESTADO: Qual jogador está jogando (1 ou 2)
  const [jogadorAtual, setJogadorAtual] = useState("Vermelho");

  const [jogoTerminado, setJogoTerminado] = useState(false);

  const [mensagem, setMensagem] = useState('');

  const [mostrarTrocaTurno, setMostrarTrocaTurno] = useState(false);

  const [combateAtivo, setCombateAtivo] = useState(false);
  const [pecaRevelada, setPecaRevelada] = useState(null);

  const [faseJogo, setFaseJogo] = useState('configuracao'); // 'configuracao' ou 'jogando'
  const [pecasDisponiveis, setPecasDisponiveis] = useState({
    "Vermelho": { 10: 1, 9: 1, 8: 2, 7: 3, 6: 4, 5: 4, 4: 4, 3: 5, 2: 8, 1: 1, 'bomba': 6, 'bandeira': 1 },
    "Azul": { 10: 1, 9: 1, 8: 2, 7: 3, 6: 4, 5: 4, 4: 4, 3: 5, 2: 8, 1: 1, 'bomba': 6, 'bandeira': 1 }
  });
  const [pecaSelecionadaConfig, setPecaSelecionadaConfig] = useState(null);

  // ESTADO: Onde estão as peças no tabuleiro
  const [tabuleiro, setTabuleiro] = useState({});

  // ESTADO: estado auxiliar
  const [touchState, setTouchState] = useState({ x: 0, y: 0, moved: false });

  // Converte '2' -> 2, mantém número como número
  const rankNum = (n) => (typeof n === 'number' ? n : Number(n));


  // Estado que armazena array de posições onde a peça selecionada pode se mover
  // Usado para destacar visualmente as opções de movimento durante o jogo
  const [movimentosValidos, setMovimentosValidos] = useState([]);

  // Navbar / Modal de Regras / Restart
  const [mostrarRegras, setMostrarRegras] = useState(false);
  const abrirRegras = () => setMostrarRegras(true);
  const fecharRegras = () => setMostrarRegras(false);
  const handleRestart = () => {
    // usa função existente
    reiniciarJogo();
  };

  // EFEITO: detectando se é mobile
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setModoMobile(isMobile);
  }, []);

  // EFEITO: Tornar células draggable durante o jogo
  useEffect(() => {
    if (faseJogo === 'jogando') {
      const cells = document.querySelectorAll('.cell[data-pos]');

      cells.forEach(cell => {
        const posicao = cell.getAttribute('data-pos');
        const peca = tabuleiro[posicao];

        if (peca && peca.jogador === jogadorAtual && !pecaImovel(peca.numero)) {
          cell.setAttribute('draggable', 'true');
          cell.style.cursor = 'grab';
        } else {
          cell.setAttribute('draggable', 'false');
          cell.style.cursor = 'default';
        }
      });
    }
  }, [faseJogo, jogadorAtual, tabuleiro]);

  // EFEITO: Detectar orientação da tela
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.innerHeight > window.innerWidth) {
        setOrientacao('portrait');
      } else {
        setOrientacao('landscape');
      }
    };

    // Verificar orientação inicial
    handleOrientationChange();

    // Escutar mudanças de orientação
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // FUNÇÃO: Verificar se uma posição é água
  const isAgua = (posicao) => {
    const posAgua = ['E2', 'E3', 'E6', 'E7', 'F2', 'F3', 'F6', 'F7'];
    return posAgua.includes(posicao);
  };

  // Linhas A–D = território do Jogador Vermelho
  const isTerritorioVermelho = (pos) => {
    const l = pos[0];
    return l >= 'A' && l <= 'D';
  };

  // Linhas G–J = território do Jogador Azul
  const isTerritorioAzul = (pos) => {
    const l = pos[0];
    return l >= 'G' && l <= 'J';
  };

  // FUNÇÃO: Verificar se uma peça é imóvel
  const pecaImovel = (numeroPeca) => {
    const pecasImoveis = ['🏳️', '💣']; // Bandeira e bomba
    const ehBomba = React.isValidElement(numeroPeca) && numeroPeca.props?.icon === faBomb;
    const ehBandeira = React.isValidElement(numeroPeca) && numeroPeca.props?.icon === faFlag;
    return pecasImoveis.includes(numeroPeca) || ehBomba || ehBandeira;
  };

  // FUNÇÃO: Colocar peça durante configuração
  const colocarPecaConfiguracao = (posicao) => {
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
  const moverPecaNoTabuleiro = (posicaoOrigem, posicaoDestino) => {
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

  // FUNÇÃO: Verificar se algum jogador venceu
  const verificarVitoria = (tabuleiro) => {
    // Verificar se alguma bandeira foi capturada
    const bandeiraJogador1 = Object.values(tabuleiro).find(peca =>
      (peca?.numero === '🏳️' || (React.isValidElement(peca?.numero) && peca?.numero.props?.icon === faFlag))
      && peca?.jogador === "Vermelho"
    );
    const bandeiraJogador2 = Object.values(tabuleiro).find(peca =>
      (peca?.numero === '🏳️' || (React.isValidElement(peca?.numero) && peca?.numero.props?.icon === faFlag))
      && peca?.jogador === "Azul"
    );

    if (!bandeiraJogador1) return { vencedor: "Azul", motivo: 'Bandeira capturada!' };
    if (!bandeiraJogador2) return { vencedor: "Vermelho", motivo: 'Bandeira capturada!' };

    // Verificar se algum jogador não tem mais peças
    const pecasJogador1 = Object.values(tabuleiro).filter(peca => peca?.jogador === "Vermelho");
    const pecasJogador2 = Object.values(tabuleiro).filter(peca => peca?.jogador === "Azul");

    if (pecasJogador1.length === 0) return { vencedor: "Azul", motivo: 'Jogador Vermelho não tem mais peças' };
    if (pecasJogador2.length === 0) return { vencedor: "Vermelho", motivo: 'Jogador Azul não tem mais peças' };

    // Verificar se algum jogador não tem movimentos válidos (imobilizado)
    if (!jogadorTemMovimentosValidos("Vermelho", tabuleiro)) {
      return { vencedor: "Azul", motivo: 'Jogador Vermelho não tem movimentos válidos' };
    }
    if (!jogadorTemMovimentosValidos("Azul", tabuleiro)) {
      return { vencedor: "Vermelho", motivo: 'Jogador Azul não tem movimentos válidos' };
    }

    return null;
  };

  // FUNÇÃO: Reiniciar o jogo
  const reiniciarJogo = () => {
    setTabuleiro({});
    setJogadorAtual("Vermelho");
    setCelulaSelecionada(null);
    setJogoTerminado(false);
    setMensagem('');
    setFaseJogo('configuracao');
    setPecasDisponiveis({
      "Vermelho": { 10: 1, 9: 1, 8: 2, 7: 3, 6: 4, 5: 4, 4: 4, 3: 5, 2: 8, 1: 1, 'bomba': 6, 'bandeira': 1 },
      "Azul": { 10: 1, 9: 1, 8: 2, 7: 3, 6: 4, 5: 4, 4: 4, 3: 5, 2: 8, 1: 1, 'bomba': 6, 'bandeira': 1 }
    });
    setPecaSelecionadaConfig(null);
    setPecasCapturadas({ Vermelho: [], Azul: [] });

    // RESETAR IA AQUI
    setMovimentoIAEmAndamento(false);
    setUltimoMovimento(null);

    setHistoricoIA([]);
    setVisitasIA({});

    setArestaRepetida({ chave: null, cont: 0 });

    // Voltar ao menu
    setModoJogo('menu');
    setEstadoIA({ pensando: false, dificuldade: 'Média' });

    // Limpar estados de drag completamente
    setDraggedPiece(null);
    setDragSourcePosition(null);
    setIsDragging(false);
  };

  // FUNÇÃO: Registrar peça capturada
  const registrarCaptura = (pecaCapturada, jogadorCapturador) => {
    const novasPecasCapturadas = { ...pecasCapturadas };
    novasPecasCapturadas[jogadorCapturador].push(pecaCapturada);
    setPecasCapturadas(novasPecasCapturadas);
  };

  // FUNÇÃO: Executar combate
  const executarCombate = (pecaAtacante, pecaDefensora, posicao, novoTabuleiro, origem) => {

    if (rankNum(pecaAtacante.numero) === 1 && rankNum(pecaDefensora.numero) === 10) {
      // Assassino vence Marechal quando ataca
      setMensagem(`Combate: Assassino vs Marechal - Assassino venceu!`);
      registrarCaptura(pecaDefensora, pecaAtacante.jogador);
      novoTabuleiro[posicao] = pecaAtacante;

    } else if (pecaDefensora.numero === '💣' || (React.isValidElement(pecaDefensora.numero) && pecaDefensora.numero.props?.icon === faBomb)) {
      if (rankNum(pecaAtacante.numero) === 3) {
        setMensagem(`Combate: Engenheiro vs Bomba - Bomba desarmada!`);
        registrarCaptura(pecaDefensora, pecaAtacante.jogador);
        novoTabuleiro[posicao] = pecaAtacante;
      } else {
        setMensagem(`Combate: ${pecaAtacante.numero} vs Bomba - Ambos destruídos!`);
        registrarCaptura(pecaAtacante, pecaDefensora.jogador);
        registrarCaptura(pecaDefensora, pecaAtacante.jogador); // CAPTURA A BOMBA TAMBÉM
        delete novoTabuleiro[posicao]; // REMOVE AMBOS DO TABULEIRO
      }

    } else if (rankNum(pecaAtacante.numero) > rankNum(pecaDefensora.numero)) {
      setMensagem(`Combate: ${pecaAtacante.numero} vs ${pecaDefensora.numero} - Atacante venceu!`);
      registrarCaptura(pecaDefensora, pecaAtacante.jogador);
      novoTabuleiro[posicao] = pecaAtacante;

    } else if (rankNum(pecaAtacante.numero) < rankNum(pecaDefensora.numero)) {
      setMensagem(`Combate: ${pecaAtacante.numero} vs ${pecaDefensora.numero} - Defensor venceu!`);
      registrarCaptura(pecaAtacante, pecaDefensora.jogador);

    } else {
      setMensagem(`Combate: ${pecaAtacante.numero} vs ${pecaDefensora.numero} - Empate! Ambas morrem.`);
      registrarCaptura(pecaAtacante, pecaDefensora.jogador);
      registrarCaptura(pecaDefensora, pecaAtacante.jogador);
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
  const handleDrop = (destino) => {

    if (!draggedPiece || !dragSourcePosition) {
      return;
    }

    const origem = dragSourcePosition;
    const pecaAtacante = tabuleiro[origem];
    const pecaDefensora = tabuleiro[destino];

    if (!movimentoValido(origem, destino, pecaAtacante)) {
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

  // FUNÇÃO: O que acontece quando clica numa célula
  const handleCellClick = (posicao) => {

    if (faseJogo === 'configuracao') {
      const pecaNaPosicao = tabuleiro[posicao];

      // PRIORIDADE 1: Se tem uma peça selecionada no tabuleiro para mover
      if (pecaSelecionadaNoTabuleiro) {
        // Se clicou na mesma peça, desseleciona
        if (pecaSelecionadaNoTabuleiro === posicao) {
          setPecaSelecionadaNoTabuleiro(null);
          return;
        }

        // Se clicou em outra célula, move/troca a peça
        moverPecaNoTabuleiro(pecaSelecionadaNoTabuleiro, posicao);
        setPecaSelecionadaNoTabuleiro(null);
        return;
      }

      // PRIORIDADE 2: Se clicou em uma peça própria, selecionar para mover
      if (pecaNaPosicao && pecaNaPosicao.jogador === jogadorAtual) {
        setPecaSelecionadaNoTabuleiro(posicao);
        return;
      }

      // PRIORIDADE 3: Se tem peça selecionada na lista, colocar nova peça em célula VAZIA
      if (pecaSelecionadaConfig && !pecaNaPosicao) {
        colocarPecaConfiguracao(posicao);
        return;
      }

      // PRIORIDADE 4: Se clicou numa célula vazia sem nada selecionado, não faz nada
      // (este bloco pode ficar vazio, mas garante que não trava)

      return;
    }

    // Verificar se está tentando selecionar peça de outro jogador sem sua peça selecionada
    // Se clicou numa peça do oponente sem ter uma seleção ativa...
    if (tabuleiro[posicao] && tabuleiro[posicao].jogador !== jogadorAtual && !celulaSelecionada) {
      // ...mas quem está jogando é a IA (Vermelho) no modo IA, deixe passar
      const iaAtiva = (modoJogo === 'ia' && jogadorAtual === 'Vermelho' && movimentoIAEmAndamento);
      if (!iaAtiva) {
        setMensagem('Não é sua vez!');
        return;
      }
      // caso seja a IA, não dá return: segue o fluxo para permitir o 2º clique
    }


    // Verificar se está tentando selecionar peça imóvel
    if (tabuleiro[posicao] && !celulaSelecionada && pecaImovel(tabuleiro[posicao].numero)) {
      setMensagem('Esta peça não pode se mover!');
      return;
    }

    // Se já tenho uma célula selecionada
    if (celulaSelecionada && celulaSelecionada !== posicao) {
      // Verificar se é movimento adjacente, se é agua, se tem peça e se é inimigo
      if (movimentoValido(celulaSelecionada, posicao, tabuleiro[celulaSelecionada]) && !isAgua(posicao) && (!tabuleiro[posicao] || tabuleiro[posicao].jogador !== jogadorAtual)) {
        // Mover a peça
        const pecaAtacante = tabuleiro[celulaSelecionada];
        const pecaDefensora = tabuleiro[posicao];

        if (pecaAtacante) {
          const novoTabuleiro = { ...tabuleiro };

          if (pecaDefensora) {
            // Guarde a origem ANTES de limpar a seleção
            const origemSel = celulaSelecionada;

            // LIGA o modo de combate ANTES de revelar
            setCombateAtivo(true);

            // Revela as duas casas envolvidas no combate
            setRevealCombate({ origem: origemSel, destino: posicao });

            // (Opcional, ajuda em outros efeitos visuais)
            setPecaRevelada(posicao);

            // Registrar último lance (para highlight)
            setUltimoMovimento({ origem: origemSel, destino: posicao, tipo: 'combate' });

            // Limpar seleção e movimentos imediatamente antes do combate
            setCelulaSelecionada(null);
            setMovimentosValidos([]);

            // Resolve o combate DEPOIS da janela de revelação
            setTimeout(() => {
              executarCombate(pecaAtacante, pecaDefensora, posicao, novoTabuleiro, origemSel);
            }, 1500);

            return; // Para aqui e espera o setTimeout

          } else {
            // Movimento normal para célula vazia - iniciar animação
            setUltimoMovimento({ origem: celulaSelecionada, destino: posicao, tipo: 'move' });
            setAnimandoMovimento(true);
            setDadosAnimacao({
              origem: celulaSelecionada,
              destino: posicao,
              peca: pecaAtacante
            });

            // Limpar seleção imediatamente
            setCelulaSelecionada(null);
            setMovimentosValidos([]);

            // Executar movimento após animação
            setTimeout(() => {
              novoTabuleiro[posicao] = pecaAtacante;
              delete novoTabuleiro[celulaSelecionada];
              setTabuleiro(novoTabuleiro);

              // Aguardar um pouco para ver o resultado
              setTimeout(() => {
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
                setAnimandoMovimento(false);
                setDadosAnimacao(null);
              }, 1500);
            }, 500); // Duração da animação
          }

        }
        setCelulaSelecionada(null);

      } else {
        if (!saoAdjacentes(celulaSelecionada, posicao)) {
          console.log('Movimento não permitido - não é adjacente');
          setMensagem('Movimento não permitido - não é adjacente');
        } else if (isAgua(posicao)) {
          console.log('Movimento não permitido - não pode ir na água');
          setMensagem('Movimento não permitido - não pode ir na água');
        } else if (tabuleiro[posicao]) {
          console.log('Movimento não permitido - célula ocupada');
          setMensagem('Movimento não permitido - célula ocupada');
        }
        setCelulaSelecionada(null);
      }
    } else {
      // Selecionar/desselecionar célula
      if (celulaSelecionada === posicao) {
        setCelulaSelecionada(null);
        setMovimentosValidos([]);
      } else {
        setCelulaSelecionada(posicao);
        if (tabuleiro[posicao] && tabuleiro[posicao].jogador === jogadorAtual) {
          setMovimentosValidos(calcularMovimentosValidos(posicao));
        } else {
          setMovimentosValidos([]);
        }
      }
    }
  };

  // FUNÇÃO Executa um movimento da IA sem simular cliques na UI
  const executarMovimentoDiretoIA = (origem, destino) => {
    try {
      const atacante = tabuleiro[origem];
      if (!atacante) {
        console.warn('[IA] Origem vazia, cancelando movimento.');
        finalizarMovimentoIA();
        return;
      }

      // Regra básica: destino não pode ser água; movimento deve ser válido
      if (isAgua(destino) || !movimentoValido(origem, destino, atacante)) {
        console.warn('[IA] Movimento inválido (água ou regra de movimento).', { origem, destino, atacante });
        finalizarMovimentoIA();
        return;
      }

      const defensor = tabuleiro[destino];
      const novoTabuleiro = { ...tabuleiro };

      // Combate
      if (defensor && defensor.jogador !== atacante.jogador) {
        // Mostrar ultimo movimento
        setUltimoMovimento({ origem, destino, tipo: 'combate' });
        // Revelar atacante e defensor para todos
        setRevealCombate({ origem, destino });
        setCombateAtivo(true);
        setPecaRevelada(destino);

        // Atualiza a contagem da aresta usada
        const chaveA = edgeKey(origem, destino);
        setArestaRepetida(prev =>
          prev && prev.chave === chaveA
            ? { chave: chaveA, cont: prev.cont + 1 }
            : { chave: chaveA, cont: 1 }
        );

        //  alimentar memória
        registrarHistoricoIA(origem, destino, atacante);
        incrementarVisita(destino);

        // Pequena pausa para "revelar" e então resolver combate
        setTimeout(() => {
          executarCombate(atacante, defensor, destino, novoTabuleiro, origem);
          // executarCombate troca o turno e chama finalizarMovimentoIA() se for IA
        }, 500);

        return;
      }

      // Célula vazia — animação e move
      if (!defensor) {
        // Mostrar ultimo movimento
        setUltimoMovimento({ origem, destino, tipo: 'move' });
        setAnimandoMovimento(true);
        setDadosAnimacao({ origem, destino, peca: atacante });

        setTimeout(() => {
          novoTabuleiro[destino] = atacante;
          delete novoTabuleiro[origem];
          setTabuleiro(novoTabuleiro);

          // Atualiza a contagem da aresta usada
          const chaveB = edgeKey(origem, destino);
          setArestaRepetida(prev =>
            prev && prev.chave === chaveB
              ? { chave: chaveB, cont: prev.cont + 1 }
              : { chave: chaveB, cont: 1 }
          );

          // alimentar memória
          registrarHistoricoIA(origem, destino, atacante);
          incrementarVisita(destino);


          setTimeout(() => {
            // Troca de turno
            const novoJogador = "Azul";
            if (modoJogo === 'ia' && jogadorAtual === 'Vermelho') {
              finalizarMovimentoIA();
            }
            setJogadorAtual(novoJogador);
            // Não mostra popup quando é movimento da IA
            setAnimandoMovimento(false);
            setDadosAnimacao(null);
          }, 500);
        }, 300);

        return;
      }

      // Célula ocupada pelo próprio (não move)
      console.warn('[IA] Destino tem peça própria, cancelando movimento.');
      finalizarMovimentoIA();

    } catch (e) {
      console.error('[IA] Erro ao executar movimento direto:', e);
      finalizarMovimentoIA();
    }
  };


  // FUNÇÃO: Verificar se há peça vermelha na posição
  const temPecaVermelha = (posicao) => {
    return tabuleiro[posicao]?.jogador === "Vermelho";
  };

  // FUNÇÃO: Verificar se há peça azul na posição  
  const temPecaAzul = (posicao) => {
    return tabuleiro[posicao]?.jogador === "Azul";
  };

  // 🌟 FUNÇÃO: Determinar o estilo da célula (selecionada ou não)
  const getCellStyle = (posicao) => {

    const baseSelecionada = (celulaSelecionada === posicao)
      ? {
        outline: '3px solid #DFD0B8',
        outlineOffset: '-3px'
      }
      : {};

    if (combateAtivo && pecaRevelada === posicao) {
      // Descobrir qual jogador é dono da peça revelada
      const pecaReveladaInfo = tabuleiro[pecaRevelada];
      const corJogador = pecaReveladaInfo?.jogador === "Vermelho" ?
        'linear-gradient(135deg, #e74c3c, #c0392b)' :
        'linear-gradient(135deg, #3498db, #2980b9)';

      const corBorda = pecaReveladaInfo?.jogador === "Vermelho" ? '#c0392b' : '#2980b9';

      return {
        animation: 'revealPiece .5s ease-in-out',
        transform: 'scale(1.2)',
        background: `${corJogador} !important`,
        border: `3px solid ${corBorda} !important`,
        boxShadow: `0 0 20px ${pecaReveladaInfo?.jogador === "Vermelho" ? 'rgba(231, 76, 60, 0.6)' : 'rgba(52, 152, 219, 0.6)'}`,
        zIndex: 9999,
        position: 'relative'
      };
    }

    // Destacar peça selecionada no tabuleiro durante configuração
    if (faseJogo === 'configuracao' && pecaSelecionadaNoTabuleiro === posicao) {
      const corFundo = temPecaVermelha(posicao)
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
      if (temPecaVermelha(posicao)) {
        corFundo = 'linear-gradient(135deg, #e74c3c, #c0392b)';
      } else if (temPecaAzul(posicao)) {
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
    if (temPecaVermelha(posicao)) {
      return { ...baseSelecionada, background: 'linear-gradient(135deg, #e74c3c, #c0392b)' };
    }
    if (temPecaAzul(posicao)) {
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

  // 🎯 FUNÇÃO: Mostrar qual peça está numa célula
  const getPeca = (posicao) => {
    const peca = tabuleiro[posicao];
    if (!peca) return '';

    // Durante combate, SEMPRE mostrar as peças das duas casas envolvidas
    if (
      combateAtivo &&
      (posicao === revealCombate.origem || posicao === revealCombate.destino)
    ) {
      // Layout especial para peças com patentes
      if (rankNum(peca.numero) === 1) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
            <span className="number-corner">1</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 2) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
            <span className="number-corner">2</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 3) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
            <span className="number-corner">3</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 4) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
            <span className="number-corner">4</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 5) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
            <span className="number-corner">5</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 6) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
            <span className="number-corner">6</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 7) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
            <span className="number-corner">7</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 8) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
            <span className="number-corner">8</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 9) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
            <span className="number-corner">9</span>
          </div>
        );
      } else if (rankNum(peca.numero) === 10) {
        return (
          <div className="piece-layout-2">
            <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
            <span className="number-corner">10</span>
          </div>
        );
      } else {
        return peca.numero;
      }
    }


    // Durante configuração, controle de visibilidade
    if (faseJogo === 'configuracao') {
      // No modo IA, NUNCA mostrar as peças Vermelhas (IA) — sempre “de costas”
      if (modoJogo === 'ia') {
        if (peca.jogador === 'Vermelho') {
          return (
            <FontAwesomeIcon
              icon={faWebAwesome}
              className="piece-back vermelho"
              style={{ transition: 'none' }}
            />
          );
        }
        // Peças Azuis (humano): mostra quando for o turno dele configurar
        return peca.jogador === jogadorAtual
          ? (rankNum(peca.numero) === 1 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
              <span className="number-corner">1</span>
            </div>
          ) : rankNum(peca.numero) === 2 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
              <span className="number-corner">2</span>
            </div>
          ) : rankNum(peca.numero) === 3 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
              <span className="number-corner">3</span>
            </div>
          ) : rankNum(peca.numero) === 4 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
              <span className="number-corner">4</span>
            </div>
          ) : rankNum(peca.numero) === 5 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
              <span className="number-corner">5</span>
            </div>
          ) : rankNum(peca.numero) === 6 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
              <span className="number-corner">6</span>
            </div>
          ) : rankNum(peca.numero) === 7 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
              <span className="number-corner">7</span>
            </div>
          ) : rankNum(peca.numero) === 8 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
              <span className="number-corner">8</span>
            </div>
          ) : rankNum(peca.numero) === 9 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
              <span className="number-corner">9</span>
            </div>
          ) : rankNum(peca.numero) === 10 ? (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
              <span className="number-corner">10</span>
            </div>
          ) : peca.numero)
          : (
            <FontAwesomeIcon
              icon={faWebAwesome}
              className="piece-back azul"
              style={{ transition: 'none' }}
            />
          );
      }

      // Modo local (sem IA)
      if (peca.jogador === jogadorAtual) {
        // Layout especial para peças com patentes
        if (rankNum(peca.numero) === 1) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
              <span className="number-corner">1</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 2) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
              <span className="number-corner">2</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 3) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
              <span className="number-corner">3</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 4) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
              <span className="number-corner">4</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 5) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
              <span className="number-corner">5</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 6) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
              <span className="number-corner">6</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 7) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
              <span className="number-corner">7</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 8) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
              <span className="number-corner">8</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 9) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
              <span className="number-corner">9</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 10) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
              <span className="number-corner">10</span>
            </div>
          );
        } else {
          return peca.numero;
        }
      } else {
        return (
          <FontAwesomeIcon
            icon={faWebAwesome}
            className={`piece-back ${peca.jogador === 'Vermelho' ? 'vermelho' : 'azul'}`}
          />
        );
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
        return (
          <FontAwesomeIcon
            icon={faWebAwesome}
            className={`piece-back ${peca.jogador === "Vermelho" ? "vermelho" : "azul"}`}
            style={{ transition: 'none' }} // Remove transição para evitar flash
          />
        );
      }
    }

    // Durante combate, mostrar a peça que está sendo revelada
    if (combateAtivo && pecaRevelada === posicao) {
      return peca.numero; // Mostra a peça inimiga sendo revelada
    }

    // Durante o jogo contra IA, só mostrar peças do jogador humano
    if (modoJogo === 'ia') {

      if (peca.jogador === "Azul") {
        // Layout especial para peças com patentes
        if (rankNum(peca.numero) === 1) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
              <span className="number-corner">1</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 2) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
              <span className="number-corner">2</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 3) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
              <span className="number-corner">3</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 4) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
              <span className="number-corner">4</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 5) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
              <span className="number-corner">5</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 6) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
              <span className="number-corner">6</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 7) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
              <span className="number-corner">7</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 8) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
              <span className="number-corner">8</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 9) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
              <span className="number-corner">9</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 10) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
              <span className="number-corner">10</span>
            </div>
          );
        } else {
          return peca.numero;
        }
      } else {
        return (
          <FontAwesomeIcon
            icon={faWebAwesome}
            className={`piece-back ${peca.jogador === "Vermelho" ? "vermelho" : "azul"}`}
          />
        ); // Ícone vermelho escuro para peças da IA
      }
    } else {
      // Modo local - mostrar peças do jogador atual
      if (peca.jogador === jogadorAtual) {
        // Layout especial para peças com patentes
        if (rankNum(peca.numero) === 1) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
              <span className="number-corner">1</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 2) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
              <span className="number-corner">2</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 3) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
              <span className="number-corner">3</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 4) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
              <span className="number-corner">4</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 5) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
              <span className="number-corner">5</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 6) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
              <span className="number-corner">6</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 7) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
              <span className="number-corner">7</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 8) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
              <span className="number-corner">8</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 9) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
              <span className="number-corner">9</span>
            </div>
          );
        } else if (rankNum(peca.numero) === 10) {
          return (
            <div className="piece-layout-2">
              <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
              <span className="number-corner">10</span>
            </div>
          );
        } else {
          return peca.numero;
        }
      } else {
        return (
          <FontAwesomeIcon
            icon={faWebAwesome}
            className={`piece-back ${peca.jogador === "Vermelho" ? "vermelho" : "azul"}`}
          />
        );
      }
    }
  };

  // 📏 FUNÇÃO: Verificar se duas células são adjacentes
  const saoAdjacentes = (pos1, pos2) => {
    const linha1 = pos1[0];
    const col1 = parseInt(pos1[1]);
    const linha2 = pos2[0];
    const col2 = parseInt(pos2[1]);

    const difLinha = Math.abs(linha1.charCodeAt(0) - linha2.charCodeAt(0));
    const difCol = Math.abs(col1 - col2);


    const resultado = (difLinha === 1 && difCol === 0) || (difLinha === 0 && difCol === 1);

    return resultado;
  };

  // FUNÇÃO: Validar movimento considerando regras especiais
  const movimentoValido = (posInicial, posDestino, peca) => {
    // Batedores (número 2) podem se mover em linha reta múltiplas casas
    if (rankNum(peca?.numero) === 2) {
      return movimentoBatedor(posInicial, posDestino);
    }

    // Todas as outras peças só podem se mover para células adjacentes
    return saoAdjacentes(posInicial, posDestino);
  };

  // FUNÇÃO: Verificar movimento válido para batedores
  const movimentoBatedor = (posInicial, posDestino) => {
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

  // FUNÇÃO: Verificar se o caminho entre duas posições está livre
  const caminhoLivre = (posInicial, posDestino, tabuleiroAtual) => {
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

  // FUNÇÃO: Calcular movimentos válidos para uma peça
  const calcularMovimentosValidos = (posicao, tabuleiroAtual = tabuleiro) => {
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
  // Retorna true se tem movimentos possíveis, false se está imobilizado
  const jogadorTemMovimentosValidos = (jogador, tabuleiroAtual = tabuleiro) => {
    const pecasMoveis = Object.entries(tabuleiroAtual).filter(([pos, p]) => {
      if (!p || p.jogador !== jogador) return false;
      if (pecaImovel(p.numero)) return false;
      const movimentos = calcularMovimentosValidos(pos, tabuleiroAtual);
      return movimentos.length > 0;
    });
    return pecasMoveis.length > 0;
  };


  // FUNÇÃO: Finalizar movimento da IA e limpar estados
  // Esta função é chamada sempre que a IA termina um movimento (com sucesso ou erro)
  const finalizarMovimentoIA = () => {

    // Limpa todos os estados relacionados ao movimento da IA
    setMovimentoIAEmAndamento(false);     // Permite que a IA faça outro movimento no futuro
    setEstadoIA(prev => ({ ...prev, pensando: false })); // Para de mostrar "IA pensando..."
    setCelulaSelecionada(null);           // Remove seleção de peça
    setMovimentosValidos([]);             // Limpa movimentos destacados no tabuleiro
    // Limpar estados de drag também
    setDraggedPiece(null);
    setDragSourcePosition(null);
    setIsDragging(false);
  };

  // FUNÇÃO: Helpers de memória de IA
  // Registra o último lance da IA para evitar “vai-e-volta”
  const registrarHistoricoIA = (origem, destino, peca) => {
    setHistoricoIA(prev => {
      const novo = [...prev, { origem, destino, peca: peca?.numero ?? null, ts: Date.now() }];
      // Mantem no max. 8 entradas para poupar memória
      return novo.slice(-8);
    });
  };

  // Conta visitas a casas (punição por “passear” no mesmo lugar)
  const incrementarVisita = (pos) => {
    setVisitasIA(prev => {
      const qtd = (prev[pos] || 0) + 1;
      return { ...prev, [pos]: qtd };
    });
  };

  // Penaliza voltar para a casa anterior e ficar rondando casas já muito visitadas
  const penalizacaoRepeticao = (origem, destino) => {
    let penalidade = 0;

    // Evitar “desfazer” imediatamente o último lance (origem<-destino do lance anterior)
    if (ultimoMovimento && ultimoMovimento.origem === destino && ultimoMovimento.destino === origem) {
      penalidade -= 120; // forte punição para não “voltar”
    }

    // Evitar casas muito visitadas
    const visitas = visitasIA[destino] || 0;
    if (visitas >= 3) penalidade -= 10 * visitas; // -30 a partir de 3 visitas, -40 a partir de 4, etc.

    return penalidade;
  };

  // FUNÇÃO: IA faz movimento automático
  const movimentoIA = () => {

    // Verifica se já há um movimento em andamento para evitar conflitos
    if (movimentoIAEmAndamento) {
      return;
    }

    // Marca que a IA está fazendo um movimento
    setMovimentoIAEmAndamento(true);
    setEstadoIA(prev => ({ ...prev, pensando: true }));

    // Aguarda 1 segundo para simular "pensamento" da IA
    setTimeout(() => {
      try {
        const estrategia = analisarSituacao();
        const melhorMovimento = escolherMelhorMovimento(estrategia);

        if (melhorMovimento) {

          // Executa diretamente o movimento da IA
          executarMovimentoDiretoIA(melhorMovimento.origem, melhorMovimento.destino);


        } else {
          finalizarMovimentoIA(); // Finaliza em caso de erro
        }
      } catch (error) {
        console.error('Erro na IA:', error);
        finalizarMovimentoIA(); // Finaliza em caso de erro
      }
    }, 1000);
  };

  // Analisar situação do jogo
  const analisarSituacao = () => {
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

  // Escolher melhor movimento baseado na estratégia
  const escolherMelhorMovimento = (estrategia) => {
    const pecasMoveis = Object.entries(tabuleiro).filter(([pos, peca]) =>
      peca?.jogador === "Vermelho" && !pecaImovel(peca.numero)
    );


    let movimentosCandidatos = [];

    pecasMoveis.forEach(([origem, peca]) => {
      const movimentosValidos = calcularMovimentosValidos(origem, tabuleiro);

      movimentosValidos.forEach(destino => {
        const prioridade = calcularPrioridadeMovimento(origem, destino, peca, estrategia);
        movimentosCandidatos.push({ origem, destino, peca, prioridade });
      });
    });

    // Ordena por prioridade
    movimentosCandidatos.sort((a, b) => b.prioridade - a.prioridade);

    if (movimentosCandidatos.length > 0) {
      return movimentosCandidatos[0];
    }

    //FALLBACK: tenta um movimento adjacente seguro para NÃO travar
    console.warn('[IA] nenhum movimento “inteligente” encontrado; tentando fallback...');
    for (const [origem, peca] of pecasMoveis) {
      const candidatosAdj = calcularMovimentosValidos(origem, tabuleiro);
      if (candidatosAdj.length > 0) {
        return { origem, destino: candidatosAdj[0], peca, prioridade: 0 };
      }
    }

    console.error('[IA] nem fallback disponível — sem lances!');
    return null;
  };


  // Calcular prioridade do movimento
  const calcularPrioridadeMovimento = (origem, destino, peca, estrategia) => {
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

    // penalização por repetição/volta e “passeios” em casas já batidas
    prioridade += penalizacaoRepeticao(origem, destino);

    // EVITAR movimentos perigosos
    const pecasAdjacentesDestino = obterPecasAdjacentes(destino);
    pecasAdjacentesDestino.forEach(([pos, pecaAdjacente]) => {
      if (pecaAdjacente?.jogador === "Azul" && Number(pecaAdjacente.numero) > Number(peca.numero)) {
        prioridade -= 60; // Evitar ficar perto de peças mais fortes
      }
    });

    // Penaliza usar a mesma aresta 3+ vezes seguidas (e desestimula a 2ª)
    prioridade += penalizacaoCicloAresta(origem, destino);

    return prioridade;

  };

  // Simular resultado de combate
  const simularCombate = (atacante, defensor) => {
    const a = rankNum(atacante.numero);
    const d = rankNum(defensor.numero);

    // Assassino (1) ataca Marechal (10)
    if (a === 1 && d === 10) return 'vitoria';

    // Bomba
    if (defensor.numero === '💣' || (React.isValidElement(defensor.numero) && defensor.numero.props?.icon === faBomb)) {
      if (a === 3) return 'vitoria'; // desarmador desarma bomba
      return 'derrota';
    }

    if (a > d) return 'vitoria';
    if (a < d) return 'derrota';
    return 'empate';
  };

  // Obter peças adjacentes a uma posição
  const obterPecasAdjacentes = (posicao) => {
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

  // FUNÇÃO: Normaliza a aresta como chave sem direção (A5<->A6 vira "A5-A6" sempre)
  const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

  // Penaliza quando a IA tenta usar a MESMA aresta pela 3ª vez consecutiva
  // Regras: 1ª vez (cont=1) OK; 2ª vez (cont=2) OK; 3ª+ (cont>=2 tentando de novo) PUNE forte
  const penalizacaoCicloAresta = (origem, destino) => {
    if (!arestaRepetida || !arestaRepetida.chave) return 0;
    const chave = edgeKey(origem, destino);

    if (arestaRepetida.chave !== chave) return 0;         // aresta diferente, sem penalização

    if (arestaRepetida.cont >= 2) return -500;            // 3ª vez ou mais -> bloqueia forte
    if (arestaRepetida.cont === 1) return -30;            // 2ª vez -> permite, mas desestimula um pouco
    return 0;                                             // 1ª vez -> livre
  };

  // FUNÇÃO: Verificar se todas as peças foram colocadas no tabuleiro
  const validarConfiguracaoCompleta = (jogador) => {
    const pecasRestantes = Object.values(pecasDisponiveis[jogador]).reduce((total, qtd) => total + qtd, 0);
    return pecasRestantes === 0;
  };

  // FUNÇÃO: Contar quantas peças faltam ser colocadas
  const contarPecasRestantes = (jogador) => {
    return Object.values(pecasDisponiveis[jogador]).reduce((total, qtd) => total + qtd, 0);
  };

  const posicionarPecasIA = () => {

    // Escolher estratégia aleatória
    const estrategias = ['defensiva', 'ofensiva', 'balanceada', 'decoy'];
    const estrategiaEscolhida = estrategias[Math.floor(Math.random() * estrategias.length)];


    const tabuleiroNovo = {};

    // Posições possíveis para bandeira (sempre linha A para proteção)
    const posicoesSegurasBandeira = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    const posicaoBandeira = posicoesSegurasBandeira[Math.floor(Math.random() * posicoesSegurasBandeira.length)];

    if (estrategiaEscolhida === 'defensiva') {
      // ESTRATÉGIA DEFENSIVA - Bandeira super protegida
      tabuleiroNovo[posicaoBandeira] = { numero: <FontAwesomeIcon icon={faFlag} className="flag-icon" />, jogador: 'Vermelho' };

      // Proteger bandeira com todas as bombas possíveis
      const protecoesBandeira = obterPosicoesAdjacentes(posicaoBandeira);
      protecoesBandeira.slice(0, 3).forEach(pos => {
        tabuleiroNovo[pos] = { numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />, jogador: 'Vermelho' };
      });

      // Mais 3 bombas em pontos estratégicos
      const bombasExtras = ['A0', 'A9', 'B1'];
      bombasExtras.forEach(pos => {
        if (!tabuleiroNovo[pos]) tabuleiroNovo[pos] = { numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />, jogador: 'Vermelho' };
      });

      // Peças altas protegidas na linha A
      const posicoesLivresA = ['A1', 'A2', 'A3', 'A7', 'A8'].filter(pos => !tabuleiroNovo[pos]);
      if (posicoesLivresA[0]) tabuleiroNovo[posicoesLivresA[0]] = { numero: 10, jogador: 'Vermelho' };
      if (posicoesLivresA[1]) tabuleiroNovo[posicoesLivresA[1]] = { numero: 9, jogador: 'Vermelho' };

      // Completar TODAS as posições restantes
      const todasAsPecas = [<FontAwesomeIcon icon={faFlag} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, 10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 1];
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

      // Embaralhar ambos os arrays
      for (let i = pecasRestantes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
      }

      for (let i = posicoesVazias.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
      }

      // Preencher posições vazias
      pecasRestantes.forEach((peca, index) => {
        if (posicoesVazias[index]) {
          tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
        }
      });

    } else if (estrategiaEscolhida === 'ofensiva') {
      // ESTRATÉGIA OFENSIVA - Ataque agressivo
      tabuleiroNovo[posicaoBandeira] = { numero: <FontAwesomeIcon icon={faFlag} className="flag-icon" />, jogador: 'Vermelho' };

      // Apenas 2 bombas protegendo bandeira
      const protecoesBandeira = obterPosicoesAdjacentes(posicaoBandeira);
      protecoesBandeira.slice(0, 2).forEach(pos => {
        tabuleiroNovo[pos] = { numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />, jogador: 'Vermelho' };
      });

      // Peças altas na FRENTE (linha D)
      tabuleiroNovo['D4'] = { numero: 10, jogador: 'Vermelho' }; // Marechal na frente
      tabuleiroNovo['D5'] = { numero: 9, jogador: 'Vermelho' };  // General na frente
      tabuleiroNovo['D3'] = { numero: 8, jogador: 'Vermelho' };
      tabuleiroNovo['D6'] = { numero: 8, jogador: 'Vermelho' };

      // Mais bombas espalhadas
      const bombasOfensivas = ['A0', 'A9', 'B0', 'D0'];
      bombasOfensivas.forEach(pos => {
        if (!tabuleiroNovo[pos]) tabuleiroNovo[pos] = { numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />, jogador: 'Vermelho' };
      });

      // Completar TODAS as posições restantes
      const todasAsPecas = [<FontAwesomeIcon icon={faFlag} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, 10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 1];
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

      // Embaralhar ambos os arrays
      for (let i = pecasRestantes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
      }

      for (let i = posicoesVazias.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
      }

      // Preencher posições vazias
      pecasRestantes.forEach((peca, index) => {
        if (posicoesVazias[index]) {
          tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
        }
      });

    } else if (estrategiaEscolhida === 'balanceada') {
      // ESTRATÉGIA BALANCEADA
      tabuleiroNovo[posicaoBandeira] = { numero: <FontAwesomeIcon icon={faFlag} className="flag-icon" />, jogador: 'Vermelho' };

      // 3 bombas protegendo bandeira
      const protecoesBandeira = obterPosicoesAdjacentes(posicaoBandeira);
      protecoesBandeira.slice(0, 3).forEach(pos => {
        tabuleiroNovo[pos] = { numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />, jogador: 'Vermelho' };
      });

      // Peças altas balanceadas entre linha A e B
      const posicoesLivresA = ['A0', 'A1', 'A8', 'A9'].filter(pos => !tabuleiroNovo[pos]);
      if (posicoesLivresA[0]) tabuleiroNovo[posicoesLivresA[0]] = { numero: 10, jogador: 'Vermelho' };
      tabuleiroNovo['B2'] = { numero: 9, jogador: 'Vermelho' };

      // Bombas extras balanceadas
      const bombasBalanceadas = ['A0', 'D1', 'D8'];
      bombasBalanceadas.forEach(pos => {
        if (!tabuleiroNovo[pos]) tabuleiroNovo[pos] = { numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />, jogador: 'Vermelho' };
      });

      // Completar TODAS as posições restantes
      const todasAsPecas = [<FontAwesomeIcon icon={faFlag} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, 10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 1];
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

      // Embaralhar ambos os arrays
      for (let i = pecasRestantes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
      }

      for (let i = posicoesVazias.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
      }

      // Preencher posições vazias
      pecasRestantes.forEach((peca, index) => {
        if (posicoesVazias[index]) {
          tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
        }
      });
    } else if (estrategiaEscolhida === 'decoy') {
      // ESTRATÉGIA DECOY - Bandeira na frente (blefe)
      const posicoesDecoy = ['D4', 'D5', 'D6'];
      const posicaoBandeira = posicoesDecoy[Math.floor(Math.random() * posicoesDecoy.length)];

      tabuleiroNovo[posicaoBandeira] = { numero: <FontAwesomeIcon icon={faFlag} className="flag-icon" />, jogador: 'Vermelho' };

      // Bombas na linha A (proteção real)
      const bombasDecoy = ['A0', 'A1', 'A8', 'A9', 'B0', 'B9'];
      bombasDecoy.forEach(pos => {
        if (!tabuleiroNovo[pos]) tabuleiroNovo[pos] = { numero: <FontAwesomeIcon icon={faBomb} className="bomb-icon" />, jogador: 'Vermelho' };
      });

      // Peças fortes ao redor da bandeira falsa
      const adjacentes = obterPosicoesAdjacentes(posicaoBandeira);
      if (adjacentes[0]) tabuleiroNovo[adjacentes[0]] = { numero: 10, jogador: 'Vermelho' };
      if (adjacentes[1]) tabuleiroNovo[adjacentes[1]] = { numero: 9, jogador: 'Vermelho' };

      // Completar o resto
      const todasAsPecas = [<FontAwesomeIcon icon={faFlag} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, <FontAwesomeIcon icon={faBomb} />, 10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 1];
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

      for (let i = pecasRestantes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pecasRestantes[i], pecasRestantes[j]] = [pecasRestantes[j], pecasRestantes[i]];
      }

      for (let i = posicoesVazias.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posicoesVazias[i], posicoesVazias[j]] = [posicoesVazias[j], posicoesVazias[i]];
      }

      pecasRestantes.forEach((peca, index) => {
        if (posicoesVazias[index]) {
          tabuleiroNovo[posicoesVazias[index]] = { numero: peca, jogador: 'Vermelho' };
        }
      });
    }


    setTabuleiro(tabuleiroNovo);
    setPecasDisponiveis(prev => ({
      ...prev,
      Vermelho: {
        10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
        'bomba': 0, 'bandeira': 0
      }
    }));
  };

  // Função auxiliar para obter posições adjacentes
  const obterPosicoesAdjacentes = (posicao) => {
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

  // FUNÇÃO: Detectar quando é vez da IA
  useEffect(() => {

    // Só executa se TODAS as condições estão corretas E não há movimento em andamento
    // Isso evita que a IA tente fazer vários movimentos ao mesmo tempo
    if (
      modoJogo === 'ia' &&
      jogadorAtual === "Vermelho" &&
      faseJogo === 'jogando' &&
      !estadoIA.pensando &&
      !movimentoIAEmAndamento &&  // evita movimento duplo
      !animandoMovimento &&       // aguarda animação terminar
      !combateAtivo &&
      !mostrarTrocaTurno          // BLOQUEIA IA com o pop-up aberto
    ) {
      movimentoIA();
    }
  }, [jogadorAtual, faseJogo, modoJogo, estadoIA.pensando, movimentoIAEmAndamento, animandoMovimento, combateAtivo, mostrarTrocaTurno]);

  // FUNÇÃO: Gerar código de sala aleatório
  const gerarCodigoSala = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // FUNÇÃO: Criar sala nova
  const criarSala = async () => {
    try {
      const codigo = gerarCodigoSala();
      const jogadorId = Date.now().toString();

      const salaRef = ref(database, `salas/${codigo}`);
      await set(salaRef, {
        host: jogadorId,
        jogadores: {
          [jogadorId]: {
            nome: 'Jogador 1',
            cor: 'Vermelho',
            pronto: false
          }
        },
        estado: 'aguardando',
        tabuleiro: {},
        jogadorAtual: 'Vermelho',
        faseJogo: 'configuracao'
      });

      setEstadoOnline({
        sala: codigo,
        conectado: true,
        jogadorHost: true
      });
      setJogadorOnlineId(jogadorId);
      setModoJogo('online');
      setAguardandoJogador(true);

      // Mostrar tela especial com código
      setTelaSalaCriada(true);

    } catch (error) {
      setErroConexao('Erro ao criar sala: ' + error.message);
    }
  };

  // FUNÇÃO: Entrar em sala existente
  const entrarNaSala = async () => {
    if (!codigoSala.trim()) {
      setErroConexao('Digite um código de sala');
      return;
    }

    try {
      const jogadorId = Date.now().toString();
      const salaRef = ref(database, `salas/${codigoSala}`);

      // Verificar se a sala existe
      onValue(salaRef, (snapshot) => {
        const salaData = snapshot.val();
        if (!salaData) {
          setErroConexao('Sala não encontrada');
          return;
        }

        // Adicionar segundo jogador
        const jogadoresRef = ref(database, `salas/${codigoSala}/jogadores/${jogadorId}`);
        set(jogadoresRef, {
          nome: 'Jogador 2',
          cor: 'Azul',
          pronto: false
        });

        setEstadoOnline({
          sala: codigoSala,
          conectado: true,
          jogadorHost: false
        });
        setJogadorOnlineId(jogadorId);
        setModoJogo('online');
        setMensagem(`Conectado à sala: ${codigoSala}`);
      }, { onlyOnce: true });
      // Ler UMA VEZ o estado da sala
      const snap = await get(salaRef);
      const salaData = snap.val();
      if (!salaData) {
        setErroConexao('Sala não encontrada');
        return;
      }
      // (opcional) Checar se já tem 2 jogadores
      const totalJogadores = salaData.jogadores ? Object.keys(salaData.jogadores).length : 0;
      if (totalJogadores >= 2) {
        setErroConexao('Sala cheia');
        return;
      }

      // Adicionar este jogador
      const jogadoresRef = ref(database, `salas/${codigoSala}/jogadores/${jogadorId}`);
      await set(jogadoresRef, {
        nome: 'Jogador 2',
        cor: 'Azul',
        pronto: false
      });

      setEstadoOnline({
        sala: codigoSala,
        conectado: true,
        jogadorHost: false
      });
      setJogadorOnlineId(jogadorId);
      setModoJogo('online');
      setMensagem(`Conectado à sala: ${codigoSala}`);
      // FECHA MODAL E LIMPA CAMPOS
      setMostrarModalOnline(false);
      setErroConexao('');
      setCodigoSala('');
      // Vai para a tela de configuração (host começa Vermelho)
      setFaseJogo('configuracao');
      setJogadorAtual('Vermelho');

    } catch (error) {
      setErroConexao('Erro ao entrar na sala: ' + error.message);
    }
  };

  return (
    <div>

      {/* AVISO PARA ROTACIONAR DISPOSITIVO */}
      {orientacao === 'portrait' && window.innerWidth <= 768 && (
        <div className="rotate-device-warning">
          <div>
            <h2>Rotacione seu dispositivo</h2>
            <p>Este jogo foi otimizado para modo paisagem</p>
            <div style={{ fontSize: '3rem', margin: '20px' }}>↻</div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <span className="brand">Stratego</span>
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={abrirRegras}>Regras</button>
          <button className="icon-btn" onClick={handleRestart} aria-label="Reiniciar">
            {/* Ícone restart (SVG) */}
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-9.9 1h-2.1A7.1 7.1 0 0 0 12 20a7 7 0 0 0 0-14z" />
            </svg>
          </button>
        </div>
      </nav>

      {modoJogo === 'online' && aguardandoJogador && (
        <div className="online-wait" style={{ textAlign: 'center', marginTop: '8px', color: '#DFD0B8' }}>
          Aguardando outro jogador se conectar...
        </div>
      )}


      <h1 className="game-title"><FontAwesomeIcon
        icon={faWebAwesome} /> STRATEGO <FontAwesomeIcon
          icon={faWebAwesome} /></h1>

      {/* INDICADORES DE MODO E IA */}
      {modoJogo !== 'menu' && (
        <>
          <div className="modo-indicador">
            Modo: {modoJogo === 'local' ? '2 Jogadores Local' : modoJogo === 'ia' ? 'Contra IA' : 'Online'}
            {modoJogo === 'ia' && ` - Dificuldade: ${estadoIA.dificuldade}`}
          </div>

          {modoJogo === 'ia' && estadoIA.pensando && (
            <div className="ia-status">
              <div className="ia-pensando">IA pensando...</div>
            </div>
          )}
        </>
      )}

      {/* MENU DE SELEÇÃO DE MODO */}
      {modoJogo === 'menu' && (
        <div className="menu-container">
          <h2 className="menu-title">Escolha o Modo de Jogo</h2>

          <button
            className="menu-button"
            onClick={() => {
              setModoJogo('local');
              setFaseJogo('configuracao');
            }}
          >
            2 Jogadores Local
          </button>

          <button
            className="menu-button"
            onClick={() => {
              setModoJogo('ia');
              setTabuleiro({}); // Limpar tabuleiro
              setMensagem('IA posicionando peças...');

              setTimeout(() => {
                posicionarPecasIA();
                setJogadorAtual("Azul");
                setFaseJogo('configuracao');
                setMensagem('Posicione suas peças no território azul (linhas G-J)');
              }, 500);
            }}
          >
            Contra IA
          </button>

          <button
            className="menu-button"
            onClick={() => {
              setMostrarModalOnline(true); // só abre o modal
            }}
          >
            Jogar Online
          </button>

        </div>
      )
      }

      {/* MODAL ONLINE */}
      {
        mostrarModalOnline && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Jogo Online">
            <div className="modal">
              <header className="modal-header">
                <h3>Jogo Online</h3>
                <button
                  className="close-btn"
                  onClick={() => {
                    setMostrarModalOnline(false);
                    setErroConexao('');
                    setCodigoSala('');
                  }}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </header>
              <div className="modal-content">
                <div className="online-section">
                  <h4>Entrar em uma Sala</h4>
                  <div className="online-inputs">
                    <input
                      type="text"
                      placeholder="Digite o código da sala"
                      value={codigoSala}
                      onChange={(e) => setCodigoSala(e.target.value.toUpperCase())}
                      className="sala-input"
                      maxLength={6}
                    />
                    <button
                      className="nav-btn"
                      onClick={entrarNaSala}
                      disabled={!codigoSala.trim()}
                    >
                      Entrar
                    </button>
                  </div>

                  <div className="ou-divider">OU</div>

                  <h4>Criar Nova Sala</h4>
                  <button
                    className="nav-btn"
                    onClick={criarSala}
                  >
                    Criar Sala
                  </button>

                  {erroConexao && (
                    <div className="erro-conexao" style={{ color: 'red', marginTop: '10px' }}>
                      {erroConexao}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* TELA SALA CRIADA */}
      {telaSalaCriada && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <h3>Sala Criada com Sucesso!</h3>
            </header>
            <div className="modal-content" style={{ textAlign: 'center' }}>
              <h4>Código da Sala:</h4>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#DFD0B8',
                backgroundColor: '#2c3e50',
                padding: '20px',
                borderRadius: '10px',
                margin: '20px 0',
                letterSpacing: '0.2em'
              }}>
                {estadoOnline.sala}
              </div>
              <p>Compartilhe este código com seu amigo para que ele possa entrar na sala.</p>

              <div style={{ marginTop: '20px' }}>
                <button
                  className="nav-btn"
                  onClick={() => {
                    // Copiar código para área de transferência
                    navigator.clipboard.writeText(estadoOnline.sala);
                    alert('Código copiado!');
                  }}
                  style={{ marginRight: '10px' }}
                >
                  Copiar Código
                </button>

                <button
                  className="nav-btn"
                  onClick={() => {
                    setTelaSalaCriada(false);
                    setMostrarModalOnline(false);
                    setErroConexao('');
                    setCodigoSala('');
                    setFaseJogo('configuracao');
                    setJogadorAtual('Vermelho');
                  }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JOGO ATUAL */}
      <div className={`game-content ${modoJogo === 'menu' ? 'hidden' : ''}`}>

        {faseJogo === 'configuracao' ? (
          <div>
            <div className="config-container">
              <h2 className="config-title">Posicionamento - Jogador {jogadorAtual}</h2>
              <p className="config-description">Posicione suas peças no seu território (linhas {jogadorAtual === "Vermelho" ? 'A-D' : 'G-J'})</p>
            </div>

            <div className="piece-selector">
              <h3>Selecione uma peça:</h3>
              <div className="piece-buttons">
                {Object.entries(pecasDisponiveis[jogadorAtual]).map(([tipo, quantidade]) => {
                  if (quantidade === 0) return null;
                  const display = tipo === 'bomba' ? <FontAwesomeIcon icon={faBomb} /> :
                    tipo === 'bandeira' ? <FontAwesomeIcon icon={faFlag} /> :
                      parseInt(tipo) === 1 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
                          <span className="number-corner">1</span>
                        </div>
                      ) : parseInt(tipo) === 2 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
                          <span className="number-corner">2</span>
                        </div>
                      ) : parseInt(tipo) === 3 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
                          <span className="number-corner">3</span>
                        </div>
                      ) : parseInt(tipo) === 4 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
                          <span className="number-corner">4</span>
                        </div>
                      ) : parseInt(tipo) === 5 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
                          <span className="number-corner">5</span>
                        </div>
                      ) : parseInt(tipo) === 6 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
                          <span className="number-corner">6</span>
                        </div>
                      ) : parseInt(tipo) === 7 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
                          <span className="number-corner">7</span>
                        </div>
                      ) : parseInt(tipo) === 8 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
                          <span className="number-corner">8</span>
                        </div>
                      ) : parseInt(tipo) === 9 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
                          <span className="number-corner">9</span>
                        </div>
                      ) : parseInt(tipo) === 10 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
                          <span className="number-corner">10</span>
                        </div>
                      ) : tipo;
                  return (
                    <button
                      key={tipo}
                      draggable={
                        faseJogo === 'configuracao' && quantidade > 0 && !modoMobile
                      }
                      onClick={() => {
                        setPecaSelecionadaConfig(tipo);
                      }}

                      // ==== DESATIVADO: SISTEMA DE DRAG AND DROP ======

                      // onDragStart={(e) => {
                      //   if (faseJogo === 'configuracao' && quantidade > 0) {
                      //     setDraggedPiece(tipo);
                      //     e.dataTransfer.effectAllowed = 'move';
                      //   } else {
                      //     e.preventDefault();
                      //   }
                      // }}
                      // onDragEnd={() => {
                      //   setDraggedPiece(null);
                      //   setIsDragging(false);
                      // }}    
                      // onTouchStart={(e) => {
                      //   // Só ativar drag se realmente mover o dedo
                      //   setTouchDragData({
                      //     piece: tipo,
                      //     startX: e.touches[0].clientX,
                      //     startY: e.touches[0].clientY,
                      //     moved: false
                      //   });
                      // }}
                      // onTouchMove={(e) => {
                      //   if (touchDragData && !touchDragData.moved) {
                      //     e.preventDefault();
                      //     // Primeira vez movendo - criar ghost
                      //     setDraggedPiece(tipo);
                      //     setIsDragging(true);

                      //     const ghost = document.createElement('div');
                      //     ghost.className = 'drag-ghost';
                      //     ghost.textContent = display;
                      //     ghost.style.left = e.touches[0].clientX + 'px';
                      //     ghost.style.top = e.touches[0].clientY + 'px';
                      //     document.body.appendChild(ghost);
                      //     setGhostElement(ghost);

                      //     setTouchDragData({ ...touchDragData, moved: true });
                      //   } else if (touchDragData && ghostElement) {
                      //     e.preventDefault();
                      //     ghostElement.style.left = e.touches[0].clientX + 'px';
                      //     ghostElement.style.top = e.touches[0].clientY + 'px';
                      //   }
                      // }}
                      // onTouchEnd={(e) => {
                      //   if (touchDragData) {
                      //     if (touchDragData.moved) {
                      //       // Foi um drag - executar drop
                      //       e.preventDefault();
                      //       const touch = e.changedTouches[0];
                      //       const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                      //       const cell = elementBelow?.closest('.cell[data-pos]');

                      //       if (cell) {
                      //         const posicao = cell.getAttribute('data-pos');
                      //         colocarPecaConfiguracao(posicao);
                      //       }

                      //       setDraggedPiece(null);
                      //       setIsDragging(false);
                      //       // Remover elemento fantasma
                      //       if (ghostElement) {
                      //         document.body.removeChild(ghostElement);
                      //         setGhostElement(null);
                      //       }
                      //     }
                      //     // Se não moveu, deixar o onClick executar normalmente
                      //     setTouchDragData(null);
                      //   }
                      // }}
                      className={`piece-button player${jogadorAtual} ${pecaSelecionadaConfig === tipo ? 'selected' : ''}`}
                      style={{ cursor: quantidade > 0 ? 'grab' : 'not-allowed' }}
                    >
                      {display} ({quantidade})
                    </button>
                  );
                })}
              </div>
              {pecaSelecionadaConfig && (
                <p className="selected-piece">
                  Peça selecionada: {pecaSelecionadaConfig === 'bomba' ? <FontAwesomeIcon icon={faBomb} /> :
                    pecaSelecionadaConfig === 'bandeira' ? <FontAwesomeIcon icon={faFlag} /> :
                      pecaSelecionadaConfig === 1 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/assassin-1.png`} alt="patente 1" className="patentes-image patent-1" />
                          <span className="number-corner">1</span>
                        </div>
                      ) : pecaSelecionadaConfig === 2 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-2.png`} alt="patente 2" className="patentes-image" />
                          <span className="number-corner">2</span>
                        </div>
                      ) : pecaSelecionadaConfig === 3 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/desarmador-3.png`} alt="desarmador 3" className="patentes-image" />
                          <span className="number-corner">3</span>
                        </div>
                      ) : pecaSelecionadaConfig === 4 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-4.png`} alt="patente 4" className="patentes-image" />
                          <span className="number-corner">4</span>
                        </div>
                      ) : pecaSelecionadaConfig === 5 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-5.png`} alt="patente 5" className="patentes-image" />
                          <span className="number-corner">5</span>
                        </div>
                      ) : pecaSelecionadaConfig === 6 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-6.png`} alt="patente 6" className="patentes-image" />
                          <span className="number-corner">6</span>
                        </div>
                      ) : pecaSelecionadaConfig === 7 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-7.png`} alt="patente 7" className="patentes-image" />
                          <span className="number-corner">7</span>
                        </div>
                      ) : pecaSelecionadaConfig === 8 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-8.png`} alt="patente 8" className="patentes-image" />
                          <span className="number-corner">8</span>
                        </div>
                      ) : pecaSelecionadaConfig === 9 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/patente-9.png`} alt="patente 9" className="patentes-image" />
                          <span className="number-corner">9</span>
                        </div>
                      ) : pecaSelecionadaConfig === 10 ? (
                        <div className="piece-layout-2">
                          <img src={`${process.env.PUBLIC_URL}/images/marechal-10.png`} alt="patente 10" className="patentes-image patent-10" />
                          <span className="number-corner">10</span>
                        </div>
                      ) : pecaSelecionadaConfig}
                  {modoMobile && (
                    <>
                      <br />
                      <span style={{ fontSize: '12px', color: '#f39c12' }}>
                        Toque na célula do tabuleiro para colocar a peça
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="finish-config">
              <button
                onClick={() => {
                  if (!validarConfiguracaoCompleta(jogadorAtual)) {
                    setMensagem(`Você ainda precisa colocar ${contarPecasRestantes(jogadorAtual)} peças no tabuleiro!`);
                    return;
                  }

                  // Jogador confirmou que está pronto
                  if (jogadorAtual === "Vermelho") {
                    setJogadorAtual("Azul");
                    setPecaSelecionadaConfig(null); // Limpa seleção
                    setMensagem('Jogador Vermelho pronto! Agora é a vez do Jogador Azul configurar suas peças.');
                  } else {
                    // Jogador Azul também está pronto - iniciar jogo
                    setFaseJogo('jogando');
                    setJogadorAtual("Vermelho"); // Vermelho sempre começa
                    setPecaSelecionadaConfig(null);
                    setMensagem('Configuração completa! Que comece a batalha!');
                  }
                }}
                className={`finish-button ${!validarConfiguracaoCompleta(jogadorAtual) ? 'disabled' : ''}`}
                disabled={!validarConfiguracaoCompleta(jogadorAtual)}
              >
                {validarConfiguracaoCompleta(jogadorAtual)
                  ? (jogadorAtual === "Vermelho" ? 'Pronto! Passar para Azul' : 'Pronto! Iniciar Jogo')
                  : `Faltam ${contarPecasRestantes(jogadorAtual)} peças`
                }
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="game-info">
              Vez do Jogador {jogadorAtual}
            </div>
            {mensagem && (
              <div className="game-message">
                {mensagem}
              </div>
            )}
          </div>
        )}

        {/* Capturas do Vermelho - acima do tabuleiro */}
        {faseJogo === 'jogando' && (
          <div className="capturas-container capturas-vermelho">
            <h4 className="capturas-titulo vermelho">Capturas do Vermelho</h4>
            <div className="capturas-lista vermelho">
              {pecasCapturadas.Vermelho.map((peca, index) => (
                <span key={index} className={`peca-capturada ${peca.jogador.toLowerCase()}`}>
                  {peca.numero}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="main-content">
          <div className="board-wrapper">
            <div className="coordinates">
              <div className="coord-numbers">
                <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
                <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
              </div>
            </div>

            <div className="board-content">
              <div className="coord-letters">
                <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span>
                <span>F</span><span>G</span><span>H</span><span>I</span><span>J</span>
              </div>

              <div className="board-container">
                <div
                  className="game-board"
                  id="gameBoard"
                  onClick={animandoMovimento ? (e) => e.preventDefault() : undefined}
                  style={{ pointerEvents: animandoMovimento ? 'none' : 'auto' }}

                // ==== DESATIVADO: SISTEMA DE DRAG AND DROP ======

                // onDragStart={(e) => {
                //   if (faseJogo === 'configuracao' && draggedPiece) {
                //     e.dataTransfer.effectAllowed = 'move';
                //   } else if (faseJogo === 'jogando' && !animandoMovimento) {
                //     const cell = e.target.closest('.cell[data-pos]');
                //     if (cell && cell.getAttribute('draggable') === 'true') {
                //       const posicao = cell.getAttribute('data-pos');
                //       const peca = tabuleiro[posicao];

                //       setDraggedPiece(peca.numero);
                //       setDragSourcePosition(posicao);
                //       setIsDragging(true);

                //       const movimentosValidos = calcularMovimentosValidos(posicao);
                //       setMovimentosValidos(movimentosValidos);

                //       e.dataTransfer.effectAllowed = 'move';
                //     } else {
                //       e.preventDefault();
                //     }
                //   } else {
                //     e.preventDefault();
                //   }
                // }}
                // onDragOver={(e) => {
                //   if ((faseJogo === 'configuracao' && draggedPiece) ||
                //     (faseJogo === 'jogando' && draggedPiece && dragSourcePosition)) {
                //     e.preventDefault();
                //     // Adicionar classe visual na célula sendo "hovered"
                //     const cell = e.target.closest('.cell');
                //     if (cell) {
                //       cell.classList.add('dragging-over');
                //     }
                //   }
                // }}
                // onDragLeave={(e) => {
                //   // Remover classe visual
                //   const cell = e.target.closest('.cell');
                //   if (cell) {
                //     cell.classList.remove('dragging-over');
                //   }
                // }}
                // onDrop={(e) => {
                //   e.preventDefault();
                //   const cell = e.target.closest('.cell');
                //   if (!cell) return;

                //   const posicao = cell.getAttribute('data-pos');

                //   if (faseJogo === 'configuracao' && draggedPiece) {
                //     colocarPecaConfiguracao(posicao);
                //     setDraggedPiece(null);
                //     setIsDragging(false);
                //     cell.classList.remove('dragging-over');
                //   } else if (faseJogo === 'jogando' && draggedPiece && dragSourcePosition) {
                //     handleDrop(posicao);
                //     cell.classList.remove('dragging-over');
                //   }
                // }}
                // onTouchStart={(e) => {
                //   // Para configuração: ativa drag quando toca em célula vazia
                //   if (faseJogo === 'configuracao' && pecaSelecionadaConfig) {
                //     const cell = e.target.closest('.cell[data-pos]');
                //     if (cell) {
                //       const pos = cell.getAttribute('data-pos');
                //       if (!tabuleiro[pos]) { // só em célula vazia
                //         e.preventDefault();
                //         setDraggedPiece(pecaSelecionadaConfig);
                //         setIsDragging(true);
                //       }
                //     }
                //   }

                //   // Para jogo: ativa drag quando toca em peça própria
                //   if (faseJogo === 'jogando' && !animandoMovimento) {
                //     const cell = e.target.closest('.cell[data-pos]');
                //     if (cell) {
                //       const pos = cell.getAttribute('data-pos');
                //       const peca = tabuleiro[pos];
                //       if (peca && peca.jogador === jogadorAtual && !pecaImovel(peca.numero)) {
                //         e.preventDefault();
                //         setDraggedPiece(peca.numero);
                //         setDragSourcePosition(pos);
                //         setIsDragging(true);
                //         setMovimentosValidos(calcularMovimentosValidos(pos));
                //       }
                //     }
                //   }
                // }}

                // onTouchMove={(e) => {
                //   if (isDragging) {
                //     e.preventDefault();
                //     const touch = e.touches[0];
                //     const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                //     const cell = elementBelow?.closest('.cell');

                //     // Visual feedback
                //     document.querySelectorAll('.cell').forEach(c => c.classList.remove('dragging-over'));
                //     if (cell) cell.classList.add('dragging-over');
                //   }
                // }}

                // onTouchEnd={(e) => {
                //   if (isDragging) {
                //     e.preventDefault();
                //     const touch = e.changedTouches[0];
                //     const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                //     const cell = elementBelow?.closest('.cell[data-pos]');

                //     if (cell) {
                //       const posicao = cell.getAttribute('data-pos');

                //       if (faseJogo === 'configuracao') {
                //         colocarPecaConfiguracao(posicao);
                //       } else if (faseJogo === 'jogando' && dragSourcePosition) {
                //         handleDrop(posicao);
                //       }
                //     }

                //     // Limpar estados
                //     setDraggedPiece(null);
                //     setDragSourcePosition(null);
                //     setIsDragging(false);
                //     setMovimentosValidos([]);
                //     document.querySelectorAll('.cell').forEach(c => c.classList.remove('dragging-over'));
                //   }
                // }}
                >

                  {/* Linha A (0) - Território Jogador Vermelho */}
                  <div className="cell player1-territory" data-pos="A0" onClick={() => handleCellClick('A0')} style={getCellStyle('A0')}>{getPeca('A0')}</div>
                  <div className="cell player1-territory" data-pos="A1" onClick={() => handleCellClick('A1')} style={getCellStyle('A1')}>{getPeca('A1')}</div>
                  <div className="cell player1-territory" data-pos="A2" onClick={() => handleCellClick('A2')} style={getCellStyle('A2')}>{getPeca('A2')}</div>
                  <div className="cell player1-territory" data-pos="A3" onClick={() => handleCellClick('A3')} style={getCellStyle('A3')}>{getPeca('A3')}</div>
                  <div className="cell player1-territory" data-pos="A4" onClick={() => handleCellClick('A4')} style={getCellStyle('A4')}>{getPeca('A4')}</div>
                  <div className="cell player1-territory" data-pos="A5" onClick={() => handleCellClick('A5')} style={getCellStyle('A5')}>{getPeca('A5')}</div>
                  <div className="cell player1-territory" data-pos="A6" onClick={() => handleCellClick('A6')} style={getCellStyle('A6')}>{getPeca('A6')}</div>
                  <div className="cell player1-territory" data-pos="A7" onClick={() => handleCellClick('A7')} style={getCellStyle('A7')}>{getPeca('A7')}</div>
                  <div className="cell player1-territory" data-pos="A8" onClick={() => handleCellClick('A8')} style={getCellStyle('A8')}>{getPeca('A8')}</div>
                  <div className="cell player1-territory" data-pos="A9" onClick={() => handleCellClick('A9')} style={getCellStyle('A9')}>{getPeca('A9')}</div>

                  {/* Linha B (1) - Território Jogador Vermelho */}
                  <div className="cell player1-territory" data-pos="B0" onClick={() => handleCellClick('B0')} style={getCellStyle('B0')}>{getPeca('B0')}</div>
                  <div className="cell player1-territory" data-pos="B1" onClick={() => handleCellClick('B1')} style={getCellStyle('B1')}>{getPeca('B1')}</div>
                  <div className="cell player1-territory" data-pos="B2" onClick={() => handleCellClick('B2')} style={getCellStyle('B2')}>{getPeca('B2')}</div>
                  <div className="cell player1-territory" data-pos="B3" onClick={() => handleCellClick('B3')} style={getCellStyle('B3')}>{getPeca('B3')}</div>
                  <div className="cell player1-territory" data-pos="B4" onClick={() => handleCellClick('B4')} style={getCellStyle('B4')}>{getPeca('B4')}</div>
                  <div className="cell player1-territory" data-pos="B5" onClick={() => handleCellClick('B5')} style={getCellStyle('B5')}>{getPeca('B5')}</div>
                  <div className="cell player1-territory" data-pos="B6" onClick={() => handleCellClick('B6')} style={getCellStyle('B6')}>{getPeca('B6')}</div>
                  <div className="cell player1-territory" data-pos="B7" onClick={() => handleCellClick('B7')} style={getCellStyle('B7')}>{getPeca('B7')}</div>
                  <div className="cell player1-territory" data-pos="B8" onClick={() => handleCellClick('B8')} style={getCellStyle('B8')}>{getPeca('B8')}</div>
                  <div className="cell player1-territory" data-pos="B9" onClick={() => handleCellClick('B9')} style={getCellStyle('B9')}>{getPeca('B9')}</div>

                  {/* Linha C (2) - Território Jogador Vermelho */}
                  <div className="cell player1-territory" data-pos="C0" onClick={() => handleCellClick('C0')} style={getCellStyle('C0')}>{getPeca('C0')}</div>
                  <div className="cell player1-territory" data-pos="C1" onClick={() => handleCellClick('C1')} style={getCellStyle('C1')}>{getPeca('C1')}</div>
                  <div className="cell player1-territory" data-pos="C2" onClick={() => handleCellClick('C2')} style={getCellStyle('C2')}>{getPeca('C2')}</div>
                  <div className="cell player1-territory" data-pos="C3" onClick={() => handleCellClick('C3')} style={getCellStyle('C3')}>{getPeca('C3')}</div>
                  <div className="cell player1-territory" data-pos="C4" onClick={() => handleCellClick('C4')} style={getCellStyle('C4')}>{getPeca('C4')}</div>
                  <div className="cell player1-territory" data-pos="C5" onClick={() => handleCellClick('C5')} style={getCellStyle('C5')}>{getPeca('C5')}</div>
                  <div className="cell player1-territory" data-pos="C6" onClick={() => handleCellClick('C6')} style={getCellStyle('C6')}>{getPeca('C6')}</div>
                  <div className="cell player1-territory" data-pos="C7" onClick={() => handleCellClick('C7')} style={getCellStyle('C7')}>{getPeca('C7')}</div>
                  <div className="cell player1-territory" data-pos="C8" onClick={() => handleCellClick('C8')} style={getCellStyle('C8')}>{getPeca('C8')}</div>
                  <div className="cell player1-territory" data-pos="C9" onClick={() => handleCellClick('C9')} style={getCellStyle('C9')}>{getPeca('C9')}</div>

                  {/* Linha D (3) - Território Jogador Vermelho */}
                  <div className="cell player1-territory" data-pos="D0" onClick={() => handleCellClick('D0')} style={getCellStyle('D0')}>{getPeca('D0')}</div>
                  <div className="cell player1-territory" data-pos="D1" onClick={() => handleCellClick('D1')} style={getCellStyle('D1')}>{getPeca('D1')}</div>
                  <div className="cell player1-territory" data-pos="D2" onClick={() => handleCellClick('D2')} style={getCellStyle('D2')}>{getPeca('D2')}</div>
                  <div className="cell player1-territory" data-pos="D3" onClick={() => handleCellClick('D3')} style={getCellStyle('D3')}>{getPeca('D3')}</div>
                  <div className="cell player1-territory" data-pos="D4" onClick={() => handleCellClick('D4')} style={getCellStyle('D4')}>{getPeca('D4')}</div>
                  <div className="cell player1-territory" data-pos="D5" onClick={() => handleCellClick('D5')} style={getCellStyle('D5')}>{getPeca('D5')}</div>
                  <div className="cell player1-territory" data-pos="D6" onClick={() => handleCellClick('D6')} style={getCellStyle('D6')}>{getPeca('D6')}</div>
                  <div className="cell player1-territory" data-pos="D7" onClick={() => handleCellClick('D7')} style={getCellStyle('D7')}>{getPeca('D7')}</div>
                  <div className="cell player1-territory" data-pos="D8" onClick={() => handleCellClick('D8')} style={getCellStyle('D8')}>{getPeca('D8')}</div>
                  <div className="cell player1-territory" data-pos="D9" onClick={() => handleCellClick('D9')} style={getCellStyle('D9')}>{getPeca('D9')}</div>

                  {/* Linha E (4) - Zona Neutra com Lagos */}
                  <div className="cell neutral-zone" data-pos="E0" onClick={() => handleCellClick('E0')} style={getCellStyle('E0')}>{getPeca('E0')}</div>
                  <div className="cell neutral-zone" data-pos="E1" onClick={() => handleCellClick('E1')} style={getCellStyle('E1')}>{getPeca('E1')}</div>
                  <div className="cell water" data-pos="E2" onClick={() => handleCellClick('E2')}></div>
                  <div className="cell water" data-pos="E3" onClick={() => handleCellClick('E3')}></div>
                  <div className="cell neutral-zone" data-pos="E4" onClick={() => handleCellClick('E4')} style={getCellStyle('E4')}>{getPeca('E4')}</div>
                  <div className="cell neutral-zone" data-pos="E5" onClick={() => handleCellClick('E5')} style={getCellStyle('E5')}>{getPeca('E5')}</div>
                  <div className="cell water" data-pos="E6" onClick={() => handleCellClick('E6')}></div>
                  <div className="cell water" data-pos="E7" onClick={() => handleCellClick('E7')}></div>
                  <div className="cell neutral-zone" data-pos="E8" onClick={() => handleCellClick('E8')} style={getCellStyle('E8')}>{getPeca('E8')}</div>
                  <div className="cell neutral-zone" data-pos="E9" onClick={() => handleCellClick('E9')} style={getCellStyle('E9')}>{getPeca('E9')}</div>

                  {/* Linha F (5) - Zona Neutra com Lagos */}
                  <div className="cell neutral-zone" data-pos="F0" onClick={() => handleCellClick('F0')} style={getCellStyle('F0')}>{getPeca('F0')}</div>
                  <div className="cell neutral-zone" data-pos="F1" onClick={() => handleCellClick('F1')} style={getCellStyle('F1')}>{getPeca('F1')}</div>
                  <div className="cell water" data-pos="F2" onClick={() => handleCellClick('F2')}></div>
                  <div className="cell water" data-pos="F3" onClick={() => handleCellClick('F3')}></div>
                  <div className="cell neutral-zone" data-pos="F4" onClick={() => handleCellClick('F4')} style={getCellStyle('F4')}>{getPeca('F4')}</div>
                  <div className="cell neutral-zone" data-pos="F5" onClick={() => handleCellClick('F5')} style={getCellStyle('F5')}>{getPeca('F5')}</div>
                  <div className="cell water" data-pos="F6" onClick={() => handleCellClick('F6')}></div>
                  <div className="cell water" data-pos="F7" onClick={() => handleCellClick('F7')}></div>
                  <div className="cell neutral-zone" data-pos="F8" onClick={() => handleCellClick('F8')} style={getCellStyle('F8')}>{getPeca('F8')}</div>
                  <div className="cell neutral-zone" data-pos="F9" onClick={() => handleCellClick('F9')} style={getCellStyle('F9')}>{getPeca('F9')}</div>

                  {/* Linha G (6) - Território Jogador Azul */}
                  <div className="cell player2-territory" data-pos="G0" onClick={() => handleCellClick('G0')} style={getCellStyle('G0')}>{getPeca('G0')}</div>
                  <div className="cell player2-territory" data-pos="G1" onClick={() => handleCellClick('G1')} style={getCellStyle('G1')}>{getPeca('G1')}</div>
                  <div className="cell player2-territory" data-pos="G2" onClick={() => handleCellClick('G2')} style={getCellStyle('G2')}>{getPeca('G2')}</div>
                  <div className="cell player2-territory" data-pos="G3" onClick={() => handleCellClick('G3')} style={getCellStyle('G3')}>{getPeca('G3')}</div>
                  <div className="cell player2-territory" data-pos="G4" onClick={() => handleCellClick('G4')} style={getCellStyle('G4')}>{getPeca('G4')}</div>
                  <div className="cell player2-territory" data-pos="G5" onClick={() => handleCellClick('G5')} style={getCellStyle('G5')}>{getPeca('G5')}</div>
                  <div className="cell player2-territory" data-pos="G6" onClick={() => handleCellClick('G6')} style={getCellStyle('G6')}>{getPeca('G6')}</div>
                  <div className="cell player2-territory" data-pos="G7" onClick={() => handleCellClick('G7')} style={getCellStyle('G7')}>{getPeca('G7')}</div>
                  <div className="cell player2-territory" data-pos="G8" onClick={() => handleCellClick('G8')} style={getCellStyle('G8')}>{getPeca('G8')}</div>
                  <div className="cell player2-territory" data-pos="G9" onClick={() => handleCellClick('G9')} style={getCellStyle('G9')}>{getPeca('G9')}</div>

                  {/* Linha H (7) - Território Jogador Azul */}
                  <div className="cell player2-territory" data-pos="H0" onClick={() => handleCellClick('H0')} style={getCellStyle('H0')}>{getPeca('H0')}</div>
                  <div className="cell player2-territory" data-pos="H1" onClick={() => handleCellClick('H1')} style={getCellStyle('H1')}>{getPeca('H1')}</div>
                  <div className="cell player2-territory" data-pos="H2" onClick={() => handleCellClick('H2')} style={getCellStyle('H2')}>{getPeca('H2')}</div>
                  <div className="cell player2-territory" data-pos="H3" onClick={() => handleCellClick('H3')} style={getCellStyle('H3')}>{getPeca('H3')}</div>
                  <div className="cell player2-territory" data-pos="H4" onClick={() => handleCellClick('H4')} style={getCellStyle('H4')}>{getPeca('H4')}</div>
                  <div className="cell player2-territory" data-pos="H5" onClick={() => handleCellClick('H5')} style={getCellStyle('H5')}>{getPeca('H5')}</div>
                  <div className="cell player2-territory" data-pos="H6" onClick={() => handleCellClick('H6')} style={getCellStyle('H6')}>{getPeca('H6')}</div>
                  <div className="cell player2-territory" data-pos="H7" onClick={() => handleCellClick('H7')} style={getCellStyle('H7')}>{getPeca('H7')}</div>
                  <div className="cell player2-territory" data-pos="H8" onClick={() => handleCellClick('H8')} style={getCellStyle('H8')}>{getPeca('H8')}</div>
                  <div className="cell player2-territory" data-pos="H9" onClick={() => handleCellClick('H9')} style={getCellStyle('H9')}>{getPeca('H9')}</div>

                  {/* Linha I (8) - Território Jogador Azul */}
                  <div className="cell player2-territory" data-pos="I0" onClick={() => handleCellClick('I0')} style={getCellStyle('I0')}>{getPeca('I0')}</div>
                  <div className="cell player2-territory" data-pos="I1" onClick={() => handleCellClick('I1')} style={getCellStyle('I1')}>{getPeca('I1')}</div>
                  <div className="cell player2-territory" data-pos="I2" onClick={() => handleCellClick('I2')} style={getCellStyle('I2')}>{getPeca('I2')}</div>
                  <div className="cell player2-territory" data-pos="I3" onClick={() => handleCellClick('I3')} style={getCellStyle('I3')}>{getPeca('I3')}</div>
                  <div className="cell player2-territory" data-pos="I4" onClick={() => handleCellClick('I4')} style={getCellStyle('I4')}>{getPeca('I4')}</div>
                  <div className="cell player2-territory" data-pos="I5" onClick={() => handleCellClick('I5')} style={getCellStyle('I5')}>{getPeca('I5')}</div>
                  <div className="cell player2-territory" data-pos="I6" onClick={() => handleCellClick('I6')} style={getCellStyle('I6')}>{getPeca('I6')}</div>
                  <div className="cell player2-territory" data-pos="I7" onClick={() => handleCellClick('I7')} style={getCellStyle('I7')}>{getPeca('I7')}</div>
                  <div className="cell player2-territory" data-pos="I8" onClick={() => handleCellClick('I8')} style={getCellStyle('I8')}>{getPeca('I8')}</div>
                  <div className="cell player2-territory" data-pos="I9" onClick={() => handleCellClick('I9')} style={getCellStyle('I9')}>{getPeca('I9')}</div>

                  {/* Linha J (9) - Território Jogador Azul */}
                  <div className="cell player2-territory" data-pos="J0" onClick={() => handleCellClick('J0')} style={getCellStyle('J0')}>{getPeca('J0')}</div>
                  <div className="cell player2-territory" data-pos="J1" onClick={() => handleCellClick('J1')} style={getCellStyle('J1')}>{getPeca('J1')}</div>
                  <div className="cell player2-territory" data-pos="J2" onClick={() => handleCellClick('J2')} style={getCellStyle('J2')}>{getPeca('J2')}</div>
                  <div className="cell player2-territory" data-pos="J3" onClick={() => handleCellClick('J3')} style={getCellStyle('J3')}>{getPeca('J3')}</div>
                  <div className="cell player2-territory" data-pos="J4" onClick={() => handleCellClick('J4')} style={getCellStyle('J4')}>{getPeca('J4')}</div>
                  <div className="cell player2-territory" data-pos="J5" onClick={() => handleCellClick('J5')} style={getCellStyle('J5')}>{getPeca('J5')}</div>
                  <div className="cell player2-territory" data-pos="J6" onClick={() => handleCellClick('J6')} style={getCellStyle('J6')}>{getPeca('J6')}</div>
                  <div className="cell player2-territory" data-pos="J7" onClick={() => handleCellClick('J7')} style={getCellStyle('J7')}>{getPeca('J7')}</div>
                  <div className="cell player2-territory" data-pos="J8" onClick={() => handleCellClick('J8')} style={getCellStyle('J8')}>{getPeca('J8')}</div>
                  <div className="cell player2-territory" data-pos="J9" onClick={() => handleCellClick('J9')} style={getCellStyle('J9')}>{getPeca('J9')}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Capturas do Azul - embaixo do tabuleiro */}
        {faseJogo === 'jogando' && (
          <div className="capturas-container capturas-azul">
            <h4 className="capturas-titulo azul">Capturas do Azul</h4>
            <div className="capturas-lista azul">
              {pecasCapturadas.Azul.map((peca, index) => (
                <span key={index} className={`peca-capturada ${peca.jogador.toLowerCase()}`}>
                  {peca.numero}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* MODAL DE REGRAS */}
        {mostrarRegras && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Regras do jogo">
            <div className="modal">
              <header className="modal-header">
                <h3>Regras do Jogo</h3>
                <button className="close-btn" onClick={fecharRegras} aria-label="Fechar">×</button>
              </header>
              <div className="modal-content">

                <h4 className="rule-title">Formação Inicial</h4>

                <p>• Cada jogador escolhe a formação do seu exército, distribuindo as peças como desejar nas 4 linhas de sua cor no tabuleiro.</p>

                <hr></hr>

                <h4 className="rule-title">Regras de Movimentação</h4>

                <p>• A maioria das peças se move 1 casa ortogonalmente.</p>
                <p>• O Soldado(2) pode andar quantas casas livres quiser, na horizontal ou na vertical. Ele também pode andar e atacar no mesmo turno.</p>
                <p>• Nenhuma peça pode se mover na diagonal, pular sobre outras peças, nem se mover para um espaço já ocupado por outra peça.</p>
                <p>• Lagos são intransponíveis.</p>
                <p>• Somente uma peça pode se mover em cada turno.</p>
                <p>• Uma peça não pode se mover mais do que 5 vezes, sem parar, entre 2 casas.</p>
                <p>• Bomba e Bandeira não se movem.</p>

                <hr></hr>

                <h4 className="rule-title">Regras de Ataque</h4>

                <p>• Peças se revelam no ataque; maior patente vence (Existem exceções).</p>
                <p>• A peça com o valor menor é capturada e removida do tabuleiro. Se a peça vencedora foi a atacante, então ela se move para a posição da peça capturada. Se a peça vencedora foi a atacada, ela fica na posição que está.</p>
                <p>• Quando duas peças de mesmo valor se atacam, as duas são removidas do tabuleiro.</p>
                <p>• O ataque é sempre opcional.</p>

                <hr></hr>

                <h4 className="rule-title">Regras Especiais de Ataque</h4>

                <p>• Bomba e Desarmadora(3): Todas as peças que atacam uma bomba, são removidas do tabuleiro (inclusive a bomba atacada), exceto a peça desarmadora, que desarma e captura a bomba.</p>
                <p>• Marechal(10) e Assassino(1): O Marechal ganha de todas as outras peças de valor menor, só pode ser capturado se for atacado pelo Assassino. Caso o Marechal ataque o Assassino primeiro, ele vence.</p>

                <hr></hr>

                <h4 className="rule-title">Objetivo do Jogo</h4>

                <p>• Capturar a bandeira inimiga, ou eliminar todas as peças do oponente que se movimentam.</p>

              </div>
              <footer className="modal-footer">
                <button className="nav-btn" onClick={fecharRegras}>Fechar</button>
              </footer>
            </div>
          </div>

        )}

        {/* POPUP TROCA TURNO */}
        {mostrarTrocaTurno && (
          <div className="turno-overlay">
            <div className="turno-popup">
              <h2>Troca de Turno</h2>
              <p>Agora é a vez do Jogador {jogadorAtual}</p>
              <button
                className="turno-button"
                onClick={() => setMostrarTrocaTurno(false)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}


      </div>
    </div >
  );
}

export default App;