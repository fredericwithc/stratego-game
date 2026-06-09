/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';

// Supabase (jogo online)
import { supabase } from './supabase';

// Imports dos componentes
import Navbar from './components/Navbar/Navbar';
import GameMenu from './components/Menu/GameMenu';
import RulesModal from './components/Modals/RulesModal';
import TurnChangeModal from './components/Modals/TurnChangeModal';
import VictoryModal from './components/Modals/VictoryModal';
import OnlineModal from './components/Modals/OnlineModal';
import PieceSelector from './components/PieceSelector/PieceSelector';
import Board from './components/Board/Board';
import Captures from './components/Captures/Captures';
import RotateWarning from './components/RotateWarning/RotateWarning';

// Imports das funções utilitárias
import { rankNum, pecaImovel } from './utils/pieceUtils';
import { isAgua, saoAdjacentes } from './utils/boardUtils';
import { movimentoValido, calcularMovimentosValidos } from './utils/movementUtils';
import { verificarVitoria } from './utils/combatUtils';
import {
    validarConfiguracaoCompleta,
    contarPecasRestantes,
    colocarPecaConfiguracao,
    moverPecaNoTabuleiro,
    calcularPecasDisponiveisDoTabuleiro,
    PECAS_INICIAIS_JOGADOR
} from './utils/configUtils';
import { getCellStyle } from './utils/styleUtils';
import { getPeca } from './utils/getPieceDisplay';
import { executarCombate } from './utils/gameLogic';

// Imports da IA
import {
    posicionarPecasIA,
    analisarSituacao,
    escolherMelhorMovimento,
    edgeKey
} from './game-modes/AIGame';

// Imports do jogo online
import {
    gerarCodigoSala,
    criarSala,
    entrarNaSala,
    marcarJogadorPronto,
    desserializarTabuleiro,
    rowToSalaData,
    mesclarTabuleiroConfigOnline,
    sincronizarTurnoOnline,
    iniciarCombateOnline,
    resolverCombateOnline,
    desserializarPecasCapturadas,
    COMBATE_REVEAL_MS
} from './game-modes/OnlineGame';

function App() {
    // ESTADOS DO JOGO

    // Estado: Qual célula está selecionada
    const [celulaSelecionada, setCelulaSelecionada] = useState(null);

    // Estado: Desativar botão jogador pronto Online
    const [jogadorPronto, setJogadorPronto] = useState(false);

    // Online: após enviar a configuração com sucesso, não permitir reenviar até o jogo iniciar
    const [envieiConfigOnline, setEnvieiConfigOnline] = useState(false);

    // Estado: Drag and Drop na fase de colocação de peças
    const [draggedPiece, setDraggedPiece] = useState(null);
    const [dragSourcePosition, setDragSourcePosition] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Estado: Detectando Mobile para draganddrop
    const [modoMobile, setModoMobile] = useState(false);
    const [touchDragData, setTouchDragData] = useState(null);
    const [ghostElement, setGhostElement] = useState(null);

    // Estado que controla qual modo de jogo está ativo
    const [modoJogo, setModoJogo] = useState('menu');

    // Estado para IA (se modo IA estiver ativo)
    const [estadoIA, setEstadoIA] = useState({
        pensando: false,
        dificuldade: 'Média'
    });

    // Estado Revelação temporária durante o combate (origem e destino)
    const [revealCombate, setRevealCombate] = useState({ origem: null, destino: null });

    // Estado para modo online (se modo online estiver ativo)
    const [estadoOnline, setEstadoOnline] = useState({
        sala: null,
        conectado: false,
        jogadorHost: false,
        minhaCor: null
    });

    useEffect(() => {
        // Ao trocar de sala/modo online, resetar flags locais de "pronto/envio"
        setEnvieiConfigOnline(false);
        setJogadorPronto(false);
    }, [modoJogo, estadoOnline.sala]);

    // Estado: criar a sala para modo online
    const [telaSalaCriada, setTelaSalaCriada] = useState(false);

    // Estado: Controla se o modal de jogo online está visível
    const [mostrarModalOnline, setMostrarModalOnline] = useState(false);

    // Estado: Código da sala que o jogador digitou para entrar
    const [codigoSala, setCodigoSala] = useState('');

    // Estado: ID único do jogador na sala online (gerado automaticamente)
    const [jogadorOnlineId, setJogadorOnlineId] = useState(null);

    // Estado: Se está aguardando outro jogador se conectar à sala
    const [aguardandoJogador, setAguardandoJogador] = useState(false);

    // Estado: Mensagens de erro de conexão para mostrar ao usuário
    const [erroConexao, setErroConexao] = useState('');

    // Estado: peca selecionada no posicionamento
    const [pecaSelecionadaNoTabuleiro, setPecaSelecionadaNoTabuleiro] = useState(null);

    // Estado Guarda origem e destino do último movimento da IA
    const [ultimoMovimento, setUltimoMovimento] = useState(null);

    // Estado Destaque visual do último movimento
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

    // Estado: Identificação de modo 'paisagem' em celular
    const [orientacao, setOrientacao] = useState('landscape');

    // Estado: controla se uma animação de movimento está acontecendo
    const [animandoMovimento, setAnimandoMovimento] = useState(false);
    const [movimentoIAEmAndamento, setMovimentoIAEmAndamento] = useState(false);

    // Estado: que armazena dados da animação (posição origem, destino, peça)
    const [dadosAnimacao, setDadosAnimacao] = useState(null);

    // Estado Memória simples da IA
    const [historicoIA, setHistoricoIA] = useState([]);
    const [visitasIA, setVisitasIA] = useState({});

    // Estado Controla a repetição consecutiva da mesma aresta (origem<->destino) pela IA
    const [arestaRepetida, setArestaRepetida] = useState({ chave: null, cont: 0 });

    // Estado que armazena as peças capturadas por cada jogador
    const [pecasCapturadas, setPecasCapturadas] = useState({
        Vermelho: [],
        Azul: []
    });
    const pecasCapturadasRef = useRef({ Vermelho: [], Azul: [] });

    // Estado: Qual jogador está jogando (1 ou 2)
    const [jogadorAtual, setJogadorAtual] = useState("Vermelho");

    const [jogoTerminado, setJogoTerminado] = useState(false);

    const [mensagem, setMensagem] = useState('');

    const [mostrarTrocaTurno, setMostrarTrocaTurno] = useState(false);

    const [combateAtivo, setCombateAtivo] = useState(false);
    const [pecaRevelada, setPecaRevelada] = useState(null);

    const combateTimerRef = useRef(null);
    const combateEventoIdRef = useRef(null);
    const ultimoCombateResolvidoEmRef = useRef(0);

    const [faseJogo, setFaseJogo] = useState('configuracao');
    const [pecasDisponiveis, setPecasDisponiveis] = useState({
        "Vermelho": { 10: 1, 9: 1, 8: 2, 7: 3, 6: 4, 5: 4, 4: 4, 3: 5, 2: 8, 1: 1, 'bomba': 6, 'bandeira': 1 },
        "Azul": { 10: 1, 9: 1, 8: 2, 7: 3, 6: 4, 5: 4, 4: 4, 3: 5, 2: 8, 1: 1, 'bomba': 6, 'bandeira': 1 }
    });
    const [pecaSelecionadaConfig, setPecaSelecionadaConfig] = useState(null);

    // Estado: Onde estão as peças no tabuleiro
    const [tabuleiro, setTabuleiro] = useState({});

    // Estado: estado auxiliar
    const [touchState, setTouchState] = useState({ x: 0, y: 0, moved: false });

    // Estado que armazena array de posições onde a peça selecionada pode se mover
    const [movimentosValidos, setMovimentosValidos] = useState([]);

    // Navbar / Modal de Regras / Restart
    const [mostrarRegras, setMostrarRegras] = useState(false);
    const abrirRegras = () => setMostrarRegras(true);
    const fecharRegras = () => setMostrarRegras(false);
    const handleRestart = () => {
        reiniciarJogo();
    };

    // EFEITOS

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

        handleOrientationChange();

        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            window.removeEventListener('resize', handleOrientationChange);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    // EFEITO: Limpar ao sair da página (modo online)
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (modoJogo === 'online' && estadoOnline.sala && jogadorOnlineId) {
                const { sairDaSala } = require('./game-modes/OnlineGame');
                sairDaSala(estadoOnline.sala, jogadorOnlineId);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleBeforeUnload(); // Executar ao desmontar componente
        };
    }, [modoJogo, estadoOnline.sala, jogadorOnlineId]);

    // EFEITO: Sincronizar sala online via Supabase Realtime
    useEffect(() => {
        if (modoJogo !== 'online' || !estadoOnline.sala || !supabase) return;

        const salaId = estadoOnline.sala;
        const minhaCor = estadoOnline.minhaCor;

        const aplicarSala = (row) => {
            try {
                const salaData = rowToSalaData(row);
                if (!salaData) return;

                console.log('[ONLINE] Dados da sala:', salaData);

                const faseSala = salaData.faseJogo || 'configuracao';
                const jogadores = salaData.jogadores || {};
                const totalConectados = Object.values(jogadores).filter(
                    (j) => j?.conectado !== false
                ).length;
                setAguardandoJogador(totalConectados < 2);

                const combateServidor = salaData.combate;
                const combateAtivoNoServidor =
                    combateServidor?.origem && combateServidor?.destino;
                const combateObsoleto =
                    combateAtivoNoServidor &&
                    (combateServidor.iniciado_em || 0) <= ultimoCombateResolvidoEmRef.current;

                if (combateObsoleto) {
                    console.log('[ONLINE] Evento de combate obsoleto ignorado');
                    return;
                }

                if (combateAtivoNoServidor) {
                    const eventoId = `${combateServidor.origem}-${combateServidor.destino}-${combateServidor.iniciado_em}`;
                    const souDefensor = minhaCor && combateServidor.atacante !== minhaCor;

                    if (souDefensor && combateEventoIdRef.current !== eventoId) {
                        combateEventoIdRef.current = eventoId;
                        const restante = Math.max(
                            0,
                            COMBATE_REVEAL_MS - (Date.now() - (combateServidor.iniciado_em || 0))
                        );

                        setCombateAtivo(true);
                        setRevealCombate({
                            origem: combateServidor.origem,
                            destino: combateServidor.destino
                        });
                        setPecaRevelada(combateServidor.destino);

                        if (combateTimerRef.current) {
                            clearTimeout(combateTimerRef.current);
                        }
                        combateTimerRef.current = setTimeout(() => {
                            setCombateAtivo(false);
                            setRevealCombate({ origem: null, destino: null });
                            setPecaRevelada(null);
                        }, restante);
                    }
                } else {
                    if (combateEventoIdRef.current) {
                        const partes = combateEventoIdRef.current.split('-');
                        const iniciadoAnterior = Number(partes[partes.length - 1]);
                        if (!Number.isNaN(iniciadoAnterior)) {
                            ultimoCombateResolvidoEmRef.current = Math.max(
                                ultimoCombateResolvidoEmRef.current,
                                iniciadoAnterior
                            );
                        }
                    }
                    combateEventoIdRef.current = null;
                    if (combateTimerRef.current) {
                        clearTimeout(combateTimerRef.current);
                        combateTimerRef.current = null;
                    }
                    setCombateAtivo(false);
                    setRevealCombate({ origem: null, destino: null });
                    setPecaRevelada(null);
                }

                // Enquanto combate está aberto no servidor, não aplicar tabuleiro/turno antigos
                if (!combateAtivoNoServidor) {
                    let tabuleiroAtualizado = null;

                    if (faseSala === 'jogando' && salaData.tabuleiro) {
                        tabuleiroAtualizado = desserializarTabuleiro(salaData.tabuleiro);
                        setTabuleiro(tabuleiroAtualizado);

                        if (salaData.pecasCapturadas) {
                            const capturas = desserializarPecasCapturadas(salaData.pecasCapturadas);
                            pecasCapturadasRef.current = capturas;
                            setPecasCapturadas(capturas);
                        }
                    } else if (faseSala === 'configuracao') {
                        setTabuleiro((prevTabuleiro) => {
                            tabuleiroAtualizado = mesclarTabuleiroConfigOnline(
                                prevTabuleiro,
                                salaData.tabuleiro || {},
                                minhaCor,
                                salaData.jogadorAtual
                            );
                            return tabuleiroAtualizado;
                        });
                    }

                    if (
                        faseSala === 'configuracao' &&
                        minhaCor &&
                        salaData.jogadorAtual === minhaCor &&
                        tabuleiroAtualizado
                    ) {
                        setPecasDisponiveis((pd) => ({
                            ...pd,
                            [minhaCor]: calcularPecasDisponiveisDoTabuleiro(minhaCor, tabuleiroAtualizado)
                        }));
                    }

                    setFaseJogo((faseAnterior) => {
                        const novaFase = salaData.faseJogo || faseAnterior;
                        if (novaFase === 'jogando' && faseAnterior !== 'jogando') {
                            setJogadorPronto(false);
                            setEnvieiConfigOnline(false);
                            setMensagem('Configuração completa! Que comece a batalha!');
                        }
                        return novaFase;
                    });

                    if (salaData.jogadorAtual) {
                        setJogadorAtual((anterior) => {
                            const proximo = salaData.jogadorAtual;
                            if (proximo && proximo !== anterior && faseSala === 'jogando') {
                                if (minhaCor && proximo === minhaCor) {
                                    setMensagem('Sua vez!');
                                    setMostrarTrocaTurno(true);
                                } else if (minhaCor) {
                                    setMensagem(`Vez do jogador ${proximo}.`);
                                }
                            }
                            return proximo;
                        });
                    }

                    if (salaData.estado === 'finalizado') {
                        setJogoTerminado(true);
                    }
                }
            } catch (e) {
                console.error('[ONLINE] Erro ao aplicar estado da sala:', e);
            }
        };

        supabase
            .from('rooms')
            .select('*')
            .eq('id', salaId)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error('[ONLINE] Falha ao carregar sala:', error);
                    return;
                }
                if (data) aplicarSala(data);
            });

        const channel = supabase
            .channel(`room:${salaId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${salaId}`
                },
                (payload) => {
                    if (payload.new) aplicarSala(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (combateTimerRef.current) {
                clearTimeout(combateTimerRef.current);
            }
        };
    }, [modoJogo, estadoOnline.sala, estadoOnline.minhaCor]);

    // FUNÇÕES DO JOGO

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
        const capturasVazias = { Vermelho: [], Azul: [] };
        setPecasCapturadas(capturasVazias);
        pecasCapturadasRef.current = capturasVazias;

        setMovimentoIAEmAndamento(false);
        setUltimoMovimento(null);
        setHistoricoIA([]);
        setVisitasIA({});
        setArestaRepetida({ chave: null, cont: 0 });

        setModoJogo('menu');
        setEstadoIA({ pensando: false, dificuldade: 'Média' });

        setDraggedPiece(null);
        setDragSourcePosition(null);
        setIsDragging(false);

        setJogadorPronto(false);
        setEnvieiConfigOnline(false);
    };

    // Wrapper da função registrarCaptura
    const registrarCapturaWrapper = (pecaCapturada, jogadorCapturador) => {
        const novas = { ...pecasCapturadasRef.current };
        novas[jogadorCapturador] = [...novas[jogadorCapturador], pecaCapturada];
        pecasCapturadasRef.current = novas;
        setPecasCapturadas(novas);
    };

    const limparRevelacaoCombate = useCallback(() => {
        if (combateTimerRef.current) {
            clearTimeout(combateTimerRef.current);
            combateTimerRef.current = null;
        }
        combateEventoIdRef.current = null;
        setCombateAtivo(false);
        setRevealCombate({ origem: null, destino: null });
        setPecaRevelada(null);
    }, []);

    const sincronizarEstadoOnline = async (novoTabuleiro, proximoJogador, extra = {}) => {
        if (modoJogo !== 'online' || !estadoOnline.sala) return;

        try {
            await sincronizarTurnoOnline(
                estadoOnline.sala,
                novoTabuleiro,
                proximoJogador,
                {
                    ...(extra.estado ? { estado: extra.estado } : {}),
                    pecasCapturadas: pecasCapturadasRef.current
                }
            );
            if (!extra.jogoTerminado && proximoJogador !== estadoOnline.minhaCor) {
                setMensagem(`Aguardando jogador ${proximoJogador}...`);
            }
        } catch (error) {
            console.error('[ONLINE] Falha ao publicar movimento:', error);
            setMensagem('Erro ao sincronizar movimento com o servidor.');
        }
    };

    const aoMovimentoOnline = (novoTabuleiro, proximoJogador, extra = {}) => {
        if (extra.jogoTerminado) {
            setJogoTerminado(true);
        }

        if (modoJogo !== 'online' || !estadoOnline.sala) return;

        if (combateEventoIdRef.current) {
            const partes = combateEventoIdRef.current.split('-');
            const iniciado = Number(partes[partes.length - 1]);
            if (!Number.isNaN(iniciado)) {
                ultimoCombateResolvidoEmRef.current = Math.max(
                    ultimoCombateResolvidoEmRef.current,
                    iniciado
                );
            }
        }

        resolverCombateOnline(
            estadoOnline.sala,
            novoTabuleiro,
            proximoJogador,
            {
                ...(extra.estado ? { estado: extra.estado } : {}),
                pecasCapturadas: pecasCapturadasRef.current
            }
        ).then(() => {
            if (!extra.jogoTerminado && proximoJogador !== estadoOnline.minhaCor) {
                setMensagem(`Aguardando jogador ${proximoJogador}...`);
            }
        }).catch((error) => {
            console.error('[ONLINE] Falha ao resolver combate:', error);
            setMensagem('Erro ao sincronizar combate com o servidor.');
        });
    };

    // Wrapper da função executarCombate
    const executarCombateWrapper = (pecaAtacante, pecaDefensora, posicao, novoTabuleiro, origem) => {
        executarCombate(
            pecaAtacante,
            pecaDefensora,
            posicao,
            novoTabuleiro,
            origem,
            setMensagem,
            registrarCapturaWrapper,
            setTabuleiro,
            setJogoTerminado,
            setCombateAtivo,
            setPecaRevelada,
            setRevealCombate,
            jogadorAtual,
            modoJogo,
            finalizarMovimentoIA,
            setJogadorAtual,
            setMostrarTrocaTurno,
            modoJogo === 'online' ? aoMovimentoOnline : null
        );
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

            if (isAgua(destino) || !movimentoValido(origem, destino, atacante, tabuleiro)) {
                console.warn('[IA] Movimento inválido (água ou regra de movimento).', { origem, destino, atacante });
                finalizarMovimentoIA();
                return;
            }

            const defensor = tabuleiro[destino];
            const novoTabuleiro = { ...tabuleiro };

            if (defensor && defensor.jogador !== atacante.jogador) {
                setUltimoMovimento({ origem, destino, tipo: 'combate' });
                setRevealCombate({ origem, destino });
                setCombateAtivo(true);
                setPecaRevelada(destino);

                const chaveA = edgeKey(origem, destino);
                setArestaRepetida(prev =>
                    prev && prev.chave === chaveA
                        ? { chave: chaveA, cont: prev.cont + 1 }
                        : { chave: chaveA, cont: 1 }
                );

                registrarHistoricoIA(origem, destino, atacante);
                incrementarVisita(destino);

                setTimeout(() => {
                    executarCombateWrapper(atacante, defensor, destino, novoTabuleiro, origem);
                }, 500);

                return;
            }

            if (!defensor) {
                setUltimoMovimento({ origem, destino, tipo: 'move' });
                setAnimandoMovimento(true);
                setDadosAnimacao({ origem, destino, peca: atacante });

                setTimeout(() => {
                    novoTabuleiro[destino] = atacante;
                    delete novoTabuleiro[origem];
                    setTabuleiro(novoTabuleiro);

                    const chaveB = edgeKey(origem, destino);
                    setArestaRepetida(prev =>
                        prev && prev.chave === chaveB
                            ? { chave: chaveB, cont: prev.cont + 1 }
                            : { chave: chaveB, cont: 1 }
                    );

                    registrarHistoricoIA(origem, destino, atacante);
                    incrementarVisita(destino);

                    setTimeout(() => {
                        const novoJogador = "Azul";
                        if (modoJogo === 'ia' && jogadorAtual === 'Vermelho') {
                            finalizarMovimentoIA();
                        }
                        setJogadorAtual(novoJogador);
                        setAnimandoMovimento(false);
                        setDadosAnimacao(null);
                    }, 500);
                }, 300);

                return;
            }

            console.warn('[IA] Destino tem peça própria, cancelando movimento.');
            finalizarMovimentoIA();

        } catch (e) {
            console.error('[IA] Erro ao executar movimento direto:', e);
            finalizarMovimentoIA();
        }
    };

    // FUNÇÃO: O que acontece quando clica numa célula
    const handleCellClick = (posicao) => {
        if (jogoTerminado) {
            return;
        }

        if (combateAtivo) {
            return;
        }

        // BLOQUEAR CLIQUES NA FASE "AGUARDANDO"
        if (faseJogo === 'aguardando') {
            setMensagem('Aguarde o outro jogador terminar a configuração.');
            return;
        }

        // BLOQUEAR INTERAÇÃO COM PEÇAS ERRADAS DURANTE O JOGO
        if (faseJogo === 'jogando') {
            if (
                modoJogo === 'online' &&
                estadoOnline.minhaCor &&
                jogadorAtual !== estadoOnline.minhaCor
            ) {
                setMensagem(`Aguarde a vez do jogador ${jogadorAtual}.`);
                return;
            }

            const pecaNaPosicao = tabuleiro[posicao];

            // Se clicar em uma peça
            if (pecaNaPosicao && !celulaSelecionada) {
                // Modo IA: Jogador Azul NUNCA pode selecionar peças Vermelhas
                if (modoJogo === 'ia' && pecaNaPosicao.jogador === 'Vermelho') {
                    setMensagem('Você não pode mover peças da IA!');
                    return;
                }

                // Modo Local: Não pode selecionar peça do oponente
                if (modoJogo === 'local' && pecaNaPosicao.jogador !== jogadorAtual) {
                    setMensagem('Não é sua vez! Passe o dispositivo para o outro jogador.');
                    return;
                }

                // Modo Online: Não pode selecionar peça do oponente
                if (modoJogo === 'online' && estadoOnline.minhaCor && pecaNaPosicao.jogador !== estadoOnline.minhaCor) {
                    setMensagem('Você não pode mover peças do oponente!');
                    return;
                }
            }
        }

        if (faseJogo === 'configuracao') {
            const jogadorConfig =
                modoJogo === 'online' && estadoOnline.minhaCor
                    ? estadoOnline.minhaCor
                    : jogadorAtual;

            // MODO ONLINE: Só posso interagir na minha vez
            if (modoJogo === 'online' && estadoOnline.minhaCor) {
                if (jogadorAtual !== estadoOnline.minhaCor) {
                    setMensagem(`Aguarde o jogador ${jogadorAtual} configurar suas peças.`);
                    return;
                }
                if (envieiConfigOnline) {
                    setMensagem('Aguarde o outro jogador terminar a configuração.');
                    return;
                }
            }

            const pecaNaPosicao = tabuleiro[posicao];

            if (pecaSelecionadaNoTabuleiro) {
                if (pecaSelecionadaNoTabuleiro === posicao) {
                    setPecaSelecionadaNoTabuleiro(null);
                    return;
                }

                moverPecaNoTabuleiro(
                    pecaSelecionadaNoTabuleiro,
                    posicao,
                    jogadorConfig,
                    tabuleiro,
                    setTabuleiro
                );
                setPecaSelecionadaNoTabuleiro(null);
                return;
            }

            if (pecaNaPosicao && pecaNaPosicao.jogador === jogadorConfig) {
                setPecaSelecionadaNoTabuleiro(posicao);
                return;
            }

            if (pecaSelecionadaConfig && !pecaNaPosicao) {
                colocarPecaConfiguracao(
                    posicao,
                    pecaSelecionadaConfig,
                    draggedPiece,
                    jogadorConfig,
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
                );

                return;
            }

            return;
        }

        // BLOQUEAR CLIQUE EM PEÇAS DO OPONENTE
        if (tabuleiro[posicao] && tabuleiro[posicao].jogador !== jogadorAtual && !celulaSelecionada) {
            // Verificar se é a IA pensando
            const iaAtiva = (modoJogo === 'ia' && jogadorAtual === 'Vermelho' && movimentoIAEmAndamento);

            if (!iaAtiva) {
                setMensagem('Não é sua vez!');
                return;
            }
        }

        // BLOQUEAR SELEÇÃO DE PEÇAS DO OPONENTE
        if (celulaSelecionada && tabuleiro[celulaSelecionada]) {
            const pecaSelecionada = tabuleiro[celulaSelecionada];

            // Se tentar clicar em outra peça que não seja do jogador atual
            if (tabuleiro[posicao] && tabuleiro[posicao].jogador !== jogadorAtual && posicao !== celulaSelecionada) {
                // Só permite se for um ataque válido
                if (!movimentoValido(celulaSelecionada, posicao, pecaSelecionada, tabuleiro)) {
                    setMensagem('Você não pode selecionar peças do oponente!');
                    setCelulaSelecionada(null);
                    setMovimentosValidos([]);
                    return;
                }
            }
        }

        if (tabuleiro[posicao] && !celulaSelecionada && pecaImovel(tabuleiro[posicao].numero)) {
            setMensagem('Esta peça não pode se mover!');
            return;
        }

        if (celulaSelecionada && celulaSelecionada !== posicao) {
            if (movimentoValido(celulaSelecionada, posicao, tabuleiro[celulaSelecionada], tabuleiro) && !isAgua(posicao) && (!tabuleiro[posicao] || tabuleiro[posicao].jogador !== jogadorAtual)) {
                const pecaAtacante = tabuleiro[celulaSelecionada];
                const pecaDefensora = tabuleiro[posicao];

                if (pecaAtacante) {
                    const novoTabuleiro = { ...tabuleiro };

                    if (pecaDefensora) {
                        const origemSel = celulaSelecionada;
                        const iniciadoEm = Date.now();
                        const eventoId = `${origemSel}-${posicao}-${iniciadoEm}`;

                        setCombateAtivo(true);
                        setRevealCombate({ origem: origemSel, destino: posicao });
                        setPecaRevelada(posicao);
                        setUltimoMovimento({ origem: origemSel, destino: posicao, tipo: 'combate' });

                        setCelulaSelecionada(null);
                        setMovimentosValidos([]);

                        if (modoJogo === 'online' && estadoOnline.sala) {
                            combateEventoIdRef.current = eventoId;
                            iniciarCombateOnline(estadoOnline.sala, {
                                origem: origemSel,
                                destino: posicao,
                                atacante: jogadorAtual,
                                iniciado_em: iniciadoEm
                            }).catch((error) => {
                                console.error('[ONLINE] Falha ao iniciar combate:', error);
                                limparRevelacaoCombate();
                                setMensagem('Erro ao sincronizar combate.');
                            });
                        }

                        if (combateTimerRef.current) {
                            clearTimeout(combateTimerRef.current);
                        }
                        combateTimerRef.current = setTimeout(() => {
                            combateTimerRef.current = null;
                            const souAtacante =
                                modoJogo !== 'online' ||
                                !estadoOnline.minhaCor ||
                                estadoOnline.minhaCor === jogadorAtual;

                            if (souAtacante) {
                                executarCombateWrapper(
                                    pecaAtacante,
                                    pecaDefensora,
                                    posicao,
                                    novoTabuleiro,
                                    origemSel
                                );
                            }
                        }, COMBATE_REVEAL_MS);

                        return;

                    } else {
                        setUltimoMovimento({ origem: celulaSelecionada, destino: posicao, tipo: 'move' });
                        setAnimandoMovimento(true);
                        setDadosAnimacao({
                            origem: celulaSelecionada,
                            destino: posicao,
                            peca: pecaAtacante
                        });

                        setCelulaSelecionada(null);
                        setMovimentosValidos([]);

                        setTimeout(() => {
                            novoTabuleiro[posicao] = pecaAtacante;
                            delete novoTabuleiro[celulaSelecionada];
                            setTabuleiro(novoTabuleiro);

                            const novoJogador = jogadorAtual === "Vermelho" ? "Azul" : "Vermelho";

                            if (jogadorAtual === "Vermelho" && modoJogo === 'ia') {
                                finalizarMovimentoIA();
                            }

                            setJogadorAtual(novoJogador);

                            if (modoJogo === 'online') {
                                sincronizarEstadoOnline(novoTabuleiro, novoJogador);
                            } else {
                                setTimeout(() => {
                                    if (modoJogo !== 'ia') {
                                        setMostrarTrocaTurno(true);
                                    }
                                }, 1500);
                            }

                            setAnimandoMovimento(false);
                            setDadosAnimacao(null);
                        }, 500);
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
            if (celulaSelecionada === posicao) {
                setCelulaSelecionada(null);
                setMovimentosValidos([]);
            } else {
                setCelulaSelecionada(posicao);
                if (tabuleiro[posicao] && tabuleiro[posicao].jogador === jogadorAtual) {
                    setMovimentosValidos(calcularMovimentosValidos(posicao, tabuleiro));
                } else {
                    setMovimentosValidos([]);
                }
            }
        }
    };

    // FUNÇÃO: Finalizar movimento da IA e limpar estados
    const finalizarMovimentoIA = () => {
        setMovimentoIAEmAndamento(false);
        setEstadoIA(prev => ({ ...prev, pensando: false }));
        setCelulaSelecionada(null);
        setMovimentosValidos([]);
        setDraggedPiece(null);
        setDragSourcePosition(null);
        setIsDragging(false);
    };

    // FUNÇÃO: Helpers de memória de IA
    const registrarHistoricoIA = (origem, destino, peca) => {
        setHistoricoIA(prev => {
            const novo = [...prev, { origem, destino, peca: peca?.numero ?? null, ts: Date.now() }];
            return novo.slice(-8);
        });
    };

    const incrementarVisita = (pos) => {
        setVisitasIA(prev => {
            const qtd = (prev[pos] || 0) + 1;
            return { ...prev, [pos]: qtd };
        });
    };

    // FUNÇÃO: IA faz movimento automático
    const movimentoIA = () => {
        if (movimentoIAEmAndamento) {
            return;
        }

        setMovimentoIAEmAndamento(true);
        setEstadoIA(prev => ({ ...prev, pensando: true }));

        setTimeout(() => {
            try {
                const estrategia = analisarSituacao(tabuleiro);
                const melhorMovimento = escolherMelhorMovimento(estrategia, tabuleiro, ultimoMovimento, visitasIA, arestaRepetida);

                if (melhorMovimento) {
                    executarMovimentoDiretoIA(melhorMovimento.origem, melhorMovimento.destino);
                } else {
                    finalizarMovimentoIA();
                }
            } catch (error) {
                console.error('Erro na IA:', error);
                finalizarMovimentoIA();
            }
        }, 1000);
    };

    // FUNÇÃO: Detectar quando é vez da IA
    useEffect(() => {
        if (
            modoJogo === 'ia' &&
            jogadorAtual === "Vermelho" &&
            faseJogo === 'jogando' &&
            !estadoIA.pensando &&
            !movimentoIAEmAndamento &&
            !animandoMovimento &&
            !combateAtivo &&
            !mostrarTrocaTurno &&
            !jogoTerminado
        ) {
            movimentoIA();
        }
    }, [jogadorAtual, faseJogo, modoJogo, estadoIA.pensando, movimentoIAEmAndamento, animandoMovimento, combateAtivo, mostrarTrocaTurno]);

    // Wrapper para posicionarPecasIA
    const handlePosicionarPecasIA = () => {
        const novoTabuleiro = posicionarPecasIA();
        setTabuleiro(novoTabuleiro);
        setPecasDisponiveis(prev => ({
            ...prev,
            Vermelho: {
                10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
                'bomba': 0, 'bandeira': 0
            }
        }));
    };

    // Wrappers para funções online
    const handleCriarSala = async () => {
        const ok = await criarSala(
            setEstadoOnline,
            setJogadorOnlineId,
            setModoJogo,
            setAguardandoJogador,
            setTelaSalaCriada,
            setErroConexao
        );
        if (!ok) return;
        setJogadorAtual('Vermelho');
        setFaseJogo('configuracao');
        setTabuleiro({});
        setPecasDisponiveis({
            Vermelho: { ...PECAS_INICIAIS_JOGADOR },
            Azul: { ...PECAS_INICIAIS_JOGADOR }
        });
        setPecaSelecionadaConfig(null);
        setEnvieiConfigOnline(false);
    };

    const handleEntrarNaSala = async () => {
        const ok = await entrarNaSala(
            codigoSala,
            setEstadoOnline,
            setJogadorOnlineId,
            setModoJogo,
            setMensagem,
            setMostrarModalOnline,
            setErroConexao,
            setCodigoSala,
            setFaseJogo,
            setJogadorAtual
        );
        if (!ok) return;
        setTabuleiro({});
        setPecasDisponiveis({
            Vermelho: { ...PECAS_INICIAIS_JOGADOR },
            Azul: { ...PECAS_INICIAIS_JOGADOR }
        });
        setPecaSelecionadaConfig(null);
        setEnvieiConfigOnline(false);
    };

    // Wrapper para getCellStyle
    const getCellStyleWrapper = (posicao) => {
        return getCellStyle(
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
            revealCombate
        );
    };

    // Wrapper para getPeca
    const getPecaWrapper = (posicao) => {
        return getPeca(
            posicao,
            tabuleiro,
            combateAtivo,
            revealCombate,
            faseJogo,
            modoJogo,
            jogadorAtual,
            mostrarTrocaTurno,
            estadoOnline
        );
    };

    // RENDER

    return (
        <div>
            <RotateWarning orientacao={orientacao} />

            <Navbar abrirRegras={abrirRegras} handleRestart={handleRestart} />

            {modoJogo === 'online' && aguardandoJogador && (
                <div className="online-wait" style={{ textAlign: 'center', marginTop: '8px', color: '#DFD0B8' }}>
                    Aguardando outro jogador se conectar...
                </div>
            )}

            {modoJogo === 'menu' && (
                <GameMenu
                    setModoJogo={setModoJogo}
                    setFaseJogo={setFaseJogo}
                    setTabuleiro={setTabuleiro}
                    setMensagem={setMensagem}
                    posicionarPecasIA={handlePosicionarPecasIA}
                    setJogadorAtual={setJogadorAtual}
                    setMostrarModalOnline={setMostrarModalOnline}
                />
            )}

            {modoJogo !== 'menu' && (
                <>
                    <div className="modo-indicador">
                        {modoJogo === 'local' ? 'Modo: 2 Jogadores Local' :
                            modoJogo === 'ia' ? 'Modo: Contra IA' :
                                `Sala: ${estadoOnline.sala || 'Conectando...'}`}
                    </div>

                    {modoJogo === 'ia' && estadoIA.pensando && (
                        <div className="ia-status">
                            <div className="ia-pensando">IA pensando...</div>
                        </div>
                    )}
                </>
            )}

            <div className={`game-content ${modoJogo === 'menu' ? 'hidden' : ''}`}>
                {faseJogo === 'aguardando' ? (
                    <div className="config-container">
                        <h2 className="config-title">Aguardando...</h2>
                        <p className="config-description">
                            O Jogador Vermelho está posicionando suas peças.
                            Aguarde até que ele termine para começar seu posicionamento.
                        </p>
                        <div className="loading-animation">⏳</div>
                    </div>
                ) : faseJogo === 'configuracao' ? (
                    <div>
                        <div className="config-container">
                            <h2 className="config-title">Posicionamento - Jogador {jogadorAtual}</h2>
                            <p className="config-description">Posicione suas peças no seu território (linhas {jogadorAtual === "Vermelho" ? 'A-D' : 'G-J'})</p>
                        </div>

                        {/* SÓ MOSTRAR SELETOR QUANDO FOR MINHA VEZ */}
                        {(modoJogo !== 'online' || (estadoOnline.minhaCor === jogadorAtual)) && (
                            <PieceSelector
                                pecasDisponiveis={pecasDisponiveis}
                                jogadorAtual={jogadorAtual}
                                pecaSelecionadaConfig={pecaSelecionadaConfig}
                                setPecaSelecionadaConfig={setPecaSelecionadaConfig}
                                modoMobile={modoMobile}
                            />
                        )}

                        {/* MENSAGEM QUANDO NÃO É MINHA VEZ */}
                        {modoJogo === 'online' && estadoOnline.minhaCor && estadoOnline.minhaCor !== jogadorAtual && (
                            <div className="waiting-message" style={{
                                textAlign: 'center',
                                padding: '20px',
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                borderRadius: '10px',
                                margin: '20px auto',
                                maxWidth: '500px',
                                color: '#DFD0B8'
                            }}>
                                <h3>Aguardando...</h3>
                                <p>O jogador {jogadorAtual} está posicionando suas peças.</p>
                            </div>
                        )}

                        <div className="finish-config">
                            <button
                                onClick={async () => {
                                    if (!validarConfiguracaoCompleta(jogadorAtual, pecasDisponiveis)) {
                                        setMensagem(`Você ainda precisa colocar ${contarPecasRestantes(jogadorAtual, pecasDisponiveis)} peças no tabuleiro!`);
                                        return;
                                    }

                                    // MODO ONLINE: Sincronizar com Firebase
                                    if (modoJogo === 'online' && estadoOnline.sala && jogadorOnlineId) {
                                        try {
                                            await marcarJogadorPronto(
                                                estadoOnline.sala,
                                                jogadorOnlineId,
                                                tabuleiro
                                            );

                                            if (estadoOnline.minhaCor === "Vermelho") {
                                                setMensagem('Você está pronto! Aguardando Jogador Azul...');
                                            } else {
                                                setMensagem('Aguardando o jogo iniciar...');
                                            }

                                            setEnvieiConfigOnline(true);
                                        } catch (error) {
                                            console.error('Erro ao sincronizar:', error);
                                            setMensagem('Erro ao sincronizar com o servidor.');
                                            setEnvieiConfigOnline(false);
                                        }
                                    } else {
                                        // Marcar que clicou (local/IA)
                                        setJogadorPronto(true);

                                        // MODO LOCAL/IA (código original)
                                        if (jogadorAtual === "Vermelho") {
                                            setJogadorAtual("Azul");
                                            setPecaSelecionadaConfig(null);
                                            setMensagem('Jogador Vermelho pronto! Agora é a vez do Jogador Azul configurar suas peças.');
                                            setJogadorPronto(false); // Resetar para o próximo jogador
                                        } else {
                                            // MODO LOCAL: Mostrar modal antes de iniciar
                                            if (modoJogo === 'local') {
                                                setFaseJogo('jogando');
                                                setJogadorAtual("Vermelho");
                                                setPecaSelecionadaConfig(null);
                                                setMensagem('Configuração completa! Que comece a batalha!');
                                                setMostrarTrocaTurno(true); // Mostrar modal IMEDIATAMENTE
                                            } else {
                                                // MODO IA: Não precisa de modal
                                                setFaseJogo('jogando');
                                                setJogadorAtual("Vermelho");
                                                setPecaSelecionadaConfig(null);
                                                setMensagem('Configuração completa! Que comece a batalha!');
                                            }
                                        }
                                    }
                                }}
                                className={`finish-button ${(
                                    !validarConfiguracaoCompleta(jogadorAtual, pecasDisponiveis) ||
                                    (modoJogo === 'online'
                                        ? (envieiConfigOnline || estadoOnline.minhaCor !== jogadorAtual)
                                        : jogadorPronto)
                                ) ? 'disabled' : ''}`}
                                disabled={
                                    !validarConfiguracaoCompleta(jogadorAtual, pecasDisponiveis) ||
                                    (modoJogo === 'online'
                                        ? (envieiConfigOnline || estadoOnline.minhaCor !== jogadorAtual)
                                        : jogadorPronto)
                                }
                            >
                                {(modoJogo === 'online' ? envieiConfigOnline : jogadorPronto)
                                    ? 'Aguardando...'
                                    : validarConfiguracaoCompleta(jogadorAtual, pecasDisponiveis)
                                        ? (jogadorAtual === "Vermelho" ? 'Pronto! Passar para Azul' : 'Pronto! Iniciar Jogo')
                                        : `Faltam ${contarPecasRestantes(jogadorAtual, pecasDisponiveis)} peças`
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

                {faseJogo === 'jogando' && (
                    <Captures pecasCapturadas={pecasCapturadas} jogador="Vermelho" />
                )}

                <div className="main-content">
                    <Board
                        handleCellClick={handleCellClick}
                        getCellStyle={getCellStyleWrapper}
                        getPeca={getPecaWrapper}
                        animandoMovimento={animandoMovimento}
                    />
                </div>

                {faseJogo === 'jogando' && (
                    <Captures pecasCapturadas={pecasCapturadas} jogador="Azul" />
                )}

                <RulesModal mostrarRegras={mostrarRegras} fecharRegras={fecharRegras} />

                <TurnChangeModal
                    mostrarTrocaTurno={mostrarTrocaTurno}
                    setMostrarTrocaTurno={setMostrarTrocaTurno}
                    jogadorAtual={jogadorAtual}
                />

                <VictoryModal
                    jogoTerminado={jogoTerminado}
                    mensagem={mensagem}
                    reiniciarJogo={reiniciarJogo}
                />
            </div>

            <OnlineModal
                mostrarModalOnline={mostrarModalOnline}
                setMostrarModalOnline={setMostrarModalOnline}
                codigoSala={codigoSala}
                setCodigoSala={setCodigoSala}
                entrarNaSala={handleEntrarNaSala}
                criarSala={handleCriarSala}
                erroConexao={erroConexao}
                setErroConexao={setErroConexao}
                telaSalaCriada={telaSalaCriada}
                setTelaSalaCriada={setTelaSalaCriada}
                estadoOnline={estadoOnline}
                setFaseJogo={setFaseJogo}
                setJogadorAtual={setJogadorAtual}
            />

        </div>
    );
}

export default App;